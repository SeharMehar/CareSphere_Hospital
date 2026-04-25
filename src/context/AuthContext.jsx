import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { ROLES } from '../dummyData';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [applications, setApplications] = useState([]); 
  const [tasks, setTasks] = useState([]);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  // Ref to prevent double-fetching profile when login() and onAuthStateChange fire together
  const isFetchingProfile = useRef(false);

  // Helper to find profile and role from SQL tables based on email
  const fetchProfileByEmail = async (email) => {
    // PostgreSQL stores unquoted identifiers as lowercase
    const tables = ['admins', 'doctor', 'nurse', 'receptionist', 'wardboy', 'patient'];
    const emailFields = { admins: 'username', doctor: 'email', nurse: 'email', receptionist: 'email', wardboy: 'email', patient: 'email' };
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .ilike(emailFields[table], email.trim())
        .maybeSingle(); // maybeSingle() returns null data (not an error) when no rows found
      
      if (error) {
        console.error(`[Auth Debug] Error querying table ${table}:`, error.message);
        continue;
      }
      
      if (data) {
        console.log(`[Auth Debug] Found user in table: ${table}`, data);
        let role = table;
        if (role === 'doctor') role = ROLES.DOCTOR;
        else if (role === 'admins') role = ROLES.ADMIN;
        else if (role === 'nurse') role = ROLES.NURSE;
        else if (role === 'receptionist') role = ROLES.RECEPTIONIST;
        else if (role === 'wardboy') role = ROLES.WARDBOY;
        else if (role === 'patient') role = ROLES.PATIENT;
        
        return { 
          id: data.adminid || data.docid || data.pid || data.nurseid || data.repid || data.wardbid,
          name: data.name || data.pname || data.nursename || data.wardbname || (data.username ? data.username.split('@')[0] : email.split('@')[0]),
          email: email,
          role: role,
          profile: data
        };
      }
    }
    console.warn(`[Auth Debug] No profile found for email: ${email}`);
    return null;
  };

  const fetchAllData = async () => {
    try {
      // 1. Fetch Users from all tables for admin views
      const [
        { data: admins },
        { data: doctors },
        { data: nurses },
        { data: receptionists },
        { data: wardboys },
        { data: patients },
        { data: depts }
      ] = await Promise.all([
        supabase.from('admins').select('*'),
        supabase.from('doctor').select('*'),
        supabase.from('nurse').select('*'),
        supabase.from('receptionist').select('*'),
        supabase.from('wardboy').select('*'),
        supabase.from('patient').select('*'),
        supabase.from('departments').select('*')
      ]);

      const deptMap = (depts || []).reduce((acc, d) => ({ ...acc, [d.depid]: d.departmentname }), {});

      const consolidatedUsers = [
        ...(admins || []).map(u => ({ ...u, id: u.adminid, name: u.username ? u.username.split('@')[0] : 'Admin', email: u.username || 'unknown', role: ROLES.ADMIN })),
        ...(doctors || []).map(u => ({ ...u, id: u.docid, name: u.name || 'Unknown', email: u.email || 'unknown', role: ROLES.DOCTOR, department: deptMap[u.depid], depid: u.depid, shift_start: u.shift_start || '09:00', shift_end: u.shift_end || '17:00' })),
        ...(nurses || []).map(u => ({ ...u, id: u.nurseid, name: u.nursename || 'Unknown', email: u.email || 'unknown', role: ROLES.NURSE, department: deptMap[u.depid], depid: u.depid, shift_start: u.shift_start || '09:00', shift_end: u.shift_end || '17:00' })),
        ...(receptionists || []).map(u => ({ ...u, id: u.repid, name: u.name || 'Unknown', email: u.email || 'unknown', role: ROLES.RECEPTIONIST, department: deptMap[u.depid], depid: u.depid, shift_start: u.shift_start || '09:00', shift_end: u.shift_end || '17:00' })),
        ...(wardboys || []).map(u => ({ ...u, id: u.wardbid, name: u.wardbname || 'Unknown', email: u.email || 'unknown', role: ROLES.WARDBOY, department: deptMap[u.depid], depid: u.depid, shift_start: u.shift_start || '09:00', shift_end: u.shift_end || '17:00' })),
        ...(patients || []).map(u => ({ ...u, id: u.pid, name: u.pname || 'Unknown', email: u.email || 'unknown', role: ROLES.PATIENT }))
      ];

      setUsers(consolidatedUsers);

      // 2. Fetch Appointments
      const { data: appts } = await supabase.from('appointment').select(`
        *,
        patient(pname),
        doctor(name),
        departments(departmentname)
      `);
      
      setAppointments((appts || []).map(a => ({
        id: a.apid,
        patientName: a.patient?.pname,
        doctorName: a.doctor?.name,
        doctorId: a.docid,
        department: a.departments?.departmentname,
        date: a.appointmentdate,
        status: a.status,
        patientId: a.pid,
        disease: a.disease,
        note: a.note
      })));

      // 3. Fetch Wards
      const { data: wardData } = await supabase.from('ward').select('*, departments(departmentname)');
      setWards((wardData || []).map(w => ({
        id: w.wardid,
        wardNo: w.wardno,
        department: w.departments?.departmentname,
        departmentId: w.depid,
        totalBeds: w.totalbeds,
        availableBeds: w.availablebeds
      })));

      // 4. Set Departments
      setDepartments((depts || []).map(d => ({
        id: d.depid,
        name: d.departmentname
      })));

      // 5. Fetch Applications (if table exists)
      const { data: appsData, error: appsError } = await supabase.from('applications').select('*');
      if (!appsError && appsData) {
        setApplications(appsData);
      }

      // 6. Fetch WardBoy Tasks
      await fetchTasksOnly(wardboys);

    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // Lightweight function to fetch ONLY tasks (avoids re-fetching all tables)
  const fetchTasksOnly = async (wardboysOverride) => {
    try {
      const { data: tasksData, error: tasksError } = await supabase.from('wardboytasks').select('*');
      if (tasksError) {
        console.error('fetchTasksOnly error:', tasksError.message);
        return;
      }
      // Get wardboy names for display
      let wbList = wardboysOverride;
      if (!wbList) {
        const { data: wbData } = await supabase.from('wardboy').select('wardbid, wardbname');
        wbList = wbData || [];
      }
      setTasks((tasksData || []).map(t => {
        const wId = t.wardbid || t.WardBid || t.wardboyId || t.wardboy_id;
        const wName = (wbList || []).find(wb => String(wb.wardbid || wb.WardBid || wb.wardboy_id) === String(wId))?.wardbname;
        return {
          id: t.taskid || t.TaskId || t.task_id || t.id,
          wardboyId: wId,
          wardboyName: wName || 'Unknown Wardboy',
          assignedByRole: t.assignedbyrole || t.AssignedByRole || t.assigned_by_role,
          assignedByName: t.assignedbyname || t.AssignedByName || t.assigned_by_name,
          description: t.taskdescription || t.TaskDescription || t.task_description,
          status: t.status || t.Status,
          createdAt: t.createdat || t.CreatedAt || t.created_at
        };
      }));
    } catch (err) {
      console.error('fetchTasksOnly error:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Step 1: Check for an existing session on mount
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        const profile = await fetchProfileByEmail(session.user.email);
        if (mounted) {
          if (profile) setUser(profile);
          else setUser({ email: session.user.email, role: 'unauthorized', name: 'User' });
          fetchAllData();
        }
      }
      if (mounted) setLoading(false);
    };

    initAuth();

    // Step 2: Listen for subsequent Auth changes (e.g., token refresh, signout)
    // We skip SIGNED_IN events here because login() handles them directly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event);
      if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Just refresh the profile silently
        if (!isFetchingProfile.current && mounted) {
          const profile = await fetchProfileByEmail(session.user.email);
          if (mounted && profile) setUser(profile);
        }
      }
      // SIGNED_IN is handled by the login() function directly
    });

    // Step 3: Realtime subscription for wardboytasks - instant updates across browsers
    const tasksChannel = supabase
      .channel('wardboytasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wardboytasks' }, () => {
        // Any INSERT, UPDATE, or DELETE on wardboytasks triggers a lightweight refresh
        if (mounted) {
          console.log('[Realtime] wardboytasks changed, refreshing tasks...');
          fetchTasksOnly();
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(tasksChannel);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    isFetchingProfile.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[Login] Supabase auth error:', error.message);
        return { success: false, message: error.message };
      }

      if (!data?.user) {
        return { success: false, message: 'Login failed. No user returned.' };
      }

      // Use the email from Supabase Auth (canonical/lowercase form)
      const authEmail = data.user.email.trim().toLowerCase();

      // Fetch the profile from DB tables using the Supabase auth email
      const profile = await fetchProfileByEmail(authEmail);
      if (profile) {
        setUser(profile);
        fetchAllData(); // Load full data in background
        return { success: true };
      } else {
        // Authenticated with Supabase but not found in any DB table
        // Sign them out to prevent a broken session
        await supabase.auth.signOut();
        return { 
          success: false, 
          message: 'Your account is not registered in the system. Please contact admin.' 
        };
      }
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      return { success: false, message: 'An unexpected error occurred. Please try again.' };
    } finally {
      setLoading(false);
      isFetchingProfile.current = false;
    }
  };

  const signup = async (userData) => {
    // 1. Supabase Auth Signup
    const safeEmail = userData.email.trim().toLowerCase();
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email: safeEmail, 
      password: userData.password 
    });

    if (authError) return { success: false, message: authError.message };

    // 2. Create Patient Profile
    const { error: profileError } = await supabase.from('patient').insert([{
      pname: userData.name,
      email: safeEmail,
      gender: userData.gender,
      dob: userData.dob,
      phoneno: userData.phone,
      address: userData.address,
      bloodgroup: userData.bloodGroup,
      emergencyphoneno: userData.emergencyPhone,
      disease: userData.disease || 'N/A',
      passwordhash: 'MANAGED_BY_SUPABASE_AUTH'
    }]);

    if (profileError) {
      console.error('[Signup] Profile insert error:', profileError.message);
      return { success: true, message: 'Account created! Please check your email to verify.' };
    }

    return { success: true, message: 'Account created! Please check your email to verify your account before logging in.' };
  };

  const bookAppointment = async (apptData) => {
    const { data: dept } = await supabase.from('departments').select('depid').eq('departmentname', apptData.department).single();
    await supabase.from('appointment').insert([{ 
        appointmentdate: apptData.date, 
        pid: apptData.patientId, 
        docid: apptData.doctorId || null, 
        depid: dept?.depid,
        disease: apptData.disease,
        note: apptData.note
    }]);
    await fetchAllData();
  };

  const submitApplication = async (formData) => {
    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      coverletter: formData.coverLetter,
      licensenumber: formData.licenseNumber || null,
      yearsexperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
      shiftpreference: formData.shiftPreference || null,
      languages: formData.languages || null,
      status: 'Pending'
    };
    const { error } = await supabase.from('applications').insert([payload]);
    if (error) {
      console.error('submitApplication error:', error.message);
      // Fallback: Temporarily hold in memory if table doesn't exist yet
      setApplications(prev => [...prev, { ...payload, id: Date.now() }]);
    } else {
      fetchAllData();
    }
  };

  const approveApplication = async (appId) => {
    const { error } = await supabase.from('applications').update({ status: 'Approved' }).eq('id', appId);
    if (!error) await fetchAllData();
  };

  const rejectApplication = async (appId) => {
    const { error } = await supabase.from('applications').update({ status: 'Rejected' }).eq('id', appId);
    if (!error) await fetchAllData();
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    await supabase.from('appointment').update({ status: newStatus }).eq('apid', appointmentId);
    await fetchAllData();
  };

  const assignTask = async (wardboyId, description, assignedByRole, assignedByName) => {
    const wName = users.find(u => u.role === 'wardboy' && String(u.id) === String(wardboyId))?.name;
    
    // Optimistic UI: show the task immediately in the assigner's view
    const optimisticTask = {
      id: `temp-${Date.now()}`,
      wardboyId,
      wardboyName: wName || 'Unknown Wardboy',
      assignedByRole,
      assignedByName,
      description,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, optimisticTask]);

    const payload = {
        wardbid: parseInt(wardboyId, 10),
        taskdescription: description,
        assignedbyrole: assignedByRole,
        assignedbyname: assignedByName
    };
    const { error } = await supabase.from('wardboytasks').insert([payload]);
    if (error) {
      console.error('assignTask error:', error.message);
      // Keep the optimistic task as fallback
    } else {
      // Lightweight refresh to replace optimistic task with real DB row
      // (Realtime subscription will also trigger this for other browsers)
      await fetchTasksOnly();
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    // Optimistic UI update — task stays visible with new status
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    const { error } = await supabase.from('wardboytasks').update({ status: newStatus }).eq('taskid', taskId);
    if (error) {
      console.error('Failed to update task status:', error.message);
      // Revert optimistic update on failure
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Pending' } : t));
    } else {
      // Sync from DB to ensure consistency (completed tasks stay in the list)
      await fetchTasksOnly();
    }
  };

  const addUser = async (userData) => {
    // 1. Create user in Supabase Auth using a temporary client
    // so it doesn't log the active admin out.
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mgcepqktrhmuuabqqbsp.supabase.co';
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_a5GzMp5gycCMKI_BRI5GMA_9rBkog7e';
    
    const adminAuthClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    });

    const safeEmail = userData.username.trim().toLowerCase();

    const { error: authError } = await adminAuthClient.auth.signUp({
      email: safeEmail, // In Users.jsx, the 'username' field represents the element's email 
      password: userData.password
    });

    if (authError) {
      console.error('[AddUser] Auth error:', authError.message);
      return { success: false, message: `Failed to create auth account: ${authError.message}` };
    }

    // 2. Insert into the appropriate DB table
    let table = '';
    let payload = { status: 'Active' };
    switch (userData.role) {
      case ROLES.DOCTOR: table = 'doctor'; payload = { ...payload, name: userData.name, email: safeEmail, passwordhash: 'MANAGED_BY_SUPABASE_AUTH' }; break;
      case ROLES.NURSE: table = 'nurse'; payload = { ...payload, nursename: userData.name, email: safeEmail, passwordhash: 'MANAGED_BY_SUPABASE_AUTH' }; break;
      case ROLES.RECEPTIONIST: table = 'receptionist'; payload = { ...payload, name: userData.name, email: safeEmail, passwordhash: 'MANAGED_BY_SUPABASE_AUTH' }; break;
      case ROLES.WARDBOY: table = 'wardboy'; payload = { ...payload, wardbname: userData.name, email: safeEmail, passwordhash: 'MANAGED_BY_SUPABASE_AUTH' }; break;
      case ROLES.PATIENT: table = 'patient'; payload = { ...payload, pname: userData.name, email: safeEmail, passwordhash: 'MANAGED_BY_SUPABASE_AUTH' }; break;
      case ROLES.ADMIN: table = 'admins'; payload = { username: safeEmail, passwordhash: 'MANAGED_BY_SUPABASE_AUTH', role: ROLES.ADMIN }; break;
      default: return { success: false, message: 'Invalid role' };
    }
    
    // Using the primary client (with admin session) to insert the role record
    const { error } = await supabase.from(table).insert([payload]);
    if (error) {
      console.error('[AddUser] DB error:', error.message);
      return { success: false, message: `Failed to create database profile: ${error.message}` };
    }
    
    await fetchAllData();
    return { success: true, message: 'User added successfully!' };
  };

  const removeUser = async (userToRemove) => {
    const tables = { [ROLES.DOCTOR]: ['doctor', 'docid'], [ROLES.NURSE]: ['nurse', 'nurseid'], [ROLES.RECEPTIONIST]: ['receptionist', 'repid'], [ROLES.WARDBOY]: ['wardboy', 'wardbid'], [ROLES.PATIENT]: ['patient', 'pid'], [ROLES.ADMIN]: ['admins', 'adminid'] };
    const [table, idCol] = tables[userToRemove.role];
    await supabase.from(table).delete().eq(idCol, userToRemove.id);
    await fetchAllData();
  };

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase.from('admins').update({ role: newRole }).eq('adminid', userId);
    if (error) console.error('updateUserRole error:', error.message);
    await fetchAllData();
  };

  const updateUserDetails = async (userId, role, details) => {
    let table = '';
    let idCol = '';
    
    switch (role) {
      case ROLES.DOCTOR: table = 'doctor'; idCol = 'docid'; break;
      case ROLES.NURSE: table = 'nurse'; idCol = 'nurseid'; break;
      case ROLES.RECEPTIONIST: table = 'receptionist'; idCol = 'repid'; break;
      case ROLES.WARDBOY: table = 'wardboy'; idCol = 'wardbid'; break;
      case ROLES.PATIENT: table = 'patient'; idCol = 'pid'; break;
      case ROLES.ADMIN: return { success: false, message: 'Admins do not have extended details.' };
      default: return { success: false, message: 'Invalid role' };
    }

    const { error } = await supabase.from(table).update(details).eq(idCol, userId);
    if (error) {
      console.error('[UpdateUserDetails] Error:', error.message);
      return { success: false, message: error.message };
    }
    
    await fetchAllData();
    return { success: true };
  };

  const addDepartment = async (name) => {
    const { error } = await supabase.from('departments').insert([{ departmentname: name }]);
    if (error) return { success: false, message: error.message };
    await fetchAllData();
    return { success: true };
  };

  const addWard = async (wardNo, depid, totalBeds) => {
    const { data, error } = await supabase.from('ward').insert([{
      wardno: wardNo,
      depid: depid,
      totalbeds: totalBeds,
      availablebeds: totalBeds
    }]).select();
    if (error) return { success: false, message: error.message };
    if (!data || data.length === 0) return { success: false, message: 'Operation blocked by database policies.' };
    await fetchAllData();
    return { success: true };
  };

  const updateWardBeds = async (wardId, addedBeds) => {
    const ward = wards.find(w => w.id === wardId);
    if (!ward) return { success: false, message: 'Ward not found' };
    
    const newTotal = Number(ward.totalBeds) + addedBeds;
    const newAvailable = Number(ward.availableBeds) + addedBeds;
    
    if (newTotal < 0 || newAvailable < 0) return { success: false, message: 'Cannot reduce beds below 0' };

    const { data, error } = await supabase.from('ward').update({ 
      totalbeds: newTotal,
      availablebeds: newAvailable 
    }).eq('wardid', wardId).select();

    if (error) return { success: false, message: error.message };
    if (!data || data.length === 0) return { success: false, message: 'Operation blocked by database. Please check Supabase RLS policies.' };
    await fetchAllData();
    return { success: true };
  };

  const deleteWard = async (wardId) => {
    const { data, error } = await supabase.from('ward').delete().eq('wardid', wardId).select();
    if (error) return { success: false, message: error.message };
    if (!data || data.length === 0) return { success: false, message: 'Operation blocked by database. Please check Supabase RLS policies.' };
    await fetchAllData();
    return { success: true };
  };

  const updateWard = async (wardId, updatedData) => {
    const payload = {
      wardno: updatedData.wardNo,
      depid: updatedData.depid ? parseInt(updatedData.depid) : null,
      totalbeds: parseInt(updatedData.totalBeds),
      availablebeds: parseInt(updatedData.availableBeds)
    };

    const { data, error } = await supabase.from('ward').update(payload).eq('wardid', wardId).select();
    
    if (error) return { success: false, message: error.message };
    if (!data || data.length === 0) return { success: false, message: 'Operation blocked by database. Please check Supabase RLS policies.' };
    await fetchAllData();
    return { success: true };
  };

  const deleteApplication = async (applicationId) => {
    const { error } = await supabase.from('applications').delete().eq('id', applicationId);
    if (error) return { success: false, message: error.message };
    await fetchAllData();
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, users, appointments, applications, wards, departments, tasks,
      login, signup, logout, bookAppointment, updateAppointmentStatus, 
      addUser, removeUser, updateUserRole, updateUserDetails, addDepartment, addWard, updateWard, updateWardBeds, deleteWard, loading,
      submitApplication, approveApplication, rejectApplication, deleteApplication, assignTask, updateTaskStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
