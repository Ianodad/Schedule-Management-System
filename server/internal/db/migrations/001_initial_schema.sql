CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(500),
    attendees TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    recurrence_frequency VARCHAR(50),
    recurrence_interval INT,
    recurrence_until TIMESTAMP WITH TIME ZONE,
    recurrence_count INT,
    parent_appointment_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version BIGINT DEFAULT 1,

    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_recurrence_interval CHECK (recurrence_interval IS NULL OR recurrence_interval > 0),
    CONSTRAINT valid_status CHECK (status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED')),

    EXCLUDE USING GIST (
        user_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status = 'SCHEDULED')
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_time ON appointments(user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_time_range ON appointments USING GIST (tstzrange(start_time, end_time));
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_parent ON appointments(parent_appointment_id) WHERE parent_appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflicts(
    p_user_id VARCHAR,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    location VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.start_time,
        a.end_time,
        a.location
    FROM appointments a
    WHERE a.user_id = p_user_id
        AND a.status = 'SCHEDULED'
        AND tstzrange(a.start_time, a.end_time) && tstzrange(p_start_time, p_end_time)
        AND (p_exclude_id IS NULL OR a.id != p_exclude_id);
END;
$$ LANGUAGE plpgsql;

-- Function to generate recurring appointment instances
CREATE OR REPLACE FUNCTION generate_recurring_instances(
    p_parent_id UUID,
    p_user_id VARCHAR,
    p_title VARCHAR,
    p_description TEXT,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_location VARCHAR,
    p_attendees TEXT[],
    p_frequency VARCHAR,
    p_interval INT,
    p_until TIMESTAMP WITH TIME ZONE,
    p_count INT
)
RETURNS INT AS $$
DECLARE
    v_duration INTERVAL;
    v_current_start TIMESTAMP WITH TIME ZONE;
    v_current_end TIMESTAMP WITH TIME ZONE;
    v_instances_created INT := 0;
    v_max_instances INT := COALESCE(p_count, 100);
BEGIN
    v_duration := p_end_time - p_start_time;
    v_current_start := p_start_time;
    v_current_end := p_end_time;

    WHILE v_instances_created < v_max_instances LOOP
        CASE p_frequency
            WHEN 'DAILY' THEN
                v_current_start := v_current_start + (p_interval || ' days')::INTERVAL;
            WHEN 'WEEKLY' THEN
                v_current_start := v_current_start + (p_interval || ' weeks')::INTERVAL;
            WHEN 'MONTHLY' THEN
                v_current_start := v_current_start + (p_interval || ' months')::INTERVAL;
        END CASE;

        v_current_end := v_current_start + v_duration;

        IF p_until IS NOT NULL AND v_current_start > p_until THEN
            EXIT;
        END IF;

        INSERT INTO appointments (
            user_id, title, description, start_time, end_time,
            location, attendees, status, parent_appointment_id
        ) VALUES (
            p_user_id, p_title, p_description, v_current_start, v_current_end,
            p_location, p_attendees, 'SCHEDULED', p_parent_id
        );

        v_instances_created := v_instances_created + 1;
    END LOOP;

    RETURN v_instances_created;
END;
$$ LANGUAGE plpgsql;

-- Create a table for tracking event streams
CREATE TABLE IF NOT EXISTS appointment_events (
    id BIGSERIAL PRIMARY KEY,
    appointment_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_event_type CHECK (event_type IN ('CREATED', 'UPDATED', 'DELETED'))
);

CREATE INDEX IF NOT EXISTS idx_appointment_events_user ON appointment_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_events_created_at ON appointment_events(created_at DESC);

-- Function to publish appointment events
CREATE OR REPLACE FUNCTION publish_appointment_event()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type VARCHAR;
    v_event_data JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'CREATED';
        v_event_data := row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'UPDATE' THEN
        v_event_type := 'UPDATED';
        v_event_data := row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'DELETE' THEN
        v_event_type := 'DELETED';
        v_event_data := row_to_json(OLD)::JSONB;
    END IF;

    INSERT INTO appointment_events (appointment_id, user_id, event_type, event_data)
    VALUES (
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.user_id, OLD.user_id),
        v_event_type,
        v_event_data
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointment_event_trigger ON appointments;

-- Trigger to publish events on appointment changes
CREATE TRIGGER appointment_event_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION publish_appointment_event();

-- Cleanup old events (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS void AS $$
BEGIN
    DELETE FROM appointment_events
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
