/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { backend } from '../backend';

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

  const syncState = async () => {
    const nextState = await backend.getUserState();
    setUser(nextState.user);
    setUsers(nextState.users);
    setAppointments(nextState.appointments);
    setApplications(nextState.applications);
    setTasks(nextState.tasks);
    setWards(nextState.wards);
    setDepartments(nextState.departments);
  };

  useEffect(() => {
    syncState().catch(() => null).finally(() => setLoading(false));

    if (backend.storageKeys) {
      const handleStorage = (event) => {
        const watchedKeys = Object.values(backend.storageKeys);
        if (!event.key || watchedKeys.includes(event.key)) {
          syncState();
        }
      };

      window.addEventListener('storage', handleStorage);
      return () => {
        window.removeEventListener('storage', handleStorage);
      };
    }

    return undefined;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await backend.login(email, password);

      await syncState();

      if (!result.success) {
        return {
          success: false,
          accountCreated: result.accountCreated,
          message: result.message
        };
      }

      return { success: true };
    } catch (error) {
      console.error('[Login] Unexpected error:', error);
      return {
        success: false,
        message: error?.message || 'An unexpected error occurred. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      const signupHandler = backend.signupUser || backend.signupPatient;
      const result = await signupHandler(userData);
      await syncState();
      return result;
    } catch (error) {
      console.error('[Signup] Unexpected error:', error);
      return {
        success: false,
        message: error?.message || 'An unexpected error occurred while creating the account.'
      };
    }
  };

  const logout = async () => {
    const result = await backend.logout();
    await syncState();
    return result;
  };

  const bookAppointment = async (appointmentData) => {
    const result = await backend.bookAppointment(appointmentData);
    await syncState();
    return result;
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    const result = await backend.updateAppointmentStatus(appointmentId, newStatus);
    await syncState();
    return result;
  };

  const submitApplication = async (formData) => {
    const result = await backend.submitApplication(formData);
    await syncState();
    return result;
  };

  const approveApplication = async (applicationId) => {
    const result = await backend.approveApplication(applicationId);
    await syncState();
    return result;
  };

  const rejectApplication = async (applicationId) => {
    const result = await backend.rejectApplication(applicationId);
    await syncState();
    return result;
  };

  const deleteApplication = async (applicationId) => {
    const result = await backend.deleteApplication(applicationId);
    await syncState();
    return result;
  };

  const assignTask = async (wardboyId, description, assignedByRole, assignedByName) => {
    const result = await backend.assignTask(wardboyId, description, assignedByRole, assignedByName);
    await syncState();
    return result;
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const result = await backend.updateTaskStatus(taskId, newStatus);
    await syncState();
    return result;
  };

  const addUser = async (userData) => {
    const result = await backend.addUser(userData);
    await syncState();
    return result;
  };

  const removeUser = async (userToRemove) => {
    const result = await backend.removeUser(userToRemove);
    await syncState();
    return result;
  };

  const updateUserRole = async (userId, currentRole, newRole) => {
    const result = await backend.updateUserRole(userId, currentRole, newRole);
    await syncState();
    return result;
  };

  const updateUserDetails = async (userId, role, details) => {
    const result = await backend.updateUserDetails(userId, role, details);
    await syncState();
    return result;
  };

  const addDepartment = async (name) => {
    const result = await backend.addDepartment(name);
    await syncState();
    return result;
  };

  const addWard = async (wardNo, depid, totalBeds) => {
    const result = await backend.addWard(wardNo, depid, totalBeds);
    await syncState();
    return result;
  };

  const updateWardBeds = async (wardId, addedBeds) => {
    const result = await backend.updateWardBeds(wardId, addedBeds);
    await syncState();
    return result;
  };

  const deleteWard = async (wardId) => {
    const result = await backend.deleteWard(wardId);
    await syncState();
    return result;
  };

  const updateWard = async (wardId, updatedData) => {
    const result = await backend.updateWard(wardId, updatedData);
    await syncState();
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        appointments,
        applications,
        wards,
        departments,
        tasks,
        loading,
        login,
        signup,
        logout,
        bookAppointment,
        updateAppointmentStatus,
        submitApplication,
        approveApplication,
        rejectApplication,
        deleteApplication,
        assignTask,
        updateTaskStatus,
        addUser,
        removeUser,
        updateUserRole,
        updateUserDetails,
        addDepartment,
        addWard,
        updateWard,
        updateWardBeds,
        deleteWard
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
