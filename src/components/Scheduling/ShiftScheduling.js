import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import StaffManagement from './StaffManagement';
import ShiftTemplates from './ShiftTemplates';
import StaffAssignments from './StaffAssignments';
import PlannerGrid from './PlannerGrid';
import StaffAvailability from './StaffAvailability';
import AIRecommendations from './AIRecommendations';
import AISmartScheduler from './AISmartScheduler';
import SchedulingChat from './SchedulingChat';
import { useFacility } from '../../contexts/FacilityContext';

const ShiftScheduling = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalShifts: 0,
    totalAssignments: 0,
    understaffedShifts: 0,
  });
  
  // Use global facility context
  const { selectedFacility, facilities, selectFacility, loading: facilitiesLoading, error: facilitiesError } = useFacility();

  useEffect(() => {
    console.log('ShiftScheduling - Facilities:', facilities);
    console.log('ShiftScheduling - Selected Facility:', selectedFacility);
    console.log('ShiftScheduling - Loading:', facilitiesLoading);
    console.log('ShiftScheduling - Error:', facilitiesError);
    
    if (selectedFacility) {
      fetchStats();
    }
  }, [selectedFacility, facilities, facilitiesLoading, facilitiesError]);

  const fetchStats = async () => {
    if (!selectedFacility) return;
    
    setLoading(true);
    setError(null);
    try {
      const [staffResponse, shiftsResponse, assignmentsResponse, understaffedResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/scheduling/staff/?facility=${selectedFacility}`),
        axios.get(`${API_BASE_URL}/api/scheduling/shifts/?facility=${selectedFacility}`),
        axios.get(`${API_BASE_URL}/api/scheduling/staff-assignments/?facility=${selectedFacility}`),
        axios.get(`${API_BASE_URL}/api/scheduling/shifts/understaffed/?facility=${selectedFacility}`),
      ]);

      setStats({
        totalStaff: staffResponse.data.count || 0,
        totalShifts: shiftsResponse.data.count || 0,
        totalAssignments: assignmentsResponse.data.count || 0,
        understaffedShifts: understaffedResponse.data.length || 0,
      });
    } catch (error) {
      console.error('Error fetching scheduling stats:', error);
      setError('Failed to load scheduling statistics');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  // Create a memoized callback that doesn't cause unnecessary re-renders
  const handleDataChange = React.useCallback(() => {
    // Only fetch stats if we're not currently loading
    if (!loading) {
      fetchStats();
    }
  }, [loading]); // Remove tab dependency since we only call this from StaffManagement

  // Render all components but only show the active one
  const renderTabContent = () => {
    if (!selectedFacility) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Please select a facility to manage scheduling
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Choose a facility from the dropdown above to access scheduling features
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* Render all components but only show the active one */}
        <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
          <StaffManagement onDataChange={handleDataChange} selectedFacility={selectedFacility} />
        </Box>
        <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
          <ShiftTemplates selectedFacility={selectedFacility} />
        </Box>
        <Box sx={{ display: tab === 2 ? 'block' : 'none' }}>
          <StaffAssignments selectedFacility={selectedFacility} />
        </Box>
        <Box sx={{ display: tab === 3 ? 'block' : 'none' }}>
          <PlannerGrid selectedFacility={selectedFacility} />
        </Box>
        <Box sx={{ display: tab === 4 ? 'block' : 'none' }}>
          <StaffAvailability selectedFacility={selectedFacility} />
        </Box>
        <Box sx={{ display: tab === 5 ? 'block' : 'none' }}>
          <AIRecommendations onDataChange={handleDataChange} />
        </Box>
        <Box sx={{ display: tab === 6 ? 'block' : 'none' }}>
          <AISmartScheduler selectedFacility={selectedFacility} onDataChange={handleDataChange} />
        </Box>
      </Box>
    );
  };

  if (loading || facilitiesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!selectedFacility) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Select a Facility
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Choose a facility from the dropdown above to manage scheduling
          </Typography>
          
          {facilitiesLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Loading facilities...
              </Typography>
            </Box>
          ) : facilitiesError ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {facilitiesError}
              </Alert>
              <Button variant="outlined" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Box>
          ) : facilities.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Alert severity="info">
                You don't have access to any facilities yet. Please contact an administrator to request access.
              </Alert>
              <Button variant="outlined" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <FormControl fullWidth sx={{ maxWidth: 400 }}>
                <InputLabel>Select Facility</InputLabel>
                <Select
                  value={selectedFacility || ''}
                  onChange={(e) => selectFacility(e.target.value)}
                  label="Select Facility"
                >
                  {facilities.map((facility) => (
                    <MenuItem key={facility.id} value={facility.id}>
                      {facility.name}
                      {facility.city && facility.state && ` - ${facility.city}, ${facility.state}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                {facilities.length} facility{facilities.length !== 1 ? 's' : ''} available
              </Typography>
              <Button variant="outlined" size="small" onClick={() => window.location.reload()}>
                Refresh Facilities
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <ScheduleIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Shift Scheduling
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {facilitiesError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
            {facilitiesError}
          </Alert>
        )}

        {/* Facility Selector */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Facility
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Choose a facility to manage its scheduling, staff, and shifts
          </Typography>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ maxWidth: 400 }}>
              <InputLabel>Select Facility</InputLabel>
              <Select
                value={selectedFacility}
                onChange={(e) => selectFacility(e.target.value)}
                label="Select Facility"
                disabled={facilities.length === 0}
              >
                {facilities.length === 0 ? (
                  <MenuItem disabled>
                    No facilities available
                  </MenuItem>
                ) : (
                  facilities.map((facility) => (
                    <MenuItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            {facilities.length === 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                You don't have access to any facilities yet. Please contact an administrator to request access.
              </Alert>
            )}
          </Box>
        </Paper>

        {/* Statistics Cards */}
        {selectedFacility && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Staff
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalStaff}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Shifts
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalShifts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Assignments
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalAssignments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Understaffed Shifts
                </Typography>
                <Typography variant="h4" component="div" color="error">
                  {stats.understaffedShifts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        )}

        {/* Main Content */}
        {selectedFacility && (
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={handleTabChange} aria-label="scheduling tabs">
                <Tab label="Staff Management" icon={<PeopleIcon />} />
                <Tab label="Shift Templates" icon={<AssignmentIcon />} />
                <Tab label="Staff Assignments" icon={<ScheduleIcon />} />
                <Tab label="Planner (Grid)" icon={<ScheduleIcon />} />
                <Tab label="Staff Availability" icon={<PeopleIcon />} />
                <Tab label="AI Recommendations" icon={<AssessmentIcon />} />
                <Tab label="AI Smart Scheduler" icon={<AIIcon />} />
              </Tabs>
            </Box>
            <Box sx={{ p: 3 }}>
              {renderTabContent()}
            </Box>
          </Paper>
        )}
      </Container>
      
      {/* Chat Assistant */}
      {selectedFacility && <SchedulingChat selectedFacility={selectedFacility} />}
    </Box>
  );
};

export default ShiftScheduling;
