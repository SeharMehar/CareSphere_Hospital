import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../dummyData';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import './SharedPages.css';

const Users = () => {
  const { users, user, departments, addUser, removeUser, updateUserRole, updateUserDetails } = useAuth();
  
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: ROLES.PATIENT });
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDetails, setEditDetails] = useState({});
  const [filterRole, setFilterRole] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Safety: if auth user is not loaded yet, show loading
  if (!user || !user.role) {
    return <Loader fullScreen={false} text="Loading user data..." />;
  }

  if (user.role !== ROLES.ADMIN && user.role !== ROLES.DOCTOR) {
    return <div>Access Denied</div>;
  }

  // Safe users list - filter out any null/undefined entries
  const safeUsers = Array.isArray(users) ? users.filter(u => u != null && typeof u === 'object') : [];

  const filteredUsers = safeUsers.filter(u => {
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const availableRoles = Object.values(ROLES).filter(role => {
    if (user.role === ROLES.ADMIN) return true;
    if (user.role === ROLES.DOCTOR) return role !== ROLES.ADMIN;
    return false;
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const result = await addUser(formData);
    
    if (result.success) {
      alert('Success: ' + result.message);
      setFormData({ name: '', username: '', password: '', role: ROLES.PATIENT });
    } else {
      alert('Error: ' + result.message);
    }
  };

  const openUserModal = (u) => {
    if (!u) return;
    setSelectedUser(u);
    setEditDetails({
      salary: u.salary || '',
      shift: u.shift || '',
      shift_start: u.shift_start || '09:00',
      shift_end: u.shift_end || '17:00',
      phoneno: u.phoneno || '',
      address: u.address || '',
      qualification: u.qualification || '',
      specialization: u.specialization || '',
      experience: u.experience || '',
      disease: u.disease || '',
      bloodgroup: u.bloodgroup || '',
      role: u.role || '',
      depid: u.depid || ''
    });
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setEditDetails({});
  };

  const handleDetailChange = (field, value) => {
    setEditDetails({ ...editDetails, [field]: value });
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    // First, handle role change if changed (Admins only)
    if (editDetails.role !== selectedUser.role && user.role === ROLES.ADMIN) {
      await updateUserRole(selectedUser.id, selectedUser.role, editDetails.role);
    }

    // Now construct payload based on role
    const payload = {};
    if (selectedUser.role === ROLES.DOCTOR) {
      payload.salary = editDetails.salary || null;
      payload.phoneno = editDetails.phoneno || null;
      payload.address = editDetails.address || null;
      payload.qualification = editDetails.qualification || null;
      payload.specialization = editDetails.specialization || null;
      payload.experience = editDetails.experience ? parseInt(editDetails.experience) : null;
      payload.depid = editDetails.depid ? parseInt(editDetails.depid) : null;
      payload.shift_start = editDetails.shift_start || null;
      payload.shift_end = editDetails.shift_end || null;
    } else if (selectedUser.role === ROLES.NURSE || selectedUser.role === ROLES.WARDBOY) {
      payload.salary = editDetails.salary || null;
      payload.phoneno = editDetails.phoneno || null;
      payload.address = editDetails.address || null;
      payload.shift_start = editDetails.shift_start || null;
      payload.shift_end = editDetails.shift_end || null;
      payload.depid = editDetails.depid ? parseInt(editDetails.depid) : null;
    } else if (selectedUser.role === ROLES.RECEPTIONIST) {
      payload.phoneno = editDetails.phoneno || null;
      payload.address = editDetails.address || null;
      payload.shift_start = editDetails.shift_start || null;
      payload.shift_end = editDetails.shift_end || null;
      payload.depid = editDetails.depid ? parseInt(editDetails.depid) : null;
    } else if (selectedUser.role === ROLES.PATIENT) {
      payload.phoneno = editDetails.phoneno || null;
      payload.address = editDetails.address || null;
      payload.disease = editDetails.disease || null;
      payload.bloodgroup = editDetails.bloodgroup || null;
    }

    if (Object.keys(payload).length > 0) {
      const res = await updateUserDetails(selectedUser.id, selectedUser.role, payload);
      if (res.success) {
         alert('Details updated successfully!');
      } else {
         alert('Failed to update details: ' + res.message);
      }
    } else {
      if (editDetails.role === selectedUser.role) {
         alert('No editable details for this role.');
      }
    }
    
    closeUserModal();
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    if (window.confirm(`Are you sure you want to remove ${selectedUser.name || 'this user'}?`)) {
      removeUser(selectedUser);
      closeUserModal();
    }
  };

  return (
    <div className="page-wrapper">
      <header className="page-header dashboard-header">
        <div>
          <h2 style={{color: 'white', margin: 0, fontSize: '2rem'}}>User Management</h2>
          <p style={{margin: 0, opacity: 0.9}}>Authenticated as: {user?.name || 'Admin'} (<span style={{textTransform: 'capitalize'}}>{user?.role || ''}</span>)</p>
        </div>
        <Link to="/dashboard">
          <button className="nav-btn" style={{color: 'white'}}>Back to Dashboard</button>
        </Link>
      </header>
      
      <main className="dashboard-container" style={{maxWidth: '1200px'}}>
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          
          {/* Add User Sidebar */}
          <div style={{ flex: '1', minWidth: '300px', maxWidth: '350px' }}>
            <div className="stat-card">
              <h4 style={{marginBottom: '20px', color: '#0083B0'}}>Add New Staff/User</h4>
              <form onSubmit={handleCreateUser} style={{boxShadow: 'none', padding: 0, width: '100%'}}>
                <div className="form-group">
                  <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Email Address" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                </div>
                <div className="form-group">
                  <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                </div>
                <div className="form-group">
                  <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="submit-btn" style={{padding: '12px'}}>Add User</button>
              </form>
            </div>
          </div>

          {/* Users Grid */}
          <div style={{ flex: '2', minWidth: '400px' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px'}}>
              <h4 style={{color: '#112A46', fontSize: '1.4rem', margin: 0}}>Current Directory</h4>
              <div style={{display: 'flex', gap: '10px'}}>
                <input 
                  type="text" 
                  placeholder="Search user..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', outline: 'none', maxWidth: '200px'}}
                />
                <select 
                  value={filterRole} 
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', outline: 'none'}}
                >
                  <option value="All">All Roles</option>
                  {Object.values(ROLES).map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <p style={{color: '#888'}}>No users found matching your criteria.</p>
            ) : (
              <div className="users-grid">
                {filteredUsers.map((u, index) => (
                  <div key={u.id || `user-${index}`} className="user-card" onClick={() => openUserModal(u)}>
                    <div className="user-card-header">
                      <h4>{u.name || 'Unknown'}</h4>
                      <span className="role-badge">{u.role || 'User'}</span>
                    </div>
                    <div style={{fontSize: '0.9rem', color: '#666'}}>
                      <p style={{margin: '2px 0'}}><strong>Email:</strong> {u.email || u.username || 'N/A'}</p>
                      {u.department && <p style={{margin: '2px 0'}}><strong>Dept:</strong> {u.department}</p>}
                      {u.role === ROLES.PATIENT && u.disease && <p style={{margin: '2px 0'}}><strong>Condition:</strong> {u.disease}</p>}
                    </div>
                    <div style={{marginTop: 'auto', paddingTop: '10px', textAlign: 'right'}}>
                      <span style={{fontSize: '0.8rem', color: '#0083B0', fontWeight: '600'}}>Edit Details &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={closeUserModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeUserModal}>&times;</button>
            <h3 style={{color: '#112A46', marginBottom: '5px'}}>Edit {selectedUser.name || 'User'}</h3>
            <p style={{color: '#888', fontSize: '0.9rem', marginBottom: '20px'}}>Update details or permissions for this user.</p>
            
            <form onSubmit={handleSaveDetails} style={{boxShadow: 'none', padding: 0, maxWidth: '100%'}}>
              
              {/* Common Fields */}
              {(selectedUser.role !== ROLES.ADMIN) && (
                <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div>
                    <label>Phone Number</label>
                    <input type="text" value={editDetails.phoneno} onChange={e => handleDetailChange('phoneno', e.target.value)} />
                  </div>
                  {(selectedUser.role === ROLES.DOCTOR || selectedUser.role === ROLES.NURSE || selectedUser.role === ROLES.WARDBOY) && (
                    <div>
                      <label>Salary ($)</label>
                      <input type="number" value={editDetails.salary} onChange={e => handleDetailChange('salary', e.target.value)} />
                    </div>
                  )}
                  {(selectedUser.role === ROLES.NURSE || selectedUser.role === ROLES.WARDBOY || selectedUser.role === ROLES.RECEPTIONIST) && (
                    <div>
                      <label>Shift (e.g., Morning)</label>
                      <input type="text" value={editDetails.shift} onChange={e => handleDetailChange('shift', e.target.value)} />
                    </div>
                  )}
                  {(selectedUser.role === ROLES.DOCTOR || selectedUser.role === ROLES.NURSE || selectedUser.role === ROLES.WARDBOY || selectedUser.role === ROLES.RECEPTIONIST) && (
                    <div>
                      <label>Department</label>
                      <select value={editDetails.depid} onChange={e => handleDetailChange('depid', e.target.value)}>
                        <option value="">Unassigned</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              
              {(selectedUser.role !== ROLES.ADMIN) && (
                <div className="form-group">
                  <label>Home Address</label>
                  <input type="text" value={editDetails.address} onChange={e => handleDetailChange('address', e.target.value)} />
                </div>
              )}

              {/* Doctor Specific Fields */}
              {selectedUser.role === ROLES.DOCTOR && (
                <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div>
                    <label>Qualification</label>
                    <input type="text" value={editDetails.qualification} onChange={e => handleDetailChange('qualification', e.target.value)} />
                  </div>
                  <div>
                    <label>Specialization</label>
                    <input type="text" value={editDetails.specialization} onChange={e => handleDetailChange('specialization', e.target.value)} />
                  </div>
                  <div>
                    <label>Experience (Years)</label>
                    <input type="number" value={editDetails.experience} onChange={e => handleDetailChange('experience', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Shared Shifts for all hospital staff */}
              {(selectedUser.role === ROLES.DOCTOR || selectedUser.role === ROLES.NURSE || selectedUser.role === ROLES.RECEPTIONIST || selectedUser.role === ROLES.WARDBOY) && (
                <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div>
                    <label>Shift Start (HH:mm)</label>
                    <input type="time" value={editDetails.shift_start} onChange={e => handleDetailChange('shift_start', e.target.value)} />
                  </div>
                  <div>
                    <label>Shift End (HH:mm)</label>
                    <input type="time" value={editDetails.shift_end} onChange={e => handleDetailChange('shift_end', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Patient Specific Fields */}
              {selectedUser.role === ROLES.PATIENT && (
                <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div>
                    <label>Known Disease</label>
                    <input type="text" value={editDetails.disease} onChange={e => handleDetailChange('disease', e.target.value)} />
                  </div>
                  <div>
                    <label>Blood Group</label>
                    <input type="text" value={editDetails.bloodgroup} onChange={e => handleDetailChange('bloodgroup', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Role Switcher (Admins Only) */}
              {user.role === ROLES.ADMIN && selectedUser.id && user.id && selectedUser.id !== user.id && (
                <div className="form-group">
                  <label>System Role</label>
                  <select value={editDetails.role} onChange={e => handleDetailChange('role', e.target.value)}>
                    {Object.values(ROLES).map(role => (
                      <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}

              <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '20px 0'}} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {user.role === ROLES.ADMIN && selectedUser.id && user.id && selectedUser.id !== user.id ? (
                   <button type="button" onClick={handleDeleteUser} className="action-btn danger">Remove User</button>
                ) : <div></div>}
                <div style={{display: 'flex', gap: '10px'}}>
                  <button type="button" onClick={closeUserModal} className="action-btn" style={{backgroundColor: '#e2e8f0', color: '#475569'}}>Cancel</button>
                  <button type="submit" className="action-btn primary">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
