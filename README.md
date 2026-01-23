# RescaTeam
Web Platform for Pet Adoption and Lost Pet Search

## Overview
RescaTeam is a microservices-based web platform for pet adoption and lost pet search. The system is composed of multiple independent microservices that communicate with each other.

### Microservices Architecture

#### Auth Middleware
**Port:** 8082 | **Technology:** Go (Gin)  
Middleware for JWT token verification. Provides an endpoint to validate authentication tokens and extract user information.

#### Users Microservice
**Port:** 8083 | **Technology:** Go (Gin) + MySQL  
Manages user authentication, registration, and administration. Includes login, registration, password change, user suspension/reactivation, and reporting system functionality.

#### Posts Microservice
**Port:** 8090 | **Technology:** Go (Gin) + MongoDB  
Manages adoption, lost and found pet posts. Allows creating, updating, deleting and searching posts, as well as uploading and managing associated images.

#### Chat Microservice
**Port:** 8083 (internal) | **Technology:** Go (Gin) + MongoDB + WebSockets  
Real-time messaging system between users. Includes WebSockets for instant communication and push notifications to alert users when someone is offline.

#### Search Microservice
**Port:** 8000 | **Technology:** Python (FastAPI) + Qdrant  
Semantic pet search service using vectors. Generates image embeddings and allows searching for similar pets through similarity search in a vector database.


#### Frontend
**Port:** 5173 | **Technology:** React + Vite  
Platform user interface. SPA web application built with React that consumes the microservices APIs.

---

## Getting started without Docker

### Prerequisites

- **Databases:**
  - MySQL (for Users microservice)
  - MongoDB (for Posts and Chat microservices)
  - Qdrant (for Search microservice)
  - AWS S3 (for Posts)
- **Message Queue:** RabbitMQ
- **Go 1.x** (for Go microservices)
- **Python 3.x** (for Python microservices)
- **Node.js and npm** (for Frontend)
- All `.env` files configured for each microservice

#### Start Dependencies

**MySQL**

**MongoDB:**
Make sure you have a MongoDB instance running or configured in Docker.

**RabbitMQ:**
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
# Web interface: http://localhost:15672
```
or
```bash
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:4-management
# Web interface: http://localhost:15672
```

#### 1. Auth Middleware
```bash
cd auth
go mod init auth
go mod tidy
go run main.go
```

#### 2. Users Microservice
```bash
cd users
go mod init users
go mod tidy
go run main.go
```

#### 3. Posts Microservice
```bash
cd posts
go mod init posts
go mod tidy
go run main.go
```

#### 4. Chat Microservice
```bash
cd chat
go mod init chat
go mod tidy
go run main.go
```

#### 5. Search Microservice
```bash
cd search
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m app.main
```
##### Note: for Windows same commands but replacing python3 for python


#### 6. Frontend
```bash
cd frontend
npm install
npm install react-router-dom axios
npm run dev
# Web interface: http://localhost:5173/
```

---

## Getting Started with Docker

### Prerequisites

- Docker and Docker Compose installed
- All `.env` files configured for each microservice

### Docker Network

Create the Docker network (only if it doesn't exist):
```bash
docker network create rescateam
```

### Running Services with Docker

#### 1. Auth Middleware
```bash
cd auth
docker build -t rescateam-auth .
docker run -d --network=rescateam --name rescateam-auth -p 8082:8082 rescateam-auth
```

#### 2. Users Microservice
```bash
cd users
docker build -t rescateam-users .
docker run -d --network=rescateam --name rescateam-users -p 8083:8080 rescateam-users
```

#### 3. Posts Microservice
```bash
cd posts
docker build -t rescateam-adoption .
docker run -d --network=rescateam --name rescateam-adoption -p 8090:8090 rescateam-adoption
```

#### 4. Chat Microservice
No dockerfile yet

#### 5. Search Microservice
```bash
cd search
docker build -t search-api .
docker run -d --network=rescateam --name search-api -p 8000:8000 --env-file .env search-api
```
or
```bash
cd search
docker build -t search-api .
docker run -p 8000:8000 --env-file .env search-api
```

#### 6. Frontend
```bash
cd frontend
docker build -t rescateam-frontend .
docker run -d --network=rescateam --name rescateam-frontend -p 5173:5173  rescateam-frontend
```

---

## Environment Variables
Each microservice requires its `.env` file with the necessary configurations.

---

## Notes

- Make sure all databases (MySQL, MongoDB, Qdrant) are running before starting the microservices
- RabbitMQ is necessary for asynchronous communication between microservices
- All microservices must be on the same Docker network (`rescateam`) to communicate when using Docker

---

## Testing

### Unit testing
#### 1. Auth Middleware
No unit tests yet

#### 2. Users Microservice
```bash
cd users
go test ./services/user -coverprofile=services/user/coverage.out \
&& go tool cover -func=services/user/coverage.out | tail -1

go test ./services/report -coverprofile=services/report/coverage.out \
&& go tool cover -func=services/report/coverage.out | tail -1
```

#### 3. Posts Microservice
```bash
cd posts
go test ./services -coverprofile=services/coverage.out && go tool cover -func=services/coverage.out | tail -1
```

#### 4. Chat Microservice
```bash
cd chat
go test ./services -coverprofile=services/coverage.out && go tool cover -func=services/coverage.out | tail -1
```

#### 5. Search Microservice
```bash
cd search
pytest app/services/embedding_service_test.py --cov=app.services.embedding_service --cov-report=term --cov-report=html -v
```

#### 6. Frontend
```bash
cd frontend
npm run test:coverage
```

---

### E2E Tests

⚠️ **WARNING:** Before running any E2E test, configure the following environment variables:

**Posts `.env`:**
```env
ENV=QA
MONGO_DB_QA=posts_qa
```

**Chat `.env`:**
```env
ENV=QA
MONGO_DB_QA=rescateam_chatdb_qa
```

**Note:** Still need to configure environment to separate users database for QA.

**Run E2E Tests:**

Headless mode:
```bash
cd frontend
npm run test:e2e
```

Interactive mode (Cypress UI):
```bash
cd frontend
npx cypress open
```