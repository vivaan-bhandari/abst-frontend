import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Chip as MuiChip,
  Tooltip,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const StaffAvailability = ({ selectedFacility, onDataChange }) => {
  const [availability, setAvailability] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [preferredStartTime, setPreferredStartTime] = useState('');
  const [preferredEndTime, setPreferredEndTime] = useState('');
  const [maxHours, setMaxHours] = useState('');
  const [preferredShifts, setPreferredShifts] = useState([]);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [weeklySummary, setWeeklySummary] = useState([]);

  const availabilityStatusOptions = [
    { value: 'available', label: 'Available', color: 'success' },
    { value: 'unavailable', label: 'Unavailable', color: 'error' },
    { value: 'preferred', label: 'Preferred', color: 'primary' },
    { value: 'limited', label: 'Limited Hours', color: 'warning' },
    { value: 'overtime_ok', label: 'Overtime OK', color: 'info' },
    { value: 'no_overtime', label: 'No Overtime', color: 'default' },
  ];

  const shiftTypeOptions = [
    { value: 'day', label: 'Day' },
    { value: 'swing', label: 'Swing' },
    { value: 'noc', label: 'NOC' },
  ];

  useEffect(() => {
    console.log('🔍 DEBUG: StaffAvailability useEffect - selectedFacility:', selectedFacility);
    console.log('🔍 DEBUG: StaffAvailability useEffect - selectedFacility type:', typeof selectedFacility);
    
    if (selectedFacility) {
      fetchData();
      fetchWeeklySummary();
    } else {
      console.log('🔍 DEBUG: No selectedFacility, skipping data fetch');
    }
  }, [selectedFacility, selectedDate]);

  const fetchData = async () => {
    if (!selectedFacility) return;
    
    setLoading(true);
    setError(null);
    try {
      const [availabilityRes, staffRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/scheduling/staff-availability/?facility=${selectedFacility}`),
        axios.get(`${API_BASE_URL}/api/scheduling/staff/?facility=${selectedFacility}`),
      ]);

      setAvailability(availabilityRes.data.results || availabilityRes.data || []);
      setStaff(staffRes.data.results || staffRes.data || []);
    } catch (error) {
      console.error('Error fetching availability data:', error);
      setError('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySummary = async () => {
    if (!selectedFacility || !selectedDate) return;
    
    try {
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // End of week (Saturday)
      
      const response = await axios.get(
        `${API_BASE_URL}/api/scheduling/staff-availability/weekly_summary/?facility=${selectedFacility}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`
      );
      
      setWeeklySummary(response.data);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingAvailability(item);
      setSelectedStaff(item.staff);
      setAvailabilityStatus(item.availability_status);
      setPreferredStartTime(item.preferred_start_time || '');
      setPreferredEndTime(item.preferred_end_time || '');
      setMaxHours(item.max_hours || '');
      setPreferredShifts(item.preferred_shifts || []);
      setNotes(item.notes || '');
    } else {
      setEditingAvailability(null);
      setSelectedStaff('');
      setAvailabilityStatus('available');
      setPreferredStartTime('');
      setPreferredEndTime('');
      setMaxHours('');
      setPreferredShifts([]);
      setNotes('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAvailability(null);
    setSelectedStaff('');
    setAvailabilityStatus('available');
    setPreferredStartTime('');
    setPreferredEndTime('');
    setMaxHours('');
    setPreferredShifts([]);
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedStaff || !selectedDate) {
      setError('Please select staff and date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Debug logging
      console.log('🔍 DEBUG: selectedFacility value:', selectedFacility);
      console.log('🔍 DEBUG: selectedFacility type:', typeof selectedFacility);
      console.log('🔍 DEBUG: API URL will be:', `${API_BASE_URL}/api/scheduling/staff-availability/?facility=${selectedFacility}`);

      const data = {
        staff: selectedStaff,
        date: selectedDate.toISOString().split('T')[0],
        availability_status: availabilityStatus,
        preferred_start_time: preferredStartTime || null,
        preferred_end_time: preferredEndTime || null,
        max_hours: maxHours ? parseInt(maxHours) : null,
        preferred_shifts: preferredShifts,
        notes: notes,
      };

      console.log('🔍 DEBUG: Request data being sent:', data);

      if (editingAvailability) {
        await axios.put(
          `${API_BASE_URL}/api/scheduling/staff-availability/${editingAvailability.id}/?facility=${selectedFacility}`,
          data
        );
        setSuccessMessage('Availability updated successfully!');
      } else {
        await axios.post(
          `${API_BASE_URL}/api/scheduling/staff-availability/?facility=${selectedFacility}`,
          data
        );
        setSuccessMessage('Availability created successfully!');
      }

      handleCloseDialog();
      fetchData();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error saving availability:', error);
      if (error.response?.data) {
        setError(`Failed to save availability: ${JSON.stringify(error.response.data)}`);
      } else {
        setError('Failed to save availability');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this availability record?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/api/scheduling/staff-availability/${id}/?facility=${selectedFacility}`
      );
      setSuccessMessage('Availability deleted successfully!');
      fetchData();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error deleting availability:', error);
      setError('Failed to delete availability');
    }
  };

  const getStatusColor = (status) => {
    const option = availabilityStatusOptions.find(opt => opt.value === status);
    return option ? option.color : 'default';
  };

  const getStatusLabel = (status) => {
    const option = availabilityStatusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const handlePreferredShiftToggle = (shiftType) => {
    setPreferredShifts(prev => 
      prev.includes(shiftType)
        ? prev.filter(s => s !== shiftType)
        : [...prev, shiftType]
    );
  };

  if (!selectedFacility) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          Please select a facility to manage staff availability
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Staff Availability Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Availability
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Daily View" icon={<CalendarIcon />} />
        <Tab label="Weekly Summary" icon={<PeopleIcon />} />
      </Tabs>

      {activeTab === 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Daily Availability
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Select Date"
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Preferred Times</TableCell>
                    <TableCell>Max Hours</TableCell>
                    <TableCell>Preferred Shifts</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availability
                    .filter(item => new Date(item.date).toDateString() === selectedDate.toDateString())
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.staff_name}</TableCell>
                        <TableCell>{item.staff_role}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.availability_status)}
                            color={getStatusColor(item.availability_status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {item.preferred_start_time && item.preferred_end_time
                            ? `${item.preferred_start_time} - ${item.preferred_end_time}`
                            : 'Any time'
                          }
                        </TableCell>
                        <TableCell>{item.max_hours || 'No limit'}</TableCell>
                        <TableCell>
                          {item.preferred_shifts && item.preferred_shifts.length > 0
                            ? item.preferred_shifts.map(shift => (
                                <Chip
                                  key={shift}
                                  label={shift}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))
                            : 'Any shift'
                          }
                        </TableCell>
                        <TableCell>{item.notes || '-'}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(item)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Weekly Availability Summary
          </Typography>
          <Grid container spacing={3}>
            {weeklySummary.map((day) => (
              <Grid item xs={12} sm={6} md={4} key={day.date}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Total Staff: {day.total_staff}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {availabilityStatusOptions.map(option => (
                        day[option.value] > 0 && (
                          <Box key={option.value} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{option.label}:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {day[option.value]}
                            </Typography>
                          </Box>
                        )
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Add/Edit Availability Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAvailability ? 'Edit Availability' : 'Add Availability'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Staff Member</InputLabel>
                <Select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  label="Staff Member"
                  required
                >
                  {staff.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({member.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Date"
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Availability Status</InputLabel>
                <Select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                  label="Availability Status"
                  required
                >
                  {availabilityStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Hours"
                type="number"
                value={maxHours}
                onChange={(e) => setMaxHours(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ min: 1, max: 24 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preferred Start Time"
                type="time"
                value={preferredStartTime}
                onChange={(e) => setPreferredStartTime(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preferred End Time"
                type="time"
                value={preferredEndTime}
                onChange={(e) => setPreferredEndTime(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Preferred Shift Types
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {shiftTypeOptions.map((shift) => (
                  <Chip
                    key={shift.value}
                    label={shift.label}
                    onClick={() => handlePreferredShiftToggle(shift.value)}
                    color={preferredShifts.includes(shift.value) ? 'primary' : 'default'}
                    variant={preferredShifts.includes(shift.value) ? 'filled' : 'outlined'}
                    clickable
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about availability..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !selectedStaff}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Saving...' : (editingAvailability ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAvailability;
