import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create the Stock Context
const StockContext = createContext();

// Custom hook to use the Stock Context
export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

// Stock Provider Component
export const StockProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State for different types of rights
  const [categoryRights, setCategoryRights] = useState([]);
  const [magasinRights, setMagasinRights] = useState([]);
  const [clientRights, setClientRights] = useState([]);
  
  // Loading states
  const [loadingCategoryRights, setLoadingCategoryRights] = useState(false);
  const [loadingMagasinRights, setLoadingMagasinRights] = useState(false);
  const [loadingClientRights, setLoadingClientRights] = useState(false);
  
  // Error states
  const [categoryRightsError, setCategoryRightsError] = useState(null);
  const [magasinRightsError, setMagasinRightsError] = useState(null);
  const [clientRightsError, setClientRightsError] = useState(null);

  // API base URL - adjust according to your backend configuration
  const API_BASE_URL =  'http://localhost:5000/api';

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Fetch category rights for current user
  const fetchCategoryRights = async (userId = null) => {
    setLoadingCategoryRights(true);
    setCategoryRightsError(null);
    
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        throw new Error('User ID is required');
      }

      const data = await makeAuthenticatedRequest(`/droits/category/user/${targetUserId}`);
      setCategoryRights(data.data || data);
    } catch (error) {
      console.error('Error fetching category rights:', error);
      setCategoryRightsError(error.message);
    } finally {
      setLoadingCategoryRights(false);
    }
  };

  // Fetch magasin rights for current user
  const fetchMagasinRights = async (userId = null) => {
    setLoadingMagasinRights(true);
    setMagasinRightsError(null);
    
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        throw new Error('User ID is required');
      }

      const data = await makeAuthenticatedRequest(`/droits/magasin/user/${targetUserId}`);
      setMagasinRights(data.data || data);
    } catch (error) {
      console.error('Error fetching magasin rights:', error);
      setMagasinRightsError(error.message);
    } finally {
      setLoadingMagasinRights(false);
    }
  };

  // Fetch client rights for current user
  const fetchClientRights = async (userId = null) => {
    setLoadingClientRights(true);
    setClientRightsError(null);
    
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        throw new Error('User ID is required');
      }

      const data = await makeAuthenticatedRequest(`/droits/client/user/${targetUserId}`);
      setClientRights(data.data || data);
    } catch (error) {
      console.error('Error fetching client rights:', error);
      setClientRightsError(error.message);
    } finally {
      setLoadingClientRights(false);
    }
  };

  // Fetch all rights for current user
  const fetchAllRights = async (userId = null) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      console.error('User ID is required to fetch rights');
      return;
    }

    try {
      const data = await makeAuthenticatedRequest(`/droits/user/${targetUserId}/all`);
      
      if (data.data) {
        setCategoryRights(data.data.categories || []);
        setMagasinRights(data.data.magasins || []);
        setClientRights(data.data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching all rights:', error);
      // Fallback to individual fetches
      await Promise.all([
        fetchCategoryRights(targetUserId),
        fetchMagasinRights(targetUserId),
        fetchClientRights(targetUserId)
      ]);
    }
  };

  // Check if user has specific rights
  const checkUserRights = async (userId, options = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (options.categoryid) queryParams.append('categoryid', options.categoryid);
      if (options.magasinid) queryParams.append('magasinid', options.magasinid);
      if (options.clientid) queryParams.append('clientid', options.clientid);

      const data = await makeAuthenticatedRequest(`/droits/check/${userId}?${queryParams}`);
      return data.data || data;
    } catch (error) {
      console.error('Error checking user rights:', error);
      return false;
    }
  };

  // Create new category right
  const createCategoryRight = async (rightData) => {
    try {
      const data = await makeAuthenticatedRequest('/droits/category', {
        method: 'POST',
        body: JSON.stringify(rightData),
      });
      
      // Refresh category rights after creation
      await fetchCategoryRights();
      return data;
    } catch (error) {
      console.error('Error creating category right:', error);
      throw error;
    }
  };

  // Create new magasin right
  const createMagasinRight = async (rightData) => {
    try {
      const data = await makeAuthenticatedRequest('/droits/magasin', {
        method: 'POST',
        body: JSON.stringify(rightData),
      });
      
      // Refresh magasin rights after creation
      await fetchMagasinRights();
      return data;
    } catch (error) {
      console.error('Error creating magasin right:', error);
      throw error;
    }
  };

  // Create new client right
  const createClientRight = async (rightData) => {
    try {
      const data = await makeAuthenticatedRequest('/droits/client', {
        method: 'POST',
        body: JSON.stringify(rightData),
      });
      
      // Refresh client rights after creation
      await fetchClientRights();
      return data;
    } catch (error) {
      console.error('Error creating client right:', error);
      throw error;
    }
  };

  // Update category right
  const updateCategoryRight = async (rightId, rightData) => {
    try {
      const data = await makeAuthenticatedRequest(`/droits/category/${rightId}`, {
        method: 'PUT',
        body: JSON.stringify(rightData),
      });
      
      // Refresh category rights after update
      await fetchCategoryRights();
      return data;
    } catch (error) {
      console.error('Error updating category right:', error);
      throw error;
    }
  };

  // Update magasin right
  const updateMagasinRight = async (rightId, rightData) => {
    try {
      const data = await makeAuthenticatedRequest(`/droits/magasin/${rightId}`, {
        method: 'PUT',
        body: JSON.stringify(rightData),
      });
      
      // Refresh magasin rights after update
      await fetchMagasinRights();
      return data;
    } catch (error) {
      console.error('Error updating magasin right:', error);
      throw error;
    }
  };

  // Update client right
  const updateClientRight = async (rightId, rightData) => {
    try {
      const data = await makeAuthenticatedRequest(`/droits/client/${rightId}`, {
        method: 'PUT',
        body: JSON.stringify(rightData),
      });
      
      // Refresh client rights after update
      await fetchClientRights();
      return data;
    } catch (error) {
      console.error('Error updating client right:', error);
      throw error;
    }
  };

  // Delete category right
  const deleteCategoryRight = async (rightId) => {
    try {
      const data = await makeAuthenticatedRequest(`/droits/category/${rightId}`, {
        method: 'DELETE',
      });
      
      // Refresh category rights after deletion
      await fetchCategoryRights();
      return data;
    } catch (error) {
      console.error('Error deleting category right:', error);
      throw error;
    }
  };

  // Delete magasin right
  const deleteMagasinRight = async (rightId) => {
    try {
      const data = await makeAuthenticatedRequest(`/droits/magasin/${rightId}`, {
        method: 'DELETE',
      });
      
      // Refresh magasin rights after deletion
      await fetchMagasinRights();
      return data;
    } catch (error) {
      console.error('Error deleting magasin right:', error);
      throw error;
    }
  };

  // Delete client right
  const deleteClientRight = async (rightId) => {
    try {
      const data = await makeAuthenticatedRequest(`/droits/client/${rightId}`, {
        method: 'DELETE',
      });
      
      // Refresh client rights after deletion
      await fetchClientRights();
      return data;
    } catch (error) {
      console.error('Error deleting client right:', error);
      throw error;
    }
  };

  // Helper functions to check active rights
  const getActiveCategoryRights = () => {
    const now = new Date();
    return categoryRights.filter(right => {
      const startDate = new Date(right.DroitStartIn);
      const endDate = new Date(right.DroitExpiredAt);
      return now >= startDate && now <= endDate;
    });
  };

  const getActiveMagasinRights = () => {
    const now = new Date();
    return magasinRights.filter(right => {
      const startDate = new Date(right.DroitStartIn);
      const endDate = new Date(right.DroitExpiredAt);
      return now >= startDate && now <= endDate;
    });
  };

  const getActiveClientRights = () => {
    const now = new Date();
    return clientRights.filter(right => {
      const startDate = new Date(right.DroitStartIn);
      const endDate = new Date(right.DroitExpiredAt);
      return now >= startDate && now <= endDate;
    });
  };

  // Auto-fetch rights when user changes
  useEffect(() => {
    if (user?.id) {
      fetchAllRights();
    }
  }, [user?.id]);

  const value = {
    // State
    categoryRights,
    magasinRights,
    clientRights,
    
    // Loading states
    loadingCategoryRights,
    loadingMagasinRights,
    loadingClientRights,
    
    // Error states
    categoryRightsError,
    magasinRightsError,
    clientRightsError,
    
    // Fetch functions
    fetchCategoryRights,
    fetchMagasinRights,
    fetchClientRights,
    fetchAllRights,
    checkUserRights,
    
    // CRUD functions
    createCategoryRight,
    createMagasinRight,
    createClientRight,
    updateCategoryRight,
    updateMagasinRight,
    updateClientRight,
    deleteCategoryRight,
    deleteMagasinRight,
    deleteClientRight,
    
    // Helper functions
    getActiveCategoryRights,
    getActiveMagasinRights,
    getActiveClientRights,
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
};