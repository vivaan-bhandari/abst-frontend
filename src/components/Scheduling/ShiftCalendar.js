import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Today as TodayIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const ShiftCalendar = ({ onDataChange, selectedFacility }) => {
  const [shifts, setShifts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [facilitySections, setFacilitySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [formData, setFormData] = useState({
    date: '',
    shift_template: '',
    section: '',
    notes: '',
  });

  useEffect(() => {
    if (selectedFacility) {
      fetchShifts();
      fetchTemplates();
      fetchFacilitySections();
    }
  }, [selectedFacility, currentDate, viewMode]);

  const fetchShifts = async () => {
    if (!selectedFacility) return;
    
    try {
      const startDate = getStartOfView();
      const endDate = getEndOfView();
      
      const response = await axios.get(
        `${API_BASE_URL}/api/scheduling/shifts/calendar/?start_date=${startDate}&end_date=${endDate}&facility=${selectedFacility}`
      );
      setShifts(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setError('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!selectedFacility) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scheduling/shift-templates/?facility=${selectedFacility}`);
      setTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchFacilitySections = async () => {
    if (!selectedFacility) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/facilitysections/?facility=${selectedFacility}`);
      setFacilitySections(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching facility sections:', error);
    }
  };

  const getStartOfView = () => {
    const date = new Date(currentDate);
    if (viewMode === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
    } else if (viewMode === 'month') {
      date.setDate(1);
    }
    return date.toISOString().split('T')[0];
  };

  const getEndOfView = () => {
    const date = new Date(currentDate);
    if (viewMode === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() + (6 - day));
    } else if (viewMode === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
    }
    return date.toISOString().split('T')[0];
  };

  const handleOpenDialog = (shift = null, specificDay = null) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        date: shift.date,
        shift_template: shift.template || '',
        section: shift.facility_section || '',
        notes: shift.notes || '',
      });
    } else {
      setEditingShift(null);
      const dateToUse = specificDay ? specificDay.toISOString().split('T')[0] : currentDate.toISOString().split('T')[0];
      setFormData({
        date: dateToUse,
        shift_template: '',
        section: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShift(null);
    setFormData({
      date: '',
      shift_template: '',
      section: '',
      notes: '',
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'shift_template') {
      const template = templates.find(t => t.id === value);
      if (template) {
        setFormData(prev => ({
          ...prev,
          start_time: template.start_time,
          end_time: template.end_time,
        }));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingShift) {
        await axios.put(`${API_BASE_URL}/api/scheduling/shifts/${editingShift.id}/`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/scheduling/shifts/`, formData);
      }
      handleCloseDialog();
      fetchShifts();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error saving shift:', error);
      setError('Failed to save shift');
    }
  };

  const handleDelete = async (shiftId) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/scheduling/shifts/${shiftId}/`);
        fetchShifts();
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error('Error deleting shift:', error);
        setError('Failed to delete shift');
      }
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const renderWeekView = () => {
    const startDate = new Date(getStartOfView());
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return (
      <Grid container spacing={2}>
        {days.map((day) => {
          const dayShifts = shifts.filter(shift => shift.date === day.toISOString().split('T')[0]);
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <Grid item xs={12} sm={6} md={1.7} key={day.toISOString()}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '200px', 
                  overflow: 'auto',
                  border: isToday ? '2px solid #1976d2' : '1px solid #e0e0e0'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* Day Header */}
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: isToday ? '#1976d2' : 'text.primary',
                        mb: 0.5
                      }}
                    >
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isToday ? '#1976d2' : 'text.secondary'
                      }}
                    >
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Typography>
                    {isToday && (
                      <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                        Today
                      </Typography>
                    )}
                  </Box>

                  {/* Shifts List */}
                  <Box sx={{ mb: 2, minHeight: '120px' }}>
                    {dayShifts.length === 0 ? (
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 3,
                        color: 'text.secondary'
                      }}>
                        <Typography variant="caption">
                          No shifts scheduled
                        </Typography>
                      </Box>
                    ) : (
                      dayShifts.map((shift) => (
                        <Box 
                          key={shift.id} 
                          sx={{ 
                            mb: 1, 
                            p: 0.5, 
                            bgcolor: 'primary.light', 
                            borderRadius: 1
                          }}
                        >
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            {shift.template_name || 'Custom Shift'}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="textSecondary">
                              {shift.section?.name || 'General'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(shift)}
                                sx={{ 
                                  p: 0.5, 
                                  minWidth: 'auto',
                                  color: 'inherit'
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(shift.id)}
                                sx={{ 
                                  p: 0.5, 
                                  minWidth: 'auto',
                                  color: 'inherit'
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>

                  {/* Add Shift Button */}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog(null, day)}
                    sx={{ mt: 1, width: '100%' }}
                  >
                    Add Shift
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderMonthView = () => {
    const startDate = new Date(getStartOfView());
    const endDate = new Date(getEndOfView());
    const days = [];
    
    // Add days from previous month to fill first week
    const firstDay = new Date(startDate);
    const dayOfWeek = firstDay.getDay();
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() - i - 1);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add current month days
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push({ date: new Date(date), isCurrentMonth: true });
    }
    
    // Add days from next month to fill last week
    const lastDay = new Date(endDate);
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= (6 - lastDayOfWeek); i++) {
      const date = new Date(lastDay);
      date.setDate(lastDay.getDate() + i);
      days.push({ date, isCurrentMonth: false });
    }

    return (
      <Grid container spacing={1}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Grid item xs={12} sm={6} md={1.7} key={day}>
            <Typography variant="subtitle2" align="center" sx={{ p: 1, fontWeight: 'bold' }}>
              {day}
            </Typography>
          </Grid>
        ))}
        {days.map(({ date, isCurrentMonth }, index) => {
          const dayShifts = shifts.filter(shift => shift.date === date.toISOString().split('T')[0]);
          return (
            <Grid item xs={12} sm={6} md={1.7} key={index}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '120px', 
                  overflow: 'auto',
                  bgcolor: isCurrentMonth ? 'background.paper' : 'grey.100',
                  opacity: isCurrentMonth ? 1 : 0.6
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Typography 
                    variant="caption" 
                    align="center" 
                    display="block" 
                    sx={{ mb: 1 }}
                  >
                    {date.getDate()}
                  </Typography>
                  {dayShifts.slice(0, 2).map((shift) => (
                    <Box key={shift.id} sx={{ mb: 0.5, p: 0.5, bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant="caption" display="block">
                        {formatTime(shift.start_time)}
                      </Typography>
                    </Box>
                  ))}
                  {dayShifts.length > 2 && (
                    <Typography variant="caption" align="center" color="textSecondary">
                      +{dayShifts.length - 2} more
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  if (!selectedFacility) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          Please select a facility to manage shifts
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h5" component="h2">
          Shift Calendar
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Shift
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Calendar Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigateDate(-1)}>
              <NavigateBeforeIcon />
            </IconButton>
            <Typography variant="h6" sx={{ mx: 2 }}>
              {viewMode === 'week' 
                ? `Week of ${formatDate(getStartOfView())}`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </Typography>
            <IconButton onClick={() => navigateDate(1)}>
              <NavigateNextIcon />
            </IconButton>
            <Button
              startIcon={<TodayIcon />}
              onClick={() => setCurrentDate(new Date())}
              sx={{ ml: 2 }}
            >
              Today
            </Button>
          </Box>
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Calendar View */}
      {viewMode === 'week' ? renderWeekView() : renderMonthView()}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingShift ? 'Edit Shift' : 'Add New Shift'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Fill in the details below to {editingShift ? 'update' : 'create'} a new shift. 
              Required fields are marked with an asterisk (*).
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Date Field */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shift Date *"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                helperText="Select the date for this shift"
              />
            </Grid>
            
            {/* Shift Template Field */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Shift Template *</InputLabel>
                <Select
                  value={formData.shift_template}
                  onChange={(e) => handleInputChange('shift_template', e.target.value)}
                  label="Shift Template *"
                >
                  <MenuItem value="" disabled>
                    <em>Select a shift template</em>
                  </MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {template.start_time} - {template.end_time} • {template.duration_hours}h
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Choose the shift template that defines timing and requirements
                </FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Facility Section Field */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Facility Section</InputLabel>
                <Select
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  label="Facility Section"
                >
                  <MenuItem value="">
                    <em>No specific section</em>
                  </MenuItem>
                  {facilitySections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      <Box>
                        <Typography variant="body1">
                          {section.name}
                        </Typography>
                        {section.description && (
                          <Typography variant="caption" color="textSecondary">
                            {section.description}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Optional: Assign to a specific section within the facility
                </FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Notes Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                multiline
                rows={3}
                placeholder="Enter any additional information about this shift..."
                helperText="Optional: Add notes, special instructions, or other relevant details"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.date || !formData.shift_template}
          >
            {editingShift ? 'Update Shift' : 'Create Shift'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftCalendar;
