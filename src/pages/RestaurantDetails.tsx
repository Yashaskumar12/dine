import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Heart, Clock, Phone, Globe, ArrowLeft, Calendar, Users, Plus, Minus, ChevronLeft, ShoppingCart } from 'lucide-react';
import { getMockRestaurantById, getMockTotalGuests } from '../services/restaurantService';
import { getMockEventById, getMockEventCapacity } from '../services/event-service';
import { Restaurant, Event, MenuItem } from '../types';
import RestaurantMap from '../components/RestaurantMap';

interface TimeSlot {
  time: string;
  available: boolean;
}

const lunchSlots: TimeSlot[] = [
  { time: '11:30 AM', available: true },
  { time: '12:00 PM', available: true },
  { time: '12:30 PM', available: true },
  { time: '1:00 PM', available: true },
  { time: '1:30 PM', available: true },
  { time: '2:00 PM', available: true },
];

const dinnerSlots: TimeSlot[] = [
  { time: '6:00 PM', available: true },
  { time: '6:30 PM', available: true },
  { time: '7:00 PM', available: true },
  { time: '7:30 PM', available: true },
  { time: '8:00 PM', available: true },
  { time: '8:30 PM', available: true },
  { time: '9:00 PM', available: true },
  { time: '9:30 PM', available: true },
];

const RestaurantDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'restaurant';
  const navigate = useNavigate();
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (id) {
          if (type === 'restaurant') {
            const restaurantData = await getMockRestaurantById(id);
            await getMockTotalGuests(); // We still call this to simulate the API call
            setRestaurant(restaurantData);
            setEvent(null);
          } else if (type === 'event') {
            const eventData = await getMockEventById(id);
            await getMockEventCapacity(); // We still call this to simulate the API call
            setEvent(eventData);
            setRestaurant(null);
          }
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type]);

  const handleTimeSlotClick = (time: string) => {
    if (type === 'restaurant') {
      const queryParams = new URLSearchParams();
      queryParams.set('date', selectedDate);
      queryParams.set('time', time);
      queryParams.set('guests', selectedGuests.toString());
      navigate(`/restaurant/${id}/menu?${queryParams.toString()}`);
    } else {
      navigate(`/event/${id}/register`);
    }
  };

  const handleEventRegistration = () => {
    navigate(`/restaurant/${id}/preview?type=event&date=${event?.date}&time=${event?.time}&guests=1&eventName=${event?.name}&eventCategory=${event?.category}&eventPrice=${event?.price}&eventOrganizer=${event?.organizer}&eventImage=${event?.image}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error || (!restaurant && !event)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">{type === 'restaurant' ? 'Restaurant' : 'Event'} not found</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-600"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Render restaurant details
  if (restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4 z-30 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>

        {/* Hero Section with Restaurant Image */}
        <div className="relative h-[400px]">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img 
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-8 left-8 z-20 text-white">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold">{restaurant.name}</h1>
            </div>
            <p className="text-lg mb-2">{restaurant.cuisine?.join(', ')}</p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{restaurant.openNow ? 'Open Now' : 'Closed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address || `${restaurant.location.city}, ${restaurant.location.state}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 transition-colors"
                >
                  <span>{restaurant.address}</span>
                </a>
              </div>
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
                <span className="text-emerald-400">★</span>
                <span>{restaurant.rating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-3 gap-8">
          {/* Booking Section */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
              <h2 className="text-2xl font-semibold mb-6">Make a Reservation</h2>
              
              {/* Guest and Date Selection */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
                  <select 
                    value={selectedGuests}
                    onChange={(e) => setSelectedGuests(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Lunch</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {lunchSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleTimeSlotClick(slot.time)}
                        className="p-3 text-center border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dinner</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {dinnerSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleTimeSlotClick(slot.time)}
                        className="p-3 text-center border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant Info Section */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
              <h2 className="text-2xl font-semibold mb-6">About {restaurant.name}</h2>
              <p className="text-gray-600 mb-6">
                {restaurant.name} is located in {restaurant.location.city}, offering {restaurant.cuisine?.join(', ')} cuisine. 
                {restaurant.openNow ? " We're currently open and ready to serve you!" : " We're currently closed."}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="text-emerald-500" size={20} />
                  <span className="text-gray-600">{restaurant.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-emerald-500" size={20} />
                  <span className="text-gray-600">{restaurant.phoneNumber}</span>
                </div>
              </div>

              {/* Add the map component */}
              <div className="mt-6">
                <RestaurantMap 
                  address={restaurant.address || `${restaurant.location.city}, ${restaurant.location.state}`}
                  name={restaurant.name}
                />
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-emerald-500 text-emerald-500 rounded-xl hover:bg-emerald-50 transition-colors"
                >
                  <Heart fill={isFavorite ? "currentColor" : "none"} />
                  <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render event details
  if (event) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-30 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>

        {/* Hero Section with Event Image */}
        <div className="relative h-[400px]">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img 
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-8 left-8 z-20 text-white">
            <h1 className="text-5xl font-bold mb-4">{event.name}</h1>
            <p className="text-lg mb-2">{event.category}</p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
                <span className="text-emerald-400">₹</span>
                <span>{event.price}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-3 gap-8">
          {/* Registration Section */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
              <h2 className="text-2xl font-semibold mb-6">Register for Event</h2>
              
              <div className="mb-8">
                <p className="text-gray-600 mb-4">
                  {event.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{event.registeredCount}/{event.capacity} Registered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={16} />
                    <span>Organized by {event.organizer}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleEventRegistration}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Register Now
              </button>
            </div>
          </div>

          {/* Event Info Section */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
              <h2 className="text-2xl font-semibold mb-6">Event Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="text-emerald-500" size={20} />
                  <span className="text-gray-600">{event.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="text-emerald-500" size={20} />
                  <span className="text-gray-600">{event.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-emerald-500" size={20} />
                  <span className="text-gray-600">{event.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-emerald-500" size={20} />
                  <span className="text-gray-600">{event.registeredCount}/{event.capacity} Registered</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="text-emerald-500" size={20} />
                  <span className="text-gray-600">Organized by {event.organizer}</span>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-emerald-500 text-emerald-500 rounded-xl hover:bg-emerald-50 transition-colors"
                >
                  <Heart fill={isFavorite ? "currentColor" : "none"} />
                  <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RestaurantDetails; 