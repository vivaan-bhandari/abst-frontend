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
  Card,
  CardContent,
  LinearProgress,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const AcuityStaffing = ({ onDataChange, selectedFacility }) => {
  const [acuityStaffing, setAcuityStaffing] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [facilitySections, setFacilitySections] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAcuity, setEditingAcuity] = useState(null);
  const [formData, setFormData] = useState({
    shift: '',
    total_care_hours_needed: '',
    high_acuity_residents: 0,
    medium_acuity_residents: 0,
    low_acuity_residents: 0,
    recommended_staff_count: 1,
    recommended_skill_mix: {},
  });
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (selectedFacility) {
      fetchAcuityStaffing();
      fetchFacilities();
      fetchShifts();
      fetchShiftTemplates();
    }
  }, [selectedFacility]);

  const fetchAcuityStaffing = async () => {
    if (!selectedFacility) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scheduling/acuity-staffing/?facility=${selectedFacility}`);
      setAcuityStaffing(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching acuity staffing:', error);
      setError('Failed to load acuity staffing data');
    } finally {
      setLoading(false);
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

  const fetchFacilitySections = async (facilityId) => {
    if (!facilityId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/facilitysections/?facility=${facilityId}`);
      setFacilitySections(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching facility sections:', error);
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
      // Only fetch active templates for acuity staffing calculations
      const response = await axios.get(`${API_BASE_URL}/api/scheduling/shift-templates/?facility=${selectedFacility}`);
      setShiftTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching shift templates:', error);
    }
  };

  const recalculateAcuityStaffing = async () => {
    setRecalculating(true);
    setError(null);
    
    try {
      // Trigger the backend to recalculate acuity staffing based on current ADL data
      const response = await axios.post(`${API_BASE_URL}/api/adls/recalculate_acuity/?facility=${selectedFacility}`);

      
      // Refresh the data
      await fetchAcuityStaffing();
      if (onDataChange) onDataChange();
      
      setSuccessMessage('Acuity staffing requirements have been recalculated based on current ADL data');
    } catch (error) {
      console.error('Error recalculating acuity staffing:', error);
      setError('Failed to recalculate acuity staffing. Please try again.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleOpenDialog = (acuity = null) => {
    if (acuity) {
      setEditingAcuity(acuity);
      setFormData({
        shift: acuity.shift || '',
        total_care_hours_needed: acuity.total_care_hours_needed || '',
        high_acuity_residents: acuity.high_acuity_residents || 0,
        medium_acuity_residents: acuity.medium_acuity_residents || 0,
        low_acuity_residents: acuity.low_acuity_residents || 0,
        recommended_staff_count: acuity.recommended_staff_count || 1,
        recommended_skill_mix: acuity.recommended_skill_mix || {},
      });
    } else {
      setEditingAcuity(null);
      setFormData({
        shift: '',
        total_care_hours_needed: '',
        high_acuity_residents: 0,
        medium_acuity_residents: 0,
        low_acuity_residents: 0,
        recommended_staff_count: 1,
        recommended_skill_mix: {},
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAcuity(null);
    setFormData({
      shift: '',
      total_care_hours_needed: '',
      high_acuity_residents: 0,
      medium_acuity_residents: 0,
      low_acuity_residents: 0,
      recommended_staff_count: 1,
      recommended_skill_mix: {},
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
  
      
      if (editingAcuity) {
        await axios.put(`${API_BASE_URL}/api/scheduling/acuity-staffing/${editingAcuity.id}/`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/scheduling/acuity-staffing/`, formData);
      }
      
      handleCloseDialog();
      fetchAcuityStaffing();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error saving acuity staffing:', error);
      if (error.response?.data) {
        console.error('Backend error details:', error.response.data);
        setError(`Failed to save acuity staffing data: ${JSON.stringify(error.response.data)}`);
      } else {
        setError('Failed to save acuity staffing data');
      }
    }
  };

  const handleDelete = async (acuityId) => {
    if (window.confirm('Are you sure you want to delete this acuity staffing requirement?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/scheduling/acuity-staffing/${acuityId}/`);
        fetchAcuityStaffing();
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error('Error deleting acuity staffing:', error);
        setError('Failed to delete acuity staffing requirement');
      }
    }
  };

  const calculateStaffingGap = (acuity) => {
    // Calculate the difference between recommended and actual staff
    // For now, we'll show a placeholder - this could be enhanced later
    const actualStaff = 0; // This would come from actual staff assignments
    const gap = Math.max(0, acuity.recommended_staff_count - actualStaff);
    
    return {
      gap: gap,
      status: gap === 0 ? 'met' : 'understaffed'
    };
  };

  if (!selectedFacility) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          Please select a facility to manage acuity staffing
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
            Acuity-Based Staffing
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 600 }}>
            Define staffing requirements based on resident acuity levels and care needs. This helps ensure adequate 
            staffing for each shift based on the complexity of resident care required.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
            onClick={recalculateAcuityStaffing}
            disabled={recalculating}
          >
            {recalculating ? 'Recalculating...' : 'Recalculate from ADL Data'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Acuity Requirement
          </Button>
        </Box>
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Requirements
              </Typography>
              <Typography variant="h4" component="div">
                {acuityStaffing.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Acuity Residents
              </Typography>
              <Typography variant="h4" component="div" color="error">
                {acuityStaffing.reduce((sum, a) => sum + (a.high_acuity_residents || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Medium Acuity Residents
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {acuityStaffing.reduce((sum, a) => sum + (a.medium_acuity_residents || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Low Acuity Residents
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {acuityStaffing.reduce((sum, a) => sum + (a.low_acuity_residents || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Shift</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Facility</strong></TableCell>
              <TableCell><strong>Care Hours</strong></TableCell>
              <TableCell><strong>Resident Counts</strong></TableCell>
              <TableCell><strong>Staff Needed</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {acuityStaffing.map((acuity) => {
              const totalResidents = (acuity.high_acuity_residents || 0) + (acuity.medium_acuity_residents || 0) + (acuity.low_acuity_residents || 0);
              const staffingGap = calculateStaffingGap(acuity);
              return (
                <TableRow key={acuity.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {acuity.shift?.shift_template?.name || 'Custom Shift'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {acuity.shift?.shift_template?.start_time} - {acuity.shift?.shift_template?.end_time}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {acuity.shift?.date ? new Date(acuity.shift.date).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {acuity.shift?.facility?.name}
                      </Typography>
                      {acuity.shift?.section && (
                        <Typography variant="caption" color="textSecondary">
                          {acuity.shift.section.name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {acuity.total_care_hours_needed}h
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        <strong>Total: {totalResidents}</strong>
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        High: {acuity.high_acuity_residents || 0} • Medium: {acuity.medium_acuity_residents || 0} • Low: {acuity.low_acuity_residents || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {acuity.recommended_staff_count} staff
                      </Typography>
                      {staffingGap.gap > 0 && (
                        <Typography variant="caption" color="error">
                          Gap: {staffingGap.gap}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {staffingGap.status === 'met' ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <WarningIcon color="warning" fontSize="small" />
                      )}
                      <Typography variant="caption">
                        {staffingGap.status === 'met' ? 'Met' : 'Understaffed'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(acuity)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(acuity.id)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAcuity ? 'Edit Acuity Staffing Requirement' : 'Add New Acuity Staffing Requirement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {editingAcuity 
                ? 'Update the acuity-based staffing requirements for this shift.' 
                : 'Define staffing requirements based on resident acuity levels and care needs.'
              }
            </Typography>
            
            {/* Required Fields Notice */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Required Fields:</strong> Shift, Total Care Hours, Resident Counts, and Recommended Staff Count must be specified.
              </Typography>
            </Alert>
            
            <Grid container spacing={3}>
              {/* Shift Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Shift *</InputLabel>
                  <Select
                    value={formData.shift}
                    onChange={(e) => handleInputChange('shift', e.target.value)}
                    label="Shift *"
                    required
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
                            {shift.date} • {shift.facility?.name}
                            {shift.section && ` • ${shift.section.name}`}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select the shift for this acuity staffing requirement</FormHelperText>
                </FormControl>
              </Grid>

              {/* Total Care Hours Needed */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Care Hours Needed *"
                  type="number"
                  value={formData.total_care_hours_needed || ''}
                  onChange={(e) => handleInputChange('total_care_hours_needed', parseFloat(e.target.value) || '')}
                  required
                  inputProps={{ step: 0.5, min: 0, max: 24 }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Total care hours required for this shift (e.g., 8.5 for 8 hours 30 minutes)"
                />
              </Grid>

              {/* High Acuity Residents */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="High Acuity Residents *"
                  type="number"
                  value={formData.high_acuity_residents || 0}
                  onChange={(e) => handleInputChange('high_acuity_residents', parseInt(e.target.value) || 0)}
                  required
                  inputProps={{ min: 0 }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Number of high acuity residents"
                />
              </Grid>

              {/* Medium Acuity Residents */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Medium Acuity Residents *"
                  type="number"
                  value={formData.medium_acuity_residents || 0}
                  onChange={(e) => handleInputChange('medium_acuity_residents', parseInt(e.target.value) || 0)}
                  required
                  inputProps={{ min: 0 }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Number of medium acuity residents"
                />
              </Grid>

              {/* Low Acuity Residents */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Low Acuity Residents *"
                  type="number"
                  value={formData.low_acuity_residents || 0}
                  onChange={(e) => handleInputChange('low_acuity_residents', parseInt(e.target.value) || 0)}
                  required
                  inputProps={{ min: 0 }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Number of low acuity residents"
                />
              </Grid>

              {/* Recommended Staff Count */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Recommended Staff Count *"
                  type="number"
                  value={formData.recommended_staff_count || 1}
                  onChange={(e) => handleInputChange('recommended_staff_count', parseInt(e.target.value) || 1)}
                  required
                  inputProps={{ min: 1, max: 20 }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Total number of staff recommended for this shift"
                />
              </Grid>

              {/* Total Residents Display */}
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Total Residents
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {(formData.high_acuity_residents || 0) + (formData.medium_acuity_residents || 0) + (formData.low_acuity_residents || 0)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    High: {formData.high_acuity_residents || 0} • Medium: {formData.medium_acuity_residents || 0} • Low: {formData.low_acuity_residents || 0}
                  </Typography>
                </Paper>
              </Grid>

              {/* Notes for Skill Mix */}
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Note:</strong> The system will automatically calculate recommended skill mix based on acuity levels and care hours. 
                    You can override this by editing the requirement after creation.
                  </Typography>
                </Alert>
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
            disabled={!formData.shift || !formData.total_care_hours_needed || formData.recommended_staff_count < 1}
            startIcon={editingAcuity ? <EditIcon /> : <AddIcon />}
          >
            {editingAcuity ? 'Update Requirement' : 'Create Requirement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcuityStaffing;
