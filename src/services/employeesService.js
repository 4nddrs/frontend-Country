import axios from 'axios';
import API_URL from './api';

export const listEmployees = () => axios.get(`${API_URL}/employees/`);
export const getEmployee = (idEmployee) => axios.get(`${API_URL}/employees/${idEmployee}`);
export const createEmployee = (data) => axios.post(`${API_URL}/employees/`, data);
export const updateEmployee = (idEmployee, data) => axios.put(`${API_URL}/employees/${idEmployee}`, data);
export const deleteEmployee = (idEmployee) => axios.delete(`${API_URL}/employees/${idEmployee}`);