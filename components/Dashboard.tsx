import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trip, Truck, TripFuel, Theme } from '../types';
import { Activity, CalendarClock, AlertTriangle, Fuel } from 'lucide-react';

interface DashboardProps {
  trips: Trip[];
  trucks: Truck[];
  fuels: TripFuel[];
  theme: Theme;
}

const Dashboard: React.FC<DashboardProps> = ({ trips, trucks, fuels, theme }) => {
  // Calculations based on Schema
  const totalFuelCost = fuels.reduce((acc, f) => acc + f.total_amount, 0);
  const activeTrips = trips.filter(t => t.status === 'In Transit').length;
  const pendingTrips = trips.filter(t => t.status === 'Scheduled').length;
  const maintenanceTrucks = trucks.filter(t => t.status === 'Maintenance').length;
  
  // Mock chart data derived from status
  const statusData = [
    { name: 'Transit', count: activeTrips },
    { name: 'Sched', count: pendingTrips },
    { name: 'Done', count: trips.filter(t => t.status === 'Completed').length },
    { name: 'Rescue', count: trips.filter(t => t.status === 'Rescue').length },
  ];

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto bg-navy-50 dark:bg-carbon-950 transition-colors duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white">Overview</h1>
        <p className="text-navy-600 dark:text-carbon-400 mt-1">Real-time performance metrics.</p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-carbon-900 p-6 rounded-lg border border-navy-100 dark:border-carbon-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-navy-500 dark:text-carbon-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Fuel Costs</p>
              <h3 className="text-3xl font-light text-navy-900 dark:text-white">${totalFuelCost.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-navy-50 dark:bg-carbon-800 rounded-md text-navy-600 dark:text-white">
              <Fuel className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-carbon-900 p-6 rounded-lg border border-navy-100 dark:border-carbon-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-navy-500 dark:text-carbon-400 text-xs font-semibold uppercase tracking-wider mb-1">Active Trips</p>
              <h3 className="text-3xl font-light text-navy-900 dark:text-white">{activeTrips}</h3>
            </div>
            <div className="p-2 bg-navy-50 dark:bg-carbon-800 rounded-md text-navy-600 dark:text-white">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-carbon-900 p-6 rounded-lg border border-navy-100 dark:border-carbon-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-navy-500 dark:text-carbon-400 text-xs font-semibold uppercase tracking-wider mb-1">Scheduled</p>
              <h3 className="text-3xl font-light text-navy-900 dark:text-white">{pendingTrips}</h3>
            </div>
            <div className="p-2 bg-navy-50 dark:bg-carbon-800 rounded-md text-navy-600 dark:text-white">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-carbon-900 p-6 rounded-lg border border-navy-100 dark:border-carbon-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-navy-500 dark:text-carbon-400 text-xs font-semibold uppercase tracking-wider mb-1">Maintenance</p>
              <h3 className="text-3xl font-light text-navy-900 dark:text-white">{maintenanceTrucks}</h3>
            </div>
            <div className="p-2 bg-navy-50 dark:bg-carbon-800 rounded-md text-navy-600 dark:text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-carbon-900 p-8 rounded-lg border border-navy-100 dark:border-carbon-800 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider mb-6">Trip Velocity</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statusData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#ffffff' : '#0f172a'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme === 'dark' ? '#ffffff' : '#0f172a'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#27272a' : '#e2e8f0'} vertical={false} />
                <XAxis 
                    dataKey="name" 
                    stroke={theme === 'dark' ? '#6d6d6d' : '#94a3b8'} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                    fontSize={12}
                />
                <YAxis 
                    stroke={theme === 'dark' ? '#6d6d6d' : '#94a3b8'} 
                    axisLine={false} 
                    tickLine={false} 
                    dx={-10}
                    fontSize={12}
                />
                <Tooltip 
                   cursor={{stroke: theme === 'dark' ? '#555' : '#ccc', strokeWidth: 1}}
                   contentStyle={{ 
                     backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', 
                     border: theme === 'dark' ? '1px solid #27272a' : '1px solid #e2e8f0',
                     boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                     borderRadius: '6px',
                     color: theme === 'dark' ? '#fff' : '#0f172a' 
                   }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke={theme === 'dark' ? '#ffffff' : '#0f172a'} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-carbon-900 p-8 rounded-lg border border-navy-100 dark:border-carbon-800 shadow-sm flex items-center justify-center min-w-0">
            <div className="text-center">
                <div className="w-16 h-16 bg-navy-50 dark:bg-carbon-800 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Activity className="w-8 h-8 text-navy-400 dark:text-carbon-400" />
                </div>
                <p className="text-navy-900 dark:text-white font-medium mb-1">Advanced Telemetry</p>
                <p className="text-navy-500 dark:text-carbon-500 text-sm">Waiting for more Trip_Event data...</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;