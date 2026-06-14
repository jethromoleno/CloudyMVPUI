import React, { useState } from 'react';
import { Truck, Sun, Moon } from 'lucide-react';
import { Theme } from '../types';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string | null;
  theme: Theme;
  onToggleTheme: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, theme, onToggleTheme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onLogin(username, password);
    }
  };

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-carbon-950 flex items-center justify-center relative overflow-hidden transition-colors duration-500">
      {/* Decorative background elements - Softer for Omni Light */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-navy-200 dark:bg-carbon-800 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob opacity-60 dark:opacity-10"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-navy-300 dark:bg-carbon-800 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob animation-delay-2000 opacity-60 dark:opacity-10"></div>
      </div>

      <button 
        onClick={onToggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-carbon-800 shadow-lg border border-navy-100 dark:border-carbon-700 text-navy-600 dark:text-carbon-300 hover:scale-110 transition-transform z-20"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/80 dark:bg-carbon-900/80 backdrop-blur-xl border border-white/50 dark:border-carbon-800 rounded-2xl shadow-xl transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-navy-900 dark:bg-white rounded-xl flex items-center justify-center mb-4 shadow-xl shadow-navy-900/20 dark:shadow-none">
            <Truck className="text-white dark:text-carbon-900 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white tracking-tight">LogiTrack AI</h1>
          <p className="text-navy-500 dark:text-carbon-400 mt-2">Enterprise Logistics Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-navy-500 dark:text-carbon-300 mb-2 uppercase tracking-wide">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-carbon-600 focus:outline-none focus:ring-2 focus:ring-navy-900 dark:focus:ring-white focus:border-transparent transition-all shadow-sm"
              placeholder="e.g. SuperAdmin"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-500 dark:text-carbon-300 mb-2 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-carbon-600 focus:outline-none focus:ring-2 focus:ring-navy-900 dark:focus:ring-white focus:border-transparent transition-all shadow-sm"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-200 text-white dark:text-carbon-900 font-semibold rounded-lg shadow-lg shadow-navy-900/20 dark:shadow-none transition-all duration-200 transform hover:scale-[1.01]"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-navy-400 dark:text-carbon-600 text-xs mt-8 font-medium">
          Secure System &bull; Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default Login;