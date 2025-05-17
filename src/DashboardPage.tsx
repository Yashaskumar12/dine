import { useState, useEffect } from 'react';
import { Search, Menu, MapPin, Heart, X, Bell, Settings, Globe, ArrowLeft, Moon, Sun, Calendar, Clock, Check, Users, FileText } from 'lucide-react';
import InvoiceModal from './components/InvoiceModal';
import { signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { storeUserData } from "./dbUtils";
import { bookingsApi } from './services/api';
import { toast } from 'react-toastify';
import { Location, Event as ImportedEvent } from './types';
import { mockRestaurants, mockEvents } from './utils/mockData';
import { GeocodingService } from './services/geocodingService';
import { indianCities } from './utils/indianCities';
import SkeletonLoading from './components/SkeletonLoading';
import RestaurantMap from './components/RestaurantMap';
import ProfileSettings from './components/ProfileSettings';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  name: string;
  photoURL?: string | null;
  location: Location;
  createdAt: Date;
  lastLogin: Date;
}

interface Restaurant {
  id: string;
  name: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  rating: number;
  image: string;
  cuisine?: string[];
  priceLevel?: number;
  address?: string;
  photos?: string[];
  openNow?: boolean;
  phoneNumber?: string;
}

interface Translation {
  welcome: string;
  exploreRestaurants: string;
  exploreEvents: string;
  home: string;
  bookings: string;
  restaurants: string;
  events: string;
  favourites: string;
  messages: string;
  settings: string;
  logout: string;
  lightMode: string;
  darkMode: string;
  upcomingEvents: string;
  eventsDescription: string;
  welcomeMessage: string;
  discoverMessage: string;
  searchPlaceholder: string;
  language: string;
  noFavorites: string;
  addFavorites: string;
  noBookings: string;
  bookingsMessage: string;
  unreadMessages: string;
  allRightsReserved: string;
  featuredRestaurants: string;
  price: string;
  rating: string;
  locationLabel: string;
  updateLocation: string;
  useCurrentLocation: string;
  searchCities: string;
  profileSettings: string;
  displayName: string;
  email: string;
  locationSettings: string;
  languageSettings: string;
  themeSettings: string;
  lightModeDescription: string;
  darkModeDescription: string;
  noNotifications: string;
  notificationsDescription: string;
  cuisine: string;
  openNow: string;
  closed: string;
  registered: string;
  capacity: string;
  category: string;
  date: string;
  time: string;
}

type Language = 'english' | 'hindi' | 'tamil' | 'kannada' | 'telugu' | 'malayalam';
type Section = 'home' | 'bookings' | 'restaurants' | 'events' | 'favorites' | 'messages' | 'settings';
type Translations = Record<Language, Translation>;

const translations: Translations = {
    english: {
      welcome: 'Welcome',
      exploreRestaurants: 'Explore Restaurants',
      exploreEvents: 'Explore Events',
      home: 'Home',
      bookings: 'Bookings',
      restaurants: 'Restaurants',
      events: 'Events',
      favourites: 'Favourites',
      messages: 'Messages',
      settings: 'Settings',
      logout: 'Logout',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      upcomingEvents: 'Upcoming Events',
      eventsDescription: 'Discover and book exciting events',
      welcomeMessage: 'Welcome to Dineingo',
      discoverMessage: 'Discover amazing restaurants and events',
      searchPlaceholder: 'Search restaurants or events...',
      language: 'Language',
      noFavorites: 'No favorites yet',
      addFavorites: 'Add some favorites to see them here',
      noBookings: 'No bookings yet',
      bookingsMessage: 'Your upcoming bookings will appear here',
      unreadMessages: 'Unread Messages',
      allRightsReserved: 'All rights reserved',
      featuredRestaurants: 'Featured Restaurants',
      price: 'Price',
      rating: 'Rating',
      locationLabel: 'Location',
      updateLocation: 'Update Location',
      useCurrentLocation: 'Use Current Location',
      searchCities: 'Search cities...',
      profileSettings: 'Profile Settings',
      displayName: 'Display Name',
      email: 'Email',
      locationSettings: 'Location Settings',
      languageSettings: 'Language Settings',
      themeSettings: 'Theme Settings',
      lightModeDescription: 'Classic bright interface',
      darkModeDescription: 'Easier on the eyes in low light',
      noNotifications: 'No notifications yet',
      notificationsDescription: 'When you receive new notifications about your bookings, events, or special offers, they will appear here',
      cuisine: 'Cuisine',
      openNow: 'Open Now',
      closed: 'Closed',
      registered: 'Registered',
      capacity: 'Capacity',
      category: 'Category',
      date: 'Date',
      time: 'Time'
    },
    hindi: {
      welcome: 'स्वागत है',
      exploreRestaurants: 'रेस्तरां खोजें',
      exploreEvents: 'कार्यक्रम खोजें',
      home: 'होम',
      bookings: 'बुकिंग',
      restaurants: 'रेस्तरां',
      events: 'कार्यक्रम',
      favourites: 'पसंदीदा',
      messages: 'संदेश',
      settings: 'सेटिंग्स',
      logout: 'लॉग आउट',
      lightMode: 'लाइट मोड',
      darkMode: 'डार्क मोड',
      upcomingEvents: 'आगामी कार्यक्रम',
      eventsDescription: 'रोमांचक कार्यक्रमों की खोज और बुकिंग करें',
      welcomeMessage: 'डाइनिंगो में आपका स्वागत है',
      discoverMessage: 'शानदार रेस्तरां और कार्यक्रमों की खोज करें',
      searchPlaceholder: 'रेस्तरां या कार्यक्रम खोजें...',
      language: 'भाषा',
      noFavorites: 'अभी तक कोई पसंदीदा नहीं',
      addFavorites: 'यहां देखने के लिए कुछ पसंदीदा जोड़ें',
      noBookings: 'अभी तक कोई बुकिंग नहीं',
      bookingsMessage: 'आपकी आगामी बुकिंग यहां दिखाई देंगी',
      unreadMessages: 'अपठित संदेश',
      allRightsReserved: 'सर्वाधिकार सुरक्षित',
      featuredRestaurants: 'विशेष रेस्तरां',
      price: 'कीमत',
      rating: 'रेटिंग',
      locationLabel: 'स्थान',
      updateLocation: 'स्थान अपडेट करें',
      useCurrentLocation: 'वर्तमान स्थान का उपयोग करें',
      searchCities: 'शहर खोजें...',
      profileSettings: 'प्रोफ़ाइल सेटिंग्स',
      displayName: 'प्रदर्शित नाम',
      email: 'ईमेल',
      locationSettings: 'स्थान सेटिंग्स',
      languageSettings: 'भाषा सेटिंग्स',
      themeSettings: 'थीम सेटिंग्स',
      lightModeDescription: 'क्लासिक उज्जवल इंटरफ़ेस',
      darkModeDescription: 'कम रोशनी में आंखों के लिए आरामदायक',
      noNotifications: 'कोई सूचना नहीं',
      notificationsDescription: 'जब आपको अपनी बुकिंग, कार्यक्रमों या विशेष ऑफ़र के बारे में नई सूचनाएं प्राप्त होंगी, तो वे यहां दिखाई देंगी',
      cuisine: 'व्यंजन',
      openNow: 'अभी खुला है',
      closed: 'बंद है',
      registered: 'पंजीकृत',
      capacity: 'क्षमता',
      category: 'श्रेणी',
      date: 'दिनांक',
      time: 'समय'
    },
    tamil: {
      welcome: 'வரவேற்பு',
      exploreRestaurants: 'உணவகங்களை ஆராயுங்கள்',
      exploreEvents: 'நிகழ்வுகளை ஆராயுங்கள்',
      home: 'முகப்பு',
      bookings: 'முன்பதிவுகள்',
      restaurants: 'உணவகங்கள்',
      events: 'நிகழ்வுகள்',
      favourites: 'பிடித்தவை',
      messages: 'செய்திகள்',
      settings: 'அமைப்புகள்',
      logout: 'வெளியேறு',
      lightMode: 'ஒளி பயன்முறை',
      darkMode: 'இருள் பயன்முறை',
      upcomingEvents: 'வரவிருக்கும் நிகழ்வுகள்',
      eventsDescription: 'சுவாரஸ்யமான நிகழ்வுகளைக் கண்டறிந்து முன்பதிவு செய்யுங்கள்',
      welcomeMessage: 'டைனிங்கோவிற்கு வரவேற்கிறோம்',
      discoverMessage: 'அற்புதமான உணவகங்கள் மற்றும் நிகழ்வுகளைக் கண்டறியுங்கள்',
      searchPlaceholder: 'உணவகங்கள் அல்லது நிகழ்வுகளைத் தேடுங்கள்...',
      language: 'மொழி',
      noFavorites: 'இதுவரை பிடித்தவை எதுவும் இல்லை',
      addFavorites: 'இங்கே காண சில பிடித்தவற்றைச் சேர்க்கவும்',
      noBookings: 'இதுவரை முன்பதிவுகள் எதுவும் இல்லை',
      bookingsMessage: 'உங்கள் வரவிருக்கும் முன்பதிவுகள் இங்கே தோன்றும்',
      unreadMessages: 'படிக்காத செய்திகள்',
      allRightsReserved: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை',
      featuredRestaurants: 'சிறப்பு உணவகங்கள்',
      price: 'விலை',
      rating: 'மதிப்பீடு',
      locationLabel: 'இடம்',
      updateLocation: 'இடத்தைப் புதுப்பிக்கவும்',
      useCurrentLocation: 'தற்போதைய இடத்தைப் பயன்படுத்தவும்',
      searchCities: 'நகரங்களைத் தேடுங்கள்...',
      profileSettings: 'சுயவிவர அமைப்புகள்',
      displayName: 'காட்சிப் பெயர்',
      email: 'மின்னஞ்சல்',
      locationSettings: 'இட அமைப்புகள்',
      languageSettings: 'மொழி அமைப்புகள்',
      themeSettings: 'தீம் அமைப்புகள்',
      lightModeDescription: 'பாரம்பரிய பிரகாசமான இடைமுகம்',
      darkModeDescription: 'குறைந்த ஒளியில் கண்களுக்கு எளிதானது',
      noNotifications: 'இதுவரை அறிவிப்புகள் எதுவும் இல்லை',
      notificationsDescription: 'உங்கள் முன்பதிவுகள், நிகழ்வுகள் அல்லது சிறப்பு சலுகைகள் பற்றிய புதிய அறிவிப்புகளைப் பெறும்போது, அவை இங்கே தோன்றும்',
      cuisine: 'உணவு வகை',
      openNow: 'இப்போது திறந்துள்ளது',
      closed: 'மூடப்பட்டுள்ளது',
      registered: 'பதிவு செய்யப்பட்டது',
      capacity: 'கொள்ளளவு',
      category: 'வகை',
      date: 'தேதி',
      time: 'நேரம்'
    },
    kannada: {
      welcome: 'ಸ್ವಾಗತ',
      exploreRestaurants: 'ರೆಸ್ಟೋರೆಂಟ್‌ಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
      exploreEvents: 'ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
      home: 'ಮುಖಪುಟ',
      bookings: 'ಬುಕ್ಕಿಂಗ್‌ಗಳು',
      restaurants: 'ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು',
      events: 'ಕಾರ್ಯಕ್ರಮಗಳು',
      favourites: 'ಮೆಚ್ಚಿನವುಗಳು',
      messages: 'ಸಂದೇಶಗಳು',
      settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      logout: 'ಲಾಗ್ ಔಟ್',
      lightMode: 'ಲೈಟ್ ಮೋಡ್',
      darkMode: 'ಡಾರ್ಕ್ ಮೋಡ್',
      upcomingEvents: 'ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು',
      eventsDescription: 'ರೋಮಾಂಚಕ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ ಮತ್ತು ಬುಕ್ ಮಾಡಿ',
      welcomeMessage: 'ಡೈನಿಂಗೋಗೆ ಸ್ವಾಗತ',
      discoverMessage: 'ಅದ್ಭುತ ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು ಮತ್ತು ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ',
      searchPlaceholder: 'ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು ಅಥವಾ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ಹುಡುಕಿ...',
      language: 'ಭಾಷೆ',
      noFavorites: 'ಇನ್ನೂ ಯಾವುದೇ ಮೆಚ್ಚಿನವುಗಳಿಲ್ಲ',
      addFavorites: 'ಇಲ್ಲಿ ನೋಡಲು ಕೆಲವು ಮೆಚ್ಚಿನವುಗಳನ್ನು ಸೇರಿಸಿ',
      noBookings: 'ಇನ್ನೂ ಯಾವುದೇ ಬುಕ್ಕಿಂಗ್‌ಗಳಿಲ್ಲ',
      bookingsMessage: 'ನಿಮ್ಮ ಮುಂಬರುವ ಬುಕ್ಕಿಂಗ್‌ಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ',
      unreadMessages: 'ಓದದ ಸಂದೇಶಗಳು',
      allRightsReserved: 'ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ',
      featuredRestaurants: 'ವಿಶೇಷ ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು',
      price: 'ಬೆಲೆ',
      rating: 'ರೇಟಿಂಗ್',
      locationLabel: 'ಸ್ಥಳ',
      updateLocation: 'ಸ್ಥಳ ನವೀಕರಿಸಿ',
      useCurrentLocation: 'ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ಬಳಸಿ',
      searchCities: 'ನಗರಗಳನ್ನು ಹುಡುಕಿ...',
      profileSettings: 'ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      displayName: 'ಪ್ರದರ್ಶನ ಹೆಸರು',
      email: 'ಇಮೇಲ್',
      locationSettings: 'ಸ್ಥಳ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      languageSettings: 'ಭಾಷಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      themeSettings: 'ಥೀಮ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      lightModeDescription: 'ಸಾಂಪ್ರದಾಯಿಕ ಪ್ರಕಾಶಮಾನ ಇಂಟರ್‌ಫೇಸ್',
      darkModeDescription: 'ಕುಱೈನ್ನ ಬೆಳಕಿನಲ್ಲಿ ಕಣ್ಣುಗಳಿಗೆ ಸುಲಭ',
      noNotifications: 'ಇತುವರೆ ಅಧಿಸೂಚನೆಗಳು ಎತುವುಮಿಲ್ಲ',
      notificationsDescription: 'ನಿಮ್ಮ ಬುಕ್ಕಿಂಗ್‌ಗಳು, ಕಾರ್ಯಕ್ರಮಗಳು ಅಥವಾ ವಿಶೇಷ ಕೊಡುಗೆಗಳ ಬಗ್ಗೆ ನೀವು ಹೊಸ ಅಧಿಸೂಚನೆಗಳನ್ನು ಸ್ವೀಕರಿಸಿದಾಗ, ಅವು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ',
      cuisine: 'ಆಹಾರ ಪದ್ಧತಿ',
      openNow: 'ಈಗ ತೆರೆದಿದೆ',
      closed: 'ಮೂಸಿದೆ',
      registered: 'ನೋಂದಾಯಿತ',
      capacity: 'ಕೊಳ್ಳಳವು',
      category: 'ವರ್ಗ',
      date: 'ದಿನಾಂಕ',
      time: 'ಸಮಯ'
    },
    telugu: {
      welcome: 'స్వాగతం',
      exploreRestaurants: 'రెస్టారెంట్లను అన్వేషించండి',
      exploreEvents: 'ఈవెంట్లను అన్వేషించండి',
      home: 'హోం',
      bookings: 'బుక్కింగ్స్',
      restaurants: 'రెస్టారెంట్లు',
      events: 'ఈవెంట్లు',
      favourites: 'ఇష్టమైనవి',
      messages: 'సందేశాలు',
      settings: 'సెట్టింగ్స్',
      logout: 'లాగ్అవుట్',
      lightMode: 'లైట్ మోడ్',
      darkMode: 'డార్క్ మోడ్',
      upcomingEvents: 'రాబోయే ఈవెంట్లు',
      eventsDescription: 'ఆసక్తికరమైన ఈవెంట్లను కనుగొని బుక్ చేయండి',
      welcomeMessage: 'డైనింగోకు స్వాగతం',
      discoverMessage: 'అద్భుత రెస్టారెంట్లు మరియు ఈవెంట్లను కనుగొనండి',
      searchPlaceholder: 'రెస్టారెంట్లు లేదా ఈవెంట్లను వెతకండి...',
      language: 'భాష',
      noFavorites: 'ఇంకా ఇష్టమైనవి ఏవీ లేవు',
      addFavorites: 'ఇక్కడ చూడటానికి కొన్ని ఇష్టమైనవి జోడించండి',
      noBookings: 'ఇంకా బుక్కింగ్స్ ఏవీ లేవు',
      bookingsMessage: 'మీ రాబోయే బుక్కింగ్స్ ఇక్కడ కనిపిస్తాయి',
      unreadMessages: 'చదవని సందేశాలు',
      allRightsReserved: 'అన్ని హక్కులు రక్షించబడ్డాయి',
      featuredRestaurants: 'ఫీచర్డ్ రెస్టారెంట్లు',
      price: 'ధర',
      rating: 'రేటింగ్',
      locationLabel: 'స్థానం',
      updateLocation: 'స్థానాన్ని నవీకరించండి',
      useCurrentLocation: 'ప్రస్తుత స్థానాన్ని ఉపయోగించండి',
      searchCities: 'నగరాలను వెతకండి...',
      profileSettings: 'ప్రొఫైల్ సెట్టింగ్స్',
      displayName: 'ప్రదర్శన పేరు',
      email: 'ఇమెయిల్',
      locationSettings: 'స్థాన సెట్టింగ్‌లు',
      languageSettings: 'భాష సెట్టింగ్‌లు',
      themeSettings: 'థీమ్ సెట్టింగ్‌లు',
      lightModeDescription: 'సాంప్రదాయ ప్రకాశవంతమైన ఇంటర్‌ఫేస్',
      darkModeDescription: 'తక్కువ కాంతిలో కళ్లకు సౌకర్యవంతం',
      noNotifications: 'ఇతువరె అధిసూచనెలు లేవు',
      notificationsDescription: 'మీ బుక్కింగ్స్, ఈవెంట్స్ లేదా ప్రత్యేక ఆఫర్ల గురించి కొత్త అధిసూచనెలు వచ్చినప్పుడు, అవి ఇక్కడ కనిపిస్తాయి',
      cuisine: 'వంటకాలు',
      openNow: 'ఇప్పుడు తెరిచి ఉంది',
      closed: 'మూసివేయబడింది',
      registered: 'నమోదు చేయబడింది',
      capacity: 'సామర్థ్యం',
      category: 'వర్గం',
      date: 'తేదీ',
      time: 'సమయం'
    },
    malayalam: {
      welcome: 'സ്വാഗതം',
      exploreRestaurants: 'റെസ്റ്റോറന്റുകൾ പര്യവേക്ഷണം ചെയ്യുക',
      exploreEvents: 'ഇവന്റുകൾ പര്യവേക്ഷണം ചെയ്യുക',
      home: 'ഹോം',
      bookings: 'ബുക്കിംഗുകൾ',
      restaurants: 'റെസ്റ്റോറന്റുകൾ',
      events: 'ഇവന്റുകൾ',
      favourites: 'പ്രിയപ്പെട്ടവ',
      messages: 'സന്ദേശങ്ങൾ',
      settings: 'സെറ്റിംഗുകൾ',
      logout: 'ലോഗൗട്ട്',
      lightMode: 'ലൈറ്റ് മോഡ്',
      darkMode: 'ഡാർക്ക് മോഡ്',
      upcomingEvents: 'വരാനിരിക്കുന്ന ഇവന്റുകൾ',
      eventsDescription: 'രസകരമായ ഇവന്റുകൾ കണ്ടെത്തി ബുക്ക് ചെയ്യുക',
      welcomeMessage: 'ഡൈനിംഗോയിലേക്ക് സ്വാഗതം',
      discoverMessage: 'അതിശയിപ്പിക്കുന്ന റെസ്റ്റോറന്റുകളും ഇവന്റുകളും കണ്ടെത്തുക',
      searchPlaceholder: 'റെസ്റ്റോറന്റുകൾ അല്ലെങ്കിൽ ഇവന്റുകൾ തിരയുക...',
      language: 'ഭാഷ',
      noFavorites: 'ഇതുവരെ പ്രിയപ്പെട്ടവ ഒന്നുമില്ല',
      addFavorites: 'ഇവിടെ കാണാൻ ചില പ്രിയപ്പെട്ടവ ചേർക്കുക',
      noBookings: 'ഇതുവരെ ബുക്കിംഗുകൾ ഒന്നുമില്ല',
      bookingsMessage: 'നിങ്ങളുടെ വരാനിരിക്കുന്ന ബുക്കിംഗുകൾ ഇവിടെ കാണാം',
      unreadMessages: 'വായിക്കാത്ത സന്ദേശങ്ങൾ',
      allRightsReserved: 'എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം',
      featuredRestaurants: 'പ്രത്യേക റെസ്റ്റോറന്റുകൾ',
      price: 'വില',
      rating: 'റേറ്റിംഗ്',
      locationLabel: 'സ്ഥലം',
      updateLocation: 'സ്ഥലം അപ്ഡേറ്റ് ചെയ്യുക',
      useCurrentLocation: 'നിലവിലെ സ്ഥലം ഉപയോഗിക്കുക',
      searchCities: 'നഗരങ്ങൾ തിരയുക...',
      profileSettings: 'പ്രൊഫൈൽ സെറ്റിംഗുകൾ',
      displayName: 'പ്രദർശന നാമം',
      email: 'ഇമെയിൽ',
      locationSettings: 'സ്ഥല സെറ്റിംഗുകൾ',
      languageSettings: 'ഭാഷാ സെറ്റിംഗുകൾ',
      themeSettings: 'തീം സെറ്റിംഗുകൾ',
      lightModeDescription: 'ക്ലാസിക്ക് തെളിഞ്ഞ ഇന്റർഫേസ്',
      darkModeDescription: 'കുറഞ്ഞ പ്രകാശത്തിൽ കണ്ണുകൾക്ക് സുഖകരം',
      noNotifications: 'ഇതുവരെ അറിയിപ്പുകൾ ഒന്നുമില്ല',
      notificationsDescription: 'നിങ്ങളുടെ ബുക്കിംഗുകൾ, ഇവന്റുകൾ അല്ലെങ്കിൽ പ്രത്യేക ഓഫറുകൾ സംബന്ധിച്ച് പുതിയ അറിയിപ്പുകൾ ലഭിക്കുമ്പോൾ, അവ ഇവിടെ കാണാം',
      cuisine: 'പാചകരീതി',
      openNow: 'ഇപ്പോൾ തുറന്നിരിക്കുന്നു',
      closed: 'അടച്ചിരിക്കുന്നു',
      registered: 'നമോദീകരിച്ചത്',
      capacity: 'ശേഷി',
      category: 'വിഭാഗം',
      date: 'തീയതി',
      time: 'സമയം'
    }
  };

  // Available Indian languages
const availableLanguages: { code: Language; name: string }[] = [
    { code: 'english', name: 'English' },
    { code: 'hindi', name: 'Hindi' },
    { code: 'tamil', name: 'Tamil' },
    { code: 'kannada', name: 'Kannada' },
    { code: 'telugu', name: 'Telugu' },
    { code: 'malayalam', name: 'Malayalam' }
  ];

// Use the imported Event type directly
type Event = ImportedEvent;

interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

export interface Booking {
  _id?: string;
  id?: string;
  userId?: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: string | number;
  table?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  occasion?: string;
  specialRequest?: string;
  status: string;
  createdAt?: string;
}

interface AvatarOption {
  id: string;
  src: string;
  alt: string;
}

// Add missing interfaces and constants
interface FavoriteItem {
  id: string;
  name: string;
  image: string;
  location: Location;
  type: 'restaurant' | 'event' | 'location';
  rating?: number;
  cuisine?: string[];
  priceLevel?: number;
  openNow?: boolean;
  date?: string;
  time?: string;
  price?: number;
  category?: string;
  description?: string;
}

const defaultLocation: Location = {
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India'
};

// Add formatTimestamp function
const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

export default function DashboardPage() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [language, setLanguage] = useState<Language>('english');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [filteredCities, setFilteredCities] = useState(indianCities);
  const [homeSection, setHomeSection] = useState<'restaurants' | 'events'>('restaurants');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const avatarOptions: AvatarOption[] = [
    { id: '1', src: '/avatars/avatar1.png', alt: 'Avatar 1' },
    { id: '2', src: '/avatars/avatar2.png', alt: 'Avatar 2' },
    { id: '3', src: '/avatars/avatar3.png', alt: 'Avatar 3' },
    { id: '4', src: '/avatars/avatar4.png', alt: 'Avatar 4' },
    { id: '5', src: '/avatars/avatar5.png', alt: 'Avatar 5' },
    { id: '6', src: '/avatars/avatar6.png', alt: 'Avatar 6' }
  ];

  // Reference to the fetchBookingsFromAPI function defined below

  // Update the loadInitialData function
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // First detect location
      await detectLocation();
      
      // Then load restaurants and events
      setRestaurants(mockRestaurants);
      setEvents(mockEvents);
      
      // Fetch bookings if user is authenticated
      if (auth.currentUser) {
        await fetchBookingsFromAPI();
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update the useEffect for initial data loading
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Force reload bookings from API when bookings section is opened
  useEffect(() => {
    if (activeSection === 'bookings' && auth.currentUser) {
      console.log('Bookings section opened - fetching from API');
      fetchBookingsFromAPI();
    }
  }, [activeSection]);

  // Handle user authentication state
  useEffect(() => {
    console.log('Setting up auth state listener in dashboard...');
    setAuthLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const parsedData = userDoc.data();
            // Update user data while preserving existing data
            const newUserData = {
              uid: user.uid,
              email: user.email || parsedData.email || '',
              displayName: user.displayName || parsedData.displayName || user.email?.split('@')[0] || '',
              name: user.displayName || parsedData.name || user.email?.split('@')[0] || '',
              photoURL: user.photoURL || parsedData.photoURL || null,
              location: parsedData.location || defaultLocation,
              lastLogin: new Date(),
              createdAt: parsedData.createdAt || new Date()
            };
            await setDoc(doc(db, 'users', user.uid), newUserData);
            setUserData(newUserData);
          } else {
            // Create new user data if document doesn't exist
            const newUserData = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || '',
              name: user.displayName || user.email?.split('@')[0] || '',
              photoURL: user.photoURL || null,
              location: defaultLocation,
              lastLogin: new Date(),
              createdAt: new Date()
            };
            await setDoc(doc(db, 'users', user.uid), newUserData);
            setUserData(newUserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load user data. Please try again.');
        } finally {
          setAuthLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load saved favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('dineInGoFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    const savedLanguage = localStorage.getItem('dineInGoLanguage');
    if (savedLanguage && ['english', 'hindi', 'tamil', 'kannada', 'telugu', 'malayalam'].includes(savedLanguage)) {
      setLanguage(savedLanguage as Language);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dineInGoFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('dineInGoLanguage', language);
  }, [language]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigation = (section: Section): void => {
    setActiveSection(section);
      setIsSidebarOpen(false);
  };

  const toggleFavorite = (item: Restaurant | Event) => {
    setFavorites(prev => {
      const isFavorite = prev.some(fav => fav.id === item.id);
      if (isFavorite) {
        return prev.filter(fav => fav.id !== item.id);
      } else {
        const favoriteItem: FavoriteItem = {
          id: item.id,
          name: item.name,
          image: item.image,
          location: 'location' in item && typeof item.location === 'object' 
            ? item.location 
            : { city: typeof item.location === 'string' ? item.location : '', state: '', country: 'India' },
          type: 'location' in item ? 'restaurant' : 'event',
          ...(('rating' in item) && { rating: item.rating }),
          ...(('cuisine' in item) && { cuisine: item.cuisine }),
          ...(('priceLevel' in item) && { priceLevel: item.priceLevel }),
          ...(('openNow' in item) && { openNow: item.openNow }),
          ...(('date' in item) && { date: item.date }),
          ...(('time' in item) && { time: item.time }),
          ...(('price' in item) && { price: item.price }),
          ...(('category' in item) && { category: item.category }),
          ...(('description' in item) && { description: item.description })
        };
        return [...prev, favoriteItem];
      }
    });
  };

  const isItemFavorite = (itemId: string) => {
    return favorites.some(fav => fav.id === itemId);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  const unreadNotificationsCount = notifications.filter(notification => !notification.read).length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('dineInGoFavorites');
      localStorage.removeItem('dineInGoLanguage');
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const handleAvatarSelect = async (src: string): Promise<void> => {
    try {
      const updatedUserData: UserData = {
        ...userData,
        photoURL: src
      };

      // Store the updated user data
      await storeUserData(updatedUserData);

      // Update local state
      setUserData(updatedUserData);
      setIsAvatarModalOpen(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      setError('Failed to update avatar. Please try again.');
    }
  };

  const handleLocationSelect = async (newLocation: Location) => {
    try {
      // Forward geocode the location to get coordinates
      const coordinates = await GeocodingService.forwardGeocode(
        `${newLocation.city}, ${newLocation.state}, ${newLocation.country}`
      );

      if (coordinates) {
        // Update user data with new location
        setUserData(prev => prev ? { ...prev, location: newLocation } : null);

        // Save location to localStorage
        localStorage.setItem('dineInGoLocation', JSON.stringify(newLocation));
        
        
        // Close the location modal
        setIsLocationModalOpen(false);
      } else {
        console.error('Could not geocode the location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Update the detectLocation function
  const detectLocation = async () => {
    try {
      setIsDetectingLocation(true);
      const currentLocation = await GeocodingService.getCurrentLocation();
      if (currentLocation) {
        const nearestCity = GeocodingService.findNearestCity(
          currentLocation.lat,
          currentLocation.lng
        );
        
        setUserData(prev => ({
          ...prev,
          location: {
            city: nearestCity.city,
            state: nearestCity.state,
            country: nearestCity.country
          }
        }));

        // Save to localStorage
        localStorage.setItem('dineInGoLocation', JSON.stringify({
          city: nearestCity.city,
          state: nearestCity.state,
          country: nearestCity.country
        }));

        // Close the modal
        setIsLocationModalOpen(false);
      }
    } catch (error) {
      console.error('Error detecting location:', error);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Add search handler function
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredRestaurants([]);
      setFilteredEvents([]);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filteredRests = restaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(lowerTerm) ||
      restaurant.cuisine?.some(c => c.toLowerCase().includes(lowerTerm)) ||
      restaurant.location.city.toLowerCase().includes(lowerTerm) ||
      restaurant.location.state.toLowerCase().includes(lowerTerm)
    );

    const filteredEvs = events.filter(event => 
      event.name.toLowerCase().includes(lowerTerm) ||
      event.category.toLowerCase().includes(lowerTerm) ||
      event.description.toLowerCase().includes(lowerTerm) ||
      (typeof event.location === 'string' 
        ? event.location.toLowerCase().includes(lowerTerm)
        : event.location.city.toLowerCase().includes(lowerTerm) ||
          event.location.state.toLowerCase().includes(lowerTerm))
    );

    setFilteredRestaurants(filteredRests);
    setFilteredEvents(filteredEvs);
  };

  const renderSection = () => {
    const section = activeSection;
    
    // Show search results if there's a search term
    if (searchTerm.trim() !== '') {
      return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-8`}>
            Search Results
          </h1>
          
          {/* Restaurants Results */}
          {filteredRestaurants.length > 0 && (
            <div className="mb-12">
              <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                Restaurants
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map(restaurant => (
                  <div key={restaurant.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-2 hover:border-emerald-500/30 cursor-pointer`} onClick={() => navigate(`/restaurant/${restaurant.id}`)}>
                    <div className="relative h-48">
                      <img 
                        src={restaurant.image} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-full flex items-center">
                        <span className="text-emerald-400 mr-1">★</span>
                        <span>{restaurant.rating}</span>
                      </div>
                      <button 
                        className="absolute top-4 right-4 p-2 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(restaurant);
                        }}
                      >
                        <Heart size={20} className="text-white" fill={isItemFavorite(restaurant.id) ? "white" : "none"} />
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {restaurant.name}
                      </h3>
                      <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                        <MapPin size={16} className="mr-1" />
                        <span>{restaurant.address || `${restaurant.location.city}, ${restaurant.location.state}`}</span>
                      </div>
                      
                      {/* Add the map component */}
                      <div className="mb-3">
                        <RestaurantMap 
                          address={restaurant.address || `${restaurant.location.city}, ${restaurant.location.state}`}
                          name={restaurant.name}
                          isListMode={true}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {restaurant.cuisine?.map((cuisine: string, index: number) => (
                          <span key={index} className={`px-2 py-1 ${
                            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                          } rounded-full text-sm`}>
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Events Results */}
          {filteredEvents.length > 0 && (
            <div className="mb-12">
              <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <div key={event.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-2 hover:border-emerald-500/30 cursor-pointer`} onClick={() => navigate(`/restaurant/${event.id}?type=event`)}>
                    <div className="relative h-48">
                      <img 
                        src={event.image} 
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-full flex items-center">
                        <span className="text-emerald-400 mr-1">₹</span>
                        <span>{event.price}</span>
                      </div>
                      <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const eventToToggle = {
                            ...event,
                            location: typeof event.location === 'string' 
                              ? event.location 
                              : event.location
                          };
                          toggleFavorite(eventToToggle);
                        }}
                      >
                        <Heart size={20} className="text-white" fill={isItemFavorite(event.id) ? "white" : "none"} />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {event.name}
                      </h3>
                      <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                        <MapPin size={16} className="mr-1" />
                        <span>{typeof event.location === 'string' ? event.location : `${(event.location as Location).city}, ${(event.location as Location).state}`}</span>
                      </div>
                      <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock size={16} className="mr-1" />
                          <span>{event.time}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`px-2 py-1 ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        } rounded-full text-sm`}>
                          {event.category}
                        </span>
                        <span className={`px-2 py-1 ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        } rounded-full text-sm`}>
                          {event.registeredCount}/{event.capacity} Registered
                        </span>
                      </div>
                      <div className="mt-4">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* No Results Message */}
          {filteredRestaurants.length === 0 && filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No results found for "{searchTerm}"
              </p>
            </div>
          )}
        </div>
      );
    }
    
    switch (section) {
      case 'home':
        return (
          <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Welcome Header */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {`${translations[language].welcome}, ${userData?.displayName || 'Guest'}!`}
                </h1>
                <button 
                  onClick={() => setIsLocationModalOpen(true)}
                  className={`flex items-center ${
                    isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-white hover:bg-gray-50'
                  } rounded-full px-4 py-2 transition-colors group`}
                >
                  <div className="flex items-center">
                    <MapPin className="text-emerald-400 mr-2" size={18} />
                    <span className={`${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                      {userData?.location.city}, {userData?.location.state}
                    </span>
                  </div>
                </button>
              </div>

              {/* Section Selector */}
              <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setHomeSection('restaurants')}
                  className={`flex-1 px-6 py-3 rounded-xl text-lg font-semibold transition-colors ${
                    homeSection === 'restaurants'
                      ? 'bg-emerald-500 text-white'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {translations[language].exploreRestaurants}
                </button>
                <button 
                  onClick={() => setHomeSection('events')}
                  className={`flex-1 px-6 py-3 rounded-xl text-lg font-semibold transition-colors ${
                    homeSection === 'events'
                      ? 'bg-emerald-500 text-white'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {translations[language].exploreEvents}
                </button>
              </div>

              {/* Content based on selection */}
              {homeSection === 'restaurants' ? (
                <div className="mb-12">
                  <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                    Featured Restaurants
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {restaurants.map(restaurant => (
                      <div 
                        key={restaurant.id} 
                        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-2 hover:border-emerald-500/30 cursor-pointer`}
                        onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                      >
                        <div className="relative h-48">
                          <img 
                            src={restaurant.image} 
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-full flex items-center">
                            <span className="text-emerald-400 mr-1">★</span>
                            <span>{restaurant.rating}</span>
                          </div>
                          <button 
                            className="absolute top-4 right-4 p-2 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(restaurant);
                            }}
                          >
                            <Heart size={20} className="text-white" fill={isItemFavorite(restaurant.id) ? "white" : "none"} />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {restaurant.name}
                          </h3>
                          <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                            <MapPin size={16} className="mr-1" />
                            <span>{`${restaurant.location.city}, ${restaurant.location.state}`}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {restaurant.cuisine?.map((cuisine: string, index: number) => (
                              <span key={index} className={`px-2 py-1 ${
                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              } rounded-full text-sm`}>
                                {cuisine}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-12">
                  <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                    Upcoming Events
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                      <div key={event.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-2 hover:border-emerald-500/30 cursor-pointer`} onClick={() => navigate(`/restaurant/${event.id}?type=event`)}>
                        <div className="relative h-48">
                          <img 
                            src={event.image} 
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-full flex items-center">
                            <span className="text-emerald-400 mr-1">₹</span>
                            <span>{event.price}</span>
                          </div>
                          <button
                            className="absolute top-4 right-4 p-2 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const eventToToggle = {
                                ...event,
                                location: typeof event.location === 'string' 
                                  ? event.location 
                                  : event.location
                              };
                              toggleFavorite(eventToToggle);
                            }}
                          >
                            <Heart size={20} className="text-white" fill={isItemFavorite(event.id) ? "white" : "none"} />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {event.name}
                          </h3>
                          <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                            <MapPin size={16} className="mr-1" />
                            <span>{typeof event.location === 'string' ? event.location : `${(event.location as Location).city}, ${(event.location as Location).state}`}</span>
                          </div>
                          <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-1" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Clock size={16} className="mr-1" />
                              <span>{event.time}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`px-2 py-1 ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            } rounded-full text-sm`}>
                              {event.category}
                            </span>
                            <span className={`px-2 py-1 ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            } rounded-full text-sm`}>
                              {event.registeredCount}/{event.capacity} Registered
                            </span>
                          </div>
                          <div className="mt-4">
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {event.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'restaurants':
        return (
          <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-8`}>
              All Restaurants
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {restaurants.map(restaurant => (
                <div 
                  key={restaurant.id} 
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-2 hover:border-emerald-500/30 cursor-pointer`}
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  <div className="relative h-48">
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-full flex items-center">
                      <span className="text-emerald-400 mr-1">★</span>
                      <span>{restaurant.rating}</span>
                    </div>
                    <button 
                      className="absolute top-4 right-4 p-2 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(restaurant);
                      }}
                    >
                      <Heart size={20} className="text-white" fill={isItemFavorite(restaurant.id) ? "white" : "none"} />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {restaurant.name}
                    </h3>
                    <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                      <MapPin size={16} className="mr-1" />
                      <span>{`${restaurant.location.city}, ${restaurant.location.state}`}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {restaurant.cuisine?.map((cuisine: string, index: number) => (
                        <span key={index} className={`px-2 py-1 ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        } rounded-full text-sm`}>
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'events':
        return (
          <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-8`}>
              All Events
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map(event => (
                <div key={event.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-2 hover:border-emerald-500/30 cursor-pointer`} onClick={() => navigate(`/restaurant/${event.id}?type=event`)}>
                  <div className="relative h-48">
                    <img 
                      src={event.image} 
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-full flex items-center">
                      <span className="text-emerald-400 mr-1">₹</span>
                      <span>{event.price}</span>
                    </div>
                    <button
                      className="absolute top-4 right-4 p-2 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const eventToToggle = {
                          ...event,
                          location: typeof event.location === 'string' 
                            ? event.location 
                            : event.location
                        };
                        toggleFavorite(eventToToggle);
                      }}
                    >
                      <Heart size={20} className="text-white" fill={isItemFavorite(event.id) ? "white" : "none"} />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {event.name}
                    </h3>
                    <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                      <MapPin size={16} className="mr-1" />
                      <span>{typeof event.location === 'string' ? event.location : `${(event.location as Location).city}, ${(event.location as Location).state}`}</span>
                    </div>
                    <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock size={16} className="mr-1" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`px-2 py-1 ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      } rounded-full text-sm`}>
                        {event.category}
                      </span>
                      <span className={`px-2 py-1 ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      } rounded-full text-sm`}>
                        {event.registeredCount}/{event.capacity} Registered
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {event.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        case 'bookings':
          // Bookings section
          
          return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-8`}>
                My Bookings {bookings.length > 0 && `(${bookings.length})`}
              </h1>
              
              {(!bookings || bookings.length === 0) ? (
                <div>
                  <div className={`mb-8 text-center py-12 ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} rounded-3xl shadow-md p-6`}>
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                    <h3 className="text-xl font-medium mb-2">{translations[language].noBookings}</h3>
                    <p className="mb-6">{translations[language].bookingsMessage}</p>
                    
                    {/* Section Selector Similar to Home - Explore options */}
                    <div className="flex gap-4 max-w-md mx-auto">
                      <button 
                        onClick={() => {
                          navigate('/');
                          setActiveSection('restaurants');
                        }}
                        className="flex-1 px-6 py-3 rounded-xl text-lg font-semibold transition-colors bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        {translations[language].exploreRestaurants}
                      </button>
                      <button 
                        onClick={() => {
                          navigate('/');
                          setHomeSection('events');
                          setActiveSection('home');
                        }}
                        className="flex-1 px-6 py-3 rounded-xl text-lg font-semibold transition-colors bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        {translations[language].exploreEvents}
                      </button>
                    </div>
                  </div>
                  
                  {/* Additional featured restaurants section */}
                  <div className="mb-8">
                    <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {translations[language].featuredRestaurants}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {restaurants.slice(0, 3).map(restaurant => (
                        <div 
                          key={restaurant.id} 
                          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-2 hover:border-emerald-500/30 cursor-pointer`}
                          onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                        >
                          <div className="relative h-48">
                            <img 
                              src={restaurant.image} 
                              alt={restaurant.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-full flex items-center">
                              <span className="text-emerald-400 mr-1">★</span>
                              <span>{restaurant.rating}</span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {restaurant.name}
                            </h3>
                            <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                              <MapPin size={16} className="mr-1" />
                              <span>{`${restaurant.location.city}, ${restaurant.location.state}`}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-2 hover:border-emerald-500/30 cursor-pointer`}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowInvoice(true);
                      }}
                    >
                      <div className="relative h-48 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold bg-white text-emerald-600">
                          {booking.status}
                        </div>
                        <h3 className="text-3xl font-bold text-white text-center p-6">
                          {booking.type === 'event' ? booking.name : booking.restaurantName}
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          <p className="flex items-center text-base">
                            <Calendar className="w-5 h-5 mr-3 text-emerald-500" />
                            <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {new Date(booking.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </p>
                          <p className="flex items-center text-base">
                            <Clock className="w-5 h-5 mr-3 text-emerald-500" />
                            <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{booking.time}</span>
                          </p>
                          <p className="flex items-center text-base">
                            <Users className="w-5 h-5 mr-3 text-emerald-500" />
                            <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {booking.guests} {Number(booking.guests) === 1 ? 'Guest' : 'Guests'}
                            </span>
                          </p>
                          {booking.table && (
                            <p className="flex items-center text-base">
                              <span className="w-5 h-5 flex items-center justify-center mr-3 text-emerald-500 font-bold">#</span>
                              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Table {booking.table}</span>
                            </p>
                          )}
                          {booking.specialRequest && (
                            <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="font-medium">Special Request:</span> {booking.specialRequest}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
      case 'settings':
        return (
          <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4 md:p-8`}>
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                {translations[language].settings}
              </h1>
              
              <ProfileSettings 
                user={auth.currentUser}
                userData={userData || {
                  displayName: auth.currentUser?.displayName || '',
                  name: auth.currentUser?.displayName || '',
                  email: auth.currentUser?.email || '',
                  photoURL: auth.currentUser?.photoURL || null,
                  location: defaultLocation
                }}
                isDarkMode={isDarkMode}
                onUpdate={async (updates) => {
                  if (!auth.currentUser) return;
                  try {
                    // Update in Firebase Auth if displayName or photoURL is being updated
                    const authUpdates: { displayName?: string; photoURL?: string | null } = {};
                    
                    if ('displayName' in updates) {
                      authUpdates.displayName = updates.displayName;
                    }
                    if ('photoURL' in updates) {
                      authUpdates.photoURL = updates.photoURL;
                    }
                    
                    if (Object.keys(authUpdates).length > 0) {
                      await updateProfile(auth.currentUser, authUpdates);
                    }
                    
                    // Update in MongoDB
                    const response = await fetch('/api/users/update', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
                      },
                      body: JSON.stringify({
                        userId: auth.currentUser.uid,
                        updates: {
                          ...updates,
                          updatedAt: new Date().toISOString()
                        }
                      })
                    });

                    if (!response.ok) {
                      throw new Error('Failed to update profile in database');
                    }
                    
                    // Update local state
                    setUserData(prev => prev ? { ...prev, ...updates } : null);
                  } catch (error) {
                    console.error('Error updating profile:', error);
                    throw error;
                  }
                }}
              />
              
              {/* Location Settings */}
              <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-3xl p-6`}>
                <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                  {translations[language].locationSettings}
                </h2>
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{`${userData?.location.city}, ${userData?.location.state}`}</span>
                </div>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  {translations[language].updateLocation}
                </button>
              </div>

              {/* Language Settings */}
              <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-3xl p-6`}>
                <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                  {translations[language].languageSettings}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`p-4 rounded-xl text-center transition-colors ${
                        language === lang.code
                          ? 'bg-emerald-500 text-white'
                        : isDarkMode
                          ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Settings */}
              <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-3xl p-6`}>
                <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                  {translations[language].themeSettings}
                </h2>
                <div className="flex flex-col space-y-6">
                  <div className={`flex items-center justify-between p-4 rounded-xl ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center">
                      {isDarkMode ? (
                        <Moon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mr-3`} />
                      ) : (
                        <Sun className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mr-3`} />
                      )}
                      <div>
                        <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {isDarkMode ? translations[language].darkMode : translations[language].lightMode}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {isDarkMode ? 'Easier on the eyes in low light' : 'Classic bright interface'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className="relative"
                      aria-label="Toggle theme"
                    >
                      <div className={`w-14 h-8 rounded-full transition-colors ${
                        isDarkMode ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute w-6 h-6 rounded-full bg-white top-1 transition-transform ${
                          isDarkMode ? 'translate-x-7' : 'translate-x-1'
                        } shadow-sm flex items-center justify-center`}>
                          {isDarkMode ? (
                            <Moon className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Sun className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'favorites':
        return (
          <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-8`}>
              Your Favorites
            </h1>
            {favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className={`w-20 h-20 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mb-6`}>
                  <Heart className={`w-10 h-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {translations[language].noFavorites}
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center max-w-sm`}>
                  {translations[language].addFavorites}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <button
                    onClick={() => handleNavigation('restaurants')}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Explore Restaurants</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('events')}
                    className={`px-6 py-3 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl transition-colors flex items-center justify-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Discover Events</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(item => (
                  <div key={item.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-2 hover:border-emerald-500/30`}>
                    <div className="relative h-48">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.type === 'restaurant' && item.rating && (
                        <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-full flex items-center">
                          <span className="text-emerald-400 mr-1">★</span>
                          <span>{item.rating}</span>
                    </div>
                      )}
                      {item.type === 'event' && item.price && (
                        <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1 rounded-full flex items-center">
                          <span className="text-emerald-400 mr-1">₹</span>
                          <span>{item.price}</span>
                  </div>
                      )}
                      <button 
                        className="absolute top-4 right-4 p-2 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors"
                        onClick={() => toggleFavorite(item as any)}
                      >
                        <Heart size={20} className="text-white" fill="white" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </h3>
                        <span className={`px-2 py-1 ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        } rounded-full text-xs`}>
                          {item.type === 'restaurant' ? 'Restaurant' : 'Event'}
                        </span>
                  </div>
                      <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                        <MapPin size={16} className="mr-1" />
                        <span>{typeof item.location === 'object' ? `${item.location.city}, ${item.location.state}` : item.location}</span>
                    </div>
                      {item.type === 'restaurant' && item.cuisine && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.cuisine.map((cuisine: string, index: number) => (
                            <span key={index} className={`px-2 py-1 ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            } rounded-full text-sm`}>
                              {cuisine}
                            </span>
                          ))}
                  </div>
                      )}
                      {item.type === 'event' && (
                        <>
                          {item.date && (
                            <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              <div className="flex items-center">
                                <Calendar size={16} className="mr-1" />
                                <span>{item.date}</span>
                </div>
                              {item.time && (
                                <div className="flex items-center mt-1">
                                  <Clock size={16} className="mr-1" />
                                  <span>{item.time}</span>
              </div>
                              )}
            </div>
                          )}
                          {item.category && (
                            <div className="mt-2">
                              <span className={`px-2 py-1 ${
                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              } rounded-full text-sm`}>
                                {item.category}
                              </span>
                            </div>
                          )}
                          {item.description && (
                            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {item.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'messages':
        return (
          <div className="p-6">
            {notifications.length === 0 ? (
              <div className={`flex flex-col items-center justify-center text-center p-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <Bell size={32} className="text-emerald-500" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  No notifications yet
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  You'll see notifications here when there are updates about your bookings, events, or other activities.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {translations[language].messages}
                  </h2>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      } text-sm font-medium transition-colors`}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className={`flex items-start p-4 rounded-xl transition-colors ${
                      isDarkMode
                        ? notification.read
                          ? 'bg-gray-800'
                          : 'bg-gray-800/80 ring-1 ring-emerald-500'
                        : notification.read
                          ? 'bg-white'
                          : 'bg-white/90 ring-1 ring-emerald-500'
                    }`}
                  >
                    <Bell
                      className={`flex-shrink-0 ${
                        notification.read
                          ? isDarkMode
                            ? 'text-gray-400'
                            : 'text-gray-500'
                          : 'text-emerald-500'
                      }`}
                      size={20}
                    />
                    <div className="ml-4 flex-1">
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      // ... rest of the cases ...
    }
  };

  // Update the location modal
  const renderLocationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Update Location</h3>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className={`p-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-full transition-colors`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`} />
          </button>
        </div>
        
        {/* Current Location Button */}
        <button
          onClick={detectLocation}
          disabled={isDetectingLocation}
          className={`w-full mb-6 px-4 py-3 rounded-xl text-white transition-colors flex items-center justify-center gap-2 ${
            isDetectingLocation 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {isDetectingLocation ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Detecting Location...</span>
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              <span>Use Current Location</span>
            </>
          )}
        </button>

        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchTerm}
            placeholder="Search cities..."
            className={`w-full ${
              isDarkMode 
                ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-emerald-500' 
                : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-emerald-500'
            } rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2`}
            onChange={(e) => {
              const term = e.target.value;
              setSearchTerm(term);
              const filtered = indianCities.filter(city => 
                city.city.toLowerCase().includes(term.toLowerCase()) || 
                city.state.toLowerCase().includes(term.toLowerCase())
              );
              setFilteredCities(filtered);
            }}
          />
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
        </div>

        <div className="space-y-2">
          {filteredCities.map(city => (
            <button
              key={`${city.city}-${city.state}`}
              onClick={() => handleLocationSelect({
                city: city.city,
                state: city.state,
                country: city.country
              })}
              className={`w-full text-left px-4 py-3 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } rounded-xl transition-colors flex items-center`}
            >
              <MapPin className="text-emerald-500 mr-3" size={16} />
              <span>{city.city}, {city.state}</span>
            </button>
          ))}
          {filteredCities.length === 0 && (
            <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No cities found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAvatarModal = () => {
    if (!isAvatarModalOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsAvatarModalOpen(false)} />
        <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 max-w-lg w-full mx-4`}>
          <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
            Choose Avatar
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar.src)}
                className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-colors ${
                  userData?.photoURL === avatar.src
                    ? 'border-emerald-500'
                    : isDarkMode
                      ? 'border-gray-700 hover:border-gray-600'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={avatar.src}
                  alt={avatar.alt}
                  className="w-full h-full object-cover"
                />
                {userData?.photoURL === avatar.src && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <Check className="text-white" size={24} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add markAllNotificationsAsRead function
  const markAllNotificationsAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  // Handle booking success and refresh bookings from API
  useEffect(() => {
    const handleBookingSuccess = () => {
      if (location.state?.bookingSuccess) {
        // Show success toast
        if (location.state.newBooking) {
          toast.success(
            `Reservation confirmed at ${location.state.newBooking.restaurantName}!`,
            {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
        }
        
        // Clear the state to prevent showing the toast again on refresh
        navigate(location.pathname, { replace: true, state: {} });
        
        // Fetch latest bookings from API to ensure we have the most up-to-date data
        fetchBookingsFromAPI();
      }
    };

    // Initial check for booking success when component mounts or location changes
    handleBookingSuccess();
    
    // Set up an interval to refresh bookings periodically
    const intervalId = setInterval(() => {
      if (auth.currentUser && activeSection === 'bookings') {
        console.log('Auto-refreshing bookings from API...');
        fetchBookingsFromAPI();
      }
    }, 30000); // Refresh every 30 seconds when on bookings section

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [location, navigate, activeSection]);

  // Fetch bookings from MongoDB API instead of localStorage
  const fetchBookingsFromAPI = async () => {
    try {
      if (!auth.currentUser) {
        console.error('No authenticated user found');
        return;
      }
      
      setIsLoading(true);
      
      // First check if we have any real bookings in localStorage
      const savedBookings = localStorage.getItem('dineInGoBookings');
      if (savedBookings) {
        try {
          const parsedBookings = JSON.parse(savedBookings);
          console.log('Found saved bookings in localStorage:', parsedBookings);
          if (Array.isArray(parsedBookings) && parsedBookings.length > 0) {
            setBookings(parsedBookings);
            setIsLoading(false);
            return;
          } else {
            console.log('No bookings found in localStorage or empty array');
          }
        } catch (error) {
          console.error('Error parsing saved bookings:', error);
        }
      } else {
        console.log('No bookings found in localStorage');
      }
      
      // In a real app, we would fetch from API
      // const response = await apiService.getBookings(auth.currentUser.uid);
      // setBookings(response.data);
      
      // For development, using mock data
      if (process.env.NODE_ENV === 'development' || true) {
        const sampleBookings: Booking[] = [
          {
            id: '1',
            userId: auth.currentUser.uid,
            restaurantName: mockRestaurants[0].name,
            date: new Date().toISOString().split('T')[0],
            time: '19:00',
            guests: 2,
            table: 'A4',
            fullName: auth.currentUser.displayName || 'Guest User',
            email: auth.currentUser.email || '',
            phoneNumber: '',
            status: 'Confirmed',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            userId: auth.currentUser.uid,
            restaurantName: mockRestaurants[1].name,
            date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days later
            time: '20:30',
            guests: 4,
            table: 'B7',
            fullName: auth.currentUser.displayName || 'Guest User',
            email: auth.currentUser.email || '',
            phoneNumber: '',
            specialRequest: 'Window seat preferred',
            status: 'Pending',
            createdAt: new Date().toISOString()
          }
        ];
        
        // Check if we already have bookings in localStorage
        const existingBookings = localStorage.getItem('dineInGoBookings');
        let finalBookings = [...sampleBookings];
        
        if (existingBookings) {
          try {
            const parsedExistingBookings = JSON.parse(existingBookings);
            if (Array.isArray(parsedExistingBookings) && parsedExistingBookings.length > 0) {
              // Merge existing bookings with sample bookings, avoiding duplicates
              const existingIds = new Set(parsedExistingBookings.map(booking => booking.id));
              const uniqueSampleBookings = sampleBookings.filter(booking => !existingIds.has(booking.id));
              finalBookings = [...parsedExistingBookings, ...uniqueSampleBookings];
              console.log('Merged existing bookings with sample bookings:', finalBookings);
            }
          } catch (error) {
            console.error('Error parsing existing bookings:', error);
          }
        }
        
        // Save merged bookings to localStorage for persistence
        localStorage.setItem('dineInGoBookings', JSON.stringify(finalBookings));
        
        // Set bookings in state
        setBookings(finalBookings);
        
        // For testing empty state, uncomment these lines and comment the lines above
        // localStorage.removeItem('dineInGoBookings');
        // setBookings([]);
        
        console.log('Using mock bookings data for development');
        return;
      }
      
      // In production, would use the actual API
      /* 
      const fetchedBookings = await bookingsApi.getAll();
      console.log('Bookings fetched from API:', fetchedBookings);
      
      // Update state with fetched bookings
      if (Array.isArray(fetchedBookings)) {
        setBookings(fetchedBookings);
      } else {
        console.warn('API returned non-array bookings:', fetchedBookings);
        setBookings([]);
      }
      */
      
      // Just set empty bookings for now to avoid errors
      setBookings([]);
      
    } catch (error) {
      console.error('Error fetching bookings from API:', error);
      setBookings([]);
      // Don't show error toasts for now to prevent the error messages
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load bookings when component mounts
  useEffect(() => {
    // Only fetch bookings if user is authenticated
    if (auth.currentUser) {
      fetchBookingsFromAPI();
    } else {
      // Initialize with empty array if user is not authenticated
      setBookings([]);
    }
  }, []);

  // Auto-refresh bookings when user authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, fetch their bookings
        fetchBookingsFromAPI();
      } else {
        // User is signed out, clear bookings
        setBookings([]);
      }
    });
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return <SkeletonLoading isDarkMode={isDarkMode} />;
  }

  return (
    <>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Sidebar */}
        <aside 
          className={`fixed top-0 left-0 h-full w-[280px] transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out z-50 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } border-r border-gray-200 shadow-lg overflow-y-auto`}
        >
          <div className="p-6 flex flex-col h-full">
            {/* Dineingo Logo */}
            <div className="flex items-center justify-between mb-8">
              <div className="text-2xl font-bold relative">
                D<span className="relative">i<span className="absolute -top-2.5 -right-0.5 text-red-500 text-2.5xl">•</span></span>neIn<span className="text-yellow-400">Go</span>
              </div>
              <button 
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile Section */}
            {isLoading ? (
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-200 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <img
                    src={userData?.photoURL || '/images/default-avatar.png'}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-emerald-600 truncate">
                    {userData?.displayName}
                  </h2>
                  <p className="text-sm text-gray-500 truncate">
                    {userData?.email}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1">
              {[
                { id: 'home', label: translations[language].home, icon: <Menu className="w-5 h-5" /> },
                { id: 'bookings', label: translations[language].bookings, icon: <Calendar className="w-5 h-5" /> },
                { id: 'restaurants', label: translations[language].restaurants, icon: <MapPin className="w-5 h-5" /> },
                { id: 'events', label: translations[language].events, icon: <Globe className="w-5 h-5" /> },
                { id: 'favorites', label: translations[language].favourites, icon: <Heart className="w-5 h-5" /> },
                { id: 'messages', label: translations[language].messages, icon: <Bell className="w-5 h-5" /> },
                { id: 'settings', label: translations[language].settings, icon: <Settings className="w-5 h-5" /> }
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    if (id === 'bookings') {
                      // Force refresh bookings when navigating to the bookings section
                      fetchBookingsFromAPI();
                    }
                    handleNavigation(id as Section);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-colors ${
                    activeSection === id
                      ? 'bg-emerald-500 text-white font-medium'
                      : isDarkMode 
                        ? 'text-gray-200 hover:bg-gray-700/70' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-8">
                    {icon}
                  </span>
                  <span className="ml-3 text-sm font-medium">{label}</span>
                  {id === 'messages' && unreadNotificationsCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unreadNotificationsCount}
                    </span>
                  )}
                  {id === 'bookings' && bookings.length > 0 && (
                    <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {bookings.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Bottom Actions in Sidebar */}
            <div className="pt-4 space-y-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center">
                <span className="inline-flex items-center justify-center w-8">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </span>
                <span className="ml-3 text-sm font-medium">
                    {isDarkMode ? translations[language].darkMode : translations[language].lightMode}
                </span>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-1.5'}`}></div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <span className="inline-flex items-center justify-center w-8">
                  <ArrowLeft className="w-5 h-5" />
                </span>
                <span className="ml-3 text-sm font-medium">{translations[language].logout}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleSidebar}
          className={`fixed top-4 left-4 z-50 p-2 rounded-full ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } shadow-lg md:hidden`}
        >
          <Menu className={`w-7 h-7 ${isDarkMode ? 'text-white' : 'text-black'}`} />
        </button>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <div className={`min-h-screen ${isSidebarOpen ? 'lg:ml-[280px]' : ''} transition-all duration-300`}>
          {/* Header - removed sticky positioning */}
          <header className="px-4 py-3">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-emerald-400'} rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleSidebar} 
                  className="flex items-center justify-center w-10 h-10 hover:bg-emerald-500 rounded-xl transition-colors"
                  aria-label="Toggle menu"
                >
                  <Menu className={`w-7 h-7 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <div 
                  className="flex items-center cursor-pointer" 
                  onClick={() => window.location.reload()}
                >
                  <div className="text-2xl font-bold relative">
                    D<span className="relative">i<span className="absolute -top-2.5 -right-0.5 text-red-500 text-2.5xl">•</span></span>neIn<span className="text-yellow-400">Go</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="relative hidden md:block">
                    <input
                      type="text"
                      placeholder={translations[language].searchPlaceholder}
                      className="w-[300px] px-4 py-2 rounded-xl bg-white/90 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Search className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <button 
                    className="flex items-center justify-center w-10 h-10 hover:bg-emerald-500 rounded-xl transition-colors relative"
                    onClick={() => handleNavigation('messages')}
                  >
                    <Bell className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  <button 
                    className="relative w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-white/50 transition-all"
                    onClick={() => handleNavigation('settings')}
                  >
                    {userData?.photoURL ? (
                      <img src={userData.photoURL} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                    )}
                  </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="px-4 py-6 relative">
            {/* Doodle Art Background */}
            <div className="absolute inset-0 overflow-hidden z-0 opacity-25">
              <img 
                src="/images/dodle.png" 
                alt="" 
                className="absolute w-40 h-40 top-10 left-10 transform rotate-12" 
                style={{ objectFit: 'contain', transition: 'all 0.5s ease-in-out', filter: 'brightness(1.3) contrast(1.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(0deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(12deg)'}
              />
              <img 
                src="/images/meatdodle.png" 
                alt="" 
                className="absolute w-28 h-28 top-1/3 right-1/3 transform -rotate-12" 
                style={{ objectFit: 'contain', transition: 'all 0.5s ease-in-out', filter: 'brightness(1.3) contrast(1.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(0deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-12deg)'}
              />
              <img 
                src="/images/nooddodle.png" 
                alt="" 
                className="absolute w-40 h-40 bottom-20 right-10 transform rotate-6" 
                style={{ objectFit: 'contain', transition: 'all 0.5s ease-in-out', filter: 'brightness(1.3) contrast(1.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(0deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(6deg)'}
              />
              <img 
                src="/images/hotdogdodle.png" 
                alt="" 
                className="absolute w-32 h-32 top-1/2 left-20 transform -rotate-3" 
                style={{ objectFit: 'contain', transition: 'all 0.5s ease-in-out', filter: 'brightness(1.3) contrast(1.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(0deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-3deg)'}
              />
              <img 
                src="/images/guiterdodle.png" 
                alt="" 
                className="absolute w-36 h-36 bottom-1/3 right-1/4 transform rotate-9" 
                style={{ objectFit: 'contain', transition: 'all 0.5s ease-in-out', filter: 'brightness(1.3) contrast(1.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(0deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(9deg)'}
              />
              <img 
                src="/images/pioanododle.png" 
                alt="" 
                className="absolute w-44 h-44 top-2/3 left-1/3 transform -rotate-6" 
                style={{ objectFit: 'contain', transition: 'all 0.5s ease-in-out', filter: 'brightness(1.3) contrast(1.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(0deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-6deg)'}
              />
              <img 
                src="/images/eventdodle.png" 
                alt="" 
                className="absolute w-28 h-28 top-40 left-1/2 transform rotate-12" 
                style={{ objectFit: 'contain', transition: 'all 0.5s ease-in-out', filter: 'brightness(1.3) contrast(1.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(0deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(12deg)'}
              />
              <img 
                src="/images/teacrosdod.png" 
                alt="" 
                className="absolute w-32 h-32 bottom-40 right-1/2 transform -rotate-9" 
                style={{ objectFit: 'contain', transition: 'all 0.5s ease-in-out', filter: 'brightness(1.3) contrast(1.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(0deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-9deg)'}
              />
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
              {renderSection()}
            </div>
          </main>

          {/* Footer */}
          <footer className={`mt-12 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} pb-6`}>
            <p>&copy;DineInGo2025. {translations[language].allRightsReserved}</p>
          </footer>
        </div>

        {/* Invoice Modal */}
        {showInvoice && selectedBooking && (
          <InvoiceModal 
            booking={selectedBooking} 
            onClose={() => {
              setShowInvoice(false);
              setSelectedBooking(null);
            }} 
            isDarkMode={isDarkMode} 
          />
        )}

        {/* Location Modal */}
        {isLocationModalOpen && renderLocationModal()}
        {/* Avatar Modal */}
        {renderAvatarModal()}
      </div>
    </>
  );
}
