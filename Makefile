.PHONY: seed reset test proto run install dev

# Database management
seed:
	@cd server && $(MAKE) seed

reset:
	@cd server && $(MAKE) reset

# Development commands
test:
	@cd server && $(MAKE) test

proto:
	@cd server && $(MAKE) proto

run:
	@cd server && $(MAKE) run

# Install dependencies
install:
	@echo "Installing server dependencies..."
	@cd server && go mod download
	@echo "Installing client dependencies..."
	@cd client && npm install
	@echo "✓ All dependencies installed"

# Start full stack with Docker Compose
dev:
	docker compose up --build

# Clean everything
clean:
	docker compose down -v
	@cd server && go clean
	@cd client && rm -rf node_modules dist
