# Period Tracker Application

A comprehensive period tracking application with intelligent prediction algorithms built with TypeScript, Node.js, React, and PostgreSQL.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Prediction Algorithm](#prediction-algorithm)
- [Project Structure](#project-structure)

## Features

### Core Features
- **Period Logging**: Track start/end dates and flow intensity
- **Smart Predictions**: AI-powered next period predictions with confidence scores
- **Ovulation Tracking**: Calculate fertile windows
- **Cycle Analytics**: View average cycle length, period duration, and regularity
- **Historical Data**: Complete period history with visualization
- **User Authentication**: Secure login and registration

### Prediction Algorithm Highlights
- Weighted moving average calculation (recent cycles weighted more)
- Statistical analysis for cycle regularity
- Confidence scoring based on data quality
- Handles irregular cycles gracefully
- Minimum 3 cycles required for accurate predictions

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Validation**: Zod
- **Authentication**: JWT with bcrypt

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation including:
- High-Level Design (HLD)
- Low-Level Design (LLD)
- Database Schema
- API Specifications
- Scalability Considerations

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Clone the Repository

```bash
cd period_tracker
```

### 2. Database Setup

#### Install PostgreSQL (if not already installed)

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE period_tracker;

# Create user (optional)
CREATE USER tracker_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE period_tracker TO tracker_user;

# Exit
\q
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your database credentials
# DB_USER=ruchidavda
# DB_PASSWORD=
# DB_NAME=period_tracker
# DB_HOST=localhost
# DB_PORT=5432
# JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Start backend server
npm run dev
```

The backend will run on `http://localhost:3000`

### 4. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 5. Access the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Create a new account by clicking "Sign Up"
3. Login with your credentials

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Periods

**POST /api/periods** - Log a new period
```json
{
  "start_date": "2026-01-15",
  "end_date": "2026-01-20",
  "flow_intensity": "moderate",
  "notes": "Normal cycle"
}
```

**GET /api/periods** - Get all periods
- Query params: `limit`, `offset`

**GET /api/periods/:id** - Get specific period with symptoms

**PUT /api/periods/:id** - Update period

**DELETE /api/periods/:id** - Delete period

#### Predictions (Core Feature)

**GET /api/predictions/next-period** - Get next period prediction

Response:
```json
{
  "success": true,
  "data": {
    "next_period": {
      "predicted_start_date": "2026-02-12",
      "predicted_end_date": "2026-02-17",
      "confidence_score": 0.85
    },
    "ovulation": {
      "predicted_start_date": "2026-01-29",
      "predicted_end_date": "2026-02-02"
    },
    "cycle_stats": {
      "avg_cycle_length": 28,
      "avg_period_length": 5,
      "cycle_regularity": "regular",
      "cycles_tracked": 7
    }
  }
}
```

**GET /api/predictions/calendar?months=3** - Get predictions for next N cycles

## Prediction Algorithm

### Overview

The prediction algorithm uses a **weighted moving average** approach combined with statistical analysis to predict menstrual cycles.

### Key Components

1. **Historical Data Collection**
   - Retrieves last 6-12 completed cycles
   - Validates data quality (filters unrealistic cycle lengths)

2. **Weighted Average Calculation**
   ```
   Predicted Cycle Length = 
     (recent_3_cycles * 0.5) + 
     (middle_3_cycles * 0.3) + 
     (older_cycles * 0.2)
   ```
   Recent cycles are weighted more heavily as they better represent current patterns.

3. **Regularity Assessment**
   - Calculates standard deviation of cycle lengths
   - Classification:
     - σ < 2 days: "Very Regular" (90-95% confidence)
     - 2 ≤ σ < 4: "Regular" (75-89% confidence)
     - 4 ≤ σ < 7: "Somewhat Irregular" (60-74% confidence)
     - σ ≥ 7: "Irregular" (40-59% confidence)

4. **Ovulation Prediction**
   - Ovulation typically occurs 14 days before next period
   - Fertile window: 5 days before to 1 day after ovulation

5. **Confidence Score**
   - Based on cycle regularity (standard deviation)
   - Number of data points (more cycles = higher confidence)
   - Recency of data (recent data weighted more)

### Algorithm Implementation

Located in `backend/src/services/predictionService.ts`

Key methods:
- `predictNextPeriod()` - Main prediction function
- `calculateWeightedCycleLength()` - Weighted average calculation
- `calculateConfidence()` - Confidence score computation
- `calculateCycleStats()` - Statistical analysis

### Edge Cases Handled

- Insufficient data (< 3 cycles): Uses default predictions with low confidence
- Irregular cycles: Adjusted confidence scores
- Unrealistic data: Filters cycle lengths outside 21-45 day range
- Missing end dates: Excluded from calculations

## Project Structure

```
period_tracker/
├── ARCHITECTURE.md          # Detailed architecture documentation
├── README.md               # This file
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts # Sequelize configuration
│   │   ├── models/
│   │   │   ├── User.ts    # User model
│   │   │   ├── UserSettings.ts
│   │   │   ├── Period.ts  # Period model
│   │   │   ├── Symptom.ts
│   │   │   ├── Prediction.ts
│   │   │   └── index.ts   # Model exports
│   │   ├── middleware/
│   │   │   └── auth.ts    # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.ts    # Authentication routes
│   │   │   ├── periods.ts # Period management routes
│   │   │   └── predictions.ts # Prediction routes
│   │   ├── services/
│   │   │   └── predictionService.ts # Prediction algorithm
│   │   └── index.ts       # Express server setup
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AddPeriodForm.tsx
    │   │   ├── Login.tsx
    │   │   ├── PeriodList.tsx
    │   │   └── PredictionCard.tsx
    │   ├── api.ts         # API client
    │   ├── App.tsx        # Main app component
    │   ├── index.css      # Global styles
    │   └── main.tsx       # React entry point
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

## Testing the Application

### Test Prediction Algorithm

1. Login with demo account
2. View the prediction card showing next period and ovulation
3. Add new periods to see how predictions update
4. Check confidence scores based on cycle regularity

### Adding Data

Start by logging your periods:
- Click "+ Log Period" button
- Enter start date and end date
- Select flow intensity
- Add optional notes
- Minimum 3 periods needed for predictions

### Testing Different Scenarios

**Regular Cycles:**
- Add periods with consistent 28-day cycles
- Observe high confidence scores (85-95%)

**Irregular Cycles:**
- Add periods with varying cycle lengths (25, 32, 27, 35 days)
- Observe lower confidence scores (40-70%)

**Insufficient Data:**
- Delete periods until less than 3 remain
- Observe default predictions with low confidence

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT-based authentication
- Protected API endpoints
- Input validation with Zod
- SQL injection prevention via Sequelize ORM
- CORS enabled for frontend-backend communication

## Future Enhancements

### Short-term
- Symptom tracking and pattern analysis
- Period reminders and notifications
- Data export (CSV/PDF)
- Dark mode support

### Long-term
- Machine learning models for improved predictions
- Integration with health apps (Apple Health, Google Fit)
- Community features and health articles
- Multi-language support
- Mobile app (React Native)

## Scalability Considerations

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed scalability strategies including:

- Database sharding by user_id
- Redis caching layer
- Read replicas for analytics
- Horizontal API scaling
- Pre-computed predictions
- CDN for static assets

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Check connection
psql -U postgres -d period_tracker
```

### Port Already in Use

```bash
# Find process using port 3000 (backend)
lsof -ti:3000

# Kill process
kill -9 <PID>

# Or use different port in backend/.env
PORT=3001
```

### Database Issues

```bash
# Check database connection
psql -d period_tracker -U ruchidavda

# Restart backend server
cd backend
npm run dev
```

## License

This is a demo project created for educational purposes.

## Getting Started

1. Sign up with your email and password (minimum 8 characters)
2. Log your first period entry
3. Add at least 3 periods to see accurate predictions

## Acknowledgments

- Prediction algorithm inspired by research on menstrual cycle tracking
- UI design influenced by popular health tracking apps
- Built with modern web technologies and best practices
