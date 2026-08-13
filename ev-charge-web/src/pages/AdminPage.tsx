import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield, CheckCircle, XCircle, MapPin, User, DollarSign } from 'lucide-react';
import { api } from '../lib/api';
import { Station, Subscription, User as UserType } from '../types';

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<'stations' | 'subscriptions' | 'users'>('stations');
  const queryClient = useQueryClient();

  // Fetch pending stations
  const { data: pendingStations = [] } = useQuery<Station[]>({
    queryKey: ['admin-pending-stations'],
    queryFn: async () => {
      const res = await api.get('/admin/stations/pending');
      return res.data;
    },
  });

  // Fetch pending subscriptions
  const { data: pendingSubs = [] } = useQuery<Subscription[]>({
    queryKey: ['admin-pending-subscriptions'],
    queryFn: async () => {
      const res = await api.get('/admin/subscriptions/pending');
      return res.data;
    },
  });

  // Fetch users
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
  });

  // Verify station mutation
  const verifyStationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
      await api.patch(`/admin/stations/${id}/verify`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-stations'] });
      toast.success('Station verification status updated');
    },
  });

  // Verify subscription mutation
  const verifySubMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
      await api.patch(`/admin/subscriptions/${id}/verify`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-subscriptions'] });
      toast.success('Subscription status updated & station extended!');
    },
  });

  // Verify CNIC user mutation
  const verifyUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/users/${id}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User CNIC verified');
    },
  });

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-white">Admin Control Center</h1>
            <p className="text-xs text-slate-400">Review pending host stations, subscription receipts, and user verification.</p>
          </div>
        </div>

        {/* Admin Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold uppercase">Pending Stations</div>
            <div className="text-3xl font-bold text-amber-400 font-display mt-1">{pendingStations.length}</div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold uppercase">Pending Subscriptions</div>
            <div className="text-3xl font-bold text-brand-400 font-display mt-1">{pendingSubs.length}</div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold uppercase">Registered Users</div>
            <div className="text-3xl font-bold text-white font-display mt-1">{users.length}</div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 space-x-6 text-xs font-bold">
          <button
            onClick={() => setTab('stations')}
            className={`pb-3 ${tab === 'stations' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-slate-400'}`}
          >
            Pending Stations ({pendingStations.length})
          </button>
          <button
            onClick={() => setTab('subscriptions')}
            className={`pb-3 ${tab === 'subscriptions' ? 'border-b-2 border-brand-400 text-brand-400' : 'text-slate-400'}`}
          >
            Subscription Proofs ({pendingSubs.length})
          </button>
          <button
            onClick={() => setTab('users')}
            className={`pb-3 ${tab === 'users' ? 'border-b-2 border-white text-white' : 'text-slate-400'}`}
          >
            User Verification ({users.filter((u) => !u.isVerified).length})
          </button>
        </div>

        {/* TAB 1: PENDING STATIONS */}
        {tab === 'stations' && (
          <div className="space-y-4">
            {pendingStations.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center text-xs text-slate-500">No stations pending verification.</div>
            ) : (
              pendingStations.map((station) => (
                <div key={station.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-white text-base font-display">{station.stationName}</div>
                    <div className="text-xs text-slate-400">{station.address} • {station.capacity} ({station.connectorType})</div>
                    <div className="text-xs text-brand-400 font-bold">PKR {station.pricePerKwh}/kWh</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => verifyStationMutation.mutate({ id: station.id, status: 'APPROVED' })}
                      className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => verifyStationMutation.mutate({ id: station.id, status: 'REJECTED' })}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: PENDING SUBSCRIPTIONS */}
        {tab === 'subscriptions' && (
          <div className="space-y-4">
            {pendingSubs.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center text-xs text-slate-500">No subscription receipts pending review.</div>
            ) : (
              pendingSubs.map((sub) => (
                <div key={sub.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-white text-base">Txn ID: {sub.transactionId}</div>
                    <div className="text-xs text-slate-400">Amount: PKR {sub.amount}</div>
                    {sub.screenshotUrl && (
                      <a href={sub.screenshotUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-400 underline font-semibold">
                        View Payment Screenshot
                      </a>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => verifySubMutation.mutate({ id: sub.id, status: 'APPROVED' })}
                      className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs"
                    >
                      Approve Payment
                    </button>
                    <button
                      onClick={() => verifySubMutation.mutate({ id: sub.id, status: 'REJECTED' })}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: USERS */}
        {tab === 'users' && (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{u.name} ({u.role})</div>
                  <div className="text-slate-400">{u.email} • {u.phone || 'No phone'}</div>
                </div>

                {u.isVerified ? (
                  <span className="text-emerald-400 font-bold flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> Verified
                  </span>
                ) : (
                  <button
                    onClick={() => verifyUserMutation.mutate(u.id)}
                    className="px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/40 font-bold"
                  >
                    Verify CNIC
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
