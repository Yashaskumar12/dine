# DineInGo - Restaurant Reservation System

A modern restaurant reservation application with MongoDB backend and Firebase authentication.

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas cloud account)
- Firebase account with authentication enabled

### Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

2. Set up Firebase Admin credentials:
   - Generate a Firebase Admin SDK private key from the Firebase Console
   - Save it as `server/config/firebase-admin-key.json`

### Installation

```bash
# Install dependencies
npm install

# Start development servers (both frontend and backend)
npm run start:all

# Start only the backend server
npm run server

# Start only the frontend development server
npm run dev
```

## Features

- User authentication with Firebase
- Restaurant browsing and search
- Table reservation and booking management
- User profile and booking history
- Responsive design for mobile and desktop

## Project Structure

- `/src` - Frontend React application
  - `/components` - Reusable UI components
  - `/pages` - Application pages
  - `/services` - API and authentication services
  - `/utils` - Utility functions and helpers
- `/server` - Backend Express.js server
  - `/config` - Server configuration
  - `/models` - MongoDB data models
  - `/routes` - API routes
  - `/middleware` - Express middleware

## Authentication Flow

1. User signs in with Firebase Authentication (email/password or Google)
2. Firebase returns an authentication token
3. Token is sent with API requests to the backend
4. Backend verifies the token using Firebase Admin SDK
5. User data is associated with MongoDB documents

## Reservation Flow

1. User browses restaurants
2. Selects date, time, and party size
3. Chooses a table
4. Confirms reservation details
5. Booking is saved to MongoDB
6. User can view/manage bookings on the dashboard
