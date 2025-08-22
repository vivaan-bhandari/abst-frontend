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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const ShiftTemplates = ({ onDataChange, selectedFacility }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    shift_type: '',
    start_time: '08:00',
    end_time: '16:00',
    duration_hours: 8,
    required_staff_count: 1,
    is_active: true,
  });

  useEffect(() => {
    if (selectedFacility) {
      fetchTemplates();
    }
  }, [selectedFacility]);

  const fetchTemplates = async () => {
    if (!selectedFacility) return;
    
    try {
      setLoading(true);
      // Fetch all templates (including inactive ones) for management purposes
      // This allows admins to see and manage both active and inactive templates
      const response = await axios.get(`${API_BASE_URL}/api/scheduling/shift-templates/?facility=${selectedFacility}&show_all=true`);
      setTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load shift templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        shift_type: template.shift_type || '',
        start_time: template.start_time,
        end_time: template.end_time,
        duration_hours: template.duration_hours,
        required_staff_count: template.required_staff_count,
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        shift_type: '',
        start_time: '06:00',
        end_time: '14:00',
        duration_hours: 8,
        required_staff_count: 1,
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      shift_type: '',
      start_time: '08:00',
      end_time: '16:00',
      duration_hours: 8,
      required_staff_count: 1,
      is_active: true,
    });
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-set shift_type based on start time
    if (field === 'start_time' && value) {
      const startHour = new Date(`2000-01-01T${value}`).getHours();
      let shiftType = '';
      
      if (startHour >= 6 && startHour < 14) {
        shiftType = 'day';
      } else if (startHour >= 14 && startHour < 22) {
        shiftType = 'swing';
      } else {
        shiftType = 'noc';
      }
      
      setFormData(prev => ({ ...prev, shift_type: shiftType }));
    }
    
    // Auto-update times when shift type changes
    if (field === 'shift_type' && value) {
      let startTime, endTime;
      
      if (value === 'day') {
        startTime = '06:00';
        endTime = '14:00';
      } else if (value === 'swing') {
        startTime = '14:00';
        endTime = '22:00';
      } else if (value === 'noc') {
        startTime = '22:00';
        endTime = '06:00';
      }
      
      if (startTime && endTime) {
        setFormData(prev => ({ 
          ...prev, 
          start_time: startTime, 
          end_time: endTime,
          duration_hours: 8 // All shifts are 8 hours
        }));
      }
    }
    
    // Calculate duration when both times are set
    if (field === 'start_time' || field === 'end_time') {
      const start = field === 'start_time' ? value : formData.start_time;
      const end = field === 'end_time' ? value : formData.end_time;
      
      if (start && end) {
        const startDate = new Date(`2000-01-01T${start}`);
        const endDate = new Date(`2000-01-01T${end}`);
        let duration = (endDate - startDate) / (1000 * 60 * 60);
        
        if (duration < 0) duration += 24; // Handle overnight shifts
        
        setFormData(prev => ({ ...prev, duration_hours: Math.round(duration * 100) / 100 }));
      }
    }
  };

  const handleSubmit = async () => {
    try {
  
      if (editingTemplate) {
        await axios.put(`${API_BASE_URL}/api/scheduling/shift-templates/${editingTemplate.id}/?facility=${selectedFacility}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/scheduling/shift-templates/?facility=${selectedFacility}`, formData);
      }
      handleCloseDialog();
      fetchTemplates();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error saving template:', error);
      if (error.response?.data) {
        console.error('Backend error details:', error.response.data);
        setError(`Failed to save shift template: ${JSON.stringify(error.response.data)}`);
      } else {
        setError('Failed to save shift template');
      }
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this shift template?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/scheduling/shift-templates/${templateId}/?facility=${selectedFacility}`);
        fetchTemplates();
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error('Error deleting template:', error);
        setError('Failed to delete shift template');
      }
    }
  };

  const handleCopy = (template) => {
    setFormData({
      name: `${template.name} (Copy)`,
      shift_type: template.shift_type || '',
      start_time: template.start_time || '06:00',
      end_time: template.end_time || '14:00',
      duration_hours: template.duration_hours || 8,
      required_staff_count: template.required_staff_count || 1,
      is_active: template.is_active !== undefined ? template.is_active : true,
    });
    setEditingTemplate(null);
    setOpenDialog(true);
  };

  if (!selectedFacility) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          Please select a facility to manage shift templates
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
          Shift Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Template
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
              <TableCell>Template Name</TableCell>
              <TableCell>Shift Type</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Required Staff</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {template.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={template.shift_type ? template.shift_type.toUpperCase() : 'Unknown'}
                    color={template.shift_type ? 'primary' : 'default'}
                    size="small"
                    variant={template.shift_type ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  {template.start_time} - {template.end_time}
                </TableCell>
                <TableCell>
                  {template.duration_hours} hours
                </TableCell>
                <TableCell>
                  {template.required_staff_count}
                </TableCell>
                <TableCell>
                  <Chip
                    label={template.is_active ? 'Active' : 'Inactive'}
                    color={template.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(template)}
                    title="Copy"
                  >
                    <CopyIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(template)}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(template.id)}
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
          {editingTemplate ? 'Edit Shift Template' : 'Add New Shift Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Shift Type</InputLabel>
                <Select
                  value={formData.shift_type}
                  onChange={(e) => handleFieldChange('shift_type', e.target.value)}
                  label="Shift Type"
                  required
                >
                  <MenuItem value="day">Day (06:00-14:00)</MenuItem>
                  <MenuItem value="swing">Swing (14:00-22:00)</MenuItem>
                  <MenuItem value="noc">NOC (22:00-06:00)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Required Staff Count"
                type="number"
                value={formData.required_staff_count}
                onChange={(e) => handleFieldChange('required_staff_count', parseInt(e.target.value))}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleFieldChange('start_time', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleFieldChange('end_time', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                value={formData.duration_hours}
                onChange={(e) => handleFieldChange('duration_hours', parseFloat(e.target.value))}
                required
                inputProps={{ step: 0.5, min: 0.5 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                  />
                }
                label="Active Template"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftTemplates;
