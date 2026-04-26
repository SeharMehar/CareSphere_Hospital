import { DEPARTMENTS, ROLES } from './dummyData';

const DB_KEY = 'caresphere.localdb.v1';
const SESSION_KEY = 'caresphere.session.v1';
const RESET_KEY = 'caresphere.reset.v1';
const LOCAL_AUTH_SENTINEL = 'MANAGED_BY_LOCAL_AUTH';

const TABLES = ['admins', 'doctor', 'nurse', 'receptionist', 'wardboy', 'patient'];
const EMAIL_FIELDS = {
  admins: 'username',
  doctor: 'email',
  nurse: 'email',
  receptionist: 'email',
  wardboy: 'email',
  patient: 'email'
};
const ID_FIELDS = {
  admins: 'adminid',
  doctor: 'docid',
  nurse: 'nurseid',
  receptionist: 'repid',
  wardboy: 'wardbid',
  patient: 'pid'
};
const ROLE_TO_TABLE = {
  [ROLES.ADMIN]: 'admins',
  [ROLES.DOCTOR]: 'doctor',
  [ROLES.NURSE]: 'nurse',
  [ROLES.RECEPTIONIST]: 'receptionist',
  [ROLES.WARDBOY]: 'wardboy',
  [ROLES.PATIENT]: 'patient'
};
const TABLE_TO_ROLE = {
  admins: ROLES.ADMIN,
  doctor: ROLES.DOCTOR,
  nurse: ROLES.NURSE,
  receptionist: ROLES.RECEPTIONIST,
  wardboy: ROLES.WARDBOY,
  patient: ROLES.PATIENT
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const readJson = (key, fallback) => {
  if (typeof window === 'undefined') {
    return typeof fallback === 'function' ? fallback() : deepClone(fallback);
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return typeof fallback === 'function' ? fallback() : deepClone(fallback);
    }

    return JSON.parse(raw);
  } catch {
    return typeof fallback === 'function' ? fallback() : deepClone(fallback);
  }
};

const writeJson = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const deriveNameFromEmail = (email = '') => {
  const baseName = normalizeEmail(email).split('@')[0] || 'patient';
  const formatted = baseName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return formatted || 'Patient';
};

const nextId = (items, idField) =>
  (items || []).reduce((max, item) => Math.max(max, Number(item?.[idField]) || 0), 0) + 1;

const createFutureDate = (daysAhead, hours, minutes) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

const createSeedDepartments = () =>
  DEPARTMENTS.map((name, index) => ({
    depid: index + 1,
    departmentname: name
  }));

const createSeedDatabase = () => ({
  departments: createSeedDepartments(),
  authAccounts: [
    { email: 'admin@caresphere.pk', password: 'Admin123!' },
    { email: 'dr.sana@caresphere.pk', password: 'Doctor123!' },
    { email: 'dr.owais@caresphere.pk', password: 'Doctor123!' },
    { email: 'dr.mariam@caresphere.pk', password: 'Doctor123!' },
    { email: 'dr.hamza@caresphere.pk', password: 'Doctor123!' },
    { email: 'dr.ayesha@caresphere.pk', password: 'Doctor123!' },
    { email: 'nurse.zara@caresphere.pk', password: 'Nurse123!' },
    { email: 'nurse.hina@caresphere.pk', password: 'Nurse123!' },
    { email: 'reception@caresphere.pk', password: 'Reception123!' },
    { email: 'ward@caresphere.pk', password: 'Ward123!' },
    { email: 'patient@caresphere.pk', password: 'Patient123!' }
  ],
  admins: [
    {
      adminid: 1,
      username: 'admin@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      role: ROLES.ADMIN
    }
  ],
  doctor: [
    {
      docid: 1,
      name: 'Dr. Sana Ahmed',
      depid: 1,
      gender: 'Female',
      email: 'dr.sana@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      phoneno: '03001234567',
      address: 'DHA Phase 6, Lahore',
      qualification: 'MBBS, FCPS',
      specialization: 'Emergency Medicine',
      experience: 8,
      salary: 250000,
      status: 'Active',
      shift_start: '08:00',
      shift_end: '16:00'
    },
    {
      docid: 2,
      name: 'Dr. Owais Khan',
      depid: 2,
      gender: 'Male',
      email: 'dr.owais@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      phoneno: '03001112222',
      address: 'Johar Town, Lahore',
      qualification: 'MBBS, MS',
      specialization: 'General Surgery',
      experience: 10,
      salary: 275000,
      status: 'Active',
      shift_start: '09:00',
      shift_end: '17:00'
    },
    {
      docid: 3,
      name: 'Dr. Mariam Ali',
      depid: 3,
      gender: 'Female',
      email: 'dr.mariam@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      phoneno: '03002223333',
      address: 'Model Town, Lahore',
      qualification: 'MBBS, FCPS',
      specialization: 'Pediatrics',
      experience: 7,
      salary: 230000,
      status: 'Active',
      shift_start: '10:00',
      shift_end: '18:00'
    },
    {
      docid: 4,
      name: 'Dr. Hamza Raza',
      depid: 4,
      gender: 'Male',
      email: 'dr.hamza@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      phoneno: '03003334444',
      address: 'Gulberg, Lahore',
      qualification: 'MBBS, FCPS',
      specialization: 'Orthopedics',
      experience: 9,
      salary: 245000,
      status: 'Active',
      shift_start: '08:30',
      shift_end: '16:30'
    },
    {
      docid: 5,
      name: 'Dr. Ayesha Noor',
      depid: 5,
      gender: 'Female',
      email: 'dr.ayesha@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      phoneno: '03004445555',
      address: 'Cantt, Lahore',
      qualification: 'MBBS, FRCR',
      specialization: 'Radiology',
      experience: 11,
      salary: 290000,
      status: 'Active',
      shift_start: '11:00',
      shift_end: '19:00'
    }
  ],
  nurse: [
    {
      nurseid: 1,
      nursename: 'Zara Iqbal',
      depid: 1,
      gender: 'Female',
      phoneno: '03005556666',
      email: 'nurse.zara@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      address: 'Askari 11, Lahore',
      salary: 95000,
      shift: 'Morning',
      status: 'Active',
      shift_start: '07:00',
      shift_end: '15:00'
    },
    {
      nurseid: 2,
      nursename: 'Hina Saeed',
      depid: 3,
      gender: 'Female',
      phoneno: '03006667777',
      email: 'nurse.hina@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      address: 'Wapda Town, Lahore',
      salary: 90000,
      shift: 'Evening',
      status: 'Active',
      shift_start: '13:00',
      shift_end: '21:00'
    }
  ],
  receptionist: [
    {
      repid: 1,
      name: 'Imran Desk',
      depid: 1,
      gender: 'Male',
      email: 'reception@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      phoneno: '03007778888',
      address: 'Bahria Town, Lahore',
      shift: 'Front Desk',
      status: 'Active',
      shift_start: '08:00',
      shift_end: '16:00'
    }
  ],
  wardboy: [
    {
      wardbid: 1,
      wardbname: 'Naveed Staff',
      depid: 2,
      gender: 'Male',
      email: 'ward@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      address: 'Township, Lahore',
      phoneno: '03008889999',
      salary: 60000,
      shift: 'General',
      status: 'Active',
      shift_start: '09:00',
      shift_end: '17:00'
    }
  ],
  patient: [
    {
      pid: 1,
      pname: 'Ali Raza',
      gender: 'Male',
      dob: '1998-06-15',
      phoneno: '03009990000',
      email: 'patient@caresphere.pk',
      passwordhash: LOCAL_AUTH_SENTINEL,
      address: 'DHA Phase 5, Lahore',
      bloodgroup: 'B+',
      emergencyphoneno: '03112223344',
      registrationdate: new Date().toISOString(),
      disease: 'Seasonal Flu',
      status: 'Active'
    }
  ],
  appointment: [
    {
      apid: 1,
      appointmentdate: createFutureDate(1, 10, 0),
      pid: 1,
      docid: 1,
      depid: 1,
      disease: 'Fever',
      note: 'First consultation',
      status: 'Pending'
    },
    {
      apid: 2,
      appointmentdate: createFutureDate(2, 14, 30),
      pid: 1,
      docid: 3,
      depid: 3,
      disease: 'Pediatric follow-up',
      note: 'Bring previous reports',
      status: 'Confirmed'
    }
  ],
  ward: [
    { wardid: 1, wardno: 'E-101', totalbeds: 20, availablebeds: 14, depid: 1, status: 'Active' },
    { wardid: 2, wardno: 'S-201', totalbeds: 18, availablebeds: 9, depid: 2, status: 'Active' },
    { wardid: 3, wardno: 'P-301', totalbeds: 22, availablebeds: 12, depid: 3, status: 'Active' },
    { wardid: 4, wardno: 'O-401', totalbeds: 16, availablebeds: 6, depid: 4, status: 'Active' },
    { wardid: 5, wardno: 'R-501', totalbeds: 12, availablebeds: 8, depid: 5, status: 'Active' }
  ],
  applications: [],
  wardboytasks: [
    {
      taskid: 1,
      wardbid: 1,
      assignedbyrole: ROLES.ADMIN,
      assignedbyname: 'Admin',
      taskdescription: 'Prepare operation support trolley for Surgical ward.',
      status: 'Pending',
      createdat: new Date().toISOString()
    }
  ],
  meta: {
    version: 2,
    provider: 'local-storage'
  }
});

const normalizeDatabaseShape = (database) => {
  const seeded = createSeedDatabase();
  return {
    ...seeded,
    ...database,
    departments: Array.isArray(database?.departments) ? database.departments : seeded.departments,
    authAccounts: Array.isArray(database?.authAccounts) ? database.authAccounts : seeded.authAccounts,
    admins: Array.isArray(database?.admins) ? database.admins : seeded.admins,
    doctor: Array.isArray(database?.doctor) ? database.doctor : seeded.doctor,
    nurse: Array.isArray(database?.nurse) ? database.nurse : seeded.nurse,
    receptionist: Array.isArray(database?.receptionist)
      ? database.receptionist
      : seeded.receptionist,
    wardboy: Array.isArray(database?.wardboy) ? database.wardboy : seeded.wardboy,
    patient: Array.isArray(database?.patient) ? database.patient : seeded.patient,
    appointment: Array.isArray(database?.appointment) ? database.appointment : seeded.appointment,
    ward: Array.isArray(database?.ward) ? database.ward : seeded.ward,
    applications: Array.isArray(database?.applications) ? database.applications : seeded.applications,
    wardboytasks: Array.isArray(database?.wardboytasks) ? database.wardboytasks : seeded.wardboytasks,
    meta: {
      ...seeded.meta,
      ...(database?.meta || {}),
      provider: 'local-storage'
    }
  };
};

const ensureDatabase = () => {
  const database = readJson(DB_KEY, null);
  if (
    !database ||
    !database.meta ||
    database.meta.provider !== 'local-storage' ||
    !Array.isArray(database.authAccounts)
  ) {
    const seededDatabase = createSeedDatabase();
    writeJson(DB_KEY, seededDatabase);
    return seededDatabase;
  }

  const normalizedDatabase = normalizeDatabaseShape(database);
  if (JSON.stringify(database) !== JSON.stringify(normalizedDatabase)) {
    writeJson(DB_KEY, normalizedDatabase);
  }

  return normalizedDatabase;
};

const saveDatabase = (database) => {
  const normalizedDatabase = normalizeDatabaseShape(database);
  writeJson(DB_KEY, normalizedDatabase);
  return normalizedDatabase;
};

const getSessionEmail = () => {
  const session = readJson(SESSION_KEY, null);
  return typeof session?.email === 'string' ? normalizeEmail(session.email) : null;
};

const setSessionEmail = (email) => {
  writeJson(SESSION_KEY, { email: normalizeEmail(email) });
};

const clearSessionEmail = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
};

const getResetTokens = () => {
  const tokens = readJson(RESET_KEY, []);
  const activeTokens = (tokens || []).filter((token) => token.expiresAt > Date.now());
  if (activeTokens.length !== (tokens || []).length) {
    writeJson(RESET_KEY, activeTokens);
  }
  return activeTokens;
};

const saveResetTokens = (tokens) => writeJson(RESET_KEY, tokens);

const findAuthAccount = (database, email) =>
  (database.authAccounts || []).find(
    (account) => normalizeEmail(account.email) === normalizeEmail(email)
  );

const findProfileEntryByEmail = (database, email) => {
  const safeEmail = normalizeEmail(email);

  for (const table of TABLES) {
    const emailField = EMAIL_FIELDS[table];
    const record = (database[table] || []).find(
      (item) => normalizeEmail(item?.[emailField]) === safeEmail
    );

    if (record) {
      return { table, record };
    }
  }

  return null;
};

const findRecordByRoleAndId = (database, role, id) => {
  const table = ROLE_TO_TABLE[role];
  if (!table) return null;

  const idField = ID_FIELDS[table];
  const record = (database[table] || []).find((item) => String(item?.[idField]) === String(id));

  return record ? { table, record } : null;
};

const getDisplayName = (table, record) => {
  if (table === 'admins') {
    return record.username ? record.username.split('@')[0] : 'Admin';
  }

  if (table === 'doctor' || table === 'receptionist') return record.name || 'Unknown';
  if (table === 'nurse') return record.nursename || 'Unknown';
  if (table === 'wardboy') return record.wardbname || 'Unknown';
  if (table === 'patient') return record.pname || 'Unknown';

  return 'Unknown';
};

const buildProfile = (table, record, departmentName = null) => {
  const emailField = EMAIL_FIELDS[table];
  const idField = ID_FIELDS[table];

  return {
    id: record[idField],
    name: getDisplayName(table, record),
    email: normalizeEmail(record[emailField] || ''),
    role: TABLE_TO_ROLE[table],
    department: departmentName,
    depid: record.depid || null,
    profile: deepClone(record)
  };
};

const buildDepartments = (database) =>
  (database.departments || []).map((department) => ({
    id: department.depid,
    name: department.departmentname
  }));

const buildUsers = (database) => {
  const deptMap = (database.departments || []).reduce((acc, dept) => {
    acc[dept.depid] = dept.departmentname;
    return acc;
  }, {});

  return [
    ...(database.admins || []).map((user) => ({
      ...user,
      id: user.adminid,
      name: getDisplayName('admins', user),
      email: user.username || 'unknown',
      role: ROLES.ADMIN,
      profile: deepClone(user)
    })),
    ...(database.doctor || []).map((user) => ({
      ...user,
      id: user.docid,
      name: user.name || 'Unknown',
      email: user.email || 'unknown',
      role: ROLES.DOCTOR,
      department: deptMap[user.depid] || null,
      depid: user.depid,
      shift_start: user.shift_start || '09:00',
      shift_end: user.shift_end || '17:00',
      profile: deepClone(user)
    })),
    ...(database.nurse || []).map((user) => ({
      ...user,
      id: user.nurseid,
      name: user.nursename || 'Unknown',
      email: user.email || 'unknown',
      role: ROLES.NURSE,
      department: deptMap[user.depid] || null,
      depid: user.depid,
      shift_start: user.shift_start || '09:00',
      shift_end: user.shift_end || '17:00',
      profile: deepClone(user)
    })),
    ...(database.receptionist || []).map((user) => ({
      ...user,
      id: user.repid,
      name: user.name || 'Unknown',
      email: user.email || 'unknown',
      role: ROLES.RECEPTIONIST,
      department: deptMap[user.depid] || null,
      depid: user.depid,
      shift_start: user.shift_start || '09:00',
      shift_end: user.shift_end || '17:00',
      profile: deepClone(user)
    })),
    ...(database.wardboy || []).map((user) => ({
      ...user,
      id: user.wardbid,
      name: user.wardbname || 'Unknown',
      email: user.email || 'unknown',
      role: ROLES.WARDBOY,
      department: deptMap[user.depid] || null,
      depid: user.depid,
      shift_start: user.shift_start || '09:00',
      shift_end: user.shift_end || '17:00',
      profile: deepClone(user)
    })),
    ...(database.patient || []).map((user) => ({
      ...user,
      id: user.pid,
      name: user.pname || 'Unknown',
      email: user.email || 'unknown',
      role: ROLES.PATIENT,
      profile: deepClone(user)
    }))
  ];
};

const buildAppointments = (database) => {
  const patientMap = new Map((database.patient || []).map((patient) => [patient.pid, patient]));
  const doctorMap = new Map((database.doctor || []).map((doctor) => [doctor.docid, doctor]));
  const deptMap = new Map(
    (database.departments || []).map((department) => [department.depid, department.departmentname])
  );

  return (database.appointment || [])
    .map((appointment) => ({
      id: appointment.apid,
      patientName: patientMap.get(appointment.pid)?.pname,
      doctorName: doctorMap.get(appointment.docid)?.name,
      doctorId: appointment.docid,
      department: deptMap.get(appointment.depid) || null,
      date: appointment.appointmentdate,
      status: appointment.status,
      patientId: appointment.pid,
      disease: appointment.disease,
      note: appointment.note
    }))
    .sort((left, right) => new Date(left.date) - new Date(right.date));
};

const buildWards = (database) => {
  const deptMap = new Map(
    (database.departments || []).map((department) => [department.depid, department.departmentname])
  );

  return (database.ward || []).map((ward) => ({
    id: ward.wardid,
    wardNo: ward.wardno,
    department: deptMap.get(ward.depid) || null,
    departmentId: ward.depid,
    depid: ward.depid,
    totalBeds: ward.totalbeds,
    availableBeds: ward.availablebeds
  }));
};

const buildTasks = (database) => {
  const wardboyMap = new Map((database.wardboy || []).map((wardboy) => [wardboy.wardbid, wardboy]));

  return (database.wardboytasks || []).map((task) => ({
    id: task.taskid,
    wardboyId: task.wardbid,
    wardboyName: wardboyMap.get(task.wardbid)?.wardbname || 'Unknown Wardboy',
    assignedByRole: task.assignedbyrole,
    assignedByName: task.assignedbyname,
    description: task.taskdescription,
    status: task.status,
    createdAt: task.createdat
  }));
};

const createPatientRecord = (database, userData) => ({
  pid: nextId(database.patient, 'pid'),
  pname: userData.name?.trim() || deriveNameFromEmail(userData.email),
  gender: userData.gender || null,
  dob: userData.dob || null,
  phoneno: userData.phone || null,
  email: normalizeEmail(userData.email),
  passwordhash: LOCAL_AUTH_SENTINEL,
  address: userData.address || null,
  bloodgroup: userData.bloodGroup || null,
  emergencyphoneno: userData.emergencyPhone || null,
  registrationdate: new Date().toISOString(),
  disease: userData.disease || null,
  status: 'Active'
});

const createRecordForRole = (database, role, details) => {
  const email = normalizeEmail(details.email);
  const name = details.name?.trim() || deriveNameFromEmail(email);

  switch (role) {
    case ROLES.ADMIN:
      return {
        table: 'admins',
        record: {
          adminid: nextId(database.admins, 'adminid'),
          username: email,
          passwordhash: LOCAL_AUTH_SENTINEL,
          role: ROLES.ADMIN
        }
      };
    case ROLES.DOCTOR:
      return {
        table: 'doctor',
        record: {
          docid: nextId(database.doctor, 'docid'),
          name,
          depid: details.depid || null,
          gender: details.gender || null,
          dob: details.dob || null,
          phoneno: details.phoneno || null,
          email,
          passwordhash: LOCAL_AUTH_SENTINEL,
          address: details.address || null,
          qualification: details.qualification || null,
          specialization: details.specialization || null,
          experience: details.experience || null,
          salary: details.salary || null,
          status: details.status || 'Active',
          shift_start: details.shift_start || '09:00',
          shift_end: details.shift_end || '17:00'
        }
      };
    case ROLES.NURSE:
      return {
        table: 'nurse',
        record: {
          nurseid: nextId(database.nurse, 'nurseid'),
          nursename: name,
          depid: details.depid || null,
          gender: details.gender || null,
          phoneno: details.phoneno || null,
          email,
          passwordhash: LOCAL_AUTH_SENTINEL,
          address: details.address || null,
          salary: details.salary || null,
          shift: details.shift || null,
          status: details.status || 'Active',
          shift_start: details.shift_start || '09:00',
          shift_end: details.shift_end || '17:00'
        }
      };
    case ROLES.RECEPTIONIST:
      return {
        table: 'receptionist',
        record: {
          repid: nextId(database.receptionist, 'repid'),
          name,
          depid: details.depid || null,
          gender: details.gender || null,
          email,
          passwordhash: LOCAL_AUTH_SENTINEL,
          phoneno: details.phoneno || null,
          address: details.address || null,
          shift: details.shift || null,
          status: details.status || 'Active',
          shift_start: details.shift_start || '09:00',
          shift_end: details.shift_end || '17:00'
        }
      };
    case ROLES.WARDBOY:
      return {
        table: 'wardboy',
        record: {
          wardbid: nextId(database.wardboy, 'wardbid'),
          wardbname: name,
          depid: details.depid || null,
          gender: details.gender || null,
          email,
          passwordhash: LOCAL_AUTH_SENTINEL,
          address: details.address || null,
          phoneno: details.phoneno || null,
          salary: details.salary || null,
          shift: details.shift || null,
          status: details.status || 'Active',
          shift_start: details.shift_start || '09:00',
          shift_end: details.shift_end || '17:00'
        }
      };
    case ROLES.PATIENT:
      return {
        table: 'patient',
        record: createPatientRecord(database, {
          name,
          email,
          gender: details.gender || null,
          dob: details.dob || null,
          phone: details.phoneno || details.phone || null,
          address: details.address || null,
          bloodGroup: details.bloodgroup || details.bloodGroup || null,
          emergencyPhone: details.emergencyphoneno || details.emergencyPhone || null,
          disease: details.disease || null
        })
      };
    default:
      return null;
  }
};

const getUserState = () => {
  const database = ensureDatabase();
  const sessionEmail = getSessionEmail();
  const sessionProfile = sessionEmail ? findProfileEntryByEmail(database, sessionEmail) : null;
  const departmentName =
    sessionProfile?.record?.depid != null
      ? (database.departments || []).find(
          (department) => department.depid === sessionProfile.record.depid
        )?.departmentname || null
      : null;

  return {
    user: sessionProfile ? buildProfile(sessionProfile.table, sessionProfile.record, departmentName) : null,
    users: buildUsers(database),
    appointments: buildAppointments(database),
    applications: deepClone(database.applications || []),
    tasks: buildTasks(database),
    wards: buildWards(database),
    departments: buildDepartments(database)
  };
};

const login = (email, password) => {
  const database = ensureDatabase();
  const safeEmail = normalizeEmail(email);
  const account = findAuthAccount(database, safeEmail);

  if (!account) {
    return { success: false, code: 'NOT_FOUND', message: 'No account found for this email.' };
  }

  if (account.password !== password) {
    return { success: false, code: 'INVALID_PASSWORD', message: 'Invalid login credentials.' };
  }

  const profileEntry = findProfileEntryByEmail(database, safeEmail);
  if (!profileEntry) {
    return {
      success: false,
      code: 'NO_PROFILE',
      message: 'This account has no profile in the local system yet.'
    };
  }

  setSessionEmail(safeEmail);
  return { success: true, user: buildProfile(profileEntry.table, profileEntry.record) };
};

const signupPatient = (userData) => {
  const database = ensureDatabase();
  const safeEmail = normalizeEmail(userData.email);

  if (findAuthAccount(database, safeEmail)) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  database.authAccounts.push({
    email: safeEmail,
    password: userData.password
  });
  database.patient.push(createPatientRecord(database, { ...userData, email: safeEmail }));
  saveDatabase(database);
  setSessionEmail(safeEmail);

  const profileEntry = findProfileEntryByEmail(database, safeEmail);
  return {
    success: true,
    autoSignedIn: true,
    user: profileEntry ? buildProfile(profileEntry.table, profileEntry.record) : null,
    message: 'Account created and signed in successfully!'
  };
};

const createQuickPatientAccess = (email, password) =>
  signupPatient({
    name: deriveNameFromEmail(email),
    email,
    password
  });

const logout = () => {
  clearSessionEmail();
  return { success: true };
};

const bookAppointment = (appointmentData) => {
  const database = ensureDatabase();
  const department = (database.departments || []).find(
    (item) => item.departmentname === appointmentData.department
  );

  database.appointment.push({
    apid: nextId(database.appointment, 'apid'),
    appointmentdate: appointmentData.date,
    pid: appointmentData.patientId,
    docid: appointmentData.doctorId ? parseInt(appointmentData.doctorId, 10) : null,
    depid: department?.depid || null,
    disease: appointmentData.disease || '',
    note: appointmentData.note || '',
    status: 'Pending'
  });

  saveDatabase(database);
  return { success: true };
};

const submitApplication = (formData) => {
  const database = ensureDatabase();

  database.applications.push({
    id: nextId(database.applications, 'id'),
    name: formData.name,
    email: formData.email,
    role: formData.role,
    department: formData.department,
    coverletter: formData.coverLetter,
    licensenumber: formData.licenseNumber || null,
    yearsexperience: formData.yearsExperience ? parseInt(formData.yearsExperience, 10) : null,
    shiftpreference: formData.shiftPreference || null,
    languages: formData.languages || null,
    status: 'Pending',
    createdat: new Date().toISOString()
  });

  saveDatabase(database);
  return { success: true };
};

const updateApplicationStatus = (applicationId, status) => {
  const database = ensureDatabase();
  const application = (database.applications || []).find(
    (item) => String(item.id) === String(applicationId)
  );

  if (!application) {
    return { success: false, message: 'Application not found.' };
  }

  application.status = status;
  saveDatabase(database);
  return { success: true };
};

const deleteApplication = (applicationId) => {
  const database = ensureDatabase();
  database.applications = (database.applications || []).filter(
    (item) => String(item.id) !== String(applicationId)
  );
  saveDatabase(database);
  return { success: true };
};

const updateAppointmentStatus = (appointmentId, status) => {
  const database = ensureDatabase();
  const appointment = (database.appointment || []).find(
    (item) => String(item.apid) === String(appointmentId)
  );

  if (!appointment) {
    return { success: false, message: 'Appointment not found.' };
  }

  appointment.status = status;
  saveDatabase(database);
  return { success: true };
};

const assignTask = (wardboyId, description, assignedByRole, assignedByName) => {
  const database = ensureDatabase();

  database.wardboytasks.push({
    taskid: nextId(database.wardboytasks, 'taskid'),
    wardbid: parseInt(wardboyId, 10),
    assignedbyrole: assignedByRole,
    assignedbyname: assignedByName,
    taskdescription: description,
    status: 'Pending',
    createdat: new Date().toISOString()
  });

  saveDatabase(database);
  return { success: true };
};

const updateTaskStatus = (taskId, status) => {
  const database = ensureDatabase();
  const task = (database.wardboytasks || []).find((item) => String(item.taskid) === String(taskId));

  if (!task) {
    return { success: false, message: 'Task not found.' };
  }

  task.status = status;
  saveDatabase(database);
  return { success: true };
};

const addUser = (userData) => {
  const database = ensureDatabase();
  const safeEmail = normalizeEmail(userData.username);

  if (findAuthAccount(database, safeEmail)) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const created = createRecordForRole(database, userData.role, {
    email: safeEmail,
    name: userData.name
  });

  if (!created) {
    return { success: false, message: 'Invalid role.' };
  }

  database.authAccounts.push({
    email: safeEmail,
    password: userData.password
  });
  database[created.table].push(created.record);
  saveDatabase(database);

  return { success: true, message: 'User added successfully!' };
};

const removeUser = (userToRemove) => {
  const database = ensureDatabase();
  const entry = findRecordByRoleAndId(database, userToRemove.role, userToRemove.id);

  if (!entry) {
    return { success: false, message: 'User not found.' };
  }

  const emailField = EMAIL_FIELDS[entry.table];
  const idField = ID_FIELDS[entry.table];
  const email = normalizeEmail(entry.record[emailField] || '');

  database[entry.table] = (database[entry.table] || []).filter(
    (item) => String(item[idField]) !== String(userToRemove.id)
  );
  database.authAccounts = (database.authAccounts || []).filter(
    (account) => normalizeEmail(account.email) !== email
  );

  if (userToRemove.role === ROLES.PATIENT) {
    database.appointment = (database.appointment || []).filter(
      (appointment) => String(appointment.pid) !== String(userToRemove.id)
    );
  }

  if (userToRemove.role === ROLES.DOCTOR) {
    database.appointment = (database.appointment || []).map((appointment) =>
      String(appointment.docid) === String(userToRemove.id)
        ? { ...appointment, docid: null }
        : appointment
    );
  }

  if (userToRemove.role === ROLES.WARDBOY) {
    database.wardboytasks = (database.wardboytasks || []).filter(
      (task) => String(task.wardbid) !== String(userToRemove.id)
    );
  }

  if (normalizeEmail(getSessionEmail() || '') === email) {
    clearSessionEmail();
  }

  saveDatabase(database);
  return { success: true };
};

const updateUserRole = (userId, currentRole, newRole) => {
  if (currentRole === newRole) {
    return { success: true };
  }

  const database = ensureDatabase();
  const entry = findRecordByRoleAndId(database, currentRole, userId);

  if (!entry) {
    return { success: false, message: 'User not found.' };
  }

  const emailField = EMAIL_FIELDS[entry.table];
  const idField = ID_FIELDS[entry.table];
  const email = normalizeEmail(entry.record[emailField] || '');
  const name = getDisplayName(entry.table, entry.record);
  const commonDetails = {
    email,
    name,
    address: entry.record.address || null,
    phoneno: entry.record.phoneno || null,
    gender: entry.record.gender || null,
    depid: entry.record.depid || null,
    shift: entry.record.shift || null,
    shift_start: entry.record.shift_start || null,
    shift_end: entry.record.shift_end || null,
    salary: entry.record.salary || null,
    qualification: entry.record.qualification || null,
    specialization: entry.record.specialization || null,
    experience: entry.record.experience || null,
    disease: entry.record.disease || null,
    bloodgroup: entry.record.bloodgroup || null,
    emergencyphoneno: entry.record.emergencyphoneno || null,
    dob: entry.record.dob || null,
    status: entry.record.status || 'Active'
  };
  const created = createRecordForRole(database, newRole, commonDetails);

  if (!created) {
    return { success: false, message: 'Invalid role.' };
  }

  database[entry.table] = (database[entry.table] || []).filter(
    (item) => String(item[idField]) !== String(userId)
  );
  database[created.table].push(created.record);

  if (currentRole === ROLES.PATIENT) {
    database.appointment = (database.appointment || []).filter(
      (appointment) => String(appointment.pid) !== String(userId)
    );
  }

  if (currentRole === ROLES.DOCTOR) {
    database.appointment = (database.appointment || []).map((appointment) =>
      String(appointment.docid) === String(userId)
        ? { ...appointment, docid: null }
        : appointment
    );
  }

  if (currentRole === ROLES.WARDBOY) {
    database.wardboytasks = (database.wardboytasks || []).filter(
      (task) => String(task.wardbid) !== String(userId)
    );
  }

  saveDatabase(database);
  return { success: true };
};

const updateUserDetails = (userId, role, details) => {
  const database = ensureDatabase();
  const entry = findRecordByRoleAndId(database, role, userId);

  if (!entry) {
    return { success: false, message: 'User not found.' };
  }

  Object.assign(entry.record, details);
  saveDatabase(database);
  return { success: true };
};

const addDepartment = (name) => {
  const database = ensureDatabase();
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { success: false, message: 'Department name is required.' };
  }

  const exists = (database.departments || []).some(
    (department) => department.departmentname.toLowerCase() === trimmedName.toLowerCase()
  );

  if (exists) {
    return { success: false, message: 'Department already exists.' };
  }

  database.departments.push({
    depid: nextId(database.departments, 'depid'),
    departmentname: trimmedName
  });
  saveDatabase(database);
  return { success: true };
};

const addWard = (wardNo, depid, totalBeds) => {
  const database = ensureDatabase();
  const trimmedWardNo = wardNo.trim();

  if (!trimmedWardNo) {
    return { success: false, message: 'Ward number is required.' };
  }

  const exists = (database.ward || []).some(
    (ward) => ward.wardno.toLowerCase() === trimmedWardNo.toLowerCase()
  );

  if (exists) {
    return { success: false, message: 'Ward number already exists.' };
  }

  database.ward.push({
    wardid: nextId(database.ward, 'wardid'),
    wardno: trimmedWardNo,
    depid: parseInt(depid, 10),
    totalbeds: totalBeds,
    availablebeds: totalBeds,
    status: 'Active'
  });
  saveDatabase(database);
  return { success: true };
};

const updateWardBeds = (wardId, addedBeds) => {
  const database = ensureDatabase();
  const ward = (database.ward || []).find((item) => String(item.wardid) === String(wardId));

  if (!ward) {
    return { success: false, message: 'Ward not found.' };
  }

  const newTotal = Number(ward.totalbeds) + addedBeds;
  const newAvailable = Number(ward.availablebeds) + addedBeds;

  if (newTotal < 0 || newAvailable < 0) {
    return { success: false, message: 'Cannot reduce beds below 0.' };
  }

  ward.totalbeds = newTotal;
  ward.availablebeds = newAvailable;
  saveDatabase(database);
  return { success: true };
};

const deleteWard = (wardId) => {
  const database = ensureDatabase();
  database.ward = (database.ward || []).filter((item) => String(item.wardid) !== String(wardId));
  saveDatabase(database);
  return { success: true };
};

const updateWard = (wardId, updatedData) => {
  const database = ensureDatabase();
  const ward = (database.ward || []).find((item) => String(item.wardid) === String(wardId));

  if (!ward) {
    return { success: false, message: 'Ward not found.' };
  }

  ward.wardno = updatedData.wardNo;
  ward.depid = updatedData.depid ? parseInt(updatedData.depid, 10) : null;
  ward.totalbeds = parseInt(updatedData.totalBeds, 10);
  ward.availablebeds = parseInt(updatedData.availableBeds, 10);
  saveDatabase(database);
  return { success: true };
};

const requestPasswordReset = (email) => {
  const database = ensureDatabase();
  const safeEmail = normalizeEmail(email);

  if (!findAuthAccount(database, safeEmail)) {
    return { success: false, message: 'No account found for this email.' };
  }

  const tokens = getResetTokens();
  const token = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  tokens.push({
    token,
    email: safeEmail,
    expiresAt: Date.now() + 1000 * 60 * 30
  });
  saveResetTokens(tokens);

  return { success: true, token, email: safeEmail };
};

const validateResetToken = (token) => {
  const resetToken = getResetTokens().find((item) => item.token === token);

  if (!resetToken) {
    return { success: false, message: 'This reset link is invalid or has expired.' };
  }

  return { success: true, email: resetToken.email };
};

const resetPassword = (token, password) => {
  const validation = validateResetToken(token);
  if (!validation.success) {
    return validation;
  }

  const database = ensureDatabase();
  const account = findAuthAccount(database, validation.email);

  if (!account) {
    return { success: false, message: 'No account found for this reset request.' };
  }

  account.password = password;
  saveDatabase(database);

  const remainingTokens = getResetTokens().filter((item) => item.token !== token);
  saveResetTokens(remainingTokens);

  return { success: true };
};

export const localBackend = {
  storageKeys: {
    db: DB_KEY,
    session: SESSION_KEY,
    reset: RESET_KEY
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
  approveApplication: (applicationId) => updateApplicationStatus(applicationId, 'Approved'),
  rejectApplication: (applicationId) => updateApplicationStatus(applicationId, 'Rejected'),
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
