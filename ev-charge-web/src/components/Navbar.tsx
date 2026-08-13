import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, MapPin, Calendar, Shield, LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Volt<span className="text-brand-400">Share</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest text-slate-400 -mt-1 font-semibold">
                EV Enterprise Network
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/map"
              className="flex items-center space-x-2 text-slate-300 hover:text-brand-400 font-medium transition-colors"
            >
              <MapPin className="w-4 h-4 text-brand-500" />
              <span>Find Chargers</span>
            </Link>

            {user?.role === 'HOST' && (
              <Link
                to="/host/dashboard"
                className="flex items-center space-x-2 text-brand-400 hover:text-brand-300 font-bold transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Host Dashboard</span>
              </Link>
            )}

            {user && (
              <Link
                to="/bookings"
                className="flex items-center space-x-2 text-slate-300 hover:text-brand-400 font-medium transition-colors"
              >
                <Calendar className="w-4 h-4 text-brand-500" />
                <span>{user.role === 'HOST' ? 'My Driver Reservations' : 'My Bookings'}</span>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'HOST' && (
                  <Link
                    to="/host/station/new"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 hover:bg-brand-500/20 font-medium text-sm transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Station</span>
                  </Link>
                )}

                <div className="flex items-center space-x-3 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1.5">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-400 font-bold flex items-center justify-center text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left pr-2">
                    <div className="text-xs font-semibold text-white">{user.name}</div>
                    <div className="text-[10px] text-brand-400 capitalize font-medium">{user.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white font-medium text-sm transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
