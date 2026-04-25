import { supabase } from './supabaseClient';

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const deriveNameFromEmail = (email = '') => {
  const baseName = normalizeEmail(email).split('@')[0] || 'patient';
  return baseName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const safeSelect = async (table, columns = '*') => {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) {
    console.warn(`[Supabase] Failed to select from ${table}:`, error.message || error);
    return [];
  }
  return data || [];
};

const fetchUserByEmail = (users, email) =>
  users.find((user) => normalizeEmail(user.email) === normalizeEmail(email));

const buildProfile = (record) => {
  if (!record) return null;
  return {
    id: record.id,
    name: record.name || deriveNameFromEmail(record.email),
    email: normalizeEmail(record.email || ''),
    role: record.role || 'patient',
    profile: record
  };
};

const buildUsers = (records = []) =>
  records.map((record) => ({
    ...record,
    id: record.id,
    name: record.name || deriveNameFromEmail(record.email || ''),
    email: normalizeEmail(record.email || ''),
    role: record.role || 'patient',
    department: record.department || null,
    depid: record.depid || null,
    profile: record
  }));

const buildAppointments = (records = [], users = []) => {
  const patientMap = new Map(users.map((user) => [user.id, user]));
  const doctorMap = new Map(users.filter((user) => user.role === 'doctor').map((user) => [user.id, user]));

  return records.map((appointment) => ({
    id: appointment.id || appointment.apid,
    patientName: patientMap.get(appointment.patientId)?.name || 'Unknown Patient',
    doctorName: doctorMap.get(appointment.doctorId)?.name || 'Unknown Doctor',
    doctorId: appointment.doctorId,
    department: appointment.department || null,
    date: appointment.appointmentdate || appointment.date,
    status: appointment.status || 'Pending',
    patientId: appointment.patientId,
    disease: appointment.disease || '',
    note: appointment.note || ''
  }));
};

const buildWards = (records = []) =>
  records.map((ward) => ({
    id: ward.id || ward.wardid,
    wardNo: ward.wardno || ward.wardNo || 'Unknown',
    department: ward.department || null,
    departmentId: ward.depid || ward.departmentId || null,
    totalBeds: ward.totalbeds || ward.totalBeds || 0,
    availableBeds: ward.availablebeds || ward.availableBeds || 0
  }));

const buildTasks = (records = [], users = []) => {
  const wardboyMap = new Map(users.filter((user) => user.role === 'wardboy').map((user) => [user.id, user]));

  return records.map((task) => ({
    id: task.id || task.taskid,
    wardboyId: task.wardboyId || task.wardbid,
    wardboyName: wardboyMap.get(task.wardboyId || task.wardbid)?.name || 'Unknown Wardboy',
    assignedByRole: task.assignedByRole || task.assignedbyrole || 'admin',
    assignedByName: task.assignedByName || task.assignedbyname || 'Admin',
    description: task.description || task.taskdescription || '',
    status: task.status || 'Pending',
    createdAt: task.createdAt || task.createdat || new Date().toISOString()
  }));
};

const getSessionEmail = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.user?.email) {
    return null;
  }
  return normalizeEmail(data.session.user.email);
};

export const getUserState = async () => {
  const [departments, users, appointments, applications, wards, tasks] = await Promise.all([
    safeSelect('departments'),
    safeSelect('users'),
    safeSelect('appointments'),
    safeSelect('applications'),
    safeSelect('wards'),
    safeSelect('wardboytasks')
  ]);

  const currentEmail = await getSessionEmail();
  const currentUser = currentEmail ? buildProfile(fetchUserByEmail(users, currentEmail)) : null;

  return {
    user: currentUser,
    users: buildUsers(users),
    appointments: buildAppointments(appointments, buildUsers(users)),
    applications: applications || [],
    tasks: buildTasks(tasks, buildUsers(users)),
    wards: buildWards(wards),
    departments: (departments || []).map((dept) => ({ id: dept.id, name: dept.name }))
  };
};

export const login = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password });
  if (error) {
    return { success: false, code: error.status, message: error.message || 'Login failed.' };
  }
  return { success: true };
};

export const signupPatient = async (userData) => {
  const safeEmail = normalizeEmail(userData.email);
  const { data, error } = await supabase.auth.signUp({ email: safeEmail, password: userData.password });

  if (error) {
    return { success: false, message: error.message || 'Signup failed.' };
  }

  const { data: inserted, error: insertError } = await supabase.from('users').insert([
    {
      email: safeEmail,
      name: userData.name || deriveNameFromEmail(safeEmail),
      role: 'patient',
      department: userData.department || null,
      depid: userData.depid || null,
      phone: userData.phone || userData.phoneno || null,
      address: userData.address || null,
      gender: userData.gender || null,
      dob: userData.dob || null,
      bloodgroup: userData.bloodGroup || null,
      emergencyphoneno: userData.emergencyPhone || userData.emergencyphoneno || null,
      disease: userData.disease || null,
      status: 'Active'
    }
  ]);

  if (insertError) {
    return { success: false, message: insertError.message || 'Signup succeeded but user data could not be saved.' };
  }

  return { success: true, autoSignedIn: !!data?.user, user: buildProfile(inserted?.[0]), message: 'Account created successfully. Check your email to confirm your account.' };
};

export const createQuickPatientAccess = async (email, password) =>
  signupPatient({ name: deriveNameFromEmail(email), email, password });

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, message: error.message || 'Logout failed.' };
  }
  return { success: true };
};

const getUserById = async (id) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return null;
  return data;
};

export const bookAppointment = async (appointmentData) => {
  const { error } = await supabase.from('appointments').insert([
    {
      appointmentdate: appointmentData.date,
      patientId: appointmentData.patientId,
      doctorId: appointmentData.doctorId ? Number(appointmentData.doctorId) : null,
      department: appointmentData.department || null,
      depid: appointmentData.depid || null,
      disease: appointmentData.disease || '',
      note: appointmentData.note || '',
      status: 'Pending'
    }
  ]);
  return { success: !error, message: error?.message }; 
};

export const submitApplication = async (formData) => {
  const { error } = await supabase.from('applications').insert([
    {
      name: formData.name,
      email: normalizeEmail(formData.email),
      role: formData.role,
      department: formData.department,
      coverletter: formData.coverLetter,
      licensenumber: formData.licenseNumber || null,
      yearsexperience: formData.yearsExperience ? Number(formData.yearsExperience) : null,
      shiftpreference: formData.shiftPreference || null,
      languages: formData.languages || null,
      status: 'Pending',
      createdat: new Date().toISOString()
    }
  ]);
  return { success: !error, message: error?.message };
};

const updateRow = async (table, id, changes) => {
  const { error } = await supabase.from(table).update(changes).eq('id', id);
  return { success: !error, message: error?.message };
};

export const approveApplication = async (applicationId) => updateRow('applications', applicationId, { status: 'Approved' });
export const rejectApplication = async (applicationId) => updateRow('applications', applicationId, { status: 'Rejected' });
export const deleteApplication = async (applicationId) => {
  const { error } = await supabase.from('applications').delete().eq('id', applicationId);
  return { success: !error, message: error?.message };
};
export const updateAppointmentStatus = async (appointmentId, status) => updateRow('appointments', appointmentId, { status });
export const assignTask = async (wardboyId, description, assignedByRole, assignedByName) => {
  const { error } = await supabase.from('wardboytasks').insert([
    {
      wardboyId: Number(wardboyId),
      assignedByRole: assignedByRole || 'admin',
      assignedByName: assignedByName || 'Admin',
      description,
      status: 'Pending',
      createdAt: new Date().toISOString()
    }
  ]);
  return { success: !error, message: error?.message };
};
export const updateTaskStatus = async (taskId, status) => updateRow('wardboytasks', taskId, { status });

export const addUser = async (userData) => {
  const safeEmail = normalizeEmail(userData.username);
  const { data: existing, error: existingError } = await supabase.from('users').select('id').eq('email', safeEmail).single();
  if (existingError && existingError.code !== 'PGRST116') {
    return { success: false, message: existingError.message || 'User lookup failed.' };
  }
  if (existing) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const { error } = await supabase.from('users').insert([
    {
      email: safeEmail,
      name: userData.name || deriveNameFromEmail(safeEmail),
      role: userData.role,
      department: userData.department || null,
      depid: userData.depid || null,
      phone: userData.phoneno || userData.phone || null,
      address: userData.address || null,
      gender: userData.gender || null,
      shift: userData.shift || null,
      shift_start: userData.shift_start || null,
      shift_end: userData.shift_end || null,
      qualification: userData.qualification || null,
      specialization: userData.specialization || null,
      experience: userData.experience || null,
      salary: userData.salary || null,
      status: userData.status || 'Active',
      bloodgroup: userData.bloodgroup || null,
      emergencyphoneno: userData.emergencyphoneno || null,
      disease: userData.disease || null
    }
  ]);
  return { success: !error, message: error?.message };
};

export const removeUser = async (userToRemove) => {
  const { error } = await supabase.from('users').delete().eq('id', userToRemove.id);
  return { success: !error, message: error?.message };
};

export const updateUserRole = async (userId, currentRole, newRole) => updateRow('users', userId, { role: newRole });
export const updateUserDetails = async (userId, role, details) => updateRow('users', userId, details);

export const addDepartment = async (name) => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, message: 'Department name is required.' };
  }
  const { error } = await supabase.from('departments').insert([{ name: trimmedName }]);
  return { success: !error, message: error?.message };
};

export const addWard = async (wardNo, depid, totalBeds) => {
  const trimmedWardNo = wardNo.trim();
  if (!trimmedWardNo) {
    return { success: false, message: 'Ward number is required.' };
  }
  const { error } = await supabase.from('wards').insert([
    {
      wardno: trimmedWardNo,
      depid: Number(depid),
      totalbeds: Number(totalBeds),
      availablebeds: Number(totalBeds),
      status: 'Active'
    }
  ]);
  return { success: !error, message: error?.message };
};

export const updateWardBeds = async (wardId, addedBeds) => {
  const { data: ward, error: wardError } = await supabase.from('wards').select('*').eq('id', wardId).single();
  if (wardError || !ward) {
    return { success: false, message: wardError?.message || 'Ward not found.' };
  }
  const newTotal = Number(ward.totalbeds) + Number(addedBeds);
  const newAvailable = Number(ward.availablebeds) + Number(addedBeds);
  if (newTotal < 0 || newAvailable < 0) {
    return { success: false, message: 'Cannot reduce beds below 0.' };
  }
  return updateRow('wards', wardId, { totalbeds: newTotal, availablebeds: newAvailable });
};

export const deleteWard = async (wardId) => {
  const { error } = await supabase.from('wards').delete().eq('id', wardId);
  return { success: !error, message: error?.message };
};

export const updateWard = async (wardId, updatedData) =>
  updateRow('wards', wardId, {
    wardno: updatedData.wardNo,
    depid: Number(updatedData.depid),
    totalbeds: Number(updatedData.totalBeds),
    availablebeds: Number(updatedData.availableBeds)
  });

export const requestPasswordReset = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: import.meta.env.VITE_PASSWORD_RESET_URL || window.location.origin
  });
  if (error) {
    return { success: false, message: error.message || 'Failed to send reset email.' };
  }
  return { success: true, message: 'Check your email for a password reset link.' };
};

export const validateResetToken = async () => ({
  success: false,
  message: 'Password reset is handled by Supabase email links in this mode.'
});

export const resetPassword = async () => ({
  success: false,
  message: 'Password reset is handled by Supabase email links in this mode.'
});

export const supabaseBackend = {
  storageKeys: {
    db: 'supabase',
    session: 'supabase.session',
    reset: 'supabase.reset'
  },
  normalizeEmail,
  deriveNameFromEmail,
  getUserState,
  login,
  signupPatient,
  createQuickPatientAccess,
  logout,
  bookAppointment,
  submitApplication,
  approveApplication,
  rejectApplication,
  deleteApplication,
  updateAppointmentStatus,
  assignTask,
  updateTaskStatus,
  addUser,
  removeUser,
  updateUserRole,
  updateUserDetails,
  addDepartment,
  addWard,
  updateWardBeds,
  deleteWard,
  updateWard,
  requestPasswordReset,
  validateResetToken,
  resetPassword
};
