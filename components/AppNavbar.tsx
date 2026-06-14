import React from 'react';
import { Package, Map, DollarSign, LayoutGrid } from 'lucide-react';
import { AppModule } from '../types';

interface AppNavbarProps {
  activeModule: AppModule | 'hub';
  onSelectModule: (module: AppModule | 'hub') => void;
}

const AppNavbar: React.FC<AppNavbarProps> = ({ activeModule, onSelectModule }) => {
  const navItems = [
    { id: 'hub', label: 'Apps', icon: LayoutGrid },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'trip_scheduling', label: 'LogiTrack', icon: Map },
    { id: 'billing', label: 'Billing', icon: DollarSign },
  ];

  return (
    <div className="w-full flex justify-center pt-6 pb-2 px-6 z-40 shrink-0">
      <div className="flex items-center gap-1 p-1.5 bg-white/90 dark:bg-carbon-900/80 backdrop-blur-md border border-navy-200 dark:border-carbon-800 rounded-lg shadow-sm transition-all duration-300">
        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-navy-800 dark:bg-white text-white dark:text-carbon-900 shadow-md shadow-navy-900/10 dark:shadow-none' 
                  : 'text-navy-500 dark:text-carbon-400 hover:text-navy-900 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-carbon-800'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default AppNavbar;