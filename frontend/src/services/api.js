/**
 * Base API client for all HTTP requests
 * Handles authentication, error handling, and response formatting
 */

const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = envApiUrl || (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3001/api'
  : '/api');

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get the authorization token from localStorage
   */
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Set the authorization token in localStorage
   */
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  /**
   * Get headers with authorization
   */
  getHeaders() {
    const headers = { ...this.defaultHeaders };
    const token = this.getAuthToken();
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Handle API response
   */
  handleResponse(response) {
    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - clear token and redirect to login
        this.setAuthToken(null);
        window.location.href = '/login';
      }
      
      return response.json().then(data => {
        throw new Error(data.error || `HTTP ${response.status}`);
      }).catch(error => {
        throw new Error(`HTTP ${response.status}: ${error.message}`);
      });
    }
    
    return response.json();
  }

  /**
   * Make a GET request
   */
  async get(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        ...options,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data = {}, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
        ...options,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a PUT request
   */
  async put(endpoint, data = {}, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
        ...options,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
        ...options,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a PATCH request
   */
  async patch(endpoint, data = {}, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
        ...options,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`PATCH ${endpoint} failed:`, error);
      throw error;
    }
  }
}

export default new ApiClient();
