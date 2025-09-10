import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

// Import the modules configuration
const modulesConfig = {
  "erp_modules": {
    "gestion_stock": {
      "name": "Gestion de Stock",
      "description": "Stock management module",
      "actions": [
        {
          "id": "create_category",
          "name": "Créer Catégorie",
          "description": "Create new product category",
          "component": "CategoryManagement"
        },
        {
          "id": "validate_category",
          "name": "Valider Catégorie",
          "description": "Validate pending categories",
          "component": "CategoryManagement"
        },
        {
          "id": "delete_category",
          "name": "Supprimer Catégorie",
          "description": "Delete existing category",
          "component": "CategoryManagement"
        },
        {
          "id": "create_product",
          "name": "Créer Produit",
          "description": "Create new product",
          "component": "ProductManagement"
        },
        {
          "id": "validate_product",
          "name": "Valider Produit",
          "description": "Validate pending products",
          "component": "ProductManagement"
        },
        {
          "id": "delete_product",
          "name": "Supprimer Produit",
          "description": "Delete existing product",
          "component": "ProductManagement"
        },
        {
          "id": "manage_stock",
          "name": "Gérer Stock",
          "description": "Manage stock levels and movements",
          "component": "StockManagement"
        },
        {
          "id": "view_stock_reports",
          "name": "Voir Rapports Stock",
          "description": "View stock reports and analytics",
          "component": "StockManagement"
        },
        {
          "id": "create_supplier",
          "name": "Créer Fournisseur",
          "description": "Create new supplier",
          "component": "SupplierManagement"
        },
        {
          "id": "manage_suppliers",
          "name": "Gérer Fournisseurs",
          "description": "Manage supplier information",
          "component": "SupplierManagement"
        },
        {
          "id": "create_purchase_request",
          "name": "Créer Demande Achat",
          "description": "Create purchase request",
          "component": "PurchaseRequestManagement"
        },
        {
          "id": "validate_purchase_request",
          "name": "Valider Demande Achat",
          "description": "Validate purchase requests",
          "component": "PurchaseRequestManagement"
        },
        {
          "id": "create_purchase_order",
          "name": "Créer Bon Commande",
          "description": "Create purchase order",
          "component": "PurchaseOrderManagement"
        },
        {
          "id": "validate_purchase_order",
          "name": "Valider Bon Commande",
          "description": "Validate purchase orders",
          "component": "PurchaseOrderManagement"
        },
        {
          "id": "manage_magasin",
          "name": "Gérer Magasin",
          "description": "Manage store/warehouse information",
          "component": "MagasinManagement"
        }
      ]
    }
  }
};

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.posteData && user.posteData.actions) {
      try {
        // Parse user actions from posteData
        const userActions = Array.isArray(user.posteData.actions) 
          ? user.posteData.actions 
          : JSON.parse(user.posteData.actions || '[]');
        
        setPermissions(userActions);
      } catch (error) {
        console.error('Error parsing user actions:', error);
        setPermissions([]);
      }
    } else {
      setPermissions([]);
    }
    setLoading(false);
  }, [user]);

  // Check if user has permission for a specific action
  const hasPermission = (actionId) => {
    if (!user || !permissions) return false;
    return permissions.includes(actionId);
  };

  // Check if user has permission for a specific component
  const hasComponentAccess = (componentName) => {
    if (!user || !permissions) return false;
    
    // Get all actions for this component from modules config
    const allActions = [];
    Object.values(modulesConfig.erp_modules).forEach(module => {
      module.actions.forEach(action => {
        if (action.component === componentName) {
          allActions.push(action.id);
        }
      });
    });

    // Check if user has at least one action for this component
    return allActions.some(actionId => permissions.includes(actionId));
  };

  // Get all actions user has for a specific component
  const getComponentActions = (componentName) => {
    if (!user || !permissions) return [];
    
    const componentActions = [];
    Object.values(modulesConfig.erp_modules).forEach(module => {
      module.actions.forEach(action => {
        if (action.component === componentName && permissions.includes(action.id)) {
          componentActions.push(action.id);
        }
      });
    });

    return componentActions;
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasComponentAccess,
    getComponentActions
  };
};

export default usePermissions;