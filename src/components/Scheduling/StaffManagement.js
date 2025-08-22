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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const StaffManagement = ({ onDataChange, selectedFacility }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'cna',
    status: 'active',
    hire_date: '',
    certifications: [],
    skills: [],
    max_hours_per_week: 40,
    preferred_shifts: [],
    notes: '',
  });

  useEffect(() => {
    // Restore auth token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    }
    if (selectedFacility) {
      fetchStaff();
    }
  }, [selectedFacility]);

  const fetchStaff = async () => {
    if (!selectedFacility) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/scheduling/staff/?facility=${selectedFacility}`);
      
      setStaff(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };



  const handleOpenDialog = (staff = null) => {
    if (staff) {
      
      setEditingStaff(staff);
      setFormData({
        employee_id: staff.employee_id || '',
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        email: staff.user?.email || '',
        role: staff.role || 'cna',
        status: staff.status || 'active',
        hire_date: staff.hire_date || '',
        certifications: staff.certifications || [],
        skills: staff.skills || [],
        max_hours_per_week: staff.max_hours_per_week || 40,
        preferred_shifts: staff.preferred_shifts || [],
        notes: staff.notes || '',
      });
          } else {
        setEditingStaff(null);
        setFormData({
          employee_id: '',
          first_name: '',
          last_name: '',
          email: '',
          role: 'cna',
          status: 'active',
          hire_date: '',
          certifications: [],
          skills: [],
          max_hours_per_week: 40,
          preferred_shifts: [],
          notes: '',
        });
      }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStaff(null);
    setFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      role: 'cna',
      status: 'active',
      hire_date: '',
      certifications: [],
      skills: [],
      max_hours_per_week: 40,
      preferred_shifts: [],
      notes: '',
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    // Prevent default form submission behavior
    if (e) {
      e.preventDefault();
    }
    
    try {
      if (editingStaff) {
        await axios.put(`${API_BASE_URL}/api/scheduling/staff/${editingStaff.id}/`, formData);
      } else {
        // Create staff member directly - backend will handle user creation
        const staffData = {
          username: formData.employee_id.toLowerCase(),
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          password: 'temp123456', // Temporary password
          employee_id: formData.employee_id,
          role: formData.role,
          status: formData.status,
          hire_date: formData.hire_date,
          max_hours_per_week: formData.max_hours_per_week,
          notes: formData.notes,
          facility: selectedFacility,
        };
        
        await axios.post(`${API_BASE_URL}/api/scheduling/staff/?facility=${selectedFacility}`, staffData);
      }
      handleCloseDialog();
      fetchStaff();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error saving staff:', error);
      if (error.response?.data) {
        console.error('Server error details:', error.response.data);
        
        // Handle specific error cases
        if (error.response.data.username && error.response.data.username.includes('already exists')) {
          setError(`Username '${formData.employee_id.toLowerCase()}' already exists. Please use a different Employee ID.`);
        } else if (error.response.data.email && error.response.data.email.includes('already exists')) {
          setError(`Email '${formData.email}' already exists. Please use a different email address.`);
        } else if (error.response.data.employee_id && error.response.data.employee_id.includes('already exists')) {
          setError(`Employee ID '${formData.employee_id}' already exists. Please use a different Employee ID.`);
        } else {
          setError(`Failed to save staff data: ${JSON.stringify(error.response.data)}`);
        }
      } else {
        setError('Failed to save staff data');
      }
    }
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/scheduling/staff/${staffId}/`);
        fetchStaff();
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error('Error deleting staff:', error);
        setError('Failed to delete staff member');
      }
    }
  };

  const handleSchedule = (staffId) => {
    // Navigate to scheduling view for this staff member

  };

  if (!selectedFacility) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          Please select a facility to manage staff
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
        <Typography variant="h5" component="h2">
          Staff Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Staff Member
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Hire Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {member.first_name} {member.last_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ID: {member.employee_id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{member.employee_id}</TableCell>
                <TableCell>{member.get_role_display || member.role}</TableCell>
                <TableCell>
                  <Chip
                    label={member.status}
                    color={member.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{member.hire_date}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleSchedule(member.id)}
                    title="Schedule"
                  >
                    <ScheduleIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(member)}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(member.id)}
                    title="Delete"
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <form id="staff-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    label="Role"
                    required
                  >
                    <MenuItem value="rn">Registered Nurse</MenuItem>
                    <MenuItem value="lpn">Licensed Practical Nurse</MenuItem>
                    <MenuItem value="cna">Certified Nursing Assistant</MenuItem>
                    <MenuItem value="med_tech">Medication Technician</MenuItem>
                    <MenuItem value="aide">Personal Care Aide</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                    <MenuItem value="admin">Administrator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hire Date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleInputChange('hire_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    label="Status"
                    required
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="on_leave">On Leave</MenuItem>
                    <MenuItem value="terminated">Terminated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Hours Per Week"
                  type="number"
                  value={formData.max_hours_per_week}
                  onChange={(e) => handleInputChange('max_hours_per_week', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 168 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button type="submit" form="staff-form" variant="contained">
            {editingStaff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;
