import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const budgetService = {
  // Get all budgets
  async getBudgets() {
    try {
      const response = await axios.get(`${API_URL}/budgets`);
      return response.data;
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch budgets');
    }
  },

  // Get a single budget by ID
  async getBudgetById(id) {
    try {
      const response = await axios.get(`${API_URL}/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch budget');
    }
  },

  // Create new budget
  async createBudget(budgetData) {
    try {
      const response = await axios.post(`${API_URL}/budgets`, budgetData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create budget');
    }
  },

  // Update existing budget
  async updateBudget(id, budgetData) {
    try {
      const response = await axios.put(`${API_URL}/budgets/${id}`, budgetData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update budget');
    }
  },

  // Delete budget
  async deleteBudget(id) {
    try {
      const response = await axios.delete(`${API_URL}/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete budget');
    }
  }
};

export default budgetService;
