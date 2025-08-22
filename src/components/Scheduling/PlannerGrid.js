import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  DragIndicator as DragIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const PlannerGrid = ({ onDataChange, selectedFacility }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentWeek, setCurrentWeek] = useState(new Date('2025-08-18'));
  

  const [dragData, setDragData] = useState(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateShiftDialog, setShowCreateShiftDialog] = useState(false);
  const [createShiftData, setCreateShiftData] = useState({
    date: '',
    shift_template: '',
    start_time: '',
    end_time: '',
    duration_hours: 0,
    notes: ''
  });
  const [createShiftLoading, setCreateShiftLoading] = useState(false);
  const [showClearShiftsDialog, setShowClearShiftsDialog] = useState(false);
  const [facilities, setFacilities] = useState([]);

  // Week configuration
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shiftTypes = ['Day', 'Swing', 'NOC'];
  const shiftTimeRanges = {
    Day: '06:00-14:00',
    Swing: '14:00-22:00',
    NOC: '22:00-06:00'
  };

  // Helper function to safely stringify values for display
  const safeStringify = (value) => {
    if (value === null || value === undefined) return 'null/undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return '[Object]';
      }
    }
    return String(value);
  };

  useEffect(() => {
    if (selectedFacility) {
      fetchData();
      fetchFacilities();
    }
  }, [selectedFacility, currentWeek]);

  // Debug: Monitor state changes
  useEffect(() => {
  }, [staff, shifts, shiftTemplates, assignments]);





  const fetchData = async (forceRefresh = false) => {
    if (!selectedFacility) return;
    
    try {
      
      // Always clear data first for refresh
      setStaff([]);
      setShifts([]);
      setShiftTemplates([]);
      setAssignments([]);
      
      setLoading(true);
      
      const [staffRes, shiftsRes, templatesRes, assignmentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/scheduling/staff/?facility=${selectedFacility}`),
        axios.get(`${API_BASE_URL}/api/scheduling/shifts/?facility=${selectedFacility}`),
        axios.get(`${API_BASE_URL}/api/scheduling/shift-templates/?facility=${selectedFacility}`),
        axios.get(`${API_BASE_URL}/api/scheduling/staff-assignments/?facility=${selectedFacility}`)
      ]);
      


      let staffData = staffRes.data.results || staffRes.data;
      let shiftsData = shiftsRes.data.results || shiftsRes.data;
      let templatesData = templatesRes.data.results || templatesRes.data;
      let assignmentsData = assignmentsRes.data.results || assignmentsRes.data;
      
      // Ensure we have arrays
      if (!Array.isArray(staffData)) staffData = [];
      if (!Array.isArray(shiftsData)) shiftsData = [];
      if (!Array.isArray(templatesData)) templatesData = [];
      if (!Array.isArray(assignmentsData)) assignmentsData = [];

      setStaff(staffData);
      setShifts(shiftsData);
      setShiftTemplates(templatesData);
      setAssignments(assignmentsData);
      
      // Show success message
      setSuccessMessage(`Data refreshed successfully! Loaded ${assignmentsData.length} assignments, ${shiftsData.length} shifts, and ${staffData.length} staff members.`);
      setShowSuccessMessage(true);
      
    } catch (error) {
      console.error('❌ Error fetching planner data:', error);
      
      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        console.error('Server error:', error.response.status, error.response.data);
        setError(`Server error: ${error.response.status} - ${error.response.data?.detail || 'Unknown error'}`);
      } else if (error.request) {
        // Network error - no response received
        console.error('Network error:', error.request);
        setError('Network error: Unable to connect to server. Please check your connection.');
      } else {
        // Other error
        console.error('Other error:', error.message);
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get week start (Monday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Monday is 1, Sunday is 0
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const result = new Date(d);
    result.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    return result;
  };
  


  // Get week dates
  const getWeekDates = () => {
    const start = getWeekStart(currentWeek);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    

    
    return dates;
  };

  // Get shifts for a specific day and shift type
  const getShiftsForDay = (date, shiftType) => {
    
    const dayShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      // Handle both object and ID for shift_template
      let templateId = shift.shift_template;
      if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
        templateId = shift.shift_template.id;
      }
      
      const template = shiftTemplates.find(t => t.id === templateId);
      
      // If no template found, skip this shift
      if (!template) {
        return false;
      }
      
      // Check if dates match
      const dateMatches = shiftDate.toDateString() === date.toDateString();
      
      // Check if shift type matches (handle both cases where shift_type might not be set)
      let shiftTypeMatches = false;
      if (template.shift_type) {
        // Fix case sensitivity: convert both to lowercase for comparison
        shiftTypeMatches = template.shift_type.toLowerCase() === shiftType.toLowerCase();
      } else {
        // If no shift_type, try to infer from start_time
        const startHour = new Date(`2000-01-01T${template.start_time}`).getHours();
        if (shiftType === 'Day' && startHour >= 6 && startHour < 14) {
          shiftTypeMatches = true;
        } else if (shiftType === 'Swing' && startHour >= 14 && startHour < 22) {
          shiftTypeMatches = true;
        } else if (shiftType === 'NOC' && (startHour >= 22 || startHour < 6)) {
          shiftTypeMatches = true;
        }
      }
      
      return dateMatches && shiftTypeMatches;
    });
    
    return dayShifts;
  };

  // Get assignments for a specific shift
  const getAssignmentsForShift = (shiftId) => {
    // Ensure both IDs are the same type for comparison
    const shiftIdNum = parseInt(shiftId);
    
    const foundAssignments = assignments.filter(assignment => {
      // Handle both object and ID for shift
      let assignmentShiftId;
      if (typeof assignment.shift === 'object' && assignment.shift !== null) {
        assignmentShiftId = parseInt(assignment.shift.id);
      } else {
        assignmentShiftId = parseInt(assignment.shift);
      }
      
      const isMatch = assignmentShiftId === shiftIdNum;
      
      return isMatch;
    });
    
    return foundAssignments;
  };

  // Calculate required staff for a shift
  const getRequiredStaff = (shift) => {
    // Check if the shift has an effective_staff_count (from acuity-based staffing)
    if (shift.effective_staff_count && shift.effective_staff_count > 0) {
      return shift.effective_staff_count;
    }
    
    // Fall back to shift template's required_staff_count
    let templateId = shift.shift_template;
    if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
      templateId = shift.shift_template.id;
    }
    const template = shiftTemplates.find(t => t.id === templateId);
    return template?.required_staff_count || 1;
  };

  // Get available staff for a role
  const getAvailableStaff = (role, date, shiftType) => {
    return staff.filter(member => {
      // Check if staff member has the required role
      if (member.role !== role) return false;
      
      // Check if staff member is available (not already assigned to this day)
      const hasAssignment = assignments.some(assignment => {
        const assignmentStaffId = typeof assignment.staff === 'object' ? assignment.staff.id : assignment.staff;
        if (assignmentStaffId !== member.id) return false;
        const shift = shifts.find(s => s.id === assignment.shift);
        if (!shift) return false;
        return new Date(shift.date).toDateString() === date.toDateString();
      });
      
      return !hasAssignment;
    });
  };

  // Check if a date is in the current week
  const isDateInWeek = (date) => {
    const weekDates = getWeekDates();
    const checkDate = new Date(date);
    return weekDates.some(weekDate => 
      weekDate.toDateString() === checkDate.toDateString()
    );
  };

  // Validation rules
  const validateAssignment = (staffId, shiftId, role) => {
    const staffMember = staff.find(s => s.id === staffId);
    const shift = shifts.find(s => s.id === shiftId);
    let templateId = shift.shift_template;
    if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
      templateId = shift.shift_template.id;
    }
    const template = shiftTemplates.find(t => t.id === templateId);
    
    if (!staffMember || !shift || !template) {
      return { valid: false, error: 'Invalid data' };
    }

    // Check role match
    if (staffMember.role !== role) {
      return { valid: false, error: `Staff member is a ${staffMember.role}, not ${role}` };
    }

    // Check if already assigned to this day
    const dayAssignments = assignments.filter(assignment => {
      const assignmentStaffId = typeof assignment.staff === 'object' ? assignment.staff.id : assignment.staff;
      if (assignmentStaffId !== staffId) return false;
      const assignmentShift = shifts.find(s => s.id === assignment.shift);
      return assignmentShift && new Date(assignmentShift.date).toDateString() === new Date(shift.date).toDateString();
    });

    if (dayAssignments.length > 0) {
      return { valid: false, error: 'Staff member already assigned to this day' };
    }

    // Check rest rule (NOC shift blocks next day Day/Swing)
    if (template.shift_type === 'noc') {
      const nextDay = new Date(shift.date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Check if there are any day or swing shifts the next day
      const nextDayAssignments = assignments.filter(a => {
        // Handle both object and ID for shift
        let assignmentShift;
        if (typeof a.shift === 'object' && a.shift !== null) {
          assignmentShift = a.shift;
        } else {
          assignmentShift = shifts.find(s => s.id === a.shift);
        }
        
        if (!assignmentShift) return false;
        const assignmentDate = new Date(assignmentShift.date);
        return assignmentDate.toDateString() === nextDay.toDateString();
      });
      
      const hasNextDayShift = nextDayAssignments.some(a => {
        // Handle both object and ID for shift
        let assignmentShift;
        if (typeof a.shift === 'object' && a.shift !== null) {
          assignmentShift = a.shift;
        } else {
          assignmentShift = shifts.find(s => s.id === a.shift);
        }
        
        if (!assignmentShift) return false;
        
        // Handle both object and ID for shift_template
        let templateId = assignmentShift.shift_template;
        if (typeof assignmentShift.shift_template === 'object' && assignmentShift.shift_template !== null) {
          templateId = assignmentShift.shift_template.id;
        }
        
        const assignmentTemplate = shiftTemplates.find(t => t.id === templateId);
        return assignmentTemplate?.shift_type === 'day' || assignmentTemplate?.shift_type === 'swing';
      });
      
      if (hasNextDayShift) {
        return { valid: false, error: 'NOC shift followed by day/swing shift violates rest rule' };
      }
    }

    // Check weekly max hours
    const weekStart = getWeekStart(shift.date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weeklyHours = assignments
      .filter(assignment => {
        const assignmentStaffId = typeof assignment.staff === 'object' ? assignment.staff.id : assignment.staff;
        if (assignmentStaffId !== staffId) return false;
        const assignmentShift = shifts.find(s => s.id === assignment.shift);
        if (!assignmentShift) return false;
        
        const assignmentDate = new Date(assignmentShift.date);
        return assignmentDate >= weekStart && assignmentDate <= weekEnd;
      })
      .reduce((total, assignment) => {
        const assignmentShift = shifts.find(s => s.id === assignment.shift);
        let templateId = assignmentShift.shift_template;
        if (typeof assignmentShift.shift_template === 'object' && assignmentShift.shift_template !== null) {
          templateId = assignmentShift.shift_template.id;
        }
        const template = shiftTemplates.find(t => t.id === templateId);
        return total + (template?.duration_hours || 8);
      }, 0);

    const newShiftHours = template?.duration_hours || 8;
    if (weeklyHours + newShiftHours > (staffMember.max_hours_per_week || 40)) {
      return { valid: false, error: `Would exceed weekly max hours (${staffMember.max_hours_per_week || 40})` };
    }

    return { valid: true };
  };

  // Handle drag start
  const handleDragStart = (event, staffId) => {
    const staffMember = staff.find(s => s.id === parseInt(staffId));
    setDragData({ type: 'staff', staff: staffMember });
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    event.preventDefault();
    
    if (!dragData) {
      return;
    }

    const target = event.currentTarget;
    if (target.id && target.id.startsWith('shift-')) {
             let [shiftId, role] = target.id.replace('shift-', '').split('-');
       

       
       // Fallback: if role undefined, infer from template's required_roles or default to 'cna'
       if (!role || role.length < 3) { // Check if role is too short (like 'cn')
         const inferredShift = shifts.find(s => s.id === parseInt(shiftId));
         if (inferredShift) {
           let templateId = inferredShift.shift_template;
           if (typeof inferredShift.shift_template === 'object' && inferredShift.shift_template !== null) {
             templateId = inferredShift.shift_template.id;
           }
           const template = shiftTemplates.find(t => t.id === templateId);
           if (template && Array.isArray(template.required_roles) && template.required_roles.length > 0) {
             role = template.required_roles[0];
           } else {
             role = 'cna';
           }
         } else {
           role = 'cna';
         }
       }
      
                             // Check if assignment already exists
        const existingAssignment = assignments.find(a => {
          const assignmentStaffId = typeof a.staff === 'object' ? a.staff.id : a.staff;
          const assignmentShiftId = typeof a.shift === 'object' ? a.shift.id : a.shift;
          const isMatch = assignmentStaffId === dragData.staff.id && assignmentShiftId === parseInt(shiftId);
          return isMatch;
        });
        
        if (existingAssignment) {
          setValidationError(`Staff member ${dragData.staff.first_name} ${dragData.staff.last_name} is already assigned to this shift with role ${existingAssignment.assigned_role}`);
          setShowValidationDialog(true);
          setDragData(null);
          return;
        }
       
       // Validate assignment
       const validation = validateAssignment(dragData.staff.id, parseInt(shiftId), role);
       
       if (!validation.valid) {
         setValidationError(validation.error);
         setShowValidationDialog(true);
         setDragData(null);
         return;
       }

                                    // Create assignment
        const requestData = {
          staff: dragData.staff.id,
          shift: parseInt(shiftId),
          assigned_role: role
        };
       
               try {
          const response = await axios.post(`${API_BASE_URL}/api/scheduling/staff-assignments/`, requestData);
          
         // Update assignments state locally instead of full refresh
         const newAssignment = {
           id: response.data.id,
           staff: dragData.staff,
           shift: parseInt(shiftId),
           assigned_role: role
         };
         
         setAssignments(prevAssignments => [...prevAssignments, newAssignment]);
         
         if (onDataChange) onDataChange();
         setSuccessMessage(`Staff member ${dragData.staff.first_name} ${dragData.staff.last_name} assigned to shift.`);
         setShowSuccessMessage(true);
        
        // Show visual feedback
        const targetCell = document.getElementById(target.id);
        if (targetCell) {
          targetCell.style.backgroundColor = '#e8f5e8';
          targetCell.style.borderColor = '#6b7280';
          setTimeout(() => {
            targetCell.style.backgroundColor = '';
            targetCell.style.borderColor = '';
          }, 2000);
        }
                     } catch (error) {
          console.error('Error creating assignment:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            requestData: { staff: dragData.staff.id, shift: parseInt(shiftId), assigned_role: role }
          });
          
          // Show more detailed error information
          let errorMessage = 'Failed to create assignment';
          if (error.response?.data) {
            if (error.response.data.non_field_errors) {
              errorMessage = error.response.data.non_field_errors.join(', ');
            } else if (error.response.data.detail) {
              errorMessage = error.response.data.detail;
            } else if (typeof error.response.data === 'object') {
              errorMessage = Object.entries(error.response.data)
                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                .join('; ');
            }
          } else {
            errorMessage = error.message;
          }
          
          setError(errorMessage);
        }
    }
    
    setDragData(null);
  };

  // Auto-fill function
  const handleAutoFill = async () => {
    try {
      // Get all shifts for the week
      const weekDates = getWeekDates();
      const weekShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= weekDates[0] && shiftDate <= weekDates[6];
      });

      // For each shift, try to fill required roles
      for (const shift of weekShifts) {
        let templateId = shift.shift_template;
        if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
          templateId = shift.shift_template.id;
        }
        const template = shiftTemplates.find(t => t.id === templateId);
        const requiredRoles = (template && Array.isArray(template.required_roles) && template.required_roles.length > 0)
          ? template.required_roles
          : ['cna'];
        const requiredCount = shift.effective_staff_count || template?.required_staff_count || 1;

        for (const role of requiredRoles) {
          const currentAssignments = getAssignmentsForShift(shift.id);
          const roleAssignments = currentAssignments.filter(a => a.assigned_role === role);
          
          if (roleAssignments.length < requiredCount) {
            const needed = requiredCount - roleAssignments.length;
            const availableStaff = getAvailableStaff(role, new Date(shift.date), template.shift_type);
            
            // Sort by role fit > least hours > name
            const sortedStaff = availableStaff.sort((a, b) => {
              // Role fit (exact match first)
              if (a.role === role && b.role !== role) return -1;
              if (a.role !== role && b.role === role) return 1;
              
              // Least hours
              const aHours = getWeeklyHours(a.id, weekDates[0]);
              const bHours = getWeeklyHours(b.id, weekDates[0]);
              if (aHours !== bHours) return aHours - bHours;
              
              // Name
              return a.last_name.localeCompare(b.last_name);
            });

            // Assign staff
            for (let i = 0; i < Math.min(needed, sortedStaff.length); i++) {
              const staffMember = sortedStaff[i];
              const validation = validateAssignment(staffMember.id, shift.id, role);
              
              if (validation.valid) {
                try {
                  await axios.post(`${API_BASE_URL}/api/scheduling/staff-assignments/`, {
                    staff: staffMember.id,
                    shift: shift.id,
                    assigned_role: role
                  });
                } catch (error) {
                  console.error('Error auto-assigning staff:', error);
                }
              }
            }
          }
        }
      }

      // Refresh data
      fetchData();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error during auto-fill:', error);
      setError('Auto-fill failed');
    }
  };

  // Get weekly hours for a staff member
  const getWeeklyHours = (staffId, weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return assignments
      .filter(assignment => {
        const assignmentStaffId = typeof assignment.staff === 'object' ? assignment.staff.id : assignment.staff;
        if (assignmentStaffId !== staffId) return false;
        const assignmentShift = shifts.find(s => s.id === assignment.shift);
        if (!assignmentShift) return false;
        
        const assignmentDate = new Date(assignmentShift.date);
        return assignmentDate >= weekStart && assignmentDate <= weekEnd;
      })
      .reduce((total, assignment) => {
        const assignmentShift = shifts.find(s => s.id === assignment.shift);
        let templateId = assignmentShift.shift_template;
        if (typeof assignmentShift.shift_template === 'object' && assignmentShift.shift_template !== null) {
          templateId = assignmentShift.shift_template.id;
        }
        const template = shiftTemplates.find(t => t.id === templateId);
        return total + (template?.duration_hours || 8);
      }, 0);
  };

  // Fetch facilities
  const fetchFacilities = async () => {
    try {
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
        bed_count: access.facility.bed_count,
        created_at: access.facility.created_at,
        updated_at: access.facility.updated_at
      }));
      
      setFacilities(accessibleFacilities);
    } catch (error) {
      console.error('Error fetching user facilities:', error);
    }
  };

  // Create/Update shift function
  const handleCreateShift = async () => {
    if (!createShiftData.date || !createShiftData.shift_template || !createShiftData.start_time || !createShiftData.end_time || !createShiftData.duration_hours) {
      setError('Please fill in all required fields');
      return;
    }

    setCreateShiftLoading(true);
    setError(null);

    try {
      const formattedDate = createShiftData.date;
      
      // Ensure we always send just the ID, not the object
      let shiftTemplateId = createShiftData.shift_template;
      if (typeof shiftTemplateId === 'object' && shiftTemplateId !== null) {
        shiftTemplateId = shiftTemplateId.id;
      }
      
      const requestData = {
        date: formattedDate,
        shift_template: parseInt(shiftTemplateId),
        start_time: createShiftData.start_time,
        end_time: createShiftData.end_time,
        duration_hours: createShiftData.duration_hours,
        notes: createShiftData.notes || ''
      };
      
      let response;
      
      // Check if this is an edit operation (we have an existing shift template ID)
      const isEdit = createShiftData.shift_template && typeof createShiftData.shift_template === 'string' && createShiftData.shift_template.length > 0;
      
      if (isEdit) {
        // Try to find existing shift to update
        const existingShift = shifts.find(shift => 
          shift.date === createShiftData.date && 
          (shift.shift_template?.id === createShiftData.shift_template || shift.shift_template === createShiftData.shift_template)
        );
        
        if (existingShift) {
          // Update existing shift
          response = await axios.put(`${API_BASE_URL}/api/scheduling/shifts/${existingShift.id}/`, requestData);
        } else {
          // Create new shift if no existing shift found
          response = await axios.post(`${API_BASE_URL}/api/scheduling/shifts/`, requestData);
        }
      } else {
        // Create new shift
        response = await axios.post(`${API_BASE_URL}/api/scheduling/shifts/`, requestData);
      }
      
      // Close dialog and reset form
      setShowCreateShiftDialog(false);
      setCreateShiftData({ date: '', shift_template: '', start_time: '', end_time: '', duration_hours: 0, notes: '' });
      
      // Refresh data to show new/updated shift
      await fetchData();
      if (onDataChange) onDataChange();
      
      const isUpdate = isEdit && response.data.id;
      setSuccessMessage(isUpdate ? 'Shift updated successfully!' : 'Shift created successfully!');
      setShowSuccessMessage(true);
      
    } catch (error) {
      console.error('Error creating/updating shift:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const isEdit = createShiftData.shift_template && typeof createShiftData.shift_template === 'string' && createShiftData.shift_template.length > 0;
      let errorMessage = isEdit ? 'Failed to update shift' : 'Failed to create shift';
      
      if (error.response?.data) {
        if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors.join(', ');
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          errorMessage = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
        }
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setCreateShiftLoading(false);
    }
  };

  // Open create shift dialog
  const openCreateShiftDialog = (date, shiftType) => {
    setCreateShiftData({
      date: date.toISOString().split('T')[0],
      shift_template: '',
      start_time: '',
      end_time: '',
      duration_hours: 0,
      notes: `${shiftType} shift`
    });
    setShowCreateShiftDialog(true);
  };

  // Handle shift click for edit/delete
  const handleShiftClick = (shift) => {
    // Open edit dialog for existing shift
    setCreateShiftData({
      date: shift.date,
      shift_template: shift.shift_template?.id || shift.shift_template || '',
      notes: shift.notes || ''
    });
    setShowCreateShiftDialog(true);
  };

  // Handle shift deletion
  const handleDeleteShift = async (shiftId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/scheduling/shifts/${shiftId}/`);
      // Refresh data after deletion
      await fetchData();
      if (onDataChange) onDataChange();
      setSuccessMessage('Shift deleted successfully!');
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Error deleting shift:', error);
      setError('Failed to delete shift');
    }
  };

  // Handle clearing all shifts for the week
  const handleClearAllShifts = async () => {
    try {
      setLoading(true);
      
      // Get all shifts for the current week
      const weekShifts = shifts.filter(shift => isDateInWeek(shift.date));
      
      if (weekShifts.length === 0) {
        setSuccessMessage('No shifts to delete for this week.');
        setShowSuccessMessage(true);
        setShowClearShiftsDialog(false);
        return;
      }
      
      // Delete each shift
      let deletedCount = 0;
      for (const shift of weekShifts) {
        try {
          await axios.delete(`${API_BASE_URL}/api/scheduling/shifts/${shift.id}/`);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete shift ${shift.id}:`, error);
        }
      }
      
      // Refresh data to show cleared state
      await fetchData();
      if (onDataChange) onDataChange();
      
      setSuccessMessage(`Week cleared successfully! Removed ${deletedCount} shifts.`);
      setShowSuccessMessage(true);
      setShowClearShiftsDialog(false);
      
    } catch (error) {
      console.error('Error clearing week:', error);
      setError('Failed to clear week');
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const exportCSV = () => {
    const weekDates = getWeekDates();
    let csv = 'Date,Shift,Role,Staff Member,Start Time,End Time\n';
    
    weekDates.forEach(date => {
      shiftTypes.forEach(shiftType => {
        const dayShifts = getShiftsForDay(date, shiftType);
        dayShifts.forEach(shift => {
          const assignments = getAssignmentsForShift(shift.id);
          assignments.forEach(assignment => {
            const staffMember = staff.find(s => s.id === assignment.staff);
            let templateId = shift.shift_template;
            if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
              templateId = shift.shift_template.id;
            }
            const template = shiftTemplates.find(t => t.id === templateId);
            const startTime = shiftTimeRanges[shiftType].split('-')[0];
            const endTime = shiftTimeRanges[shiftType].split('-')[1];
            
            csv += `${date.toLocaleDateString()},${shiftType},${assignment.assigned_role},${staffMember?.first_name} ${staffMember?.last_name},${startTime},${endTime}\n`;
          });
        });
      });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${weekDates[0].toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportICS = () => {
    const weekDates = getWeekDates();
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Acuity Staffing//EN\n';
    
         staff.forEach(staffMember => {
       const staffAssignments = assignments.filter(a => {
         const assignmentStaffId = typeof a.staff === 'object' ? a.staff.id : a.staff;
         return assignmentStaffId === staffMember.id;
       });
      
      staffAssignments.forEach(assignment => {
        const shift = shifts.find(s => s.id === assignment.shift);
        let templateId = shift.shift_template;
        if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
          templateId = shift.shift_template.id;
        }
        const template = shiftTemplates.find(t => t.id === templateId);
        const shiftDate = new Date(shift.date);
        
        // Determine shift times based on template
        let startTime, endTime;
        if (template.shift_type === 'day') {
          startTime = '06:00';
          endTime = '14:00';
        } else if (template.shift_type === 'swing') {
          startTime = '14:00';
          endTime = '22:00';
        } else if (template.shift_type === 'noc') {
          startTime = '22:00';
          endTime = '06:00';
        }
        
        const startDateTime = new Date(shiftDate);
        const [startHour, startMin] = startTime.split(':');
        startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0);
        
        const endDateTime = new Date(shiftDate);
        const [endHour, endMin] = endTime.split(':');
        endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0);
        
        ics += `BEGIN:VEVENT\n`;
        ics += `UID:${assignment.id}@acuitystaffing.com\n`;
        ics += `DTSTART:${startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        ics += `DTEND:${endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        ics += `SUMMARY:${template.name} - ${assignment.assigned_role.toUpperCase()}\n`;
        ics += `DESCRIPTION:${staffMember.first_name} ${staffMember.last_name} - ${assignment.assigned_role.toUpperCase()}\n`;
        ics += `END:VEVENT\n`;
      });
    });
    
    ics += 'END:VCALENDAR';
    
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${weekDates[0].toISOString().split('T')[0]}.ics`;
    a.click();
  };

  if (!selectedFacility) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          Please select a facility to view the planner grid
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

  const weekDates = getWeekDates();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                 <Box>
           <Typography variant="h5" component="h2" gutterBottom>
             Weekly Planner Grid
           </Typography>
                       <Typography variant="body2" color="textSecondary">
              Drag & drop staff assignments with validation rules.
            </Typography>
            <Typography variant="h6" color="text.primary" sx={{ mt: 1, fontWeight: 'bold' }}>
              Week of {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
             Facility: {facilities.find(f => f.id === parseInt(selectedFacility))?.name || 'Unknown'}
           </Typography>
         </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={() => {
              const newWeek = new Date(currentWeek);
              newWeek.setDate(newWeek.getDate() - 7);
              setCurrentWeek(newWeek);
            }}
          >
            ← Previous Week
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setCurrentWeek(new Date('2025-08-18'))}
          >
            Week of 8/18
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setCurrentWeek(new Date())}
          >
            Current Week
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              const newWeek = new Date(currentWeek);
              newWeek.setDate(newWeek.getDate() + 7);
              setCurrentWeek(newWeek);
            }}
          >
            Next Week →
          </Button>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                     <Button variant="outlined" onClick={handleAutoFill} startIcon={<ScheduleIcon />}>
             Auto-Fill
           </Button>
                                 <Button 
            variant="outlined" 
            onClick={async () => {
              try {
                setLoading(true);
                
                // Delete ALL assignments (not just current week)
                if (assignments.length === 0) {
                  setSuccessMessage('No assignments to clear.');
                  setShowSuccessMessage(true);
                  return;
                }
                
                // Delete each assignment
                let deletedCount = 0;
                for (const assignment of assignments) {
                  try {
                    await axios.delete(`${API_BASE_URL}/api/scheduling/staff-assignments/${assignment.id}/`);
                    deletedCount++;
                  } catch (error) {
                    console.error(`Failed to delete assignment ${assignment.id}:`, error);
                  }
                }
                
                // Clear local state immediately
                setAssignments([]);
                
                // Refresh data to show cleared state
                await fetchData();
                if (onDataChange) onDataChange();
                
                setSuccessMessage(`Schedule cleared successfully! Removed ${deletedCount} assignments.`);
                setShowSuccessMessage(true);
                
              } catch (error) {
                console.error('Error clearing schedule:', error);
                setError('Failed to clear schedule');
              } finally {
                setLoading(false);
              }
            }} 
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            disabled={loading}
            color="error"
          >
            {loading ? 'Clearing...' : 'Clear All Assignments'}
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => setShowClearShiftsDialog(true)}
            color="error"
          >
            Clear All Shifts
          </Button>
          <Button variant="outlined" onClick={exportCSV} startIcon={<DownloadIcon />}>
            Export CSV
          </Button>
          <Button variant="outlined" onClick={exportICS} startIcon={<CalendarIcon />}>
            Export ICS
          </Button>
          <Button variant="outlined" onClick={() => window.print()} startIcon={<PrintIcon />}>
            Print View
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {showSuccessMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setShowSuccessMessage(false)}>
          {successMessage}
        </Alert>
      )}



      {/* Week Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'table', 
          width: '100%', 
          borderCollapse: 'collapse',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          {/* Summary Header */}
          <Box sx={{ 
            display: 'table-header-group',
            backgroundColor: 'primary.main',
            color: 'white'
          }}>
            <Box sx={{ display: 'table-row' }}>
              <Box sx={{ 
                display: 'table-cell', 
                p: 2, 
                textAlign: 'center',
                borderRight: '1px solid',
                borderColor: 'rgba(255,255,255,0.3)',
                fontWeight: 'bold'
              }}>
                Total Shifts This Week
              </Box>
              <Box sx={{ 
                display: 'table-cell', 
                p: 2, 
                textAlign: 'center',
                borderRight: '1px solid',
                borderColor: 'rgba(255,255,255,0.3)',
                fontWeight: 'bold'
              }}>
                Staff Assignments
              </Box>
              <Box sx={{ 
                display: 'table-cell', 
                p: 2, 
                textAlign: 'center',
                borderRight: '1px solid',
                borderColor: 'rgba(255,255,255,0.3)',
                fontWeight: 'bold'
              }}>
                Staff Near Max Hours
              </Box>
              <Box sx={{ 
                display: 'table-cell', 
                p: 2, 
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                Understaffed Shifts
              </Box>
            </Box>
          </Box>
          
          {/* Summary Values */}
          <Box sx={{ display: 'table-row-group' }}>
            <Box sx={{ display: 'table-row' }}>
              <Box sx={{ 
                display: 'table-cell', 
                p: 2, 
                textAlign: 'center',
                borderRight: '1px solid',
                borderColor: 'divider',
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {shifts.filter(shift => isDateInWeek(shift.date)).length}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'table-cell', 
                p: 2, 
                textAlign: 'center',
                borderRight: '1px solid',
                borderColor: 'divider',
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {assignments.filter(assignment => {
                    const shift = shifts.find(s => s.id === assignment.shift);
                    return shift && isDateInWeek(shift.date);
                  }).length}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'table-cell', 
                p: 2, 
                textAlign: 'center',
                borderRight: '1px solid',
                borderColor: 'divider',
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {staff.filter(member => {
                    const weeklyHours = getWeeklyHours(member.id, weekDates[0]);
                    const maxHours = member.max_hours_per_week || 40;
                    return weeklyHours > maxHours * 0.8;
                  }).length}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'table-cell', 
                p: 2, 
                textAlign: 'center',
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {shifts.filter(shift => {
                    if (!isDateInWeek(shift.date)) return false;
                    
                    let templateId = shift.shift_template;
                    if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
                      templateId = shift.shift_template.id;
                    }
                    const template = shiftTemplates.find(t => t.id === templateId);
                    const requiredStaff = shift.effective_staff_count || template?.required_staff_count || 1;
                    const assignments = getAssignmentsForShift(shift.id);
                    
                    return assignments.length < requiredStaff;
                  }).length}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Quick Actions Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Quick Start:</strong> 
          • Create shifts first in "Shift Calendar" tab, then drag staff here to assign them
          • Use "Auto-Fill" to automatically assign available staff to open positions
          • Drag staff members from the left sidebar to any shift cell below
        </Typography>
      </Alert>



        {shifts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" display="block">
              <strong>Shifts Found:</strong>
            </Typography>
            {shifts.slice(0, 3).map((shift, index) => {
              try {
                // Safely handle shift.date - it might be a string or Date object
                let dateDisplay = 'Unknown Date';
                try {
                  if (shift.date) {
                    if (typeof shift.date === 'string') {
                      dateDisplay = new Date(shift.date).toLocaleDateString();
                    } else if (shift.date instanceof Date) {
                      dateDisplay = shift.date.toLocaleDateString();
                    } else {
                      dateDisplay = 'Invalid Date';
                    }
                  }
                } catch (error) {
                  dateDisplay = 'Error parsing date';
                }
                
                let templateId = shift.shift_template;
                if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
                  templateId = shift.shift_template.id;
                }
                const template = shiftTemplates.find(t => t.id === templateId);
                
                return (
                  <Typography key={index} variant="caption" display="block" sx={{ ml: 2 }}>
                    {dateDisplay} - Template: {template?.name || 'Unknown'}
                  </Typography>
                );
              } catch (error) {
                console.error('Error rendering shift:', error, shift);
                return (
                  <Typography key={index} variant="caption" display="block" sx={{ ml: 2, color: 'error.main' }}>
                    Error rendering shift {index}
                  </Typography>
                );
              }
            })}
          </Box>
        )}

      {/* Main Content Layout - Sidebar + Grid */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* Staff Sidebar - Fixed Position */}
        <Box sx={{ 
          width: 320, 
          flexShrink: 0,
          position: 'sticky',
          top: 20
        }}>
            <Paper sx={{ p: 2, height: 'fit-content' }}>
              <Typography variant="h6" gutterBottom>
                Staff
              </Typography>
              
              {/* Search and Filter */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Role Filter</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role Filter"
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="rn">RN</MenuItem>
                  <MenuItem value="lpn">LPN</MenuItem>
                  <MenuItem value="cna">CNA</MenuItem>
                  <MenuItem value="med_tech">Med Tech</MenuItem>
                  <MenuItem value="aide">Aide</MenuItem>
                </Select>
              </FormControl>

                             {/* Staff Count */}
               <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                 <Typography variant="caption" color="textSecondary">
                   Showing {staff.filter(member => {
                     const matchesSearch = `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
                     const matchesRole = roleFilter === 'all' || member.role === roleFilter;
                     return matchesSearch && matchesRole;
                   }).length} of {staff.length} staff members
                 </Typography>
               </Box>
               
               {/* Status Legend */}
               <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                 <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" sx={{ mb: 1 }}>
                   Status:
                 </Typography>
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'success.main' }} />
                     <Typography variant="caption" color="text.secondary">Available</Typography>
                   </Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'info.main' }} />
                     <Typography variant="caption" color="text.secondary">Assigned this week</Typography>
                   </Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'warning.main' }} />
                     <Typography variant="caption" color="text.secondary">Near max hours</Typography>
                   </Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'error.main' }} />
                     <Typography variant="caption" color="text.secondary">Over max hours</Typography>
                   </Box>
                 </Box>
               </Box>

              {/* Staff List */}
              <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                {/* Staff Table Header */}
                <Box sx={{ 
                  p: 1.5, 
                  backgroundColor: 'grey.100', 
                  color: 'text.primary', 
                  borderRadius: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'grey.300'
                }}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Typography variant="caption" fontWeight="bold">Staff</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" fontWeight="bold">Role</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" fontWeight="bold">Hours</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="caption" fontWeight="bold">Status</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Staff Table Rows */}
                {staff
                  .filter(member => {
                    const matchesSearch = `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
                    return matchesSearch && matchesRole;
                  })
                  .map((member) => {
                    const weeklyHours = getWeeklyHours(member.id, weekDates[0]);
                    const maxHours = member.max_hours_per_week || 40;
                    const hoursWarning = weeklyHours > maxHours * 0.8;
                    const hoursCritical = weeklyHours > maxHours;
                    
                    return (
                      <Box
                        key={member.id}
                        draggable={true}
                        onDragStart={(event) => handleDragStart(event, member.id)}
                        sx={{
                          cursor: 'grab',
                          p: 1.5,
                          mb: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: hoursCritical ? 'error.light' : hoursWarning ? 'warning.light' : 'grey.300',
                          backgroundColor: hoursCritical ? 'error.50' : hoursWarning ? 'warning.50' : 'background.paper',
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            backgroundColor: 'grey.50',
                            transform: 'translateY(-1px)',
                            boxShadow: 2
                          },
                          '&:active': { cursor: 'grabbing' }
                        }}
                      >
                        <Grid container spacing={1} alignItems="center">
                          {/* Staff Name */}
                          <Grid item xs={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ 
                                width: 24, 
                                height: 24, 
                                bgcolor: hoursCritical ? 'error.main' : hoursWarning ? 'warning.main' : 'grey.600',
                                fontSize: '0.75rem'
                              }}>
                                {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                              </Avatar>
                              <Typography variant="caption" fontWeight="bold" noWrap>
                                {member.first_name} {member.last_name}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Role */}
                          <Grid item xs={3}>
                            <Chip 
                              label={member.role.toUpperCase()} 
                              size="small" 
                              color="default" 
                              variant="outlined"
                              sx={{ fontSize: '0.6rem', height: 20, borderColor: 'grey.400' }}
                            />
                          </Grid>
                          
                          {/* Hours */}
                          <Grid item xs={3}>
                            <Typography variant="caption" color={hoursCritical ? 'error' : hoursWarning ? 'warning' : 'textPrimary'}>
                              {weeklyHours}/{maxHours}h
                            </Typography>
                          </Grid>
                          
                                                     {/* Status */}
                           <Grid item xs={2}>
                             <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                               {(() => {
                                                                   // Check if staff is assigned to any shift this week
                                  const hasWeekAssignment = assignments.some(assignment => {
                                    const assignmentStaffId = typeof assignment.staff === 'object' ? assignment.staff.id : assignment.staff;
                                    if (assignmentStaffId !== member.id) return false;
                                    const assignmentShift = shifts.find(s => s.id === assignment.shift);
                                    return assignmentShift && isDateInWeek(assignmentShift.date);
                                  });
                                 
                                 if (hoursCritical) {
                                   return <Typography variant="caption" color="error" fontWeight="bold">!</Typography>;
                                 } else if (hoursWarning) {
                                   return <Typography variant="caption" color="warning" fontWeight="bold">~</Typography>;
                                 } else if (hasWeekAssignment) {
                                   return <Typography variant="caption" color="info" fontWeight="bold">A</Typography>;
                                 } else {
                                   return <Typography variant="caption" color="success">✓</Typography>;
                                 }
                               })()}
                             </Box>
                           </Grid>
                        </Grid>
                        
                        {/* Drag Instructions */}
                        <Box sx={{ 
                          mt: 1, 
                          p: 0.5, 
                          backgroundColor: 'grey.100', 
                          borderRadius: 0.5,
                          textAlign: 'center',
                          border: '1px solid',
                          borderColor: 'grey.200'
                        }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Drag to assign to shifts
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            </Paper>
        </Box>

        {/* Weekly Grid */}
        <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2, overflow: 'auto' }}>
              <Box sx={{ minWidth: 800 }}>
                {/* Table Structure */}
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  {/* Table Header */}
                  <Box component="thead">
                    <Box component="tr" sx={{ borderBottom: '2px solid', borderColor: 'divider' }}>
                      <Box component="th" sx={{ 
                        p: 2, 
                        textAlign: 'left', 
                        width: '15%',
                        borderBottom: '2px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Shift
                        </Typography>
                      </Box>
                                             {weekDates.map((date, index) => (
                         <Box component="th" key={index} sx={{ 
                           p: 2, 
                           textAlign: 'center', 
                           width: '12%',
                           borderBottom: '2px solid',
                           borderColor: 'divider',
                           backgroundColor: 'grey.50'
                         }}>
                           <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                             {weekDays[index]}
                           </Typography>
                           <Typography variant="h6" fontWeight="bold" display="block" sx={{ mt: 1, color: 'text.primary' }}>
                             {date.getDate()}
                           </Typography>
                           <Typography variant="body2" fontWeight="bold" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                             {date.toLocaleDateString('en-US', { month: 'short' })}
                           </Typography>
                           <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                             {date.toLocaleDateString('en-US', { weekday: 'short' })}
                           </Typography>
                         </Box>
                       ))}
                    </Box>
                  </Box>

                  {/* Table Body */}
                  <Box component="tbody">
                    {shiftTypes.map((shiftType, shiftIndex) => (
                      <Box component="tr" key={shiftType} sx={{ 
                        borderBottom: '1px solid', 
                        borderColor: 'divider',
                        '&:hover': { backgroundColor: 'grey.50' }
                      }}>
                        {/* Shift Type Column */}
                        <Box component="td" sx={{ 
                          p: 2, 
                          verticalAlign: 'top',
                          borderRight: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: 'grey.100'
                        }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Typography variant="body2" fontWeight="bold">
                              {shiftType}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {shiftTimeRanges[shiftType]}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Day Columns */}
                        {weekDates.map((date, dayIndex) => {
                          const dayShifts = getShiftsForDay(date, shiftType);
                          const shift = dayShifts[0]; // Assume one shift per day per type
                          
                          // Debug: Also check for any shifts on this date regardless of type
                          if (!shift) {
                            const anyShiftOnDate = shifts.find(s => {
                              const shiftDate = new Date(s.date);
                              return shiftDate.toDateString() === date.toDateString();
                            });
                            

                          }
                          
                                                     if (!shift) {
                             return (
                               <Box component="td" key={dayIndex} sx={{ 
                                 p: 1, 
                                 textAlign: 'center',
                                 verticalAlign: 'top',
                                 borderRight: dayIndex < 6 ? '1px solid' : 'none',
                                 borderColor: 'divider'
                               }}>
                                 <Box sx={{ 
                                   height: 100, 
                                   border: '2px dashed', 
                                   borderColor: 'divider',
                                   borderRadius: 1,
                                   display: 'flex',
                                   flexDirection: 'column',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   backgroundColor: 'grey.50',
                                   '&:hover': {
                                     borderColor: 'grey.500',
                                     backgroundColor: 'grey.100'
                                   }
                                 }}>
                                   <Typography variant="caption" color="textSecondary" align="center">
                                     No Shift
                                   </Typography>
                                   <Button
                                     variant="outlined"
                                     size="small"
                                     onClick={() => openCreateShiftDialog(date, shiftType)}
                                     sx={{ 
                                       mt: 1, 
                                       fontSize: '0.7rem',
                                       minWidth: 'auto',
                                       px: 1
                                     }}
                                   >
                                     Create Shift
                                   </Button>
                                 </Box>
                               </Box>
                             );
                           }

                          const shiftAssignments = getAssignmentsForShift(shift.id);
                          const requiredStaff = getRequiredStaff(shift);
                          let templateId = shift.shift_template;
                          if (typeof shift.shift_template === 'object' && shift.shift_template !== null) {
                            templateId = shift.shift_template.id;
                          }
                          const template = shiftTemplates.find(t => t.id === templateId);
                          const requiredRoles = (template && Array.isArray(template.required_roles) && template.required_roles.length > 0)
                            ? template.required_roles
                            : ['cna'];

                          return (
                            <Box component="td" key={dayIndex} sx={{ 
                              p: 1, 
                              textAlign: 'center',
                              verticalAlign: 'top',
                              borderRight: dayIndex < 6 ? '1px solid' : 'none',
                              borderColor: 'divider'
                            }}>
                              <Tooltip title="Click to edit shift details" arrow>
                                <Box
                                  id={`shift-${shift.id}-${requiredRoles[0]}`}
                                  onDragOver={(event) => event.preventDefault()}
                                  onDrop={handleDragEnd}
                                  onDragEnter={(event) => {
                                    event.preventDefault();
                                    event.currentTarget.style.backgroundColor = 'grey.100';
                                    event.currentTarget.style.borderColor = 'grey.500';
                                    event.currentTarget.style.transform = 'scale(1.02)';
                                  }}
                                  onDragLeave={(event) => {
                                    event.currentTarget.style.backgroundColor = 'background.paper';
                                    event.currentTarget.style.borderColor = 'divider';
                                    event.currentTarget.style.transform = 'scale(1)';
                                  }}
                                  onClick={() => handleShiftClick(shift)}
                                  sx={{
                                    minHeight: 100,
                                    border: '2px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    p: 1,
                                    backgroundColor: 'background.paper',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    '&:hover': {
                                      borderColor: 'grey.600',
                                      backgroundColor: 'grey.50',
                                      boxShadow: 2
                                    }
                                  }}
                                >
                                {/* Shift Info with Delete Button */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Typography variant="caption" color="textSecondary">
                                    {template?.name || 'Custom'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShiftClick(shift);
                                      }}
                                      sx={{ 
                                        p: 0, 
                                        minWidth: 20,
                                        color: 'grey.600',
                                        '&:hover': { backgroundColor: 'grey.100' }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to delete this ${shiftType} shift?`)) {
                                          handleDeleteShift(shift.id);
                                        }
                                      }}
                                      sx={{ 
                                        p: 0, 
                                        minWidth: 20,
                                        color: 'error.main',
                                        '&:hover': { backgroundColor: 'error.50' }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                                
                                {/* Role Chips */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 1 }}>
                                  {requiredRoles.map((role, roleIndex) => {
                                    const roleAssignments = shiftAssignments.filter(a => a.assigned_role === role);
                                    const filled = roleAssignments.length;
                                    // Use effective_staff_count from the shift data instead of hardcoded 1
                                    const required = shift.effective_staff_count || 1;
                                    
                                    return (
                                      <Chip
                                        key={roleIndex}
                                        label={`${role.toUpperCase()} ${filled}/${required}`}
                                        size="small"
                                        color={filled >= required ? 'success' : 'warning'}
                                        variant={filled >= required ? 'filled' : 'outlined'}
                                      />
                                    );
                                  })}
                                </Box>
                                
                                {/* Assignment Summary */}
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                                  {shiftAssignments.length}/{requiredStaff} filled
                                </Typography>
                                

                                
                                                                 {/* Show Assigned Staff */}
                                 {shiftAssignments.length > 0 && (
                                   <Box sx={{ mt: 1, p: 0.5, backgroundColor: 'grey.100', borderRadius: 0.5, border: '1px solid', borderColor: 'grey.200' }}>
                                     {shiftAssignments.map((assignment, index) => {
                                       const staffId = typeof assignment.staff === 'object' ? assignment.staff.id : assignment.staff;
                                       const staffMember = staff.find(s => s.id === staffId);
                                       return (
                                         <Typography key={index} variant="caption" color="text.secondary" display="block">
                                           ✓ {staffMember?.first_name} {staffMember?.last_name} ({assignment.assigned_role})
                                         </Typography>
                                       );
                                     })}
                                   </Box>
                                 )}
                                 
                                 {/* Show Available Staff Count */}
                                 {shiftAssignments.length < requiredStaff && (
                                   <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                     {requiredStaff - shiftAssignments.length} more staff needed
                                   </Typography>
                                 )}
                                
                                {/* Drop Zone Indicator */}
                                {shiftAssignments.length < requiredStaff && (
                                  <Box sx={{ 
                                    mt: 1, 
                                    p: 0.5, 
                                    backgroundColor: 'grey.100', 
                                    borderRadius: 0.5,
                                    border: '1px dashed',
                                    borderColor: 'grey.400'
                                  }}>
                                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                                      Drop Staff Here
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Edit Instructions */}
                                <Box sx={{ 
                                  mt: 0.5, 
                                  p: 0.5, 
                                  backgroundColor: 'grey.50', 
                                  borderRadius: 0.5,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 0.5
                                }}>
                                  <EditIcon fontSize="small" sx={{ fontSize: '0.6rem', color: 'grey.600' }} />
                                  <Typography variant="caption" color="textSecondary" align="center" display="block" sx={{ fontSize: '0.6rem' }}>
                                    Click to edit shift
                                  </Typography>
                                </Box>
                              </Box>
                            </Tooltip>
                            </Box>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Paper>
        </Box>
      </Box>

      {/* Help Section */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          How to Use the Planner Grid
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.primary" gutterBottom>
              🎯 Getting Started
            </Typography>
            <Typography variant="body2" paragraph>
              1. <strong>Create Shifts:</strong> First go to "Shift Calendar" tab to create shifts for the week
            </Typography>
            <Typography variant="body2" paragraph>
              2. <strong>Drag Staff:</strong> Drag staff members from the left sidebar to shift cells
            </Typography>
            <Typography variant="body2" paragraph>
              3. <strong>Auto-Fill:</strong> Use the "Auto-Fill" button to automatically assign available staff
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.primary" gutterBottom>
              📊 Understanding the Grid
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Green Chips:</strong> Role requirements fully met
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Orange Chips:</strong> Role requirements partially met
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Dashed Borders:</strong> No shift created for that time slot
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Validation Error Dialog */}
      <Dialog open={showValidationDialog} onClose={() => setShowValidationDialog(false)}>
        <DialogTitle>Assignment Validation Error</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 1 }}>
            {validationError}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowValidationDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>

             {/* Create/Edit Shift Dialog */}
       <Dialog open={showCreateShiftDialog} onClose={() => setShowCreateShiftDialog(false)} maxWidth="sm" fullWidth>
         <DialogTitle>{createShiftData.shift_template ? 'Edit Shift' : 'Create New Shift'}</DialogTitle>
         <DialogContent>
           <Box sx={{ pt: 2 }}>
             <TextField
               fullWidth
               label="Date *"
               type="date"
               value={createShiftData.date}
               onChange={(e) => setCreateShiftData({ ...createShiftData, date: e.target.value })}
               InputLabelProps={{ shrink: true }}
               sx={{ mb: 2 }}
               required
               error={!createShiftData.date}
               helperText={!createShiftData.date ? 'Date is required' : ''}
             />
             
                           <FormControl fullWidth sx={{ mb: 2 }} required error={!createShiftData.shift_template}>
                <InputLabel>Shift Template *</InputLabel>
                <Select
                  value={createShiftData.shift_template}
                  onChange={(e) => {
                    const selectedTemplateId = e.target.value;
                    setCreateShiftData({ ...createShiftData, shift_template: selectedTemplateId });
                    
                    // Auto-populate time fields if a template is selected
                    if (selectedTemplateId) {
                      const selectedTemplate = shiftTemplates.find(t => t.id === selectedTemplateId);
                      if (selectedTemplate) {
                        setCreateShiftData(prev => ({
                          ...prev,
                          start_time: selectedTemplate.start_time || '',
                          end_time: selectedTemplate.end_time || '',
                          duration_hours: selectedTemplate.duration_hours || 0
                        }));
                      }
                    }
                  }}
                  label="Shift Template *"
                  required
                >
                  <MenuItem value="">
                    <em>Select a template</em>
                  </MenuItem>
                  {shiftTemplates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.shift_type || 'No type'})
                    </MenuItem>
                  ))}
                </Select>
                {!createShiftData.shift_template && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    Shift template is required
                  </Typography>
                )}
              </FormControl>
              
              {/* Time fields */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Start Time *"
                    type="time"
                    value={createShiftData.start_time}
                    onChange={(e) => setCreateShiftData({ ...createShiftData, start_time: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                    error={!createShiftData.start_time}
                    helperText={!createShiftData.start_time ? 'Start time is required' : ''}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="End Time *"
                    type="time"
                    value={createShiftData.end_time}
                    onChange={(e) => setCreateShiftData({ ...createShiftData, end_time: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                    error={!createShiftData.end_time}
                    helperText={!createShiftData.end_time ? 'End time is required' : ''}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Duration (hours) *"
                    type="number"
                    value={createShiftData.duration_hours}
                    onChange={(e) => setCreateShiftData({ ...createShiftData, duration_hours: parseFloat(e.target.value) || 0 })}
                    required
                    error={!createShiftData.duration_hours}
                    helperText={!createShiftData.duration_hours ? 'Duration is required' : ''}
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Grid>
              </Grid>

             
             <TextField
               fullWidth
               label="Notes (Optional)"
               multiline
               rows={3}
               value={createShiftData.notes}
               onChange={(e) => setCreateShiftData({ ...createShiftData, notes: e.target.value })}
               placeholder="Additional notes about this shift..."
             />
           </Box>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setShowCreateShiftDialog(false)} disabled={createShiftLoading}>
             Cancel
           </Button>
                       <Button 
              onClick={handleCreateShift} 
              variant="contained" 
              disabled={createShiftLoading || !createShiftData.date || !createShiftData.shift_template || !createShiftData.start_time || !createShiftData.end_time || !createShiftData.duration_hours}
              startIcon={createShiftLoading ? <CircularProgress size={16} /> : null}
            >
              {createShiftLoading ? (createShiftData.shift_template ? 'Updating...' : 'Creating...') : (createShiftData.shift_template ? 'Update Shift' : 'Create Shift')}
            </Button>
         </DialogActions>
       </Dialog>

      {/* Clear All Shifts Confirmation Dialog */}
      <Dialog open={showClearShiftsDialog} onClose={() => setShowClearShiftsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clear All Shifts</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Warning:</strong> This action will permanently delete ALL shifts for the current week.
              </Typography>
            </Alert>
            <Typography variant="body2" paragraph>
              Are you sure you want to clear all shifts for the week of{' '}
              {getWeekDates()[0].toLocaleDateString()} - {getWeekDates()[6].toLocaleDateString()}?
            </Typography>
            <Typography variant="body2" color="error.main">
              This action cannot be undone. All shift data and staff assignments will be lost.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearShiftsDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleClearAllShifts} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? 'Clearing...' : 'Clear All Shifts'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlannerGrid;
