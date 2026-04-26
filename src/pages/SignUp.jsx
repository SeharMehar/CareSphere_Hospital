import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DEPARTMENTS, ROLES } from '../dummyData';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './SharedPages.css';

const ACCOUNT_OPTIONS = [
  {
    role: ROLES.PATIENT,
    title: 'Patient',
    description: 'Book appointments and use the portal.'
  },
  {
    role: ROLES.DOCTOR,
    title: 'Doctor',
    description: 'Manage appointments and doctor access.'
  },
  {
    role: ROLES.NURSE,
    title: 'Nurse',
    description: 'Use the nurse dashboard.'
  },
  {
    role: ROLES.RECEPTIONIST,
    title: 'Receptionist',
    description: 'Handle front desk tasks.'
  },
  {
    role: ROLES.WARDBOY,
    title: 'Ward Boy',
    description: 'View and complete tasks.'
  }
];

const getDefaultShiftLabel = (role) => {
  switch (role) {
    case ROLES.DOCTOR:
      return 'Consultation Shift';
    case ROLES.NURSE:
      return 'Ward Rotation';
    case ROLES.RECEPTIONIST:
      return 'Front Desk Shift';
    case ROLES.WARDBOY:
      return 'Support Shift';
    default:
      return '';
  }
};

const SignUp = () => {
  const { signup, departments } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: ROLES.PATIENT,
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    phone: '',
    address: '',
    bloodGroup: '',
    emergencyPhone: '',
    disease: '',
    depid: '',
    department: '',
    shift: '',
    shift_start: '',
    shift_end: '',
    qualification: '',
    specialization: '',
    experience: ''
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departmentOptions = useMemo(() => {
    if (Array.isArray(departments) && departments.length > 0) {
      return departments;
    }

    return DEPARTMENTS.map((name) => ({
      id: name,
      name
    }));
  }, [departments]);

  const isPatientRole = formData.role === ROLES.PATIENT;
  const isDoctorRole = formData.role === ROLES.DOCTOR;
  const isStaffRole = !isPatientRole;

  const selectedDepartment = departmentOptions.find(
    (department) => String(department.id) === String(formData.depid)
  );

  const handleFieldChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleRoleSelect = (role) => {
    setFormData((current) => ({
      ...current,
      role,
      shift: role === ROLES.PATIENT ? '' : current.shift || getDefaultShiftLabel(role),
      shift_start: role === ROLES.PATIENT ? '' : current.shift_start || '09:00',
      shift_end: role === ROLES.PATIENT ? '' : current.shift_end || '17:00',
      depid: role === ROLES.PATIENT ? '' : current.depid
    }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Password and confirm password must match.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      department: isStaffRole ? selectedDepartment?.name || formData.department || '' : ''
    };
    const result = await signup(payload);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.message || 'Signup failed. Please try again.');
      return;
    }

    if (result.autoSignedIn) {
      navigate('/dashboard', { replace: true });
      return;
    }

    setFormData((current) => ({
      ...current,
      password: '',
      confirmPassword: ''
    }));
    setSuccessMsg(
      result.message ||
        'Account created. Please check your email to confirm your address before logging in.'
    );
  };

  return (
    <div className="page-wrapper dark-nav">
      <Navbar />
      <header className="page-header">
        <h1>Create Account</h1>
        <p>Patients and staff can sign up here.</p>
      </header>

      <main className="form-container signup-shell" style={{ maxWidth: '940px' }}>
        <div className="signup-section-banner">
          <strong>Choose Role</strong>
          <span>
            Email verification required. Admin access is managed separately.
          </span>
        </div>

        <div className="role-picker-grid">
          {ACCOUNT_OPTIONS.map((option) => (
            <button
              key={option.role}
              type="button"
              className={`role-option-card ${formData.role === option.role ? 'active' : ''}`}
              onClick={() => handleRoleSelect(option.role)}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="on"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '28px' }}
        >
          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              value={formData.name}
              onChange={(event) => handleFieldChange('name', event.target.value)}
              placeholder={isPatientRole ? 'Ali Raza' : 'Dr. Aisha Khan'}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={(event) => handleFieldChange('email', event.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Gender</label>
            <select
              value={formData.gender}
              onChange={(event) => handleFieldChange('gender', event.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(event) => handleFieldChange('password', event.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(event) => handleFieldChange('confirmPassword', event.target.value)}
              placeholder="Re-enter your password"
              minLength={6}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(event) => handleFieldChange('phone', event.target.value)}
              placeholder="+92 300 0000000"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>{isPatientRole ? 'Known Condition / Symptoms' : 'Years of Experience'}</label>
            {isPatientRole ? (
              <input
                type="text"
                value={formData.disease}
                onChange={(event) => handleFieldChange('disease', event.target.value)}
                placeholder="e.g. Asthma, fever"
              />
            ) : (
              <input
                type="number"
                min="0"
                value={formData.experience}
                onChange={(event) => handleFieldChange('experience', event.target.value)}
                placeholder="Enter total years"
                required={isStaffRole}
              />
            )}
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
            <label>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(event) => handleFieldChange('address', event.target.value)}
              placeholder="House no, street, city"
            />
          </div>

          {isPatientRole && (
            <>
              <div className="signup-form-section" style={{ gridColumn: '1 / -1' }}>
                <h3>Patient Care Details</h3>
                <p>Optional patient details.</p>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(event) => handleFieldChange('bloodGroup', event.target.value)}
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bloodGroup) => (
                    <option key={bloodGroup} value={bloodGroup}>
                      {bloodGroup}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(event) => handleFieldChange('emergencyPhone', event.target.value)}
                  placeholder="+92 300 0000000"
                />
              </div>
            </>
          )}

          {isStaffRole && (
            <>
              <div className="signup-form-section" style={{ gridColumn: '1 / -1' }}>
                <h3>Staff Assignment Details</h3>
                <p>Set role, department, and shift.</p>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Department</label>
                <select
                  value={formData.depid}
                  onChange={(event) => handleFieldChange('depid', event.target.value)}
                  required={isStaffRole}
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Shift Label</label>
                <input
                  type="text"
                  value={formData.shift}
                  onChange={(event) => handleFieldChange('shift', event.target.value)}
                  placeholder={getDefaultShiftLabel(formData.role)}
                  required={isStaffRole}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Shift Start</label>
                <input
                  type="time"
                  value={formData.shift_start}
                  onChange={(event) => handleFieldChange('shift_start', event.target.value)}
                  required={isStaffRole}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Shift End</label>
                <input
                  type="time"
                  value={formData.shift_end}
                  onChange={(event) => handleFieldChange('shift_end', event.target.value)}
                  required={isStaffRole}
                />
              </div>
            </>
          )}

          {isDoctorRole && (
            <>
              <div className="signup-form-section" style={{ gridColumn: '1 / -1' }}>
                <h3>Doctor Credentials</h3>
                <p>Basic doctor info.</p>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(event) => handleFieldChange('qualification', event.target.value)}
                  placeholder="MBBS, FCPS, MD"
                  required={isDoctorRole}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(event) => handleFieldChange('specialization', event.target.value)}
                  placeholder="Cardiology, Pediatrics, Surgical"
                  required={isDoctorRole}
                />
              </div>
            </>
          )}

          {successMsg && (
            <p className="signup-message success" style={{ gridColumn: '1 / -1' }}>
              {successMsg}{' '}
              <Link to="/login" style={{ color: '#0083B0', fontWeight: 700 }}>
                Continue to Login
              </Link>
            </p>
          )}

          {errorMsg && (
            <p className="signup-message error" style={{ gridColumn: '1 / -1' }}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
            style={{ gridColumn: '1 / -1', marginTop: '6px' }}
          >
            {isSubmitting ? 'Creating...' : `Register as ${ACCOUNT_OPTIONS.find((option) => option.role === formData.role)?.title || 'User'}`}
          </button>

          <p style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '4px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0083B0', fontWeight: 700 }}>
              Login Here
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default SignUp;
