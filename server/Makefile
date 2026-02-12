.PHONY: test run postgres-up postgres-down

test:
	go test ./...

run:
	go run ./cmd/server

postgres-up:
	docker compose up -d postgres

postgres-down:
	docker compose stop postgres
