import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  PlayArrow as GenerateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const AISmartScheduler = ({ selectedFacility, onScheduleGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateSmartSchedule = async () => {
    if (!selectedFacility) {
      setError('Please select a facility first');
      return;
    }

    setLoading(true);
    setError(null);
    setGenerating(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/scheduling/smart-schedule/`, {
        facility_id: selectedFacility,
        target_date: new Date().toISOString().split('T')[0]
      });

      if (response.data.success) {
        setSchedule(response.data.data);
        setShowScheduleDialog(true);
        if (onScheduleGenerated) {
          onScheduleGenerated(response.data.data);
        }
      } else {
        setError('Failed to generate smart schedule');
      }
    } catch (error) {
      console.error('Error generating smart schedule:', error);
      setError(error.response?.data?.error || 'Failed to generate smart schedule');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const applySchedule = async () => {
    if (!schedule || !selectedFacility) {
      setError('No schedule to apply or facility not selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/scheduling/apply-smart-schedule/`, {
        facility_id: selectedFacility,
        schedule: schedule.schedule  // Send just the schedule array, not the entire object
      });

      if (response.data.success) {
        // Show success message
        const data = response.data.data;
        const message = `✅ Schedule applied successfully!\n\n` +
          `📅 Shifts: ${data.created_shifts} new, ${data.updated_shifts} updated\n` +
          `👥 Assignments: ${data.created_assignments} created\n\n` +
          `${data.message}`;
        alert(message);
        
        // Close dialog and reset
        setShowScheduleDialog(false);
        setSchedule(null);
        
        // Notify parent component about the change
        if (onScheduleGenerated) {
          onScheduleGenerated(response.data.data);
        }
      } else {
        setError(response.data.error || 'Failed to apply schedule');
      }
    } catch (error) {
      console.error('Error applying smart schedule:', error);
      setError(error.response?.data?.error || 'Failed to apply smart schedule');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (!selectedFacility) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Please select a facility to use the AI Smart Scheduler
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Main AI Scheduler Interface */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AIIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h2" gutterBottom>
              AI Smart Scheduler
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Generate optimal weekly schedules using advanced AI algorithms
            </Typography>
          </Box>
        </Box>

        {/* AI Capabilities Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Smart Optimization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI analyzes staff skills, availability, and preferences to create the perfect schedule
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <CheckIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Conflict Resolution
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Automatically detects and resolves scheduling conflicts before they happen
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <InfoIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Intelligent Reasoning
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Provides detailed explanations for every scheduling decision made
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Generate Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={generateSmartSchedule}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <GenerateIcon />}
            sx={{
              py: 2,
              px: 4,
              fontSize: '1.2rem',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
              }
            }}
          >
            {loading ? 'Generating Smart Schedule...' : '🚀 Generate AI Schedule'}
          </Button>
          
          {generating && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                AI is analyzing your data and creating the perfect schedule...
              </Typography>
              <LinearProgress sx={{ mt: 1 }} />
            </Box>
          )}
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Schedule Results Dialog */}
      <Dialog 
        open={showScheduleDialog} 
        onClose={() => setShowScheduleDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AIIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">
              AI-Generated Smart Schedule
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {schedule && (
            <Box>
              {/* Schedule Summary */}
              <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Schedule Overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {schedule.reasoning}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color={getConfidenceColor(schedule.confidence_score)}>
                        {schedule.confidence_score}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Confidence Score
                      </Typography>
                      <Chip 
                        label={getConfidenceLabel(schedule.confidence_score)}
                        color={getConfidenceColor(schedule.confidence_score)}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Staff Utilization */}
              {schedule.staff_utilization && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Staff Utilization Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {schedule.staff_utilization.total_staff}
                        </Typography>
                        <Typography variant="body2">Total Staff</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {schedule.staff_utilization.assigned_staff}
                        </Typography>
                        <Typography variant="body2">Assigned</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {schedule.staff_utilization.utilization_rate.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">Utilization</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {Object.keys(schedule.staff_utilization.role_breakdown).length}
                        </Typography>
                        <Typography variant="body2">Roles Used</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Weekly Schedule */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Weekly Schedule Breakdown
                </Typography>
                {schedule.schedule.map((day, dayIndex) => (
                  <Accordion key={dayIndex} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {day.day_name} - {new Date(day.date).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ ml: 'auto' }}>
                          {Object.values(day.shifts).map((shift, shiftIndex) => (
                            <Chip
                              key={shiftIndex}
                              label={`${shift.status === 'optimized' ? '✓' : '⚠'} ${shift.coverage_percentage?.toFixed(0) || 0}%`}
                              color={shift.status === 'optimized' ? 'success' : 'warning'}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {Object.entries(day.shifts).map(([shiftType, shiftData]) => (
                          <Grid item xs={12} md={4} key={shiftType}>
                            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                {shiftType.toUpperCase()} Shift
                              </Typography>
                              {shiftData.status === 'optimized' ? (
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Template: {shiftData.template_name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Required: {shiftData.required_staff} | Assigned: {shiftData.assigned_staff.length}
                                  </Typography>
                                  {shiftData.assigned_staff.map((staff, staffIndex) => (
                                    <Box key={staffIndex} sx={{ mt: 1, p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                                      <Typography variant="body2" fontWeight="bold">
                                        {staff.name} ({staff.role})
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {staff.assignment_reason}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {shiftData.status === 'no_template' ? 'No template available' : 'Not optimized'}
                                </Typography>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Paper>

              {/* Conflict Resolution */}
              {schedule.conflict_resolution && schedule.conflict_resolution.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Conflicts Resolved
                  </Typography>
                  {schedule.conflict_resolution.map((conflict, index) => (
                    <Alert key={index} severity="info" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{conflict.type}:</strong> {conflict.resolution}
                      </Typography>
                    </Alert>
                  ))}
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScheduleDialog(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={applySchedule}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {loading ? 'Applying Schedule...' : 'Apply This Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AISmartScheduler;
