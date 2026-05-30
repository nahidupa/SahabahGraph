.PHONY: install db-up db-down dev-backend dev-frontend dev mock-data test-e2e

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing data pipeline dependencies..."
	cd data-pipeline && pip install -r requirements.txt

db-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

db-down:
	@echo "Stopping Docker containers..."
	docker-compose down

dev-backend:
	@echo "Starting backend dev server..."
	cd backend && npm run start

dev-frontend:
	@echo "Starting frontend dev server..."
	cd frontend && npm run dev

dev:
	@echo "Starting both backend and frontend servers..."
	make -j2 dev-backend dev-frontend

mock-data:
	@echo "Generating and loading mock data..."
	cd data-pipeline && python generate_mock_data.py && python load_neo4j.py

test-e2e:
	@echo "Running Playwright E2E tests..."
	cd frontend && npx playwright test
