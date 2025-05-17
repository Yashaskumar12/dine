import { auth } from '../firebase';

const API_URL = 'http://localhost:5000/api';

/**
 * Get Firebase auth token for API requests
 */
const getAuthToken = async (): Promise<string | null> => {
  // For development purposes, we're using a simplified authentication approach
  // In production, we would properly use Firebase authentication
  try {
    const user = auth.currentUser;
    if (user) {
      return user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Make an authenticated request to the API
 */
const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  data: any = null
): Promise<any> => {
  try {
    console.log(`API Request to: ${endpoint}, Method: ${method}`);
    
    // Get auth token if available
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Using authenticated request with token');
    } else {
      console.log('Making unauthenticated request (development mode)');
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (data) {
      options.body = JSON.stringify(data);
      console.log('Request payload:', data);
    }

    console.log(`Sending request to: ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch((e) => {
        console.error('Failed to parse error response:', e);
        return {};
      });
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('API response:', responseData);
    return responseData;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Booking API endpoints
export const bookingsApi = {
  // Get all bookings for the current user
  getAll: async () => {
    return apiRequest('/bookings');
  },

  // Get a specific booking by ID
  getById: async (id: string) => {
    return apiRequest(`/bookings/${id}`);
  },

  // Create a new booking
  create: async (bookingData: any) => {
    return apiRequest('/bookings', 'POST', bookingData);
  },

  // Update a booking's status
  updateStatus: async (id: string, status: string) => {
    return apiRequest(`/bookings/${id}`, 'PATCH', { status });
  },

  // Delete a booking
  delete: async (id: string) => {
    return apiRequest(`/bookings/${id}`, 'DELETE');
  }
};

export default {
  bookings: bookingsApi
};
