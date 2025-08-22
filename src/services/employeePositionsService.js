import axios from 'axios';
import API_URL from './api';

export const listEmployeePositions = () => axios.get(`${API_URL}/employee_positions/`);
export const getEmployeePosition = (idPositionEmployee) => axios.get(`${API_URL}/employee_positions/${idPositionEmployee}`);
export const createEmployeePosition = (data) => axios.post(`${API_URL}/employee_positions/`, data);
export const updateEmployeePosition = (idPositionEmployee, data) => axios.put(`${API_URL}/employee_positions/${idPositionEmployee}`, data);
export const deleteEmployeePosition = (idPositionEmployee) => axios.delete(`${API_URL}/employee_positions/${idPositionEmployee}`);