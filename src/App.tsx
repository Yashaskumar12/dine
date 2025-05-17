import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import DashboardPage from './DashboardPage';
import RestaurantDetails from './pages/RestaurantDetails';
import ReservationPreview from './pages/ReservationPreview';
import TableSelection from './pages/TableSelection';
import ReservationDetailsPage from './pages/ReservationDetailsPage';
import TermsPage from './TermsPage';
import UserFeedbackForm from './components/UserFeedbackForm';
import DebugPage from './pages/DebugPage';
import FoodMenu from './pages/FoodMenu';
import { UserData, CityLocation } from './types';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    uid: '',
    email: '',
    displayName: '',
    name: '',
    photoURL: '',
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    phone: '',
    address: ''
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    // Clear user data
    setUserData({
      uid: '',
      email: '',
      displayName: '',
      name: '',
      photoURL: '',
      location: {
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India'
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      phone: '',
      address: ''
    });
  };

  return (
    <Router>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/feedback" element={<UserFeedbackForm />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route 
          path="/dashboard" 
          element={
            <DashboardPage 
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              userData={userData}
              setUserData={setUserData}
              handleLogout={handleLogout}
            />
          } 
        />
        <Route path="/restaurant/:id" element={<RestaurantDetails />} />
        <Route path="/restaurant/:id/preview" element={<ReservationPreview />} />
        <Route path="/restaurant/:id/table-selection" element={<TableSelection />} />
        <Route path="/restaurant/:id/reservation" element={<ReservationDetailsPage />} />
        <Route path="/restaurant/:id/menu" element={<FoodMenu />} />
      </Routes>
    </Router>
  );
};

export default App; 
