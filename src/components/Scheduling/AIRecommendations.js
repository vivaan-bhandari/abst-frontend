import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  SmartToy as AIIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useFacility } from '../../contexts/FacilityContext';

const AIRecommendations = ({ onDataChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [weeklyRecommendations, setWeeklyRecommendations] = useState([]);
  const [staffingRequirements, setStaffingRequirements] = useState({});
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [applyingRecommendations, setApplyingRecommendations] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showWeekly, setShowWeekly] = useState(true);
  
  

  // Use global facility context
  const { selectedFacility } = useFacility();

  useEffect(() => {
    // Ensure authentication token is set for axios requests
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    }
    
         if (selectedFacility) {
       fetchSections();
       fetchAIInsights();
       fetchWeeklyRecommendations();
     }
  }, [selectedFacility]);

  // Refresh data when facility changes
  useEffect(() => {
    if (selectedFacility) {
      fetchAIInsights();
      setLastUpdated(new Date().toISOString());
    }
  }, [selectedFacility]);

  const fetchSections = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/scheduling/ai-recommendations/facility_sections/?facility=${selectedFacility}`
      );
      setSections(response.data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchAIInsights = async () => {
    if (!selectedFacility) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/scheduling/ai-recommendations/insights/?facility=${selectedFacility}&days_back=30`
      );
      setInsights(response.data);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setError('Failed to fetch AI insights');
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftRecommendations = async () => {
    if (!selectedFacility) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        facility: selectedFacility,
        date: targetDate
      });
      
      if (selectedSection) {
        params.append('section', selectedSection);
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/api/scheduling/ai-recommendations/shift_recommendations/?${params}`
      );
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching shift recommendations:', error);
      setError('Failed to fetch shift recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyRecommendations = async () => {
    if (!selectedFacility) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        facility: selectedFacility
      });
      
      if (selectedSection) {
        params.append('section', selectedSection);
      }
      
      console.log('Fetching weekly recommendations with params:', params.toString());
      console.log('API URL:', `${API_BASE_URL}/api/scheduling/ai-recommendations/weekly_recommendations/?${params}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/scheduling/ai-recommendations/weekly_recommendations/?${params}`
      );
      
      console.log('Weekly recommendations response:', response.data);
      setWeeklyRecommendations(response.data.weekly_recommendations || []);
      console.log('Set weekly recommendations:', response.data.weekly_recommendations || []);
    } catch (error) {
      console.error('Error fetching weekly recommendations:', error);
      setError('Failed to fetch weekly recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffingRequirements = async () => {
    if (!selectedFacility) return;
    
    try {
      const params = new URLSearchParams({
        facility: selectedFacility,
        date: targetDate
      });
      
      if (selectedSection) {
        params.append('section', selectedSection);
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/api/scheduling/ai-recommendations/staffing_requirements/?${params}`
      );
      setStaffingRequirements(response.data.staffing_requirements || {});
    } catch (error) {
      console.error('Error fetching staffing requirements:', error);
    }
  };





  const applyRecommendations = async () => {
    if (!selectedFacility) return;
    
    setApplyingRecommendations(true);
    setError(null);
    
    try {
      const requestData = {
        date: targetDate,
        facility: selectedFacility
      };
      
      if (selectedSection) {
        requestData.section = selectedSection;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/scheduling/ai-recommendations/apply_recommendations/?facility=${selectedFacility}`,
        requestData
      );
      
      if (response.data.success_count > 0) {
        setError(null);
        // Refresh recommendations and notify parent component
        fetchShiftRecommendations();
        if (onDataChange) onDataChange();
      }
      
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Applied ${response.data.success_count} recommendations. Errors: ${response.data.errors.join(', ')}`);
      }
      
    } catch (error) {
      console.error('Error applying recommendations:', error);
      setError('Failed to apply AI recommendations');
    } finally {
      setApplyingRecommendations(false);
    }
  };

  const applyWeeklyRecommendations = async () => {
    console.log('applyWeeklyRecommendations called');
    console.log('selectedFacility:', selectedFacility);
    console.log('weeklyRecommendations:', weeklyRecommendations);
    
    if (!selectedFacility) {
      console.log('No facility selected, returning');
      return;
    }
    
    if (weeklyRecommendations.length === 0) {
      console.log('No weekly recommendations to apply');
      setError('No weekly recommendations available to apply');
      return;
    }
    
    setApplyingRecommendations(true);
    setError(null);
    
    try {
      const requestData = {
        facility: selectedFacility,
        weekly: true,
        target_date: targetDate
      };
      
      if (selectedSection) {
        requestData.section = selectedSection;
      }
      
      console.log('Making API call to apply weekly recommendations');
      console.log('Request data:', requestData);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/scheduling/ai-recommendations/apply_weekly_recommendations/?facility=${selectedFacility}`,
        requestData
      );
      
      console.log('API response:', response.data);
      
      if (response.data.success_count > 0) {
        setError(null);
        console.log(`Successfully applied ${response.data.success_count} recommendations`);
        // Refresh weekly recommendations and notify parent component
        fetchWeeklyRecommendations();
        if (onDataChange) onDataChange();
      }
      
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Applied ${response.data.success_count} weekly recommendations. Errors: ${response.data.errors.join(', ')}`);
      }
      
    } catch (error) {
      console.error('Error applying weekly recommendations:', error);
      console.error('Error response:', error.response);
      setError('Failed to apply weekly AI recommendations');
    } finally {
      setApplyingRecommendations(false);
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getCareIntensityColor = (intensity) => {
    switch (intensity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (!selectedFacility) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          Please select a facility to view AI recommendations
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AIIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            AI Shift Recommendations
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAIInsights}
          disabled={loading}
        >
          Refresh AI Analysis
        </Button>
      </Box>

             

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* AI Insights Overview */}
      {insights && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            AI Facility Insights
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Residents
                  </Typography>
                  <Typography variant="h4" component="div">
                    {insights.staffing_metrics?.total_staff || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Care Hours
                  </Typography>
                  <Typography variant="h4" component="div">
                    {insights.adl_metrics?.total_hours || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Acuity Score
                  </Typography>
                  <Typography variant="h4" component="div">
                    {insights.adl_metrics?.average_minutes_per_adl || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Staffing Efficiency
                  </Typography>
                  <Typography variant="h4" component="div">
                    {insights.staffing_metrics?.staff_to_resident_ratio || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Care Intensity Distribution */}
          {insights.care_intensity_distribution && Object.keys(insights.care_intensity_distribution).length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Care Intensity Distribution
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {Object.entries(insights.care_intensity_distribution).map(([intensity, count]) => (
                  <Chip
                    key={intensity}
                    label={`${intensity.charAt(0).toUpperCase() + intensity.slice(1)}: ${count}`}
                    color={getCareIntensityColor(intensity)}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* AI Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                AI Recommendations
              </Typography>
              <Box sx={{ display: 'flex', direction: 'column', gap: 1 }}>
                {insights.recommendations.map((rec, index) => (
                  <Alert key={index} severity="info" icon={<LightbulbIcon />}>
                    {rec}
                  </Alert>
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Shift Recommendations */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon color="primary" />
          AI Shift Recommendations
        </Typography>

        {/* Controls */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Target Date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Section (Optional)</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                label="Section (Optional)"
              >
                <MenuItem value="">
                  <em>All Sections</em>
                </MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchWeeklyRecommendations}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <ScheduleIcon />}
            >
              {loading ? 'Analyzing...' : 'Get Weekly Recommendations'}
            </Button>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchStaffingRequirements}
              disabled={loading}
            >
              Staffing Analysis
            </Button>
          </Grid>
        </Grid>

        {/* Week Range Display */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="primary.main" fontWeight="bold" gutterBottom>
              AI Recommendations Week
            </Typography>
            <Typography variant="h6" color="primary.dark">
              {showWeekly ? 
                'Weekly View: Monday - Sunday' : 
                `Daily View: ${new Date(targetDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}`
              }
            </Typography>
            <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
              {showWeekly ? 
                'Get AI-powered shift recommendations for the entire week' : 
                'Get AI-powered shift recommendations for a specific day'
              }
            </Typography>
          </Box>
        </Paper>

        {/* Weekly vs Daily Toggle */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant={showWeekly ? "contained" : "outlined"}
            onClick={() => setShowWeekly(true)}
            sx={{ mr: 2 }}
          >
            Weekly View
          </Button>
          <Button
            variant={!showWeekly ? "contained" : "outlined"}
            onClick={() => setShowWeekly(false)}
          >
            Daily View
          </Button>
        </Box>

        {/* Weekly Recommendations Display */}
        {showWeekly && weeklyRecommendations.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Weekly Shift Recommendations by Day
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={applyWeeklyRecommendations}
                disabled={applyingRecommendations}
              >
                {applyingRecommendations ? 'Applying...' : 'Apply All Weekly Recommendations'}
              </Button>
            </Box>
            
            {/* Weekly Timetable Grid */}
            <Paper sx={{ p: 2, overflow: 'auto' }}>
              <Box sx={{ minWidth: 800 }}>
                {/* Header Row with Dates */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '120px repeat(7, 1fr)',
                  gap: 1,
                  mb: 1,
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1
                }}>
                  <Box sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Shifts</Box>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <Box key={day} sx={{ 
                      fontWeight: 'bold', 
                      textAlign: 'center',
                      color: 'text.secondary',
                      fontSize: '0.9rem'
                    }}>
                      {day.slice(0, 3)}
                    </Box>
                  ))}
                </Box>
                
                {/* Shift Rows */}
                {['day', 'swing', 'noc'].map(shiftType => (
                  <Box key={shiftType} sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '120px repeat(7, 1fr)',
                    gap: 1,
                    mb: 1,
                    alignItems: 'stretch',
                    minHeight: 120,
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}>
                    {/* Shift Label */}
                    <Box sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      height: 100,
                      justifyContent: 'center'
                    }}>
                      {shiftType.toUpperCase()}
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%',
                        backgroundColor: shiftType === 'day' ? '#4caf50' : 
                                       shiftType === 'swing' ? '#ff9800' : '#9c27b0'
                      }} />
                    </Box>
                    
                    {/* Daily Recommendations */}
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const dayShort = day.slice(0, 3);
                      // Fix: Backend returns day_name like 'Monday', 'Tuesday', etc.
                      const dayRecommendation = weeklyRecommendations.find(rec => 
                        rec.day_name === day
                      );
                      
                      if (dayRecommendation) {
                        // Find the specific shift type within this day's shifts
                        const shiftRecommendation = dayRecommendation.shifts.find(shift => 
                          shift.shift_type.toLowerCase() === shiftType
                        );
                        
                        if (shiftRecommendation) {
                          return (
                            <Box key={day} sx={{ 
                              border: '1px solid #e0e0e0',
                              borderRadius: 1,
                              p: 1.5,
                              backgroundColor: '#f8f9fa',
                              height: 100,
                              position: 'relative'
                            }}>
                              {/* Staff Count */}
                              <Typography variant="h6" color="primary.main" sx={{ mb: 0.5 }}>
                                {shiftRecommendation.recommended_staff}
                              </Typography>
                              
                              {/* Time Range */}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {shiftRecommendation.start_time} - {shiftRecommendation.end_time}
                              </Typography>
                              
                              {/* Reason */}
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ 
                                fontSize: '0.7rem',
                                lineHeight: 1.2,
                                mt: 0.5
                              }}>
                                {shiftRecommendation.reason}
                              </Typography>
                            </Box>
                          );
                        }
                      }
                      
                      // No recommendation for this day/shift combination
                      return (
                        <Box key={day} sx={{ 
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          p: 1.5,
                          backgroundColor: '#fafafa',
                          height: 100,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'text.secondary'
                        }}>
                          No data
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Paper>
            
            {/* Weekly Summary */}
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>Weekly Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {weeklyRecommendations.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Total Recommendations</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {weeklyRecommendations.reduce((sum, dayRec) => 
                        sum + dayRec.shifts.reduce((daySum, shift) => 
                          daySum + (shift.recommended_staff * 8), 0
                        ), 0
                      ).toFixed(1)}h
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Total Care Hours</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {weeklyRecommendations.reduce((sum, dayRec) => 
                        sum + dayRec.shifts.reduce((daySum, shift) => 
                          daySum + shift.recommended_staff, 0
                        ), 0
                      )}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Total Staff Required</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {weeklyRecommendations.length > 0 ? 
                        (weeklyRecommendations.reduce((sum, dayRec) => 
                          sum + dayRec.shifts.length, 0
                        ) / weeklyRecommendations.length).toFixed(0) : 0}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Avg Confidence</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* Daily Recommendations Display */}
        {!showWeekly && recommendations.length > 0 && (
          <Box>
            {/* Prominent Date Header */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold" gutterBottom>
                  AI Recommendations for {new Date(targetDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Typography variant="body1" color="primary.dark">
                  {recommendations.length} shift recommendations generated
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                {recommendations.length} shift recommendations for {targetDate}
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={applyRecommendations}
                disabled={applyingRecommendations}
              >
                {applyingRecommendations ? 'Applying...' : 'Apply All Recommendations'}
              </Button>
            </Box>

            {/* Daily Timetable Grid */}
            <Paper sx={{ p: 2, overflow: 'auto', mb: 3 }}>
              <Box sx={{ minWidth: 600 }}>
                {/* Header Row */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '150px 1fr',
                  gap: 2,
                  mb: 2,
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1
                }}>
                  <Box sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Shift Type</Box>
                  <Box sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Recommendations</Box>
                </Box>
                
                {/* Shift Rows */}
                {['day', 'swing', 'noc'].map(shiftType => {
                  const shiftRecommendations = recommendations.filter(rec => 
                    rec.shift_type.toLowerCase() === shiftType
                  );
                  
                  if (shiftRecommendations.length === 0) return null;
                  
                  return (
                    <Box key={shiftType} sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '150px 1fr',
                      gap: 2,
                      mb: 2,
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}>
                      {/* Shift Label */}
                      <Box sx={{ 
                        fontWeight: 'bold',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1
                      }}>
                        {shiftType.toUpperCase()}
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%',
                          backgroundColor: shiftType === 'day' ? '#4caf50' : 
                                         shiftType === 'swing' ? '#ff9800' : '#9c27b0'
                        }} />
                      </Box>
                      
                      {/* Recommendations Grid */}
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: 1
                      }}>
                        {shiftRecommendations.map((rec, index) => (
                          <Card key={index} sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="body2" fontWeight="bold" color="text.primary">
                                {rec.template_name || 'Custom'}
                              </Typography>
                              <Chip
                                label={`${(rec.confidence_score * 100).toFixed(0)}%`}
                                color={getConfidenceColor(rec.confidence_score)}
                                size="small"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                            
                            <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                              <strong>Time:</strong> {rec.recommended_start_time} - {rec.recommended_end_time}
                            </Typography>
                            
                            <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                              <strong>Care Hours:</strong> {rec.care_hours}h
                            </Typography>
                            
                            <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                              <strong>Staff:</strong> {rec.staff_required} | <strong>Residents:</strong> {rec.resident_count}
                            </Typography>
                            
                            {rec.high_acuity_count > 0 && (
                              <Chip
                                label={`${rec.high_acuity_count} High Acuity`}
                                color="error"
                                size="small"
                                sx={{ mt: 0.5, fontSize: '0.6rem' }}
                              />
                            )}
                          </Card>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>

            {/* Daily Summary */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Daily Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {recommendations.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Total Recommendations</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {recommendations.reduce((sum, rec) => sum + rec.care_hours, 0).toFixed(1)}h
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Total Care Hours</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {recommendations.reduce((sum, rec) => sum + rec.staff_required, 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Total Staff Required</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {(recommendations.reduce((sum, rec) => sum + (rec.confidence_score * 100), 0) / recommendations.length).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Avg Confidence</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Detailed Cards (Fallback) */}
            <Grid container spacing={2}>
              {recommendations.map((rec, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="div">
                          {rec.shift_type.toUpperCase()}
                        </Typography>
                        <Chip
                          label={`${(rec.confidence_score * 100).toFixed(0)}%`}
                          color={getConfidenceColor(rec.confidence_score)}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {rec.template_name}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Time:</strong> {rec.recommended_start_time} - {rec.recommended_end_time}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Staff Required:</strong> {rec.staff_required}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Care Hours:</strong> {rec.care_hours}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Residents:</strong> {rec.resident_count}
                      </Typography>
                      
                      {rec.high_acuity_count > 0 && (
                        <Chip
                          label={`${rec.high_acuity_count} High Acuity`}
                          color="error"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="body2" color="textSecondary">
                        <strong>AI Reasoning:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {rec.reasoning}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Staffing Requirements */}
        {Object.keys(staffingRequirements).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Staffing Requirements Analysis
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(staffingRequirements).map(([shiftType, reqs]) => (
                <Grid item xs={12} md={4} key={shiftType}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div" sx={{ textTransform: 'capitalize' }}>
                        {shiftType} Shift
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Total Care Hours:</strong> {reqs.total_care_hours}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Base Staff Required:</strong> {reqs.base_staff_required}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Acuity Adjustment:</strong> +{reqs.acuity_adjustment}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Total Staff Recommended:</strong> {reqs.total_staff_recommended}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Residents:</strong> {reqs.resident_count}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>High Acuity:</strong> {reqs.high_acuity_count}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && recommendations.length === 0 && weeklyRecommendations.length === 0 && Object.keys(staffingRequirements).length === 0 && (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" color="textSecondary">
              Click "Get Recommendations" to analyze your facility's ADL data and get AI-powered shift suggestions.
            </Typography>
          </Box>
                 )}
       </Paper>

      {/* Last Updated */}
      {lastUpdated && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="caption" color="textSecondary">
            Last AI analysis: {new Date(lastUpdated).toLocaleString()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AIRecommendations;
