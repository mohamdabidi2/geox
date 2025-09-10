import React from 'react';
import { 
  Search, 
  Package,
  Users,
  Headphones,
  ShoppingCart,
  Truck,
  Factory,
  Calculator,
  UserCheck,
  Settings2,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ModulesDirectory = () => {
  const navigate = useNavigate();

  const handleModuleClick = (moduleTitle) => {
    switch (moduleTitle) {
      case 'User Management':
        navigate('/admin/users');
        break;
      case 'Stock Management':
        // Add route when available
        navigate('/admin/stock-menu');
        break;
      case 'CRM':
        // Add route when available
        console.log('Navigating to CRM');
        break;
      case 'Sales':
        // Add route when available
        console.log('Navigating to Sales');
        break;
      case 'Procurement':
        // Add route when available
        console.log('Navigating to Procurement');
        break;
      case 'Production':
        // Add route when available
        console.log('Navigating to Production');
        break;
      case 'Finance':
        // Add route when available
        console.log('Navigating to Finance');
        break;
      case 'HR':
        // Add route when available
        console.log('Navigating to HR');
        break;
      case 'Administration':
        // Add route when available
        console.log('Navigating to Administration');
        break;
      case 'Maintenance':
        // Add route when available
        console.log('Navigating to Maintenance');
        break;
      default:
        console.log(`No route defined for ${moduleTitle}`);
    }
  };

  const statsCards = [
    { label: 'Active Users', value: '248' },
    { label: 'Open Orders', value: '63' },
    { label: 'Low Stock Items', value: '18' },
    { label: 'Tickets', value: '5' },
  ];

  const moduleCards = [
    {
      icon: Package,
      title: 'Stock Management',
      description: 'Track inventory, transfers, batches and alerts.',
      primaryAction: 'Open',
      secondaryAction: 'Quick Actions'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Create roles, manage permissions and access.',
      primaryAction: 'Open',
      secondaryAction: 'Invite User'
    },
    {
      icon: Headphones,
      title: 'CRM',
      description: 'Leads, deals, pipelines, and communications.',
      primaryAction: 'Open',
      secondaryAction: 'New Lead'
    },
    {
      icon: ShoppingCart,
      title: 'Sales',
      description: 'Quotes, orders, invoices and customers.',
      primaryAction: 'Open',
      secondaryAction: 'New Order'
    },
    {
      icon: Truck,
      title: 'Procurement',
      description: 'Suppliers, purchase orders, receipts and bills.',
      primaryAction: 'Open',
      secondaryAction: 'New PO'
    },
    {
      icon: Factory,
      title: 'Production',
      description: 'BOMs, work orders, scheduling and quality.',
      primaryAction: 'Open',
      secondaryAction: 'Plan Run'
    },
    {
      icon: Calculator,
      title: 'Finance',
      description: 'GL, AP/AR, cash, and reconciliations.',
      primaryAction: 'Open',
      secondaryAction: 'New Invoice'
    },
    {
      icon: UserCheck,
      title: 'HR',
      description: 'Employees, attendance, payroll and leave.',
      primaryAction: 'Open',
      secondaryAction: 'Add Employee'
    },
    {
      icon: Settings2,
      title: 'Administration',
      description: 'System configuration and organization settings.',
      primaryAction: 'Open',
      secondaryAction: 'Audit Logs'
    },
    {
      icon: Wrench,
      title: 'Maintenance',
      description: 'Assets, preventive and corrective tasks.',
      primaryAction: 'Open',
      secondaryAction: 'New Work Order'
    }
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Explore Modules</h1>
            <p className="text-gray-600 mt-1">Choose a module to get started.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search modules, settings..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-80"
              />
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-3 gap-6">
          {moduleCards.map((module, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <module.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">{module.description}</p>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => handleModuleClick(module.title)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {module.primaryAction}
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">
                  {module.secondaryAction}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ModulesDirectory;

