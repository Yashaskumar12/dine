import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../server/config/db';
import mongoose from 'mongoose';

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
  connectionState?: number;
  envVars?: {
    MONGODB_URI?: string;
    NODE_ENV?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const response: ApiResponse = {
    success: false,
    connectionState: mongoose.connection.readyState,
    envVars: {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'development',
    }
  };

  try {
    console.log('\n=== MongoDB Test Connection ===');
    console.log('Current connection state:', mongoose.connection.readyState);
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
    
    console.log('\nAttempting to connect to MongoDB...');
    await dbConnect();
    
    // Test a simple query
    console.log('Connection successful, testing query...');
    if (mongoose.connection.db) {
      const dbs = await mongoose.connection.db.admin().listDatabases();
      console.log('Available databases:', dbs.databases.map((db: any) => db.name));
    } else {
      console.warn('Mongoose connection exists but db is not available');
    }
    
    console.log('Successfully connected to MongoDB');
    console.log('Connection state after connect:', mongoose.connection.readyState);
    
    response.success = true;
    response.message = 'Successfully connected to MongoDB';
    response.connectionState = mongoose.connection.readyState;
    
    return res.status(200).json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('MongoDB connection error:', error);
    
    response.success = false;
    response.error = 'Failed to connect to MongoDB';
    response.message = errorMessage;
    response.connectionState = mongoose.connection.readyState;
    
    return res.status(500).json(response);
  }
}

// Add this to help with debugging
export const config = {
  api: {
    bodyParser: false,
  },
};
