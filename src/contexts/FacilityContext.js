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
      
      // Get facilities the user has access to
      const response = await axios.get(`${API_BASE_URL}/api/facility-access/my_access/`);
      
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
      
      setFacilities(accessibleFacilities);
      
      // Don't auto-select any facility - let users choose via drill-down
      
    } catch (error) {
      console.error('Error fetching user facilities:', error);
      setError('Failed to load your accessible facilities');
    } finally {
      setLoading(false);
    }
  };

  const selectFacility = (facilityId) => {
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
