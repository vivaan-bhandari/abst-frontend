import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Grid,
  Switch,
  FormControlLabel,
  Tooltip,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  AccessTime as AccessTimeIcon,
  Note as NoteIcon,
  Help as HelpIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const StaffAssignments = ({ onDataChange, selectedFacility }) => {
  const [assignments, setAssignments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    staff: '',
    shift: '',
    assigned_role: '',
    clock_in_time: '',
    clock_out_time: '',
    actual_hours_worked: '',
    assigned_date: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.staff) {
      errors.staff = 'Staff member is required';
    }
    
    if (!formData.shift) {
      errors.shift = 'Shift is required';
    }
    
    if (!formData.assigned_role) {
      errors.assigned_role = 'Assigned role is required';
    }
    
    if (!formData.actual_hours_worked) {
      errors.actual_hours_worked = 'Actual hours worked is required';
    }
    
    if (!formData.assigned_date) {
      errors.assigned_date = 'Assignment date is required';
    }
    
    // Validate clock times
    if (formData.clock_in_time && formData.clock_out_time) {
      const clockIn = new Date(formData.clock_in_time);
      const clockOut = new Date(formData.clock_out_time);
      
      if (clockOut <= clockIn) {
        errors.clock_out_time = 'Clock out time must be after clock in time';
      }
    }
    
    // Validate hours worked
    if (formData.actual_hours_worked && (formData.actual_hours_worked < 0 || formData.actual_hours_worked > 24)) {
      errors.actual_hours_worked = 'Hours worked must be between 0 and 24';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (selectedFacility) {
      fetchAssignments();
      fetchStaff();
      fetchShifts();
      fetchShiftTemplates();
      fetchFacilities();
    }
  }, [selectedFacility]);

  const fetchAssignments = async () => {
    if (!selectedFacility) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scheduling/staff-assignments/?facility=${selectedFacility}`);
      setAssignments(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to load staff assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (!selectedFacility) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scheduling/staff/?facility=${selectedFacility}`);
      setStaff(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchShifts = async () => {
    if (!selectedFacility) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scheduling/shifts/?facility=${selectedFacility}`);
      setShifts(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const fetchShiftTemplates = async () => {
    if (!selectedFacility) return;
    
    try {
      // Only fetch active templates for staff assignments
      const response = await axios.get(`${API_BASE_URL}/api/scheduling/shift-templates/?facility=${selectedFacility}`);
      setShiftTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching shift templates:', error);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/facilities/`);
      setFacilities(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const handleOpenDialog = (assignment = null) => {
    setEditingAssignment(assignment);
    if (assignment) {
      setFormData({
        staff: assignment.staff || '',
        shift: assignment.shift || '',
        assigned_role: assignment.assigned_role || '',
        clock_in_time: assignment.clock_in_time || '',
        clock_out_time: assignment.clock_out_time || '',
        actual_hours_worked: assignment.actual_hours_worked || '',
        assigned_date: assignment.assigned_date || '',
        notes: assignment.notes || '',
      });
    } else {
      setFormData({
        staff: '',
        shift: '',
        assigned_role: '',
        clock_in_time: '',
        clock_out_time: '',
        actual_hours_worked: '',
        assigned_date: new Date().toISOString().split('T')[0], // Default to today
        notes: '',
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssignment(null);
    setFormData({
      staff: '',
      shift: '',
      assigned_role: '',
      clock_in_time: '',
      clock_out_time: '',
      actual_hours_worked: '',
      notes: '',
    });
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
  
      if (editingAssignment) {
        await axios.put(`${API_BASE_URL}/api/scheduling/staff-assignments/${editingAssignment.id}/`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/scheduling/staff-assignments/`, formData);
      }
      handleCloseDialog();
      fetchAssignments();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error saving assignment:', error);
      if (error.response?.data) {
        console.error('Backend error details:', error.response.data);
        setError(`Failed to save staff assignment: ${JSON.stringify(error.response.data)}`);
      } else {
        setError('Failed to save staff assignment');
      }
    }
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/scheduling/staff-assignments/${assignmentId}/`);
        fetchAssignments();
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error('Error deleting assignment:', error);
        setError('Failed to delete staff assignment');
      }
    }
  };

  const handleClockIn = async (assignmentId) => {
    try {
      const now = new Date().toISOString();
      const response = await axios.post(`${API_BASE_URL}/api/scheduling/staff-assignments/${assignmentId}/clock_in/`, {
        clock_in_time: now
      });
      fetchAssignments();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error clocking in:', error);
      setError('Failed to clock in');
    }
  };

  const handleClockOut = async (assignmentId) => {
    try {
      const now = new Date().toISOString();
      const response = await axios.post(`${API_BASE_URL}/api/scheduling/staff-assignments/${assignmentId}/clock_out/`, {
        clock_out_time: now
      });
      fetchAssignments();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error clocking out:', error);
      if (error.response?.data) {
        console.error('Backend error details:', error.response.data);
        setError(`Failed to clock out: ${JSON.stringify(error.response.data)}`);
      } else {
        setError('Failed to clock out');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'default';
      case 'clocked_in':
        return 'primary';
      case 'clocked_out':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'assigned':
        return 'Assigned';
      case 'clocked_in':
        return 'Clocked In';
      case 'clocked_out':
        return 'Clocked Out';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const canClockIn = (assignment) => {
    return !assignment.clock_in_time;
  };

  const canClockOut = (assignment) => {
    return assignment.clock_in_time && !assignment.clock_out_time;
  };

  if (!selectedFacility) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          Please select a facility to manage staff assignments
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Staff Assignments
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 600 }}>
            Manage which staff members are assigned to work specific shifts. Each assignment defines who works when, 
            what role they perform, and tracks their clock in/out times and hours worked.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ minWidth: 150 }}
        >
          Assign Staff
        </Button>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
          <Typography variant="h6" color="primary.main">
            {assignments.length}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Total Assignments
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
          <Typography variant="h6" color="success.main">
            {assignments.filter(a => a.clock_in_time && a.clock_out_time).length}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Completed Shifts
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
          <Typography variant="h6" color="warning.main">
            {assignments.filter(a => a.clock_in_time && !a.clock_out_time).length}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            In Progress
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
          <Typography variant="h6" color="info.main">
            {assignments.filter(a => !a.clock_in_time && !a.clock_out_time).length}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Not Started
          </Typography>
        </Paper>
      </Box>

      {/* Help Section */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpIcon color="primary" />
          How to Use Staff Assignments
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              <strong>1. Create Assignment:</strong> Click "Assign Staff" to assign someone to a shift
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>2. Required Fields:</strong> Staff Member, Shift, and Role are mandatory
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>3. Optional Fields:</strong> Clock times, hours worked, and notes can be added later
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              <strong>4. Track Progress:</strong> Use clock in/out buttons to track actual work time
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>5. Monitor Status:</strong> See which assignments are completed, in progress, or not started
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>6. Edit/Delete:</strong> Modify assignments or remove them as needed
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Staff Member</strong></TableCell>
              <TableCell><strong>Shift Details</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Time</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {assignment.staff?.first_name} {assignment.staff?.last_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {assignment.staff?.role?.toUpperCase()} • ID: {assignment.staff?.employee_id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {assignment.shift?.shift_template?.name || 'Custom Shift'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {assignment.shift?.facility?.name}
                      {assignment.shift?.section && ` • ${assignment.shift.section.name}`}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {assignment.shift?.date ? new Date(assignment.shift.date).toLocaleDateString() : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {assignment.shift?.shift_template?.start_time} - {assignment.shift?.shift_template?.end_time}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {assignment.shift?.shift_template?.duration_hours}h
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={assignment.assigned_role?.toUpperCase()}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {assignment.clock_in_time && (
                      <Typography variant="caption" color="success.main">
                        ✓ Clocked In: {new Date(assignment.clock_in_time).toLocaleTimeString()}
                      </Typography>
                    )}
                    {assignment.clock_out_time && (
                      <Typography variant="caption" color="info.main">
                        ✓ Clocked Out: {new Date(assignment.clock_out_time).toLocaleTimeString()}
                      </Typography>
                    )}
                    {assignment.actual_hours_worked && (
                      <Typography variant="caption" color="textSecondary">
                        Hours: {assignment.actual_hours_worked}h
                      </Typography>
                    )}
                    {!assignment.clock_in_time && !assignment.clock_out_time && (
                      <Typography variant="caption" color="warning.main">
                        Not Started
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* Clock In/Out Buttons */}
                    {canClockIn(assignment) && (
                      <Tooltip title="Clock In">
                        <IconButton
                          size="small"
                                                     onClick={() => handleClockIn(assignment.id)}
                          color="primary"
                          sx={{ 
                            backgroundColor: 'success.light', 
                            color: 'white',
                            '&:hover': { backgroundColor: 'success.main' }
                          }}
                        >
                          <LoginIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canClockOut(assignment) && (
                      <Tooltip title="Clock Out">
                        <IconButton
                          size="small"
                          onClick={() => handleClockOut(assignment.id)}
                          color="success"
                          sx={{ 
                            backgroundColor: 'info.light', 
                            color: 'white',
                            '&:hover': { backgroundColor: 'info.main' }
                          }}
                        >
                          <LogoutIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* Edit Button */}
                    <Tooltip title="Edit Assignment">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(assignment)}
                        color="primary"
                        sx={{ 
                          backgroundColor: 'primary.light', 
                          color: 'white',
                          '&:hover': { backgroundColor: 'primary.main' }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {/* Delete Button */}
                    <Tooltip title="Delete Assignment">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(assignment.id)}
                        color="error"
                        sx={{ 
                          backgroundColor: 'error.light', 
                          color: 'white',
                          '&:hover': { backgroundColor: 'error.main' }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAssignment ? 'Edit Staff Assignment' : 'Assign Staff to Shift'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {editingAssignment 
                ? 'Update the details of this staff assignment.' 
                : 'Assign a staff member to work a specific shift with a defined role.'
              }
            </Typography>
            
            {/* Required Fields Notice */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Required Fields:</strong> Staff Member, Shift, and Role must be selected to create an assignment. 
                All other fields are optional and can be filled in later.
              </Typography>
            </Alert>
            
            {/* Assignment Summary */}
            {(formData.staff && formData.shift && formData.assigned_role) && (
              <Paper sx={{ p: 2, mb: 3, backgroundColor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  Assignment Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Staff:</strong> {staff.find(s => s.id === formData.staff)?.first_name} {staff.find(s => s.id === formData.staff)?.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Shift:</strong> {shifts.find(s => s.id === formData.shift)?.shift_template?.name} on {shifts.find(s => s.id === formData.shift)?.date}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Role:</strong> {formData.assigned_role?.toUpperCase()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
            
            <Grid container spacing={3}>
              {/* Staff Member Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.staff}>
                  <InputLabel>Staff Member *</InputLabel>
                  <Select
                    value={formData.staff}
                    onChange={(e) => handleInputChange('staff', e.target.value)}
                    label="Staff Member *"
                    required
                    startAdornment={<PersonIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    {staff.map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        <Box>
                          <Typography variant="body1">
                            {member.first_name} {member.last_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {member.role.toUpperCase()} • ID: {member.employee_id}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{formErrors.staff}</FormHelperText>
                </FormControl>
              </Grid>

              {/* Shift Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.shift}>
                  <InputLabel>Shift *</InputLabel>
                  <Select
                    value={formData.shift}
                    onChange={(e) => handleInputChange('shift', e.target.value)}
                    label="Shift *"
                    required
                    startAdornment={<ScheduleIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    {shifts.map((shift) => (
                      <MenuItem key={shift.id} value={shift.id}>
                        <Box>
                          <Typography variant="body1">
                            {(() => {
                  let templateId = shift.shift_template;
                  if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
                    templateId = shift.shift_template.id;
                  }
                  // Find template by ID
                  const template = shiftTemplates?.find(t => t.id === templateId);
                  return template?.name || 'Custom Shift';
                })()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {shift.date} • {(() => {
                  let templateId = shift.shift_template;
                  if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
                    templateId = shift.shift_template.id;
                  }
                  // Find template by ID
                  const template = shiftTemplates?.find(t => t.id === templateId);
                  return `${template?.start_time || '00:00'} - ${template?.end_time || '00:00'}`;
                })()}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{formErrors.shift}</FormHelperText>
                </FormControl>
              </Grid>

              {/* Assigned Role */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.assigned_role}>
                  <InputLabel>Role on This Shift *</InputLabel>
                  <Select
                    value={formData.assigned_role}
                    onChange={(e) => handleInputChange('assigned_role', e.target.value)}
                    label="Role on This Shift *"
                    required
                    startAdornment={<WorkIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    <MenuItem value="rn">
                      <Box>
                        <Typography variant="body1">Registered Nurse (RN)</Typography>
                        <Typography variant="caption" color="textSecondary">Full nursing care, medications, assessments</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="lpn">
                      <Box>
                        <Typography variant="body1">Licensed Practical Nurse (LPN)</Typography>
                        <Typography variant="caption" color="textSecondary">Basic nursing care, medication administration</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="cna">
                      <Box>
                        <Typography variant="body1">Certified Nursing Assistant (CNA)</Typography>
                        <Typography variant="caption" color="textSecondary">Personal care, ADL assistance, vital signs</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="med_tech">
                      <Box>
                        <Typography variant="body1">Medication Technician</Typography>
                        <Typography variant="caption" color="textSecondary">Medication administration, basic care</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="aide">
                      <Box>
                        <Typography variant="body1">Personal Care Aide</Typography>
                        <Typography variant="caption" color="textSecondary">Personal care, companionship, basic assistance</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="supervisor">
                      <Box>
                        <Typography variant="body1">Supervisor</Typography>
                        <Typography variant="caption" color="textSecondary">Oversight, coordination, leadership</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box>
                        <Typography variant="body1">Administrator</Typography>
                        <Typography variant="caption" color="textSecondary">Management, policy, coordination</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                  <FormHelperText>{formErrors.assigned_role}</FormHelperText>
                </FormControl>
              </Grid>

              {/* Actual Hours Worked */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hours Worked *"
                  type="number"
                  value={formData.actual_hours_worked || ''}
                  onChange={(e) => handleInputChange('actual_hours_worked', parseFloat(e.target.value) || '')}
                  inputProps={{ step: 0.5, min: 0, max: 24 }}
                  InputLabelProps={{ shrink: true }}
                  helperText={formErrors.actual_hours_worked || "Enter actual hours worked (e.g., 7.5 for 7 hours 30 minutes)"}
                  InputProps={{
                    startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                  required
                />
              </Grid>

              {/* Assigned Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Assignment Date *"
                  type="date"
                  value={formData.assigned_date || ''}
                  onChange={(e) => handleInputChange('assigned_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="The date this assignment is for"
                  InputProps={{
                    startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                  required
                />
              </Grid>

              {/* Clock In Time */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Clock In Time (Optional)"
                  type="datetime-local"
                  value={formData.clock_in_time || ''}
                  onChange={(e) => handleInputChange('clock_in_time', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText={formErrors.clock_in_time || "When the staff member started their shift"}
                  InputProps={{
                    startAdornment: <LoginIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Clock Out Time */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Clock Out Time (Optional)"
                  type="datetime-local"
                  value={formData.clock_out_time || ''}
                  onChange={(e) => handleInputChange('clock_out_time', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText={formErrors.clock_out_time || "When the staff member ended their shift"}
                  InputProps={{
                    startAdornment: <LogoutIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Add any special instructions, accommodations, or notes about this assignment..."
                  helperText="Useful for special instructions, accommodations, or important notes"
                  InputProps={{
                    startAdornment: <NoteIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!formData.staff || !formData.shift || !formData.assigned_role || !formData.actual_hours_worked || !formData.assigned_date}
            startIcon={editingAssignment ? <EditIcon /> : <AddIcon />}
            sx={{ 
              minWidth: 180,
              '&:disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAssignments;
