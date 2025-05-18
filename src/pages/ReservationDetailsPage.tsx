import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, Check, Info } from 'lucide-react';
import { getMockRestaurantById } from '../services/restaurantService';
import type { Restaurant } from '../types';
import { auth } from '../firebase';
import { bookingsApi } from '../services/api';
import { toast } from 'react-toastify';

const ReservationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const type = searchParams.get('type') || 'restaurant';
  const [selectedMenuItems, setSelectedMenuItems] = useState<{ [key: string]: number }>({});
  const [showMenuItems, setShowMenuItems] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (id) {
          if (type === 'restaurant') {
            const restaurantData = await getMockRestaurantById(id);
            setRestaurant(restaurantData);

            // Parse selected menu items from URL
            const items = searchParams.getAll('items');
            const menuItems: { [key: string]: number } = {};
            items.forEach(item => {
              const [itemId, count] = item.split(':');
              menuItems[itemId] = parseInt(count);
            });
            setSelectedMenuItems(menuItems);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type, searchParams]);

  const getTotalPrice = () => {
    if (!restaurant?.menu) return 0;
    return Object.entries(selectedMenuItems).reduce((sum, [itemId, count]) => {
      const item = restaurant.menu?.find(m => m.id === itemId);
      return sum + (item?.price || 0) * count;
    }, 0);
  };

  const handleConfirmReservation = async () => {
    setIsConfirming(true);
    
    try {
      // Get current user (optional for development mode)
      const user = auth.currentUser;
      
      // Build booking object from reservation details
      let bookingData = {
        type: type,
        name: type === 'restaurant' 
          ? (restaurant?.name || searchParams.get('restaurantName') || 'Restaurant')
          : (searchParams.get('eventName') || 'Event'),
        date: searchParams.get('date') || '',
        time: searchParams.get('time') || '',
        guests: searchParams.get('guests') || '1',
        table: searchParams.get('table') || '',
        fullName: searchParams.get('fullName') || '',
        email: searchParams.get('email') || (user?.email || ''),
        phoneNumber: searchParams.get('phoneNumber') || '',
        occasion: searchParams.get('occasion') || '',
        specialRequest: searchParams.get('specialRequest') || '',
        status: 'Confirmed',
        // Ensure restaurantName is captured explicitly if it's a restaurant booking
        ...(type === 'restaurant' && { 
          restaurantName: restaurant?.name || searchParams.get('restaurantName') || 'Restaurant' 
        }),
        // Event specific fields
        ...(type === 'event' && {
          category: searchParams.get('eventCategory') || '',
          price: searchParams.get('eventPrice') || '',
          organizer: searchParams.get('eventOrganizer') || ''
        })
      };
      
      // Add selected menu items to bookingData if available
      if (Object.keys(selectedMenuItems).length > 0 && restaurant?.menu) {
        const itemsDetails = Object.entries(selectedMenuItems).map(([itemId, quantity]) => {
          const item = restaurant.menu?.find(m => m.id === itemId);
          return {
            id: itemId,
            name: item?.name || 'Unknown Item',
            price: item?.price || 0,
            quantity: quantity
          };
        });
        // Ensure bookingData is treated as a mutable object if it came from a non-mutable source
        const mutableBookingData = { ...bookingData };
        mutableBookingData.selectedItems = itemsDetails;
        bookingData = mutableBookingData;
      }
      
      console.log('Sending booking data to API:', bookingData);
      
      // Try to save booking to MongoDB through our API
      let savedBooking;
      try {
        savedBooking = await bookingsApi.create(bookingData);
        console.log('Booking saved to MongoDB:', savedBooking);
      } catch (apiError) {
        console.error('API error, falling back to localStorage:', apiError);
        // Fall back to localStorage for development/testing
        const bookingWithId = {
          ...bookingData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
        // Save to localStorage as fallback
        const savedBookings = localStorage.getItem('dineInGoBookings');
        const bookingsArray = savedBookings ? JSON.parse(savedBookings) : [];
        bookingsArray.push(bookingWithId);
        localStorage.setItem('dineInGoBookings', JSON.stringify(bookingsArray));
        console.log('Booking saved to localStorage as fallback');
        
        savedBooking = bookingWithId;
      }
      
      // Show success overlay
      setShowSuccess(true);
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            bookingSuccess: true,
            newBooking: savedBooking 
          } 
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('Error in booking process:', error);
      toast.error(error.message || 'Failed to save booking. Please try again.');
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all animate-bounce-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {type === 'restaurant' ? 'Reservation Confirmed!' : 'Registration Confirmed!'}
              </h3>
              <p className="text-gray-600">
                {type === 'restaurant' 
                  ? 'Your table has been reserved successfully.'
                  : 'Your event registration has been confirmed.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Back Navigation */}
      <div className="absolute top-4 left-4 z-30">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-white transition-all duration-300 hover:shadow-md"
        >
          <ArrowLeft size={20} className="text-gray-700" />
          <span className="text-gray-700 font-medium">Back</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto pt-20 px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">
              {type === 'restaurant' ? 'Confirm Your Reservation' : 'Confirm Your Registration'}
            </h1>
            {type === 'restaurant' && restaurant?.name && (
              <p className="text-xl font-semibold text-emerald-100 mb-2">{restaurant.name}</p>
            )}
            <p className="text-emerald-100">
              {type === 'restaurant' 
                ? 'Please review your reservation details before confirming.'
                : 'Please review your registration details before confirming.'}
            </p>
          </div>

          {/* Restaurant/Event Info */}
          <div className="p-8">
            <div className="flex items-start gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
              <img 
                src={type === 'restaurant' ? restaurant?.image : searchParams.get('eventImage')} 
                alt={type === 'restaurant' ? restaurant?.name : searchParams.get('eventName')}
                className="w-24 h-24 rounded-xl object-cover shadow-md"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {type === 'restaurant' ? restaurant?.name : searchParams.get('eventName')}
                </h2>
                {type === 'restaurant' ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} className="text-emerald-500" />
                    <span>{restaurant?.location.city}, {restaurant?.location.state}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-emerald-500" />
                    <span>{searchParams.get('date')} at {searchParams.get('time')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reservation/Registration Details */}
            <div className="border-t border-b border-gray-200 py-8 mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                {type === 'restaurant' ? 'Reservation Details' : 'Event Details'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{searchParams.get('date')}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{searchParams.get('time')}</p>
                </div>
                {type === 'restaurant' && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Number of Guests</p>
                    <p className="font-medium">{searchParams.get('guests')}</p>
                  </div>
                )}
                {type === 'event' && (
                  <>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{searchParams.get('eventCategory')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">₹{searchParams.get('eventPrice')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Organizer</p>
                      <p className="font-medium">{searchParams.get('eventOrganizer')}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Guest Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                Guest Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{searchParams.get('fullName')}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{searchParams.get('email')}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{searchParams.get('phoneNumber')}</p>
                </div>
                {searchParams.get('occasion') && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Occasion</p>
                    <p className="font-medium capitalize">{searchParams.get('occasion')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {searchParams.get('specialRequest') && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-emerald-500" />
                  Special Requests
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-600">{searchParams.get('specialRequest')}</p>
                </div>
              </div>
            )}

            {/* Selected Menu Items */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-500" />
                Your Order Details
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Total Items: {Object.keys(selectedMenuItems).length}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="ml-2 font-bold text-lg text-emerald-600">₹{getTotalPrice()}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(selectedMenuItems).map(([itemId, count]) => {
                    const item = restaurant?.menu?.find(m => m.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-600">Quantity: {count}</p>
                            <p className="text-sm text-gray-600">₹{item.price} each</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-emerald-600">₹{item.price * count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Confirmation Button */}
            <div className="flex justify-end">
              <button
                onClick={handleConfirmReservation}
                disabled={isConfirming}
                className={`px-8 py-3 rounded-xl transition-all duration-300 transform ${
                  isConfirming 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 hover:shadow-lg'
                }`}
              >
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Confirming...</span>
                  </div>
                ) : (
                  type === 'restaurant' ? 'Confirm Reservation' : 'Confirm Registration'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetailsPage; 