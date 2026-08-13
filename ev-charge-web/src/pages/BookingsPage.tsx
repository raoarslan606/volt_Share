import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, LayoutDashboard, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { Booking } from '../types';
import { useAuthStore } from '../store/useAuthStore';

export const BookingsPage: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['driver-bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings/mine');
      return res.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/bookings/${id}/status`, { status: 'CANCELLED' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      toast.success('Booking cancelled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    },
  });

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Host Banner Redirect */}
        {user?.role === 'HOST' && (
          <div className="glass-card p-4 rounded-2xl border border-brand-500/30 bg-brand-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-5 h-5 text-brand-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">Looking for incoming driver requests for your station?</div>
                <div className="text-xs text-slate-300">Host station requests are managed under your Host Dashboard.</div>
              </div>
            </div>
            <Link
              to="/host/dashboard"
              className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shrink-0"
            >
              <span>Go to Host Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-white">
              {user?.role === 'HOST' ? 'My Personal Driver Reservations' : 'My Bookings'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Track your reserved charging slots at public or home stations.</p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'ALL' ? 'bg-brand-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('CONFIRMED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'CONFIRMED' ? 'bg-brand-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'PENDING' ? 'bg-brand-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white font-display">No driver reservations found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {user?.role === 'HOST'
                ? 'This page lists chargers that you reserve as a driver. To manage incoming requests for your own charger, open Host Dashboard.'
                : 'Head to the map to locate a charger and make a reservation.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-lg text-white font-display">
                      {booking.station?.stationName || 'Charging Station'}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : booking.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center space-x-4">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-brand-400 mr-1" />
                      {booking.station?.address}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 text-brand-400 mr-1" />
                      {booking.timeSlot} • {new Date(booking.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {booking.status === 'PENDING' && (
                  <button
                    onClick={() => cancelMutation.mutate(booking.id)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700 font-bold text-xs"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
