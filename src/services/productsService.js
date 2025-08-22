import axios from 'axios';
import API_URL from './api';

export const listProducts = () => axios.get(`${API_URL}/products/`);
export const getProduct = (product_id) => axios.get(`${API_URL}/products/${product_id}`);
export const createProduct = (data) => axios.post(`${API_URL}/products/`, data);
export const updateProduct = (product_id, data) => axios.put(`${API_URL}/products/${product_id}`, data);
export const deleteProduct = (product_id) => axios.delete(`${API_URL}/products/${product_id}`);