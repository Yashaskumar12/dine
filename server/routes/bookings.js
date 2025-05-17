import express from 'express';
import Booking from '../models/Booking.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();


// Get all bookings for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /bookings request received');
    
    // For development, return all bookings if no user ID (simplified auth)
    const userId = req.user ? req.user.uid : null;
    console.log('User ID from token:', userId);
    
    let query = {};
    if (userId) {
      query.userId = userId;
    } else {
      console.log('Development mode: returning all bookings');
    }
    
    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    console.log(`Found ${bookings.length} bookings`);
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('POST /bookings request received:', req.body);
    
    // Get userId from token if available (simplified for development)
    const userId = req.user ? req.user.uid : 'dev-user';
    console.log('Creating booking for user:', userId);
    
    // Add required fields
    const bookingData = {
      ...req.body,
      userId,
      status: req.body.status || 'Confirmed',
      createdAt: new Date().toISOString()
    };
    
    console.log('Saving booking with data:', bookingData);
    const newBooking = new Booking(bookingData);
    
    const savedBooking = await newBooking.save();
    console.log('Booking saved successfully with ID:', savedBooking._id);
    
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Get a specific booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const booking = await Booking.findOne({ _id: req.params.id, userId });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a booking status
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status } = req.body;
    
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId },
      { status },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a booking
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const booking = await Booking.findOneAndDelete({ _id: req.params.id, userId });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
