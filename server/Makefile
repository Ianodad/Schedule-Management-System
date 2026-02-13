.PHONY: test run postgres-up postgres-down proto

proto:
	PATH=$(HOME)/bin:$(PATH) protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/appointment/v1/appointment.proto

test:
	go test ./...

run:
	go run ./cmd/server

postgres-up:
	docker compose up -d postgres

postgres-down:
	docker compose stop postgres
