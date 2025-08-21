# 🏥 DOME Care Healthcare Platform

A comprehensive healthcare platform connecting doctors and patients in Syria. DOME Care provides appointment booking, prescription management, doctor search, and patient care coordination in a modern, bilingual (Arabic/English) web application.
## 🌟 Features
### 👨‍⚕️ For Doctors

Patient Management: View and manage patient profiles and medical history
Appointment Scheduling: Manage appointments with real-time availability
Digital Prescriptions: Create detailed prescriptions with medicine database
Schedule Management: Set working hours and availability
Analytics Dashboard: Track appointments, patients, and performance metrics
Profile Management: Complete doctor profiles with specialties and clinic info

### 👥 For Patients

Doctor Search: Advanced search with filters (specialty, location, rating, fees)
Appointment Booking: Real-time appointment booking with available time slots
Medical Records: Access prescription history and medical documents
Clinic Information: View doctor details, locations, and contact information
Appointment Management: View, reschedule, or cancel appointments

### 🔧 Technical Features

Bilingual Support: Arabic and English interface
Mobile Responsive: Works seamlessly on desktop, tablet, and mobile
Real-time Updates: Live appointment status and availability
Secure Authentication: JWT-based authentication with refresh tokens
Progressive Web App: App-like experience with offline capability
Syrian Medicine Database: Comprehensive local medication database

## 🏗️ Architecture
DOME Care Platform

├── Backend (FastAPI + Python)

│   ├── RESTful API with OpenAPI documentation

│   ├── MongoDB database with optimized indexes

│   ├── JWT authentication with refresh tokens

│   ├── Clean architecture with service patterns

│   └── Comprehensive error handling

├── Frontend (React + TypeScript)

│   ├── Modern responsive UI with Tailwind CSS

│   ├── State management with React Query

│   ├── Real-time features with WebSocket support

│   └── Progressive Web App capabilities

└── Database (MongoDB)

│   ├── User management and authentication

│    ├── Appointment scheduling and management

│    ├── Prescription and medicine database
    
│    └── Audit logs and analytics

## 📋 Prerequisites
### System Requirements

- Operating System: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- Memory: 4GB RAM minimum, 8GB recommended
- Storage: 2GB free space

### Software Dependencies

- Python: 3.11 or higher
- Node.js: 18.0 or higher
- MongoDB: 7.0 or higher
- Git: Latest version

### Development Tools (Recommended)

- VS Code with Python and TypeScript extensions
- MongoDB Compass for database management
- Postman for API testing

## 🚀 Quick Start
1. Clone the Repository
```bash
$ git clone https://github.com/your-username/domecare-healthcare.git
$ cd domecare-healthcare
```
2. Database Setup (MongoDB)
#### Option A: Using Docker (Recommended)
```bash
$ cd Docker
$ cp .env.example .env
# Edit .env with your preferred credentials
$ docker-compose -f docker-compose.mongodb.yml up -d
```
#### Option B: Local MongoDB Installation

1. Install MongoDB 7.0+ from official website
2. Start MongoDB service
3. Import sample data:
```bash
$ mongosh < Docker/init-mongo.js
```
3. Backend Setup
```bash
# Navigate to backend directory
$ cd backend

# Create virtual environment
$ python -m venv venv

# Activate virtual environment
# Windows:
$ venv\Scripts\activate
# macOS/Linux:
$ source venv/bin/activate

# Install dependencies
$ pip install -r requirements.txt

# Setup environment variables
$ cp .env.example .env
# Edit .env with your configuration

# Run the backend server
$ uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
4. Frontend Setup
```bash
# Navigate to frontend directory (new terminal)
$ cd frontend-web

# Install dependencies
$ npm install

# Start development server
$ npm run dev
```
5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- MongoDB: mongodb://localhost:27017

## 📚 API Documentation
### Authentication Endpoints

- POST /api/v1/auth/register - User registration
- POST /api/v1/auth/login - User login
- POST /api/v1/auth/verify - OTP verification
- POST /api/v1/auth/refresh - Refresh access token

### Appointment Endpoints

- GET /api/v1/appointments/my - Get user appointments
- POST /api/v1/appointments/ - Create new appointment
- GET /api/v1/appointments/doctors/{id}/slots - Get available slots
- PUT /api/v1/appointments/{id}/status - Update appointment status

### Doctor Endpoints

- GET /api/v1/doctors/search - Search doctors with filters
- GET /api/v1/doctors/{id} - Get doctor details
- PUT /api/v1/doctors/profile - Update doctor profile
- GET /api/v1/doctors/specialties - Get available specialties

### Prescription Endpoints

- POST /api/v1/prescriptions/ - Create prescription
- GET /api/v1/prescriptions/my - Get user prescriptions
- GET /api/v1/prescriptions/medicines/search - Search medicines