import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Zap, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^03\d{9}$/, 'Must be a valid Pakistani phone number (03XXXXXXXXX)'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/(?=.*\d)/, 'Password must contain at least one number'),
  role: z.enum(['DRIVER', 'HOST']),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get('role') as 'HOST' | 'DRIVER') || 'DRIVER';

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: defaultRole },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', data);
      setAuth(res.data.accessToken, {
        id: res.data.userId,
        role: res.data.role,
        name: data.name,
        email: data.email,
        phone: data.phone,
        isVerified: false,
        authProvider: 'LOCAL',
        createdAt: new Date().toISOString(),
      });
      toast.success('Account created successfully!');
      if (data.role === 'HOST') navigate('/host/dashboard');
      else navigate('/map');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden glass-card border border-slate-800 shadow-2xl">
        {/* Left Side: Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center space-y-5">
          <div>
            <Link to="/" className="inline-flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-brand-400 fill-brand-400" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Volt<span className="text-brand-400">Share</span>
              </span>
            </Link>
            <h2 className="text-2xl font-bold text-white font-display">Create Account</h2>
            <p className="text-slate-400 text-sm mt-1">Join Pakistan's EV charging sharing network.</p>
          </div>

          {/* Role Segmented Control */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setValue('role', 'DRIVER')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                selectedRole === 'DRIVER'
                  ? 'bg-brand-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🚗 Driver (Charge EV)
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'HOST')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                selectedRole === 'HOST'
                  ? 'bg-brand-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Host (Earn Money)
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('name')}
                  placeholder="Ali Raza"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="ali@example.com"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pakistani Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('phone')}
                  placeholder="03001234567"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 chars & 1 number"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-brand-400 font-semibold hover:underline">
              Log In
            </Link>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="relative hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1697811827966-27bc1c73f5f3?auto=format&fit=crop&w=1200&q=80"
            alt="EV Charger Connector"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent p-8 flex flex-col justify-end">
            <div className="flex items-center space-x-2 text-brand-400 font-bold text-xs mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified & Secured</span>
            </div>
            <p className="text-slate-200 text-sm">
              Join hundreds of hosts and drivers advancing sustainable electric mobility across Pakistan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
