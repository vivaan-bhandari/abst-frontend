import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import WelcomeScreen from './components/Auth/WelcomeScreen';
import Dashboard from './components/Dashboard/Dashboard';
import FacilityPage from './components/Facility/FacilityPage';
import FacilitySectionDetails from './components/Facility/FacilitySectionDetails';
import AccessManagement from './components/Auth/AccessManagement';
import ResidentDetails from './components/Dashboard/ResidentDetails';
import ShiftScheduling from './components/Scheduling/ShiftScheduling';
import { FacilityProvider } from './contexts/FacilityContext';
import FacilityAccessRequest from './components/Auth/FacilityAccessRequest';
import axios from 'axios';

// Define User type inline since the types/user file doesn't exist
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  is_staff?: boolean;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAccessRequest, setShowAccessRequest] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setShowWelcome(false);
      // Set default auth header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
    }
  }, []);

  const handleLogin = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    setShowWelcome(false);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleRegister = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setAuthMode('login');
    setShowWelcome(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setShowWelcome(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear axios auth header
    delete axios.defaults.headers.common['Authorization'];
  };

  const handleSwitchToRegister = () => {
    setAuthMode('register');
    setShowWelcome(false);
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
    setShowWelcome(false);
  };

  // If not authenticated, show welcome screen, login, or register
  if (!user || !token) {
    if (showWelcome) {
      return (
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <WelcomeScreen 
            onLogin={handleSwitchToLogin} 
            onSignUp={handleSwitchToRegister} 
          />
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {authMode === 'login' ? (
          <Login onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />
        ) : (
          <Register onRegister={handleRegister} onSwitchToLogin={handleSwitchToLogin} />
        )}
      </Box>
    );
  }

  // If authenticated but no facility access, show access request
  if (showAccessRequest) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CssBaseline />
        <Box sx={{ flex: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FacilityAccessRequest 
            onRequestSubmitted={() => setShowAccessRequest(false)}
          />
        </Box>
      </Box>
    );
  }

  // Main authenticated app
  return (
    <FacilityProvider>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                user={user} 
                onLogout={handleLogout}
              />
            } 
          />
          <Route path="/facility/:facilityId" element={<FacilityPage />} />
          <Route path="/facility-section/:sectionId" element={<FacilitySectionDetails />} />
          <Route 
            path="/admin/access-management" 
            element={<AccessManagement />} 
          />
          <Route path="/resident/:residentId" element={<ResidentDetails />} />
          <Route path="/scheduling" element={<ShiftScheduling />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </FacilityProvider>
  );
}

export default App;
