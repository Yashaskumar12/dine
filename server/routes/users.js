import express from 'express';
import User from '../models/User.js';
import { auth, devAuth } from '../middleware/auth.js';

const router = express.Router();

// Use dev auth in development, otherwise use Firebase auth
const authMiddleware = process.env.NODE_ENV === 'development' ? devAuth : auth;

// Update user profile
router.post('/update', authMiddleware, async (req, res) => {
  try {
    const { userId, updates } = req.body;
    
    console.log('Received update request for user:', userId);
    console.log('Updates:', updates);
    
    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid user ID:', userId);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID',
        details: 'User ID is required and must be a string'
      });
    }

    // Ensure the authenticated user is updating their own profile
    if (userId !== req.user.uid) {
      console.error('Unauthorized update attempt:', {
        authenticatedUser: req.user.uid,
        targetUser: userId
      });
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized',
        details: 'You can only update your own profile'
      });
    }

    // Remove any fields that shouldn't be updated
    const allowedUpdates = [
      'displayName', 'name', 'phoneNumber', 'address', 'locationSettings', 'photoURL'
    ];
    
    const updatesToApply = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        // Handle nested updates for address and locationSettings
        if (key === 'address' || key === 'locationSettings') {
          if (updates[key] && typeof updates[key] === 'object') {
            updatesToApply[key] = { ...updates[key] };
          }
        } else {
          updatesToApply[key] = updates[key];
        }
      }
    });

    console.log('Updates to apply after filtering:', updatesToApply);

    // If phone number is being updated, clean it up
    if (updatesToApply.phoneNumber) {
      // Remove all non-digit characters except leading +
      updatesToApply.phoneNumber = updatesToApply.phoneNumber.replace(/^(\+?\d+)|\D/g, '$1');
      
      // Basic validation for Indian phone numbers
      const phoneRegex = /^(\+91|0)?[6789]\d{9}$/;
      if (!phoneRegex.test(updatesToApply.phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number',
          details: 'Please provide a valid Indian phone number'
        });
      }
    }

    // Update the user in the database
    let user;
    try {
      user = await User.findByIdAndUpdate(
        userId,
        { $set: updatesToApply },
        { new: true, runValidators: true }
      );

      if (!user) {
        console.error('User not found with ID:', userId);
        return res.status(404).json({ 
          success: false,
          error: 'User not found',
          details: 'The specified user does not exist'
        });
      }
      
      console.log('Successfully updated user:', user._id);
    } catch (error) {
      console.error('Database update error:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = {};
        Object.keys(error.errors).forEach(key => {
          errors[key] = error.errors[key].message;
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate field',
          details: 'A user with this information already exists'
        });
      }
      
      // Handle other database errors
      return res.status(500).json({
        success: false,
        error: 'Database error',
        details: 'Failed to update user in the database'
      });
    }

    // Return the updated user data (only include necessary fields)
    const userResponse = {
      uid: user._id,
      displayName: user.displayName,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      address: user.address || {},
      locationSettings: user.locationSettings || {}
    };

    console.log('Sending success response for user:', user._id);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Unexpected error in user update:', error);
    
    // Handle unexpected errors
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

export default router;
