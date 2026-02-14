package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"schedule-management-system/server/internal/config"
	"schedule-management-system/server/internal/db"
	"schedule-management-system/server/internal/domain"
	"schedule-management-system/server/internal/repository"
)

const (
	UserID           = "demo-user"
	TotalAppointments = 100
)

var (
	titles = []string{
		"Team Standup", "Client Review", "Sprint Planning", "1-on-1 Meeting",
		"Product Demo", "Code Review Session", "Architecture Discussion",
		"Sales Call", "Training Session", "Quarterly Planning", "Team Lunch",
		"Interview - Backend Engineer", "Interview - Frontend Developer",
		"Budget Review", "Marketing Sync", "Design Review", "All Hands Meeting",
		"Customer Onboarding", "Performance Review", "Strategy Session",
		"Vendor Meeting", "Project Kickoff", "Retrospective", "Tech Talk",
		"Board Meeting", "Investor Update", "Legal Review", "HR Discussion",
	}

	descriptions = []string{
		"Discuss project progress and blockers",
		"Review deliverables with stakeholders",
		"Plan upcoming sprint tasks and priorities",
		"Individual career development discussion",
		"Present new features to team",
		"Review pull requests and architecture decisions",
		"Align on technical approach and standards",
		"Discuss requirements and next steps",
		"Knowledge sharing session",
		"Set goals and priorities for the quarter",
		"",
		"Technical interview with candidate",
		"Review financial performance",
		"Coordinate marketing initiatives",
		"Present and gather feedback on designs",
		"Company-wide updates and announcements",
		"Walk through product features with new customer",
		"Annual performance evaluation",
		"Discuss long-term strategic initiatives",
	}

	locations = []string{
		"Conference Room A", "Conference Room B", "Zoom", "Google Meet",
		"Board Room", "Main Office", "Cafeteria", "Building 2 - Floor 3",
		"", "", // Some appointments without location
	}

	attendees = [][]string{
		{"alice@company.com", "bob@company.com"},
		{"charlie@company.com"},
		{"dave@company.com", "eve@company.com", "frank@company.com"},
		{"grace@company.com", "heidi@company.com"},
		{},
		{"ivan@company.com"},
		{"judy@company.com", "mallory@company.com", "oscar@company.com", "peggy@company.com"},
	}
)

func main() {
	ctx := context.Background()

	// Load configuration
	cfg := config.Load()

	// Initialize database
	pool, err := db.NewPool(ctx, cfg.DB)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	log.Println("✓ Database connected")

	// Run migrations to ensure schema is up to date
	if err := db.RunMigrations(ctx, pool); err != nil {
		log.Fatalf("migrations failed: %v", err)
	}

	// Initialize repository
	repo := repository.NewAppointmentRepository(pool)

	// Generate appointments
	startDate := time.Now().AddDate(-1, 0, 0) // 1 year ago
	endDate := time.Now().AddDate(1, 0, 0)    // 1 year in the future

	log.Printf("Generating %d appointments spanning %s to %s...\n",
		TotalAppointments, startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))

	created := 0
	recurring := 0

	// Create some recurring appointments (20% of total)
	recurringCount := TotalAppointments / 5
	for i := 0; i < recurringCount; i++ {
		appt := generateRecurringAppointment(startDate, endDate)
		if err := createAppointment(ctx, repo, appt); err != nil {
			log.Printf("⚠ Failed to create recurring appointment: %v", err)
			continue
		}
		created++
		recurring++
	}

	// Create regular appointments for the remaining count
	regularCount := TotalAppointments - recurringCount
	for i := 0; i < regularCount; i++ {
		appt := generateRegularAppointment(startDate, endDate)
		if err := createAppointment(ctx, repo, appt); err != nil {
			log.Printf("⚠ Failed to create appointment: %v", err)
			continue
		}
		created++
	}

	log.Printf("✓ Successfully created %d appointments (%d recurring, %d regular)\n",
		created, recurring, created-recurring)
	log.Println("✓ Database seeding complete!")
}

func createAppointment(ctx context.Context, repo repository.AppointmentRepository, appt domain.Appointment) error {
	created, err := repo.Create(ctx, appt)
	if err != nil {
		return err
	}

	// If recurring, generate instances
	if created.Recurrence != nil {
		count, err := repo.GenerateRecurringInstances(ctx, created)
		if err != nil {
			return fmt.Errorf("generating instances: %w", err)
		}
		if count > 0 {
			log.Printf("  → Generated %d instances for recurring appointment: %s", count, created.Title)
		}
	}

	return nil
}

func generateRecurringAppointment(startDate, endDate time.Time) domain.Appointment {
	// Random start time within the range
	dayRange := int(endDate.Sub(startDate).Hours() / 24)
	randomDay := rand.Intn(dayRange)
	startTime := startDate.AddDate(0, 0, randomDay)

	// Set to business hours
	startTime = setBusinessHours(startTime)
	duration := time.Duration(30+rand.Intn(90)) * time.Minute // 30min to 2hrs
	endTime := startTime.Add(duration)

	// Decide frequency
	var frequency domain.RecurrenceFrequency
	var interval int32
	var count *int32
	var until *time.Time

	freqType := rand.Intn(3)
	switch freqType {
	case 0: // Daily
		frequency = domain.RecurrenceDaily
		interval = 1
		countVal := int32(5 + rand.Intn(10)) // 5-15 occurrences
		count = &countVal
	case 1: // Weekly
		frequency = domain.RecurrenceWeekly
		interval = int32(1 + rand.Intn(2)) // Every 1-2 weeks
		if rand.Intn(2) == 0 {
			countVal := int32(4 + rand.Intn(12)) // 4-16 occurrences
			count = &countVal
		} else {
			untilDate := startTime.AddDate(0, 3+rand.Intn(9), 0) // 3-12 months
			until = &untilDate
		}
	case 2: // Monthly
		frequency = domain.RecurrenceMonthly
		interval = 1
		countVal := int32(6 + rand.Intn(12)) // 6-18 occurrences
		count = &countVal
	}

	return domain.Appointment{
		UserID:      UserID,
		Title:       titles[rand.Intn(len(titles))],
		Description: descriptions[rand.Intn(len(descriptions))],
		StartTime:   startTime,
		EndTime:     endTime,
		Location:    locations[rand.Intn(len(locations))],
		Attendees:   attendees[rand.Intn(len(attendees))],
		Status:      domain.StatusScheduled,
		Recurrence: &domain.RecurrenceRule{
			Frequency: frequency,
			Interval:  interval,
			Count:     count,
			Until:     until,
		},
	}
}

func generateRegularAppointment(startDate, endDate time.Time) domain.Appointment {
	// Random start time within the range
	dayRange := int(endDate.Sub(startDate).Hours() / 24)
	randomDay := rand.Intn(dayRange)
	startTime := startDate.AddDate(0, 0, randomDay)

	// Set to business hours
	startTime = setBusinessHours(startTime)
	duration := time.Duration(15+rand.Intn(105)) * time.Minute // 15min to 2hrs
	endTime := startTime.Add(duration)

	// Random status distribution (70% scheduled, 20% completed, 10% cancelled)
	var status domain.AppointmentStatus
	statusRoll := rand.Intn(100)
	switch {
	case statusRoll < 70:
		status = domain.StatusScheduled
	case statusRoll < 90:
		status = domain.StatusCompleted
	default:
		status = domain.StatusCancelled
	}

	return domain.Appointment{
		UserID:      UserID,
		Title:       titles[rand.Intn(len(titles))],
		Description: descriptions[rand.Intn(len(descriptions))],
		StartTime:   startTime,
		EndTime:     endTime,
		Location:    locations[rand.Intn(len(locations))],
		Attendees:   attendees[rand.Intn(len(attendees))],
		Status:      status,
	}
}

func setBusinessHours(t time.Time) time.Time {
	// Set to a random time between 8 AM and 5 PM on weekdays
	for t.Weekday() == time.Saturday || t.Weekday() == time.Sunday {
		t = t.AddDate(0, 0, 1) // Move to next weekday
	}

	hour := 8 + rand.Intn(9)   // 8 AM to 4 PM
	minute := rand.Intn(4) * 15 // 0, 15, 30, or 45 minutes

	return time.Date(t.Year(), t.Month(), t.Day(), hour, minute, 0, 0, t.Location())
}
