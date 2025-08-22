import axios from 'axios';
import API_URL from './api';

export const listEmployeeRoles = () => axios.get(`${API_URL}/employee_roles/`);
export const getEmployeeRole = (idRoleEmployee) => axios.get(`${API_URL}/employee_roles/${idRoleEmployee}`);
export const createEmployeeRole = (data) => axios.post(`${API_URL}/employee_roles/`, data);
export const updateEmployeeRole = (idRoleEmployee, data) => axios.put(`${API_URL}/employee_roles/${idRoleEmployee}`, data);
export const deleteEmployeeRole = (idRoleEmployee) => axios.delete(`${API_URL}/employee_roles/${idRoleEmployee}`);