import { ROLES } from './dummyData';
import { supabase } from './supabaseClient';

const AUTH_STATES = {
  ACTIVE: 'active',
  PENDING: 'pending_confirmation',
  DISABLED: 'disabled'
};

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const normalizeUuid = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const deriveNameFromEmail = (email = '') => {
  const baseName = normalizeEmail(email).split('@')[0] || 'patient';
  return baseName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const PRIMARY_ADMIN_EMAIL = normalizeEmail(import.meta.env.VITE_PRIMARY_ADMIN_EMAIL || '');
const PRIMARY_ADMIN_NAME = (import.meta.env.VITE_PRIMARY_ADMIN_NAME || 'Primary Admin').trim() || 'Primary Admin';

const isPrimaryAdminEmail = (email = '') =>
  Boolean(PRIMARY_ADMIN_EMAIL) && normalizeEmail(email) === PRIMARY_ADMIN_EMAIL;

const getPreferredDisplayName = (email = '', fallbackName = '') =>
  isPrimaryAdminEmail(email)
    ? PRIMARY_ADMIN_NAME
    : (fallbackName?.trim() || deriveNameFromEmail(email));

const STAFF_SIGNUP_ROLES = [ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.WARDBOY];
const PUBLIC_SIGNUP_ROLES = [ROLES.PATIENT, ...STAFF_SIGNUP_ROLES];

const normalizeRole = (role = '') => String(role).trim().toLowerCase();
const isStaffMemberRole = (role = '') => STAFF_SIGNUP_ROLES.includes(normalizeRole(role));

const getRoleLabel = (role = '') =>
  normalizeRole(role)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getPublicSignupRole = (userData = {}) => {
  const safeEmail = normalizeEmail(userData.email || '');
  if (isPrimaryAdminEmail(safeEmail)) {
    return ROLES.ADMIN;
  }

  const requestedRole = normalizeRole(userData.role || ROLES.PATIENT);
  return PUBLIC_SIGNUP_ROLES.includes(requestedRole) ? requestedRole : ROLES.PATIENT;
};

const buildSignupProfileFields = (userData = {}, role = ROLES.PATIENT) => ({
  phone: userData.phone || userData.phoneno || null,
  address: userData.address || null,
  gender: userData.gender || null,
  depid: isStaffMemberRole(role) ? userData.depid || null : null,
  department: isStaffMemberRole(role) ? userData.department || null : null,
  shift: isStaffMemberRole(role) ? userData.shift || null : null,
  shift_start: isStaffMemberRole(role) ? userData.shift_start || null : null,
  shift_end: isStaffMemberRole(role) ? userData.shift_end || null : null,
  qualification: role === ROLES.DOCTOR ? userData.qualification || null : null,
  specialization: role === ROLES.DOCTOR ? userData.specialization || null : null,
  experience:
    isStaffMemberRole(role) || role === ROLES.DOCTOR
      ? userData.experience ?? null
      : null,
  bloodgroup:
    role === ROLES.PATIENT
      ? userData.bloodGroup || userData.bloodgroup || null
      : null,
  emergencyphoneno:
    role === ROLES.PATIENT
      ? userData.emergencyPhone || userData.emergencyphoneno || null
      : null,
  disease: role === ROLES.PATIENT ? userData.disease || null : null
});

const getSignupSuccessMessage = (role, autoSignedIn) => {
  const roleLabel = role === ROLES.PATIENT ? 'Account' : `${getRoleLabel(role)} account`;
  return autoSignedIn
    ? `${roleLabel} created and signed in successfully!`
    : `${roleLabel} created. Please check your email to confirm your address before logging in.`;
};

const isMissingRowError = (error) => error?.code === 'PGRST116';
const isMissingUsersTableError = (error) =>
  error?.code === 'PGRST205' && String(error?.message || '').includes("public.users");
const isUsersRlsError = (error) =>
  String(error?.message || '').toLowerCase().includes('row-level security');

const normalizeDataAccessError = (error) => {
  if (isMissingUsersTableError(error) || isUsersRlsError(error)) {
    return new Error(
      "Supabase setup incomplete: 'public.users' is missing or blocked by RLS. Run supabase_schema.sql first, then run make_admin.sql, and try again."
    );
  }

  return error instanceof Error ? error : new Error(error?.message || 'Database request failed.');
};

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const cleanupPayload = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const combineAppointmentDate = (dateValue, timeValue) => {
  if (dateValue && typeof dateValue === 'string' && dateValue.includes('T')) {
    return dateValue;
  }

  if (dateValue && timeValue) {
    return `${String(dateValue).slice(0, 10)}T${timeValue}`;
  }

  return dateValue || null;
};

const getSignupRedirectUrl = () => import.meta.env.VITE_SIGNUP_REDIRECT_URL || undefined;

const getPasswordResetRedirectUrl = () => {
  if (import.meta.env.VITE_PASSWORD_RESET_URL) {
    return import.meta.env.VITE_PASSWORD_RESET_URL;
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}/reset-password`;
};

const restorePreviousSession = async (previousSession) => {
  if (!previousSession?.access_token || !previousSession?.refresh_token) {
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token: previousSession.access_token,
    refresh_token: previousSession.refresh_token
  });

  if (error) {
    console.warn('[Supabase] Failed to restore previous session:', error.message || error);
  }
};

const safeSelect = async (table, columns = '*') => {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) {
    console.warn(`[Supabase] Failed to select from ${table}:`, error.message || error);
    return [];
  }

  return data || [];
};

const logAuthEvent = async (email, event, message) => {
  const safeEmail = normalizeEmail(email);
  if (!safeEmail) return;

  const { error } = await supabase.from('login_events').insert([
    {
      user_email: safeEmail,
      event,
      message
    }
  ]);

  if (error) {
    console.warn('[Supabase] Failed to write login event:', error.message || error);
  }
};

const resolveAuthStatus = (record = {}) => {
  if (record.status === 'Removed') {
    return AUTH_STATES.DISABLED;
  }

  if (record.auth_status) {
    return record.auth_status;
  }

  if (record.confirmed_at || record.last_login) {
    return AUTH_STATES.ACTIVE;
  }

  return AUTH_STATES.PENDING;
};

const resendConfirmationEmail = async (email) => {
  if (typeof supabase.auth.resend !== 'function') {
    return { success: false, message: 'Confirmation resend is not available in this client.' };
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizeEmail(email),
    options: {
      emailRedirectTo: getSignupRedirectUrl()
    }
  });

  return {
    success: !error,
    message: error?.message || null
  };
};

const getAuthConfirmedAt = (authUser = null) =>
  authUser?.email_confirmed_at || authUser?.confirmed_at || null;

const getAuthLastLoginAt = (authUser = null) => authUser?.last_sign_in_at || null;

const getAuthStatusFromUser = (authUser = null, record = {}) => {
  if (record.status === 'Removed') {
    return AUTH_STATES.DISABLED;
  }

  if (getAuthConfirmedAt(authUser) || getAuthLastLoginAt(authUser)) {
    return AUTH_STATES.ACTIVE;
  }

  return record.auth_status || resolveAuthStatus(record);
};

const buildAuthSyncFields = (authUser = null, record = {}) => {
  const authStatus = getAuthStatusFromUser(authUser, record);
  const now = new Date().toISOString();

  return {
    auth_user_id: normalizeUuid(authUser?.id || record.auth_user_id || record.authUserId),
    auth_status: authStatus,
    confirmation_sent_at:
      authStatus === AUTH_STATES.PENDING
        ? record.confirmation_sent_at || now
        : record.confirmation_sent_at || null,
    confirmed_at: getAuthConfirmedAt(authUser) || record.confirmed_at || null,
    last_login: getAuthLastLoginAt(authUser) || record.last_login || null
  };
};

const getSessionIdentity = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.user) {
    return { authUser: null, authUserId: null, email: null };
  }

  return {
    authUser: data.session.user,
    authUserId: normalizeUuid(data.session.user.id),
    email: normalizeEmail(data.session.user.email || '')
  };
};

const findUserByEmail = async (email) => {
  const safeEmail = normalizeEmail(email);
  if (!safeEmail) return null;

  const { data, error } = await supabase.from('users').select('*').eq('email', safeEmail).maybeSingle();
  if (error && !isMissingRowError(error)) {
    throw normalizeDataAccessError(error);
  }

  return data || null;
};

const findUserByAuthUserId = async (authUserId) => {
  const safeAuthUserId = normalizeUuid(authUserId);
  if (!safeAuthUserId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', safeAuthUserId)
    .maybeSingle();

  if (error && !isMissingRowError(error)) {
    throw normalizeDataAccessError(error);
  }

  return data || null;
};

const findUserByAuthIdentity = async ({ authUserId, email } = {}) => {
  const linkedUser = await findUserByAuthUserId(authUserId);
  if (linkedUser) {
    return linkedUser;
  }

  return findUserByEmail(email);
};

const findUserById = async (id) => {
  const userId = toNullableNumber(id);
  if (userId === null) return null;

  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error && !isMissingRowError(error)) {
    throw normalizeDataAccessError(error);
  }

  return data || null;
};

const findActiveAdmin = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', ROLES.ADMIN)
    .neq('status', 'Removed')
    .order('id', { ascending: true })
    .limit(1);

  if (error) {
    throw normalizeDataAccessError(error);
  }

  return data?.[0] || null;
};

const assertAdminSlotAvailable = async (email, existingUserId = null) => {
  const activeAdmin = await findActiveAdmin();

  if (
    activeAdmin &&
    activeAdmin.id !== existingUserId &&
    normalizeEmail(activeAdmin.email) !== normalizeEmail(email)
  ) {
    throw new Error(
      `Only one active admin account is allowed. Current primary admin: ${activeAdmin.email}.`
    );
  }

  return activeAdmin;
};

const getDepartmentName = async (depid) => {
  const departmentId = toNullableNumber(depid);
  if (departmentId === null) return null;

  const { data, error } = await supabase
    .from('departments')
    .select('name')
    .eq('id', departmentId)
    .maybeSingle();

  if (error && !isMissingRowError(error)) {
    throw normalizeDataAccessError(error);
  }

  return data?.name || null;
};

const buildUserPayload = async (record = {}) => {
  const safeEmail = normalizeEmail(record.email);
  const role = record.role || (isPrimaryAdminEmail(safeEmail) ? ROLES.ADMIN : ROLES.PATIENT);
  const depid = role === ROLES.PATIENT ? null : toNullableNumber(record.depid);
  const department =
    role === ROLES.PATIENT
      ? null
      : record.department ?? (depid !== null ? await getDepartmentName(depid) : null);

  return cleanupPayload({
    auth_user_id: normalizeUuid(record.auth_user_id ?? record.authUserId),
    email: safeEmail,
    name: getPreferredDisplayName(safeEmail, record.name),
    role,
    department,
    depid,
    phone: record.phone || record.phoneno || null,
    address: record.address || null,
    gender: record.gender || null,
    shift: record.shift || null,
    shift_start: record.shift_start || null,
    shift_end: record.shift_end || null,
    qualification: record.qualification || null,
    specialization: record.specialization || null,
    experience: toNullableNumber(record.experience),
    salary: record.salary === '' ? null : record.salary ?? null,
    status: record.status || 'Active',
    bloodgroup: record.bloodgroup || record.bloodGroup || null,
    emergencyphoneno: record.emergencyphoneno || record.emergencyPhone || null,
    disease: record.disease || null,
    auth_status: record.auth_status || resolveAuthStatus(record),
    confirmation_sent_at: record.confirmation_sent_at || null,
    confirmed_at: record.confirmed_at || null,
    last_login: record.last_login || null,
    removed_at: record.removed_at || null
  });
};

const ensureUserProfile = async (record = {}) => {
  const requestedAuthUserId = normalizeUuid(record.auth_user_id ?? record.authUserId);
  const requestedEmail = normalizeEmail(record.email || '');
  let existing = await findUserByAuthIdentity({
    authUserId: requestedAuthUserId,
    email: requestedEmail
  });

  const safeEmail = requestedEmail || normalizeEmail(existing?.email || '');
  if (!safeEmail && !existing) return null;

  const role =
    record.role || existing?.role || (isPrimaryAdminEmail(safeEmail) ? ROLES.ADMIN : ROLES.PATIENT);
  const name = getPreferredDisplayName(safeEmail, record.name || existing?.name || '');
  const merged = existing
    ? {
        ...existing,
        ...record,
        auth_user_id: requestedAuthUserId || existing.auth_user_id || null,
        email: safeEmail,
        name,
        role
      }
    : {
        auth_user_id: requestedAuthUserId || null,
        email: safeEmail,
        name,
        role,
        status: record.status || 'Active',
        ...record
      };

  if (merged.role === ROLES.ADMIN) {
    await assertAdminSlotAvailable(safeEmail, existing?.id ?? null);
  }

  const payload = await buildUserPayload(merged);

  if (existing) {
    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      throw normalizeDataAccessError(error);
    }

    return data;
  }

  const { data, error } = await supabase.from('users').insert([payload]).select('*').single();
  if (error) {
    throw normalizeDataAccessError(error);
  }

  return data;
};

const buildDepartments = (records = []) =>
  records
    .map((record) => ({
      id: record.id,
      name: record.name
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

const sanitizeUserProfile = (record, departmentName, phone) => {
  return {
    ...record,
    department: departmentName,
    phoneno: phone,
    phone
  };
};

const buildUserRecord = (record, departmentMap = new Map()) => {
  if (!record) return null;

  const role = record.role || ROLES.PATIENT;
  const departmentName =
    role === ROLES.PATIENT
      ? null
      : record.department ||
        (record.depid != null ? departmentMap.get(toNullableNumber(record.depid)) || null : null);
  const phone = record.phoneno || record.phone || null;
  const isStaffRole =
    role === ROLES.DOCTOR ||
    role === ROLES.NURSE ||
    role === ROLES.RECEPTIONIST ||
    role === ROLES.WARDBOY;
  const authStatus = resolveAuthStatus(record);

  return {
    ...record,
    id: record.id,
    authUserId: normalizeUuid(record.auth_user_id),
    name: record.name || deriveNameFromEmail(record.email || ''),
    email: normalizeEmail(record.email || ''),
    role,
    department: departmentName,
    depid: toNullableNumber(record.depid),
    phoneno: phone,
    phone,
    shift_start: record.shift_start || (isStaffRole ? '09:00' : null),
    shift_end: record.shift_end || (isStaffRole ? '17:00' : null),
    status: record.status || 'Active',
    authStatus,
    profile: sanitizeUserProfile(record, departmentName, phone)
  };
};

const buildUserMaps = (users = []) => ({
  byId: new Map(users.map((user) => [String(user.id), user])),
  byEmail: new Map(users.map((user) => [normalizeEmail(user.email), user]))
});

const buildAppointmentRecord = (record, userMaps, departmentMap) => {
  const patientEmail = normalizeEmail(record.patient_email || record.patientEmail || '');
  const doctorEmail = normalizeEmail(record.doctor_email || record.doctorEmail || '');
  const patientId = toNullableNumber(record.patient_id ?? record.patientId) ??
    toNullableNumber(userMaps.byEmail.get(patientEmail)?.id);
  const doctorId = toNullableNumber(record.doctor_id ?? record.doctorId) ??
    toNullableNumber(userMaps.byEmail.get(doctorEmail)?.id);
  const patientUser =
    (patientId !== null && userMaps.byId.get(String(patientId))) || userMaps.byEmail.get(patientEmail);
  const doctorUser =
    (doctorId !== null && userMaps.byId.get(String(doctorId))) || userMaps.byEmail.get(doctorEmail);
  const date =
    record.appointmentdate ||
    combineAppointmentDate(record.date, record.time) ||
    record.created_at ||
    new Date().toISOString();

  return {
    id: record.id || record.apid,
    patientId,
    patientName: record.patient_name || record.patientName || patientUser?.name || 'Unknown Patient',
    patientEmail: patientEmail || patientUser?.email || null,
    doctorId,
    doctorName: record.doctor_name || record.doctorName || doctorUser?.name || 'Unassigned',
    doctorEmail: doctorEmail || doctorUser?.email || null,
    department:
      record.department ||
      doctorUser?.department ||
      (record.depid != null ? departmentMap.get(toNullableNumber(record.depid)) || null : null),
    date,
    disease: record.disease || record.reason || '',
    note: record.note || '',
    status: record.status || 'Pending'
  };
};

const buildAppointments = (records = [], userMaps, departmentMap) =>
  records
    .map((record) => buildAppointmentRecord(record, userMaps, departmentMap))
    .sort((left, right) => new Date(left.date) - new Date(right.date));

const buildApplicationRecord = (record) => ({
  id: record.id,
  name: record.name || record.patient_name || '',
  email: normalizeEmail(record.email || record.patient_email || ''),
  role: record.role || '',
  department: record.department || null,
  coverletter: record.coverletter || record.notes || '',
  licensenumber: record.licensenumber || null,
  yearsexperience: toNullableNumber(record.yearsexperience),
  shiftpreference: record.shiftpreference || null,
  languages: record.languages || null,
  status: record.status || 'Pending',
  createdat: record.created_at || record.createdat || null
});

const buildApplications = (records = []) =>
  records
    .map(buildApplicationRecord)
    .sort((left, right) => new Date(right.createdat || 0) - new Date(left.createdat || 0));

const buildTaskRecord = (record, userMaps) => {
  const wardboyId =
    toNullableNumber(record.wardboy_id ?? record.wardboyId ?? record.wardbid) ?? null;
  const wardboy =
    (wardboyId !== null && userMaps.byId.get(String(wardboyId))) || null;

  return {
    id: record.id || record.taskid,
    wardboyId,
    wardboyName: record.wardboy_name || wardboy?.name || 'Unknown Wardboy',
    assignedByRole:
      record.assigned_by_role || record.assignedByRole || record.assignedbyrole || 'admin',
    assignedByName:
      record.assigned_by_name || record.assignedByName || record.assignedbyname || 'Admin',
    description: record.description || record.taskdescription || '',
    status: record.status || 'Pending',
    createdAt: record.created_at || record.createdAt || record.createdat || new Date().toISOString()
  };
};

const buildTasks = (records = [], userMaps) =>
  records
    .map((record) => buildTaskRecord(record, userMaps))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

const buildWardRecord = (record, departmentMap) => ({
  id: record.id || record.wardid,
  wardNo: record.wardno || record.wardNo || 'Unknown',
  department:
    record.department ||
    (record.depid != null ? departmentMap.get(toNullableNumber(record.depid)) || null : null),
  departmentId: toNullableNumber(record.depid ?? record.departmentId),
  depid: toNullableNumber(record.depid ?? record.departmentId),
  totalBeds: Number(record.totalbeds ?? record.totalBeds ?? 0),
  availableBeds: Number(record.availablebeds ?? record.availableBeds ?? 0),
  status: record.status || 'Active'
});

const buildWards = (records = [], departmentMap) =>
  records
    .map((record) => buildWardRecord(record, departmentMap))
    .sort((left, right) => left.wardNo.localeCompare(right.wardNo));

const updateUserRow = async (userId, changes) => {
  const existing = await findUserById(userId);
  if (!existing) {
    return { success: false, message: 'User not found.' };
  }

  const payload = await buildUserPayload({
    ...existing,
    ...changes
  });

  const { error } = await supabase.from('users').update(payload).eq('id', userId);
  if (error) {
    return { success: false, message: error.message || 'Update failed.' };
  }

  return { success: true };
};

export const getUserState = async () => {
  const sessionIdentity = await getSessionIdentity();
  const currentEmail = sessionIdentity.email;
  const authUser = sessionIdentity.authUser;
  const authUserId = sessionIdentity.authUserId;
  let currentUserRow = currentEmail ? await findUserByAuthIdentity(sessionIdentity) : null;

  if (currentEmail && currentUserRow?.status === 'Removed') {
    await supabase.auth.signOut();
    currentUserRow = null;
  } else if (currentEmail) {
    const needsPrimaryAdminFix =
      isPrimaryAdminEmail(currentEmail) && (!currentUserRow || currentUserRow.role !== ROLES.ADMIN);
    const needsPrimaryAdminNameSync =
      isPrimaryAdminEmail(currentEmail) && currentUserRow?.name !== PRIMARY_ADMIN_NAME;
    const needsAuthLink = Boolean(authUserId) && currentUserRow?.auth_user_id !== authUserId;
    const needsBootstrap = !currentUserRow;

    try {
      if (needsPrimaryAdminFix || needsPrimaryAdminNameSync || needsAuthLink || needsBootstrap) {
        currentUserRow = await ensureUserProfile({
          ...(currentUserRow || {}),
          ...buildAuthSyncFields(authUser, currentUserRow || {}),
          email: currentEmail,
          name: getPreferredDisplayName(
            currentEmail,
            currentUserRow?.name || authUser?.user_metadata?.name || ''
          ),
          role:
            needsPrimaryAdminFix
              ? ROLES.ADMIN
              : currentUserRow?.role || ROLES.PATIENT,
          status: currentUserRow?.status || 'Active'
        });
      }
    } catch (error) {
      console.warn('[Supabase] Failed to sync auth-backed profile:', error.message || error);
    }
  }

  const [departmentRows, userRows, appointmentRows, applicationRows, wardRows, taskRows] =
    await Promise.all([
      safeSelect('departments'),
      safeSelect('users'),
      safeSelect('appointments'),
      safeSelect('applications'),
      safeSelect('wards'),
      safeSelect('wardboytasks')
    ]);

  const departments = buildDepartments(departmentRows);
  const departmentMap = new Map(departments.map((department) => [Number(department.id), department.name]));
  const mergedUserRows =
    currentUserRow && !userRows.some((row) => normalizeEmail(row.email) === normalizeEmail(currentUserRow.email))
      ? [currentUserRow, ...userRows]
      : userRows;
  const normalizedAllUsers = mergedUserRows.map((record) => buildUserRecord(record, departmentMap));
  const activeUsers = normalizedAllUsers.filter((user) => user.status !== 'Removed');
  const userMaps = buildUserMaps(normalizedAllUsers);
  const currentUser = currentUserRow ? buildUserRecord(currentUserRow, departmentMap) : null;

  return {
    user: currentUser?.status === 'Removed' ? null : currentUser,
    users: activeUsers,
    appointments: buildAppointments(appointmentRows, userMaps, departmentMap),
    applications: buildApplications(applicationRows),
    tasks: buildTasks(taskRows, userMaps),
    wards: buildWards(wardRows, departmentMap),
    departments
  };
};

export const login = async (email, password) => {
  const safeEmail = normalizeEmail(email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: safeEmail,
    password
  });

  if (error) {
    const profile = await findUserByAuthIdentity({ email: safeEmail });

    if (error.message?.toLowerCase().includes('email not confirmed')) {
      const resendResult = await resendConfirmationEmail(safeEmail);
      await logAuthEvent(safeEmail, 'pending_confirmation', error.message);
      return {
        success: false,
        accountCreated: true,
        message: resendResult.success
          ? 'Account exists but email is not confirmed yet. We sent another confirmation email. Please check inbox or spam.'
          : 'Account exists but email is not confirmed yet. Please check inbox or spam for the confirmation email.'
      };
    }

    if (profile && resolveAuthStatus(profile) === AUTH_STATES.PENDING) {
      return {
        success: false,
        accountCreated: true,
        message: 'This account is waiting for email confirmation. Please confirm the email first.'
      };
    }

    await logAuthEvent(safeEmail, 'failed', error.message || 'Invalid login credentials.');
    if (!profile) {
      return { success: false, code: 'NOT_FOUND', message: 'No account found for this email.' };
    }

    return { success: false, code: 'INVALID_PASSWORD', message: 'Invalid login credentials.' };
  }

  const profile = await findUserByAuthIdentity({
    authUserId: data.user?.id,
    email: safeEmail
  });
  if (profile?.status === 'Removed') {
    await supabase.auth.signOut();
    return {
      success: false,
      message: 'This account has been disabled. Please contact hospital administration.'
    };
  }

  if (isPrimaryAdminEmail(safeEmail)) {
    try {
      await assertAdminSlotAvailable(safeEmail, profile?.id ?? null);
    } catch (adminError) {
      await supabase.auth.signOut();
      return {
        success: false,
        message: adminError.message || 'Unable to assign the primary admin account.'
      };
    }
  }

  const ensuredProfile = await ensureUserProfile({
    ...(profile || {}),
    ...buildAuthSyncFields(data.user, profile || {}),
    email: safeEmail,
    name: getPreferredDisplayName(safeEmail, profile?.name || data.user?.user_metadata?.name || ''),
    role: isPrimaryAdminEmail(safeEmail)
      ? ROLES.ADMIN
      : profile?.role || ROLES.PATIENT,
    status: profile?.status || 'Active'
  });

  await logAuthEvent(safeEmail, 'success', 'Login successful.');
  return { success: true, user: ensuredProfile };
};

const createPrimaryAdminAccess = async (email, password, name = PRIMARY_ADMIN_NAME) => {
  const safeEmail = normalizeEmail(email);

  if (!isPrimaryAdminEmail(safeEmail)) {
    return { success: false, message: 'This email is not configured as the primary admin.' };
  }

  try {
    await assertAdminSlotAvailable(safeEmail);
  } catch (error) {
    return { success: false, message: error.message || 'Primary admin already exists.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email: safeEmail,
    password,
    options: {
      emailRedirectTo: getSignupRedirectUrl(),
      data: {
        name: name || PRIMARY_ADMIN_NAME,
        role: ROLES.ADMIN
      }
    }
  });

  if (error) {
    const lowerMessage = (error.message || '').toLowerCase();
    if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
      return {
        success: false,
        message: 'The primary admin auth account already exists. Please log in with the same email and password.'
      };
    }

    return { success: false, message: error.message || 'Failed to create the primary admin account.' };
  }

  const now = new Date().toISOString();
  const profile = await ensureUserProfile({
    ...buildAuthSyncFields(data.user, { status: 'Active' }),
    email: safeEmail,
    name: name || PRIMARY_ADMIN_NAME,
    role: ROLES.ADMIN,
    status: 'Active',
    confirmation_sent_at: data.session ? null : now,
    removed_at: null
  });

  const autoSignedIn = Boolean(data.session);
  await logAuthEvent(
    safeEmail,
    autoSignedIn ? 'success' : 'pending_confirmation',
    autoSignedIn
      ? 'Primary admin account created and signed in.'
      : 'Primary admin account created. Awaiting email confirmation.'
  );

  return {
    success: true,
    autoSignedIn,
    user: profile,
    message: autoSignedIn
      ? 'Primary admin account created and signed in successfully.'
      : `Primary admin account created for ${safeEmail}. Please confirm the email before logging in.`
  };
};

export const signupPatient = async (userData) => {
  const safeEmail = normalizeEmail(userData.email);
  const requestedRole = normalizeRole(userData.role || ROLES.PATIENT);

  if (requestedRole === ROLES.ADMIN && !isPrimaryAdminEmail(safeEmail)) {
    return {
      success: false,
      message: PRIMARY_ADMIN_EMAIL
        ? `Admin signup is reserved for ${PRIMARY_ADMIN_EMAIL}.`
        : 'Admin signup is reserved for the configured primary admin email.'
    };
  }

  const targetRole = getPublicSignupRole({
    ...userData,
    email: safeEmail
  });

  const existing = await findUserByEmail(safeEmail);
  if (existing?.status === 'Removed') {
    return {
      success: false,
      message: 'This account has been disabled. Please contact hospital administration.'
    };
  }

  const existingAuthUserId = normalizeUuid(existing?.auth_user_id ?? existing?.authUserId);
  const lockedExistingRole = existing && !existingAuthUserId ? normalizeRole(existing.role || '') : '';
  if (lockedExistingRole && lockedExistingRole !== targetRole) {
    return {
      success: false,
      message: `This email is already reserved for a ${getRoleLabel(existing.role)} profile. Please choose the same access type.`
    };
  }

  if (existing && existingAuthUserId) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  if (targetRole === ROLES.ADMIN) {
    return createPrimaryAdminAccess(safeEmail, userData.password, userData.name || PRIMARY_ADMIN_NAME);
  }

  const resolvedSignupRole = lockedExistingRole || targetRole;

  const signupOptions = {
    emailRedirectTo: getSignupRedirectUrl(),
    data: {
      name: userData.name || deriveNameFromEmail(safeEmail),
      role: resolvedSignupRole
    }
  };

  const { data, error } = await supabase.auth.signUp({
    email: safeEmail,
    password: userData.password,
    options: signupOptions
  });

  if (error) {
    const lowerMessage = (error.message || '').toLowerCase();
    if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    return { success: false, message: error.message || 'Signup failed.' };
  }

  const profile = await ensureUserProfile({
    ...buildAuthSyncFields(data.user, { status: 'Active' }),
    email: safeEmail,
    name: userData.name || deriveNameFromEmail(safeEmail),
    role: resolvedSignupRole,
    ...buildSignupProfileFields(userData, resolvedSignupRole),
    confirmation_sent_at: data.session ? null : new Date().toISOString(),
    status: 'Active'
  });

  const autoSignedIn = Boolean(data.session);
  const roleLabel = getRoleLabel(resolvedSignupRole);
  await logAuthEvent(
    safeEmail,
    autoSignedIn ? 'success' : 'pending_confirmation',
    autoSignedIn
      ? `${roleLabel} signup and login complete.`
      : `${roleLabel} signup created. Awaiting email confirmation.`
  );

  return {
    success: true,
    autoSignedIn,
    user: profile,
    message: getSignupSuccessMessage(resolvedSignupRole, autoSignedIn)
  };
};

export const createQuickPatientAccess = async (email, password) =>
  isPrimaryAdminEmail(email)
    ? createPrimaryAdminAccess(email, password, PRIMARY_ADMIN_NAME)
    : signupPatient({
        name: deriveNameFromEmail(email),
        email,
        password
      });

export const logout = async () => {
  const { email: sessionEmail } = await getSessionIdentity();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, message: error.message || 'Logout failed.' };
  }

  if (sessionEmail) {
    await logAuthEvent(sessionEmail, 'logout', 'User logged out.');
  }

  return { success: true };
};

export const bookAppointment = async (appointmentData) => {
  const sessionIdentity = await getSessionIdentity();
  const patient =
    (appointmentData.patientId ? await findUserById(appointmentData.patientId) : null) ||
    (await findUserByAuthIdentity(sessionIdentity));
  const doctor = appointmentData.doctorId ? await findUserById(appointmentData.doctorId) : null;
  const appointmentDate = appointmentData.date || new Date().toISOString();
  const time = new Date(appointmentDate).toTimeString().slice(0, 5);

  const payload = cleanupPayload({
    patient_id: toNullableNumber(patient?.id ?? appointmentData.patientId),
    patient_name: appointmentData.patientName || patient?.name || 'Unknown Patient',
    patient_email: patient?.email || null,
    patient_phone: patient?.phoneno || patient?.phone || null,
    doctor_id: toNullableNumber(doctor?.id ?? appointmentData.doctorId),
    doctor_name: appointmentData.doctorName || doctor?.name || null,
    doctor_email: doctor?.email || null,
    department: appointmentData.department || doctor?.department || null,
    depid: toNullableNumber(doctor?.depid ?? appointmentData.depid),
    appointmentdate: appointmentDate,
    date: appointmentDate,
    time,
    disease: appointmentData.disease || null,
    note: appointmentData.note || null,
    reason: appointmentData.disease || appointmentData.note || null,
    status: 'Pending'
  });

  const { error } = await supabase.from('appointments').insert([payload]);
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
      yearsexperience: toNullableNumber(formData.yearsExperience),
      shiftpreference: formData.shiftPreference || null,
      languages: formData.languages || null,
      status: 'Pending'
    }
  ]);

  return { success: !error, message: error?.message };
};

const updateRow = async (table, id, changes) => {
  const { error } = await supabase.from(table).update(changes).eq('id', id);
  return { success: !error, message: error?.message };
};

export const approveApplication = async (applicationId) =>
  updateRow('applications', applicationId, { status: 'Approved' });

export const rejectApplication = async (applicationId) =>
  updateRow('applications', applicationId, { status: 'Rejected' });

export const deleteApplication = async (applicationId) => {
  const { error } = await supabase.from('applications').delete().eq('id', applicationId);
  return { success: !error, message: error?.message };
};

export const updateAppointmentStatus = async (appointmentId, status) =>
  updateRow('appointments', appointmentId, { status });

export const assignTask = async (wardboyId, description, assignedByRole, assignedByName) => {
  const wardboy = await findUserById(wardboyId);
  const { error } = await supabase.from('wardboytasks').insert([
    {
      wardboy_id: toNullableNumber(wardboyId),
      wardboy_name: wardboy?.name || 'Unknown Wardboy',
      description,
      status: 'Pending',
      assigned_by_role: assignedByRole || 'admin',
      assigned_by_name: assignedByName || 'Admin'
    }
  ]);

  return { success: !error, message: error?.message };
};

export const updateTaskStatus = async (taskId, status) =>
  updateRow('wardboytasks', taskId, { status });

export const addUser = async (userData) => {
  if (userData.role === ROLES.ADMIN) {
    return {
      success: false,
      message: PRIMARY_ADMIN_EMAIL
        ? `Only one primary admin is allowed. Use ${PRIMARY_ADMIN_EMAIL} for admin login.`
        : 'Only one primary admin account is allowed.'
    };
  }

  const safeEmail = normalizeEmail(userData.username);
  const existing = await findUserByEmail(safeEmail);
  const existingAuthUserId = normalizeUuid(existing?.auth_user_id ?? existing?.authUserId);

  if (existing && existing.status !== 'Removed' && existingAuthUserId) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const {
    data: { session: previousSession }
  } = await supabase.auth.getSession();

  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: safeEmail,
    password: userData.password,
    options: {
      emailRedirectTo: getSignupRedirectUrl(),
      data: {
        name: userData.name || deriveNameFromEmail(safeEmail),
        role: userData.role
      }
    }
  });

  if (signupError) {
    const lowerMessage = (signupError.message || '').toLowerCase();
    if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    return { success: false, message: signupError.message || 'Failed to create staff account.' };
  }

  const payload = {
    ...(existing || {}),
    ...buildAuthSyncFields(signupData.user, existing || { status: 'Active' }),
    email: safeEmail,
    name: userData.name || deriveNameFromEmail(safeEmail),
    role: userData.role,
    depid: userData.depid || existing?.depid || null,
    department: userData.department || existing?.department || null,
    phone: userData.phone || userData.phoneno || existing?.phone || null,
    address: userData.address || existing?.address || null,
    gender: userData.gender || existing?.gender || null,
    shift: userData.shift || existing?.shift || null,
    shift_start: userData.shift_start || existing?.shift_start || null,
    shift_end: userData.shift_end || existing?.shift_end || null,
    qualification: userData.qualification || existing?.qualification || null,
    specialization: userData.specialization || existing?.specialization || null,
    experience: userData.experience ?? existing?.experience ?? null,
    salary: userData.salary ?? existing?.salary ?? null,
    status: 'Active',
    bloodgroup: userData.bloodgroup || existing?.bloodgroup || null,
    emergencyphoneno: userData.emergencyphoneno || existing?.emergencyphoneno || null,
    disease: userData.disease || existing?.disease || null,
    confirmation_sent_at: signupData.session ? null : new Date().toISOString(),
    removed_at: null
  };

  try {
    await ensureUserProfile(payload);
    await restorePreviousSession(previousSession);
    await logAuthEvent(
      safeEmail,
      signupData.session ? 'success' : 'pending_confirmation',
      signupData.session
        ? 'Staff account created and signed in during setup.'
        : 'Staff account created. Confirmation email sent.'
    );

    return {
      success: true,
      message:
        signupData.session
          ? 'User account created successfully.'
          : 'User account created and confirmation email sent successfully. Ask the user to check inbox or spam.'
    };
  } catch (error) {
    await restorePreviousSession(previousSession);
    return { success: false, message: error.message || 'Failed to add user.' };
  }
};

export const removeUser = async (userToRemove) => {
  const existing = await findUserById(userToRemove.id);
  if (!existing) {
    return { success: false, message: 'User not found.' };
  }

  if (existing.role === ROLES.ADMIN && existing.status !== 'Removed') {
    return { success: false, message: 'The primary admin account cannot be removed.' };
  }

  return updateUserRow(userToRemove.id, {
    ...existing,
    status: 'Removed',
    auth_status: AUTH_STATES.DISABLED,
    removed_at: new Date().toISOString()
  });
};

export const updateUserRole = async (userId, currentRole, newRole) => {
  if (currentRole === ROLES.ADMIN && newRole !== ROLES.ADMIN) {
    return { success: false, message: 'The primary admin role cannot be changed.' };
  }

  if (newRole === ROLES.ADMIN && currentRole !== ROLES.ADMIN) {
    return {
      success: false,
      message: PRIMARY_ADMIN_EMAIL
        ? `Only ${PRIMARY_ADMIN_EMAIL} can be the admin account.`
        : 'Only one primary admin account is allowed.'
    };
  }

  return updateUserRow(userId, { role: newRole });
};

export const updateUserDetails = async (userId, role, details) => updateUserRow(userId, details);

export const addDepartment = async (name) => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, message: 'Department name is required.' };
  }

  const existing = await supabase
    .from('departments')
    .select('id')
    .ilike('name', trimmedName)
    .maybeSingle();

  if (existing.data) {
    return { success: false, message: 'Department already exists.' };
  }

  const { error } = await supabase.from('departments').insert([{ name: trimmedName }]);
  return { success: !error, message: error?.message };
};

export const addWard = async (wardNo, depid, totalBeds) => {
  const trimmedWardNo = wardNo.trim();
  if (!trimmedWardNo) {
    return { success: false, message: 'Ward number is required.' };
  }

  const { data: existing, error: existingError } = await supabase
    .from('wards')
    .select('id')
    .eq('wardno', trimmedWardNo)
    .maybeSingle();

  if (existingError && !isMissingRowError(existingError)) {
    return { success: false, message: existingError.message || 'Unable to validate ward number.' };
  }

  if (existing) {
    return { success: false, message: 'Ward number already exists.' };
  }

  const { error } = await supabase.from('wards').insert([
    {
      wardno: trimmedWardNo,
      depid: toNullableNumber(depid),
      totalbeds: Number(totalBeds),
      availablebeds: Number(totalBeds),
      status: 'Active'
    }
  ]);

  return { success: !error, message: error?.message };
};

export const updateWardBeds = async (wardId, addedBeds) => {
  const { data: ward, error: wardError } = await supabase
    .from('wards')
    .select('*')
    .eq('id', wardId)
    .maybeSingle();

  if (wardError || !ward) {
    return { success: false, message: wardError?.message || 'Ward not found.' };
  }

  const newTotal = Number(ward.totalbeds) + Number(addedBeds);
  const newAvailable = Number(ward.availablebeds) + Number(addedBeds);

  if (newTotal < 0 || newAvailable < 0) {
    return { success: false, message: 'Cannot reduce beds below 0.' };
  }

  return updateRow('wards', wardId, {
    totalbeds: newTotal,
    availablebeds: newAvailable
  });
};

export const deleteWard = async (wardId) => {
  const { error } = await supabase.from('wards').delete().eq('id', wardId);
  return { success: !error, message: error?.message };
};

export const updateWard = async (wardId, updatedData) =>
  updateRow('wards', wardId, {
    wardno: updatedData.wardNo,
    depid: toNullableNumber(updatedData.depid),
    totalbeds: Number(updatedData.totalBeds),
    availablebeds: Number(updatedData.availableBeds)
  });

export const requestPasswordReset = async (email) => {
  const safeEmail = normalizeEmail(email);
  const profile = await findUserByEmail(safeEmail);

  if (!profile) {
    return { success: false, message: 'No account found for this email.' };
  }

  if (resolveAuthStatus(profile) === AUTH_STATES.PENDING) {
    return {
      success: false,
      message:
        'This account is still waiting for email confirmation. Please confirm the account first.'
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
    redirectTo: getPasswordResetRedirectUrl()
  });

  if (error) {
    return { success: false, message: error.message || 'Failed to send reset email.' };
  }

  return { success: true, message: 'Check your email for a password reset link.' };
};

export const validateResetToken = async (token) => {
  if (!token) {
    return { success: false, message: 'This reset link is invalid or has expired.' };
  }

  const { data } = await supabase.auth.getSession();
  if (data?.session) {
    return { success: true, email: data.session.user?.email || null };
  }

  return { success: true };
};

export const resetPassword = async (token, password) => {
  if (!token) {
    return { success: false, message: 'This reset link is invalid or has expired.' };
  }

  const { data } = await supabase.auth.getSession();
  if (!data?.session) {
    return {
      success: false,
      message: 'Open the latest password reset link from your email and try again.'
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { success: false, message: error.message || 'Failed to update password.' };
  }

  const sessionIdentity = {
    authUser: data.session.user,
    authUserId: normalizeUuid(data.session.user?.id),
    email: normalizeEmail(data.session.user?.email || '')
  };
  const existing = await findUserByAuthIdentity(sessionIdentity);
  if (existing) {
    await ensureUserProfile({
      ...existing,
      ...buildAuthSyncFields(data.session.user, existing),
      auth_status: AUTH_STATES.ACTIVE,
      confirmed_at: getAuthConfirmedAt(data.session.user) || existing.confirmed_at || new Date().toISOString()
    });
  }

  return { success: true };
};

export const supabaseBackend = {
  normalizeEmail,
  deriveNameFromEmail,
  primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
  primaryAdminName: PRIMARY_ADMIN_NAME,
  getUserState,
  login,
  signupUser: signupPatient,
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
