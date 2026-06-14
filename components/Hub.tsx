import React from 'react';
import { Package, Map, DollarSign, Lock, Sun, Moon, LogOut } from 'lucide-react';
import { SystemUser, AppModule, Theme } from '../types';

interface HubProps {
  user: SystemUser;
  onSelectModule: (module: AppModule) => void;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const Hub: React.FC<HubProps> = ({ user, onSelectModule, onLogout, theme, onToggleTheme }) => {
  const hasPermission = (module: AppModule) => user.permissions.includes(module);

  const modules = [
    {
      id: 'inventory' as AppModule,
      title: 'Inventory Management',
      description: 'Warehouse tracking, stock levels, and asset management.',
      icon: Package,
      // Light Mode: Slate/Navy aesthetic
      lightBg: 'bg-white',
      lightBorder: 'border-navy-100',
      lightIconBg: 'bg-emerald-50 text-emerald-600',
      lightText: 'text-navy-900',
      // Dark Mode: Carbon / Matte Black
      darkBg: 'dark:bg-carbon-900',
      darkBorder: 'dark:border-carbon-800',
      darkIconBg: 'dark:bg-emerald-500/10 dark:text-emerald-500',
      darkText: 'dark:text-white'
    },
    {
      id: 'trip_scheduling' as AppModule,
      title: 'Trip Scheduling (LogiTrack)',
      description: 'Logistics, route planning, fleet management, and AI analysis.',
      icon: Map,
      lightBg: 'bg-white',
      lightBorder: 'border-navy-100',
      lightIconBg: 'bg-navy-50 text-navy-700',
      lightText: 'text-navy-900',
      darkBg: 'dark:bg-carbon-900',
      darkBorder: 'dark:border-carbon-800',
      darkIconBg: 'dark:bg-blue-500/10 dark:text-blue-500',
      darkText: 'dark:text-white'
    },
    {
      id: 'billing' as AppModule,
      title: 'Billing System',
      description: 'Invoicing, expense tracking, and financial reporting.',
      icon: DollarSign,
      lightBg: 'bg-white',
      lightBorder: 'border-navy-100',
      lightIconBg: 'bg-purple-50 text-purple-700',
      lightText: 'text-navy-900',
      darkBg: 'dark:bg-carbon-900',
      darkBorder: 'dark:border-carbon-800',
      darkIconBg: 'dark:bg-purple-500/10 dark:text-purple-500',
      darkText: 'dark:text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-carbon-950 flex flex-col relative overflow-hidden transition-colors duration-500">
      {/* Background Decor - Subtle for Light Mode, Hidden/Minimal for Dark */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-navy-200 dark:bg-carbon-800 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[120px] opacity-40 dark:opacity-10"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-navy-200 dark:bg-carbon-800 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[120px] opacity-40 dark:opacity-10"></div>
      </div>

      <header className="relative z-10 px-8 py-6 flex justify-between items-center border-b border-navy-100 dark:border-carbon-800 bg-white/80 dark:bg-carbon-950/50 backdrop-blur-md">
        <h1 className="text-xl font-bold text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-navy-900 dark:bg-white rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-white dark:bg-carbon-900 rounded-full"></div>
            </div>
            Enterprise Portal
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleTheme}
            className="p-2 rounded-full bg-navy-100 dark:bg-carbon-800 text-navy-600 dark:text-carbon-300 hover:bg-navy-200 dark:hover:bg-carbon-700 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="h-6 w-px bg-navy-200 dark:bg-carbon-800 mx-2"></div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-navy-900 dark:text-white">{user.username}</p>
            <p className="text-xs text-navy-500 dark:text-carbon-500">{user.role}</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm font-medium text-navy-600 dark:text-carbon-400 hover:text-navy-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-navy-100 dark:hover:bg-carbon-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const allowed = hasPermission(mod.id);

            return (
              <button
                key={mod.id}
                onClick={() => allowed && onSelectModule(mod.id)}
                disabled={!allowed}
                className={`
                  relative group overflow-hidden rounded-xl border transition-all duration-300 text-left h-80 flex flex-col justify-between p-8
                  ${allowed 
                    ? `${mod.lightBg} ${mod.darkBg} ${mod.lightBorder} ${mod.darkBorder} hover:shadow-xl hover:shadow-navy-200/50 dark:hover:shadow-none hover:-translate-y-1` 
                    : 'bg-navy-50 border-navy-200 dark:bg-carbon-950 dark:border-carbon-800 opacity-60 cursor-not-allowed grayscale'}
                `}
              >
                <div>
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-6 ${allowed ? `${mod.lightIconBg} ${mod.darkIconBg}` : 'bg-navy-100 text-navy-400 dark:bg-carbon-800'}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h2 className={`text-xl font-bold mb-2 ${mod.lightText} ${mod.darkText}`}>{mod.title}</h2>
                  <p className="text-navy-500 dark:text-carbon-400 text-sm leading-relaxed">{mod.description}</p>
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-navy-100 dark:border-carbon-800/50">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${allowed ? 'text-navy-900 dark:text-white' : 'text-navy-400'}`}>
                    {allowed ? 'Launch App' : 'Restricted'}
                  </span>
                  {!allowed ? <Lock className="w-4 h-4 text-navy-400" /> : <div className="w-6 h-6 rounded-full bg-navy-900 dark:bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white dark:bg-carbon-900 rounded-full"></div></div>}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Hub;