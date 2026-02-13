package db

import (
	"context"
	"fmt"
	_ "embed"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/001_initial_schema.sql
var initialSchemaSQL string

func ApplyMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	if _, err := pool.Exec(ctx, initialSchemaSQL); err != nil {
		return fmt.Errorf("apply migration: %w", err)
	}

	return nil
}
