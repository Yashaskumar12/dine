import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configure dotenv
dotenv.config();

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let firebaseAdminInitialized = false;

const initializeFirebaseAdmin = () => {
  if (firebaseAdminInitialized) return;

  try {
    const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
    
    // Check if service account file exists
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Firebase service account file not found at: ${serviceAccountPath}`);
    }

    // Read the service account file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    // Initialize the app if not already initialized
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully');
    }
    
    firebaseAdminInitialized = true;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    
    // In development, we can continue with a warning
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Failed to initialize Firebase Admin SDK: ' + error.message);
    }
    
    console.warn('Continuing in development mode without Firebase Admin. Some features may not work.');
  }
};

// Initialize Firebase Admin when this module is imported
initializeFirebaseAdmin();

/**
 * Middleware to verify Firebase ID token
 */
export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || '',
        email_verified: decodedToken.email_verified || false
      };
      next();
    } catch (error) {
      console.error('Error verifying token:', error);
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

// For development/testing without Firebase
export const devAuth = async (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    // Allow requests with a test user in development
    req.user = {
      uid: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      email_verified: true
    };
    return next();
  }
  return res.status(403).json({ error: 'Not allowed in production' });
};
