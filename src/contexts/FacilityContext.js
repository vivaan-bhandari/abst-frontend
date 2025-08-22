import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const FacilityContext = createContext();

export const useFacility = () => {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error('useFacility must be used within a FacilityProvider');
  }
  return context;
};

export const FacilityProvider = ({ children }) => {
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's accessible facilities on mount
  useEffect(() => {
    fetchFacilities();
  }, []);

  // Don't auto-select any facility - let users choose via drill-down
  // useEffect(() => {
  //   if (facilities.length > 0 && !selectedFacility) {
  //     setSelectedFacility(facilities[0].id);
  //   }
  // }, [facilities, selectedFacility]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching facilities from:', `${API_BASE_URL}/api/facility-access/my_access/`);
      console.log('Current API base URL:', API_BASE_URL);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      console.log('Authentication token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.log('No authentication token found, trying fallback');
        // Try to get all facilities without authentication
        const fallbackResponse = await axios.get(`${API_BASE_URL}/api/facilities/`);
        const allFacilities = fallbackResponse.data.results || fallbackResponse.data || [];
        console.log('Fallback facilities (no auth):', allFacilities);
        
        const processedFacilities = allFacilities.map(facility => ({
          id: facility.id,
          name: facility.name,
          address: facility.address,
          city: facility.city,
          state: facility.state,
          zip_code: facility.zip_code,
          phone: facility.phone,
          email: facility.email,
          facility_type: facility.facility_type,
          facility_id: facility.facility_id,
          admin_name: facility.admin_name
        }));
        
        setFacilities(processedFacilities);
        return;
      }
      
      // Get facilities the user has access to
      const response = await axios.get(`${API_BASE_URL}/api/facility-access/my_access/`);
      
      console.log('Facility access response:', response.data);
      
      const userFacilities = response.data || [];
      
      // Extract facility information from the access list
      const accessibleFacilities = userFacilities.map(access => ({
        id: access.facility.id,
        name: access.facility.name,
        address: access.facility.address,
        city: access.facility.city,
        state: access.facility.state,
        zip_code: access.facility.zip_code,
        phone: access.facility.phone,
        email: access.facility.email,
        facility_type: access.facility.facility_type,
        facility_id: access.facility.facility_id,
        admin_name: access.facility.admin_name
      }));
      
      console.log('Processed facilities:', accessibleFacilities);
      
      setFacilities(accessibleFacilities);
      
      // Don't auto-select any facility - let users choose via drill-down
      
    } catch (error) {
      console.error('Error fetching user facilities:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('Failed to load your accessible facilities');
      
      // Fallback: try to get all facilities if the user access call fails
      try {
        console.log('Trying fallback: fetching all facilities');
        const fallbackResponse = await axios.get(`${API_BASE_URL}/api/facilities/`);
        const allFacilities = fallbackResponse.data.results || fallbackResponse.data || [];
        console.log('Fallback facilities:', allFacilities);
        
        const processedFacilities = allFacilities.map(facility => ({
          id: facility.id,
          name: facility.name,
          address: facility.address,
          city: facility.city,
          state: facility.state,
          zip_code: facility.zip_code,
          phone: facility.phone,
          email: facility.email,
          facility_type: facility.facility_type,
          facility_id: facility.facility_id,
          admin_name: facility.admin_name
        }));
        
        setFacilities(processedFacilities);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        console.error('Fallback error details:', fallbackError.response?.data || fallbackError.message);
        // Set some default facilities for testing
        setFacilities([
          { id: 1, name: 'Buena Vista', city: 'San Diego', state: 'CA' },
          { id: 2, name: 'Murray Highland', city: 'San Diego', state: 'CA' },
          { id: 3, name: 'La Posada Senior Living', city: 'San Diego', state: 'CA' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectFacility = (facilityId) => {
    console.log('Selecting facility:', facilityId);
    setSelectedFacility(facilityId);
  };

  const refreshFacilities = () => {
    fetchFacilities();
  };

  const getCurrentFacility = () => {
    return facilities.find(f => f.id === selectedFacility) || null;
  };

  const value = {
    selectedFacility,
    facilities,
    loading,
    error,
    selectFacility,
    refreshFacilities,
    getCurrentFacility,
    setError
  };

  return (
    <FacilityContext.Provider value={value}>
      {children}
    </FacilityContext.Provider>
  );
};
