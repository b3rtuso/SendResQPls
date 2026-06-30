# 🚨 SendResQPls — MDRRMO Disaster Response System

> **Municipal Disaster Risk Reduction & Management Office (MDRRMO) — Balayan, Batangas**  
> AI-powered disaster reporting & emergency response management platform

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
  - [Part 1 — User & Authentication Module](#part-1--user--authentication-module-member-1)
  - [Part 2 — Incident & Response Module](#part-2--incident--response-module-member-2)
  - [Part 3 — Departments, Logs & Analytics Module](#part-3--departments-logs--analytics-module-member-3)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Setup](#setup)

---

## System Overview

SendResQPls is a full-stack disaster response management system built for the MDRRMO of Balayan, Batangas. It consists of:

| Component | Description |
|-----------|-------------|
| **Mobile App** | Citizens report incidents via photo + GPS location |
| **Admin Dashboard** | MDRRMO dispatchers manage incidents, assign departments, view analytics |
| **AI Integration** | Google Gemini AI detects incident type and recommends department |
| **Backend API** | RESTful API with JWT authentication, Prisma ORM, PostgreSQL |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript, Vite, Recharts, Leaflet |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Prisma ORM |
| AI | Google Gemini 2.0 Flash |
| Auth | JWT + Bcrypt |
| Push Notifications | Expo Push Notifications |

---

## Database Schema

The database is divided into **3 modules**, one per team member.

---

### Part 1 — User & Authentication Module (Member 1)

> Handles user registration, login, roles, OTP verification, sessions, and notification preferences.

#### `User` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PK, DEFAULT uuid()` | Unique user identifier |
| `name` | `VARCHAR(255)` | `NOT NULL` | Full name |
| `email` | `VARCHAR(255)` | `UNIQUE, NULLABLE` | Email address (admin login) |
| `phone_number` | `VARCHAR(20)` | `UNIQUE, NULLABLE` | Mobile number (citizen login) |
| `password_hash` | `TEXT` | `NOT NULL` | Bcrypt-hashed password |
| `role` | `ENUM(Role)` | `NOT NULL, DEFAULT 'CITIZEN'` | User role |
| `avatar_url` | `TEXT` | `NULLABLE` | Profile photo URL |
| `is_active` | `BOOLEAN` | `DEFAULT true` | Account active status |
| `push_token` | `TEXT` | `NULLABLE` | Expo push notification token |
| `otp_code` | `VARCHAR(6)` | `NULLABLE` | One-time password for verification |
| `otp_expires_at` | `TIMESTAMP` | `NULLABLE` | OTP expiration timestamp |
| `last_login_at` | `TIMESTAMP` | `NULLABLE` | Last successful login |
| `created_at` | `TIMESTAMP` | `DEFAULT now()` | Account creation date |
| `updated_at` | `TIMESTAMP` | `AUTO UPDATE` | Last profile update |

#### `Role` Enum

| Value | Description |
|-------|-------------|
| `CITIZEN` | Mobile app user — reports incidents |
| `ADMIN` | Web dashboard user — MDRRMO dispatcher |
| `SUPER_ADMIN` | System administrator — full access |

#### `Session` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PK` | Session identifier |
| `user_id` | `UUID` | `FK → User.id, NOT NULL` | Owner of the session |
| `token` | `TEXT` | `NOT NULL, UNIQUE` | JWT refresh token |
| `device_info` | `VARCHAR(255)` | `NULLABLE` | Device/browser info |
| `ip_address` | `VARCHAR(45)` | `NULLABLE` | Login IP address |
| `expires_at` | `TIMESTAMP` | `NOT NULL` | Token expiration |
| `created_at` | `TIMESTAMP` | `DEFAULT now()` | Session start |

#### `NotificationPreference` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PK` | Preference identifier |
| `user_id` | `UUID` | `FK → User.id, UNIQUE` | User who owns preference |
| `new_incident` | `BOOLEAN` | `DEFAULT true` | Alert on new incident reports |
| `status_update` | `BOOLEAN` | `DEFAULT true` | Alert on status changes |
| `system_alerts` | `BOOLEAN` | `DEFAULT true` | System-wide announcements |
| `email_digest` | `BOOLEAN` | `DEFAULT false` | Daily email summary |

#### Relationships

```
User (1) ──→ (N) Session
User (1) ──→ (1) NotificationPreference
User (1) ──→ (N) Incident          [FK in Part 2]
User (1) ──→ (N) AuditLog          [FK in Part 3]
```

---

### Part 2 — Incident & Response Module (Member 2)

> Handles incident reporting, AI classification, department assignment, status tracking, and response timeline.

#### `Incident` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PK, DEFAULT uuid()` | Unique incident identifier |
| `reporter_id` | `UUID` | `FK → User.id, NOT NULL` | Citizen who reported |
| `latitude` | `FLOAT` | `NOT NULL` | GPS latitude from device |
| `longitude` | `FLOAT` | `NOT NULL` | GPS longitude from device |
| `address` | `TEXT` | `NULLABLE` | Reverse-geocoded address |
| `barangay` | `VARCHAR(100)` | `NULLABLE` | Nearest barangay name |
| `photo_url` | `TEXT` | `NOT NULL` | Incident photo (uploaded) |
| `description` | `TEXT` | `NULLABLE` | Citizen's description of event |
| `incident_type` | `ENUM(IncidentType)` | `NULLABLE` | Final incident category |
| `ai_detected_type` | `VARCHAR(100)` | `NULLABLE` | AI-predicted incident type |
| `ai_confidence` | `FLOAT` | `NULLABLE` | AI prediction confidence (0-1) |
| `ai_recommended_dept` | `ENUM(Department)` | `NULLABLE` | AI-suggested department |
| `ai_description` | `TEXT` | `NULLABLE` | AI-generated incident summary |
| `assigned_department` | `ENUM(Department)` | `NULLABLE` | Admin's final department assignment |
| `status` | `ENUM(Status)` | `NOT NULL, DEFAULT 'PENDING'` | Current incident status |
| `priority` | `ENUM(Priority)` | `DEFAULT 'MEDIUM'` | Urgency level |
| `admin_notes` | `TEXT` | `NULLABLE` | Dispatcher's notes |
| `resolved_at` | `TIMESTAMP` | `NULLABLE` | When marked resolved |
| `created_at` | `TIMESTAMP` | `DEFAULT now()` | Report timestamp |
| `updated_at` | `TIMESTAMP` | `AUTO UPDATE` | Last update |

#### `IncidentType` Enum

| Value | Description |
|-------|-------------|
| `MEDICAL` | Medical emergencies — dizziness, stroke, seizure, DOB |
| `TRAUMA` | Physical injuries — RTA motorbike, falls, lacerations |
| `ACCIDENT` | Vehicular collisions and road traffic accidents |
| `FIRE` | Structural and wildland fires |
| `CRIME` | Assault, robbery, shooting, firearm incidents |
| `FLOOD` | River overflow, flash floods, storm surge |
| `TYPHOON` | Tropical storms and typhoon damage |
| `LANDSLIDE` | Ground movement, mudslides, erosion |
| `OTHER` | Uncategorized incidents |

#### `Status` Enum

| Value | Description |
|-------|-------------|
| `PENDING` | Just reported — awaiting review |
| `REVIEWING` | Admin is evaluating the report |
| `DISPATCHED` | Responders have been sent |
| `RESOLVED` | Incident has been handled |
| `REJECTED` | Fake or invalid report |

#### `Priority` Enum

| Value | Description |
|-------|-------------|
| `LOW` | Non-urgent — can wait |
| `MEDIUM` | Standard priority |
| `HIGH` | Urgent — needs fast response |
| `CRITICAL` | Life-threatening — immediate action |

#### `Department` Enum

| Value | Full Name |
|-------|-----------|
| `BFP` | Bureau of Fire Protection |
| `PNP` | Philippine National Police |
| `MEDICAL` | Ambulance / Red Cross |
| `ENGINEERING` | DPWH / Local Engineering |
| `RESCUE` | General MDRRMO Rescue Team |

#### `IncidentTimeline` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PK` | Timeline entry ID |
| `incident_id` | `UUID` | `FK → Incident.id, NOT NULL` | Related incident |
| `action` | `VARCHAR(100)` | `NOT NULL` | Action taken (e.g., "Status changed to DISPATCHED") |
| `performed_by` | `UUID` | `FK → User.id, NULLABLE` | Admin who performed action |
| `details` | `TEXT` | `NULLABLE` | Additional context |
| `created_at` | `TIMESTAMP` | `DEFAULT now()` | When action occurred |

#### Relationships

```
User (1)     ──→ (N) Incident           [reporter_id]
Incident (1) ──→ (N) IncidentTimeline   [incident_id]
User (1)     ──→ (N) IncidentTimeline   [performed_by]
```

---

### Part 3 — Departments, Logs & Analytics Module (Member 3)

> Handles department management, call logging, audit trails, and report generation.

#### `DepartmentInfo` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PK, DEFAULT uuid()` | Department record ID |
| `name` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Short name (e.g., "BFP") |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Full name (e.g., "Bureau of Fire Protection") |
| `head_officer` | `VARCHAR(255)` | `NOT NULL` | Department head name |
| `contact` | `VARCHAR(20)` | `NOT NULL` | Contact phone number |
| `email` | `VARCHAR(255)` | `NOT NULL` | Department email |
| `personnel_count` | `INT` | `DEFAULT 0` | Number of active personnel |
| `equipment` | `TEXT[]` | `DEFAULT []` | List of available equipment |
| `status` | `VARCHAR(50)` | `DEFAULT 'Available'` | Available / On Standby / Deployed |
| `address` | `TEXT` | `NULLABLE` | Physical office address |
| `created_at` | `TIMESTAMP` | `DEFAULT now()` | Record creation |
| `updated_at` | `TIMESTAMP` | `AUTO UPDATE` | Last update |

#### `CallLog` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PK` | Call log entry ID |
| `incident_id` | `UUID` | `FK → Incident.id, NULLABLE` | Related incident (if any) |
| `department_id` | `UUID` | `FK → DepartmentInfo.id, NULLABLE` | Department called |
| `caller_id` | `UUID` | `FK → User.id, NOT NULL` | Admin who made the call |
| `phone_number` | `VARCHAR(20)` | `NOT NULL` | Number dialed |
| `direction` | `ENUM(CallDirection)` | `NOT NULL` | Inbound or outbound |
| `status` | `ENUM(CallStatus)` | `NOT NULL` | Call outcome |
| `duration_seconds` | `INT` | `DEFAULT 0` | Call duration in seconds |
| `notes` | `TEXT` | `NULLABLE` | Call notes by dispatcher |
| `created_at` | `TIMESTAMP` | `DEFAULT now()` | Call timestamp |

#### `CallDirection` Enum

| Value | Description |
|-------|-------------|
| `INBOUND` | Call received by MDRRMO |
| `OUTBOUND` | Call made by MDRRMO dispatcher |

#### `CallStatus` Enum

| Value | Description |
|-------|-------------|
| `ACCEPTED` | Call was answered |
| `NO_RESPONSE` | No answer |
| `DECLINED` | Call was rejected |

#### `AuditLog` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PK` | Audit entry ID |
| `user_id` | `UUID` | `FK → User.id, NOT NULL` | Admin who performed action |
| `action` | `VARCHAR(100)` | `NOT NULL` | Action type (e.g., "UPDATE_INCIDENT") |
| `entity_type` | `VARCHAR(50)` | `NOT NULL` | Table affected (e.g., "Incident") |
| `entity_id` | `UUID` | `NOT NULL` | ID of affected record |
| `old_values` | `JSONB` | `NULLABLE` | Previous values (for changes) |
| `new_values` | `JSONB` | `NULLABLE` | New values (for changes) |
| `ip_address` | `VARCHAR(45)` | `NULLABLE` | Request IP address |
| `created_at` | `TIMESTAMP` | `DEFAULT now()` | When action occurred |

#### `Report` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PK` | Report ID |
| `title` | `VARCHAR(255)` | `NOT NULL` | Report title |
| `type` | `ENUM(ReportType)` | `NOT NULL` | Report category |
| `generated_by` | `UUID` | `FK → User.id, NOT NULL` | Admin who generated |
| `date_from` | `DATE` | `NOT NULL` | Report period start |
| `date_to` | `DATE` | `NOT NULL` | Report period end |
| `file_url` | `TEXT` | `NULLABLE` | Generated CSV/PDF file URL |
| `metadata` | `JSONB` | `NULLABLE` | Summary stats (total incidents, etc.) |
| `created_at` | `TIMESTAMP` | `DEFAULT now()` | Generation timestamp |

#### `ReportType` Enum

| Value | Description |
|-------|-------------|
| `MONTHLY` | Monthly incident summary |
| `QUARTERLY` | Quarterly analysis report |
| `ANNUAL` | Annual performance report |
| `CUSTOM` | Custom date range report |

#### Relationships

```
DepartmentInfo (1) ──→ (N) CallLog        [department_id]
Incident (1)       ──→ (N) CallLog        [incident_id]
User (1)           ──→ (N) CallLog        [caller_id]
User (1)           ──→ (N) AuditLog       [user_id]
User (1)           ──→ (N) Report         [generated_by]
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Session : "has"
    User ||--o| NotificationPreference : "has"
    User ||--o{ Incident : "reports"
    User ||--o{ IncidentTimeline : "performs"
    User ||--o{ CallLog : "makes"
    User ||--o{ AuditLog : "creates"
    User ||--o{ Report : "generates"

    Incident ||--o{ IncidentTimeline : "has"
    Incident ||--o{ CallLog : "related to"

    DepartmentInfo ||--o{ CallLog : "receives"

    User {
        uuid id PK
        string name
        string email UK
        string phone_number UK
        string password_hash
        enum role
        string push_token
        timestamp created_at
    }

    Incident {
        uuid id PK
        uuid reporter_id FK
        float latitude
        float longitude
        string photo_url
        enum incident_type
        string ai_detected_type
        enum assigned_department
        enum status
        enum priority
        timestamp created_at
    }

    DepartmentInfo {
        uuid id PK
        string name UK
        string full_name
        string head_officer
        string contact
        int personnel_count
        string status
    }

    CallLog {
        uuid id PK
        uuid incident_id FK
        uuid department_id FK
        uuid caller_id FK
        enum direction
        enum status
        int duration_seconds
    }

    AuditLog {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        jsonb old_values
        jsonb new_values
    }

    Report {
        uuid id PK
        uuid generated_by FK
        string title
        enum type
        date date_from
        date date_to
    }
```

---

## Work Distribution Summary

| Part | Module | Tables | Member |
|------|--------|--------|--------|
| **Part 1** | User & Authentication | `User`, `Session`, `NotificationPreference` | Member 1 |
| **Part 2** | Incident & Response | `Incident`, `IncidentTimeline` + Enums | Member 2 |
| **Part 3** | Departments, Logs & Analytics | `DepartmentInfo`, `CallLog`, `AuditLog`, `Report` | Member 3 |

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/b3rtuso/SendResQPls.git
cd SendResQPls

# Backend setup
cd backend
npm install
cp .env.example .env    # Configure your database URL & API keys
npx prisma migrate dev  # Run database migrations
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/sendresqpls
JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-google-gemini-api-key
```

---

## License

This project is developed for academic purposes — MDRRMO Balayan, Batangas.
