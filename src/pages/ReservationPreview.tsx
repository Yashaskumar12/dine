import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Calendar, Users } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getMockRestaurantById } from "../services/restaurantService";
import { getMockEventById } from "../services/event-service";
import { Restaurant, Event } from "../types";

// Different high-quality restaurant preview images focusing on food and atmosphere
const restaurantPreviewImages: { [key: string]: string[] } = {
  "Spice Garden": [
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe", // Authentic Indian Thali
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7", // Butter Chicken and Naan
    "https://images.unsplash.com/photo-1613292443284-8d10ef9383fe"  // Indian Curry Spread
  ],
  "The Coastal Kitchen": [
    "https://images.unsplash.com/photo-1623341214825-9f4f963727da", // Fresh Seafood Platter
    "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58", // Grilled Fish
    "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f"  // Seafood Paella
  ],
  "Biryani House": [
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", // Hyderabadi Biryani
    "https://images.unsplash.com/photo-1606491956689-2ea866880c84", // Mutton Biryani
    "https://images.unsplash.com/photo-1642821373181-696a54913e93"  // Mixed Grill Platter
  ],
  "Pizza Paradise": [
    "https://images.unsplash.com/photo-1604382355076-af4b0eb60143", // Margherita Pizza
    "https://images.unsplash.com/photo-1513104890138-7c749659a591", // Pepperoni Pizza
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"  // Wood-fired Pizza
  ],
  "Sushi Master": [
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c", // Sushi Platter
    "https://images.unsplash.com/photo-1611143669185-af224c5e3252", // Nigiri Selection
    "https://images.unsplash.com/photo-1553621042-f6e147245754"  // Maki Rolls
  ],
  "Burger Junction": [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", // Gourmet Burger
    "https://images.unsplash.com/photo-1550547660-d9450f859349", // Classic Cheeseburger
    "https://images.unsplash.com/photo-1610440042657-612c34d95e9f"  // Burger with Fries
  ]
};

const ReservationPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    occasion: '',
    specialRequest: ''
  });
  const [selectedMenuItems, setSelectedMenuItems] = useState<{ [key: string]: number }>({});
  const [showMenuItems, setShowMenuItems] = useState(false);

  const time = searchParams.get('time');
  const date = searchParams.get('date');
  const guests = searchParams.get('guests');
  const type = searchParams.get('type') || 'restaurant';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (id) {
          if (type === 'restaurant') {
            const restaurantData = await getMockRestaurantById(id);
            setRestaurant(restaurantData);
            setEvent(null);

            // Parse selected menu items from URL
            const items = searchParams.getAll('items');
            const menuItems: { [key: string]: number } = {};
            items.forEach(item => {
              const [itemId, count] = item.split(':');
              menuItems[itemId] = parseInt(count);
            });
            setSelectedMenuItems(menuItems);
          } else if (type === 'event') {
            const eventData = await getMockEventById(id);
            setEvent(eventData);
            setRestaurant(null);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prepare query params with all form data
    const queryParams = new URLSearchParams(searchParams);
    Object.entries(formData).forEach(([key, value]) => {
      if (value) queryParams.set(key, value);
    });
    if (date) queryParams.set('date', date);
    if (time) queryParams.set('time', time);
    if (guests) queryParams.set('guests', guests);

    // Add selected menu items to query params
    searchParams.getAll('items').forEach(item => {
      queryParams.append('items', item);
    });

    if (type === 'restaurant') {
      navigate(`/restaurant/${id}/table-selection?${queryParams.toString()}`);
    } else {
      // For events, use the same reservation page but with type=event
      queryParams.set('type', 'event');
      if (event) {
        queryParams.set('eventName', event.name);
        queryParams.set('eventCategory', event.category);
        queryParams.set('eventPrice', event.price?.toString() || '');
        queryParams.set('eventOrganizer', event.organizer);
        queryParams.set('eventImage', event.image);
      }
      // Use the same reservation page for both restaurants and events
      navigate(`/restaurant/${id}/reservation?${queryParams.toString()}`);
    }
  };

  const sendEmail = async (data: any) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const getTotalPrice = () => {
    if (!restaurant?.menu) return 0;
    return Object.entries(selectedMenuItems).reduce((sum, [itemId, count]) => {
      const item = restaurant.menu?.find(m => m.id === itemId);
      return sum + (item?.price || 0) * count;
    }, 0);
  };

  const handleTimeSlotClick = (time: string) => {
    const queryParams = new URLSearchParams();
    if (time) queryParams.set('time', time);
    if (date) queryParams.set('date', date);
    if (guests) queryParams.set('guests', guests);
    navigate(`/restaurant/${id}/menu?${queryParams.toString()}`);
  };

  if (loading || (!restaurant && !event)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Image Gallery */}
      <div className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 grid grid-cols-3 gap-2">
          {type === 'restaurant' && restaurant && restaurantPreviewImages[restaurant.name]?.map((image, index) => (
            <div key={index} className={`relative ${index === 0 ? 'col-span-2 row-span-2' : ''}`}>
              <img 
                src={image}
                alt={`${restaurant.name} ambiance ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {type === 'event' && event && (
            <div className="col-span-3 row-span-3">
              <img 
                src={event.image}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        <div className="absolute bottom-8 left-8 z-20 text-white">
          {type === 'restaurant' && restaurant && (
            <>
              <h1 className="text-5xl font-bold mb-2">{restaurant.name}</h1>
              <p className="text-lg mb-2">{restaurant.cuisine?.join(', ')}</p>
              <div className="flex items-center gap-2 group cursor-pointer"
                   onClick={() => {
                     if (restaurant?.address) {
                       window.open(
                         `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                           restaurant.address || `${restaurant.location.city}, ${restaurant.location.state}`
                         )}`,
                         '_blank'
                       );
                     }
                   }}>
                <MapPin size={16} className="text-white group-hover:text-emerald-400 transition-colors" />
                <p className="text-sm opacity-90 group-hover:text-emerald-400 transition-colors">
                  {restaurant?.address || `${restaurant?.location.city}, ${restaurant?.location.state}`}
                </p>
              </div>
            </>
          )}
          {type === 'event' && event && (
            <>
              <h1 className="text-5xl font-bold mb-2">{event.name}</h1>
              <p className="text-lg mb-2">{event.category}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-white" />
                  <span className="text-sm">{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-white" />
                  <span className="text-sm">{event.registeredCount}/{event.capacity} Registered</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Back Navigation */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <button 
          onClick={() => {
            const params = new URLSearchParams();
            if (date) params.set('date', date);
            if (time) params.set('time', time);
            if (guests) params.set('guests', guests);
            navigate(`/restaurant/${id}/menu?${params.toString()}`);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700" />
          <span className="text-gray-700 font-medium">Back to Menu</span>
        </button>
      </div>

      {/* Location Preview */}
      {type === 'restaurant' && restaurant && (
        <div className="absolute top-4 right-4 z-30">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              restaurant?.address || `${restaurant?.location.city}, ${restaurant?.location.state}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-white transition-colors group"
          >
            <MapPin size={20} className="text-gray-700 group-hover:text-emerald-500" />
            <span className="text-gray-700 font-medium group-hover:text-emerald-500">View on Map</span>
          </a>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6">{type === 'restaurant' ? 'Reservation Preview' : 'Event Registration'}</h2>
          <p className="text-gray-600 mb-8">Confirm if there are errors in the entered details.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{type === 'restaurant' ? 'Dinner Details' : 'Registration Details'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter your Full Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter your Email Address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter your Phone Number"
                      required
                    />
                  </div>
                  {type === 'restaurant' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select an Occasion (Optional)</label>
                      <select
                        name="occasion"
                        value={formData.occasion}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select Occasion</option>
                        <option value="birthday">Birthday</option>
                        <option value="anniversary">Anniversary</option>
                        <option value="date">Date Night</option>
                        <option value="business">Business Meal</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{type === 'restaurant' ? 'Reservation Details' : 'Event Details'}</h3>
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <p className="text-gray-600">Date: {date}</p>
                  <p className="text-gray-600">Time: {time}</p>
                  {type === 'restaurant' && <p className="text-gray-600">Number of Guests: {guests}</p>}
                  {type === 'event' && event && (
                    <>
                      <p className="text-gray-600">Category: {event.category}</p>
                      <p className="text-gray-600">Organizer: {event.organizer}</p>
                      <p className="text-gray-600">Price: ₹{event.price}</p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add a Special Request (Optional)</label>
                  <textarea
                    name="specialRequest"
                    value={formData.specialRequest}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-32"
                    placeholder="Enter your special request"
                  />
                </div>

                <div className="mt-4">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" required />
                    <span className="ml-2 text-sm text-gray-600">
                      By clicking "Next" you agree to the{' '}
                      <a href="#" className="text-purple-600 hover:text-purple-800">Terms of Use</a>
                      {' '}and{' '}
                      <a href="#" className="text-purple-600 hover:text-purple-800">Privacy Policy</a>.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Selected Menu Items */}
            {Object.keys(selectedMenuItems).length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Selected Menu Items</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{Object.keys(selectedMenuItems).length} items</span>
                      <span className="text-sm font-medium">₹{getTotalPrice()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMenuItems(!showMenuItems)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <span className="font-medium">Menu</span>
                      <svg 
                        className={`w-5 h-5 transform transition-transform duration-200 ${showMenuItems ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className={`mt-4 space-y-4 transition-all duration-200 ${showMenuItems ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  {Object.entries(selectedMenuItems).map(([itemId, count]) => {
                    const item = restaurant?.menu?.find(m => m.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {count}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{item.price * count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl transition-colors bg-black text-white hover:bg-gray-800"
              >
                Proceed
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReservationPreview;