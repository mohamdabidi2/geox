import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Rights management hook that integrates with your existing system
export const useRightsManagement = () => {
  const [userRights, setUserRights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use the useAuth hook at the top level
  const auth = useAuth();
  
  // Get user from auth context or fallback
  const user = auth?.user || {
    id: 2,
    username: 'admin',
    firstname: 'Admin',
    lastname: 'User',
    magasin: { id: 1 }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserRights();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchUserRights = async () => {
    try {
      setLoading(true);
      // Fetch user rights from your API
      const response = await axios.get(`http://localhost:5000/api/users/${user.id}/rights`);
      setUserRights(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user rights:', err);
      setError('Failed to fetch user rights');
      // Set fallback rights for development
      setUserRights({
        magasins: [user?.magasin?.id].filter(Boolean),
        categories: [], // Empty means access to all categories
        clients: []     // Empty means access to all clients
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user has access to a specific magasin
  const hasMagasinAccess = (magasinId) => {
    if (!userRights || !magasinId) return false;
   
    // If user has no magasin rights, deny access
    if (!userRights.magasins || userRights.magasins.length === 0) {
     
      return false;
    }
    
    // Check if user has access to this specific magasin
      console.log(userRights.magasins.includes(parseInt(magasinId)))
    
    return userRights.magasins.includes(parseInt(magasinId));
  };

  // Check if user has access to a specific category
  const hasCategoryAccess = (categoryId) => {
    if (!userRights || !categoryId) return true; // Default allow if no restrictions
    
    // If categories array is empty, user has access to all categories
    if (!userRights.categories || userRights.categories.length === 0) {
      return true;
    }
    
    // Check if user has access to this specific category
    return userRights.categories.includes(parseInt(categoryId));
  };

  // Check if user has access to a specific client
  const hasClientAccess = (clientId) => {
    if (!userRights || !clientId) return true; // Default allow if no restrictions
    
    // If clients array is empty, user has access to all clients
    if (!userRights.clients || userRights.clients.length === 0) {
      return true;
    }
    
    // Check if user has access to this specific client
    return userRights.clients.includes(parseInt(clientId));
  };

  // Filter data based on user rights
  const filterByRights = (data, type) => {
    if (!data || !Array.isArray(data)) return [];
    
    switch (type) {
      case 'magasins':
        return data.filter(item => hasMagasinAccess(item.id || item.magasin?.id));
      
      case 'categories':
        return data.filter(item => hasCategoryAccess(item.id || item.category_id));
      
      case 'clients':
        return data.filter(item => hasClientAccess(item.id || item.client_id));
      
      case 'products':
        // Products need both magasin and category access
        return data.filter(item => 
          hasMagasinAccess(item.magasin?.id) && 
          hasCategoryAccess(item.category_id)
        );
      
      case 'orders':
        // Orders need both magasin and client access
        return data.filter(item => 
          hasMagasinAccess(item.magasin?.id) && 
          hasClientAccess(item.client_id)
        );
      
      default:
        return data;
    }
  };

  // Check if user has mandatory magasin access
  const hasMandatoryMagasinAccess = () => {
    if (!user?.magasin?.id) return false;
    return hasMagasinAccess(user.magasin.id);
  };

  // Get accessible magasins for the current user
  const getAccessibleMagasins = () => {
    return userRights?.magasins || [];
  };

  // Get accessible categories for the current user
  const getAccessibleCategories = () => {
    return userRights?.categories || [];
  };

  // Get accessible clients for the current user
  const getAccessibleClients = () => {
    return userRights?.clients || [];
  };

  return {
    userRights,
    loading,
    error,
    user,
    hasMagasinAccess,
    hasCategoryAccess,
    hasClientAccess,
    filterByRights,
    hasMandatoryMagasinAccess,
    getAccessibleMagasins,
    getAccessibleCategories,
    getAccessibleClients,
    refreshRights: fetchUserRights
  };
};

export default useRightsManagement;