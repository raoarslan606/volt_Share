import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Zap, Calendar, CreditCard, PlusCircle, CheckCircle, XCircle, Clock, Upload, MapPin, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import { Booking, Subscription, Station } from '../types';

export const HostDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'stations' | 'subscription'>('bookings');
  const [subAmount, setSubAmount] = useState('1500');
  const [txnId, setTxnId] = useState('');
  const [subFile, setSubFile] = useState<File | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch host bookings
  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery<Booking[]>({
    queryKey: ['host-bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings/host');
      return res.data;
    },
  });

  // Fetch host registered stations
  const { data: myStations = [] } = useQuery<Station[]>({
    queryKey: ['host-stations'],
    queryFn: async () => {
      const res = await api.get('/stations/mine');
      return res.data;
    },
  });

  // Fetch host subscriptions
  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['host-subscriptions'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/mine');
      return res.data;
    },
  });

  // Mutation for booking status updates
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-bookings'] });
      toast.success('Booking status updated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  // Handle Subscription Proof Upload & Submission
  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subFile || !txnId) {
      toast.error('Please enter transaction ID and select a screenshot');
      return;
    }

    setSubLoading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', subFile);
      const uploadRes = await api.post('/subscriptions/upload-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await api.post('/subscriptions', {
        amount: parseFloat(subAmount),
        transactionId: txnId,
        screenshotUrl: uploadRes.data.url,
      });

      toast.success('Subscription proof submitted for admin verification!');
      setTxnId('');
      setSubFile(null);
      queryClient.invalidateQueries({ queryKey: ['host-subscriptions'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-white">Host Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage charger bookings, stations, and monthly subscriptions.</p>
          </div>
          <Link
            to="/host/station/new"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Station</span>
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 font-semibold uppercase">My Stations</div>
            <div className="text-3xl font-bold font-display text-white">
              {myStations.length}
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 font-semibold uppercase">Pending Requests</div>
            <div className="text-3xl font-bold font-display text-amber-400">
              {bookings.filter((b) => b.status === 'PENDING').length}
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 font-semibold uppercase">Confirmed Bookings</div>
            <div className="text-3xl font-bold font-display text-emerald-400">
              {bookings.filter((b) => b.status === 'CONFIRMED').length}
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 font-semibold uppercase">Subscription Status</div>
            <div className="text-lg font-bold font-display text-white flex items-center space-x-2">
              {subscriptions[0]?.status === 'APPROVED' ? (
                <span className="text-emerald-400 flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" /> Active
                </span>
              ) : (
                <span className="text-amber-400 flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-1" /> {subscriptions[0]?.status || 'Renewal Needed'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 flex items-center space-x-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-b-2 border-brand-500 text-brand-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Booking Requests ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stations')}
            className={`pb-3 flex items-center space-x-2 transition-colors ${
              activeTab === 'stations'
                ? 'border-b-2 border-brand-500 text-brand-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>My Stations ({myStations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`pb-3 flex items-center space-x-2 transition-colors ${
              activeTab === 'subscription'
                ? 'border-b-2 border-brand-500 text-brand-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Monthly Subscription</span>
          </button>
        </div>

        {/* Tab 1: Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {isBookingsLoading ? (
              <div className="text-center py-8 text-slate-500 text-sm">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center space-y-3 border border-slate-800">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white font-display">No incoming booking requests yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {myStations.length === 0
                    ? 'You have not registered any charging station yet. Click "Register New Station" above to list your charger!'
                    : 'Your station is listed! When a driver selects your charger on the map and places a booking, their request will appear here for your confirmation.'}
                </p>
                {myStations.length === 0 && (
                  <Link
                    to="/host/station/new"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Register Station Now</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-base">{booking.driver?.name || 'Driver'}</span>
                        <span className="text-xs text-slate-400">({booking.driver?.phone || 'No phone'})</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : booking.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Station: <span className="text-slate-200">{booking.station?.stationName}</span> • Slot:{' '}
                        <span className="text-brand-400 font-bold">{booking.timeSlot}</span> on{' '}
                        {new Date(booking.date).toLocaleDateString()}
                      </div>
                    </div>

                    {booking.status === 'PENDING' && (
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <button
                          onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'CONFIRMED' })}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'REJECTED' })}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700 font-bold text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Stations */}
        {activeTab === 'stations' && (
          <div className="space-y-4">
            {myStations.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center space-y-3 border border-slate-800">
                <Zap className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white font-display">No stations registered yet</h3>
                <p className="text-xs text-slate-400">Add your home or commercial EV charger to start accepting driver bookings.</p>
                <Link
                  to="/host/station/new"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Station</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myStations.map((station) => (
                  <div key={station.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white font-display text-base">{station.stationName}</h4>
                        <div className="text-xs text-slate-400 flex items-center mt-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-400 mr-1 shrink-0" />
                          {station.address}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          station.verificationStatus === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : station.verificationStatus === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {station.verificationStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl text-xs text-slate-300">
                      <div>
                        <div className="text-[10px] text-slate-500">Connector</div>
                        <div className="font-bold text-white">{station.connectorType}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Capacity</div>
                        <div className="font-bold text-white">{station.capacity}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Rate</div>
                        <div className="font-bold text-brand-400">PKR {station.pricePerKwh}/kWh</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Subscription */}
        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-lg text-white font-display">JazzCash / EasyPaisa Payment</h3>
              <p className="text-xs text-slate-400">
                Household hosts pay a PKR 1,500 monthly platform fee to keep their charger active on the public map.
              </p>

              <div className="bg-slate-900 p-4 rounded-xl space-y-2 border border-slate-800 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Account Title:</span>
                  <span className="font-bold text-white">VoltShare EV Network</span>
                </div>
                <div className="flex justify-between">
                  <span>JazzCash / EasyPaisa:</span>
                  <span className="font-bold text-brand-400">0300-1234567</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold text-white">PKR 1,500 / month</span>
                </div>
              </div>

              <form onSubmit={handleSubscriptionSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 0192837465"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Screenshot Proof</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSubFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={subLoading}
                  className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{subLoading ? 'Uploading...' : 'Submit Payment Proof'}</span>
                </button>
              </form>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-lg text-white font-display">Payment History</h3>
              {subscriptions.length === 0 ? (
                <div className="text-xs text-slate-500">No payment history yet.</div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">Txn: {sub.transactionId}</div>
                        <div className="text-slate-400">PKR {sub.amount} • {new Date(sub.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span
                        className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full border ${
                          sub.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : sub.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
