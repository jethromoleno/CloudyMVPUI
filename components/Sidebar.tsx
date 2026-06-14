import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Map, Truck, Users, Settings, 
  LogOut, ClipboardList, ChevronDown, Package, 
  DollarSign, Grid
} from 'lucide-react';
import { Theme, AppModule } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout: () => void;
  username: string;
  userRole: string;
  theme: Theme;
  onSelectModule: (module: AppModule | 'hub') => void;
  activeModule?: AppModule | 'hub';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setCurrentView, onLogout, username, userRole, theme, onSelectModule, activeModule 
}) => {
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trip-management', label: 'Trip Management', icon: ClipboardList },
    { id: 'trips', label: 'Trip Schedule', icon: Map },
    { id: 'trucks', label: 'Truck Management', icon: Truck },
    { id: 'employees', label: 'Employee Directory', icon: Users },
  ];

  const apps = [
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'trip_scheduling', label: 'LogiTrack AI', icon: Map },
    { id: 'billing', label: 'Billing System', icon: DollarSign },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAppMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentApp = apps.find(app => app.id === activeModule) || { id: 'trip_scheduling', label: 'LogiTrack AI', icon: Map };

  return (
    <div className="w-64 bg-white dark:bg-carbon-950 h-screen border-r border-navy-100 dark:border-carbon-800 flex flex-col text-navy-600 dark:text-carbon-300 transition-colors duration-300 shrink-0 z-50">
      {/* App Switcher Header */}
      <div className="p-4 border-b border-navy-100 dark:border-carbon-800 relative" ref={menuRef}>
        <button 
          onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-navy-50 dark:bg-carbon-900 border border-navy-100 dark:border-carbon-800 hover:border-navy-300 dark:hover:border-carbon-600 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy-900 dark:bg-white rounded-lg flex items-center justify-center shadow-lg shadow-navy-900/20 dark:shadow-none animate-fade-in">
              <currentApp.icon className="text-white dark:text-carbon-900 w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-navy-400 dark:text-carbon-500 uppercase tracking-widest">Workspace</p>
              <p className="text-sm font-bold text-navy-900 dark:text-white truncate">{currentApp.label}</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-navy-400 transition-transform duration-300 ${isAppMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isAppMenuOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-carbon-900 border border-navy-100 dark:border-carbon-800 rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-navy-50 dark:border-carbon-800">
              <button 
                onClick={() => { onSelectModule('hub'); setIsAppMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-navy-50 dark:hover:bg-carbon-800 transition-colors text-navy-600 dark:text-carbon-300"
              >
                <Grid className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Hub</span>
              </button>
            </div>
            <div className="p-2 space-y-1">
              <p className="px-3 py-1 text-[10px] font-bold text-navy-400 dark:text-carbon-500 uppercase tracking-widest">Switch App</p>
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => { onSelectModule(app.id as AppModule); setIsAppMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    app.id === activeModule 
                    ? 'bg-navy-50 dark:bg-carbon-800 text-navy-900 dark:text-white font-semibold' 
                    : 'hover:bg-navy-50 dark:hover:bg-carbon-800 text-navy-600 dark:text-carbon-455'
                  }`}
                >
                  <app.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{app.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col overflow-y-auto">
        {activeModule === 'inventory' || activeModule === 'billing' ? (
          <div className="space-y-4">
            <p className="px-4 text-xs font-semibold text-navy-400 dark:text-carbon-500 uppercase tracking-wider mb-2">Navigation</p>
            <button
              onClick={() => onSelectModule('hub')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-navy-950 dark:bg-white text-white dark:text-black font-semibold shadow-md"
            >
              <Grid className="w-5 h-5 shrink-0" />
              <span>Back to Hub</span>
            </button>
            <button
              onClick={() => onSelectModule('trip_scheduling')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-50 dark:hover:bg-carbon-900 border border-dashed border-navy-200 dark:border-carbon-800 text-navy-600 dark:text-carbon-300 font-medium"
            >
              <Map className="w-5 h-5 shrink-0 text-navy-400" />
              <span>Return to Logistics</span>
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="px-4 text-xs font-semibold text-navy-400 dark:text-carbon-500 uppercase tracking-wider mb-2">Trip Scheduling</p>
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-navy-900 dark:bg-carbon-800 text-white dark:text-white font-semibold shadow-md dark:shadow-none'
                          : 'hover:bg-navy-50 dark:hover:bg-carbon-900 hover:text-navy-900 dark:hover:text-white text-navy-500 dark:text-carbon-400'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-navy-400 dark:text-carbon-500'}`} />
                      <span className="">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1"></div>

            <div className="mt-4">
              <p className="px-4 text-xs font-semibold text-navy-400 dark:text-carbon-500 uppercase tracking-wider mb-2">System</p>
              <button
                onClick={() => setCurrentView('settings')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentView === 'settings'
                    ? 'bg-navy-900 dark:bg-carbon-800 text-white dark:text-white font-semibold shadow-md dark:shadow-none'
                    : 'hover:bg-navy-50 dark:hover:bg-carbon-900 hover:text-navy-900 dark:hover:text-white text-navy-500 dark:text-carbon-400'
                }`}
              >
                <Settings className={`w-5 h-5 ${currentView === 'settings' ? 'text-white' : 'text-navy-400 dark:text-carbon-500'}`} />
                <span className="">Settings</span>
              </button>
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-navy-100 dark:border-carbon-800">
        <div className="flex items-center mb-4 px-4">
          <div className="w-8 h-8 bg-navy-100 dark:bg-carbon-800 rounded-full flex items-center justify-center text-xs font-bold text-navy-600 dark:text-white border border-navy-200 dark:border-carbon-700">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-navy-900 dark:text-white">{username}</p>
            <p className="text-xs text-navy-500 dark:text-carbon-500">{userRole}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 p-2 rounded-md text-navy-500 dark:text-carbon-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;