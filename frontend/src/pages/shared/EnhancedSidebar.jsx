// pages/shared/EnhancedSidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  Store,
  Layers,
  Package,
  Users as SuppliersIcon,
  FileText,
  ShoppingCart,
  BarChart3,
  Lock,
  HelpCircle,
  Settings,
  LogOut
} from 'lucide-react';

const SidebarItem = ({ item, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(item.isOpen || false);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === location.pathname || 
                  (hasChildren && item.children.some(child => child.path === location.pathname));

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
    if (item.onClick) {
      item.onClick(e);
    }
  };

  return (
    <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
      <Link
        to={item.path || '#'}
        className={`flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-lg ${
          level > 0 ? 'pl-8' : ''
        } ${isActive ? 'bg-blue-50 text-blue-600' : ''}`}
        onClick={handleClick}
      >
        <item.icon className="w-5 h-5 mr-3" />
        <span className="flex-1">{item.label}</span>
        {hasChildren && (
          <span className="ml-2">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </Link>
      
      {hasChildren && isOpen && (
        <div className="ml-4 mt-1">
          {item.children.map((child, index) => (
            <SidebarItem key={index} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const EnhancedSidebar = ({ logoUrl, navigationItems, supportItems, onLogout }) => {
  return (
    <div className="w-72 bg-white shadow-lg border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div style={{background:"#3c518f98",display:"flex",justifyContent:"center"}}  className="p-6 border-b border-gray-200">
        <img src={logoUrl} style={{width:"50%",height:"auto"}}  alt="Logo" className="h-8" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {navigationItems.map((item, index) => (
            <SidebarItem key={index} item={item} />
          ))}
        </div>
      </nav>

      {/* Support & Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="space-y-1">
          {supportItems.map((item, index) => (
            <SidebarItem key={index} item={item} />
          ))}
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg mt-2"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default EnhancedSidebar;