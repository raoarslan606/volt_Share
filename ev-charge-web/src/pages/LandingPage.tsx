import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, MapPin, ShieldCheck, DollarSign, Clock, ArrowRight, Car, CheckCircle2, Star, Sparkles } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 overflow-hidden">
      {/* ──────────────────────── HERO SECTION ──────────────────────── */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-brand-500/10 via-brand-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-400">
              <Sparkles className="w-4 h-4" />
              <span>Pakistan's #1 EV Charging Network</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-display text-white leading-tight">
              Charge Anywhere.{' '}
              <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                Earn Everywhere.
              </span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
              Connect with certified home charger hosts or discover verified public EV charging stations near you. Safe, instant booking, zero hassle.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
              <Link
                to="/map"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-slate-950 font-bold text-base shadow-xl shadow-brand-500/25 flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-0.5"
              >
                <MapPin className="w-5 h-5" />
                <span>Find Nearby Charger</span>
              </Link>
              <Link
                to="/signup"
                className="px-8 py-4 rounded-xl glass-card hover:bg-slate-800/80 text-white font-semibold text-base flex items-center justify-center space-x-2 border border-slate-700 transition-all"
              >
                <span>Become a Host</span>
                <ArrowRight className="w-5 h-5 text-brand-400" />
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80">
              <div>
                <div className="text-2xl font-bold font-display text-white">500+</div>
                <div className="text-xs text-slate-400">Active Stations</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-white">10,000+</div>
                <div className="text-xs text-slate-400">kWh Shared</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-white">PKR 0</div>
                <div className="text-xs text-slate-400">Platform Fee Early Hosts</div>
              </div>
            </div>
          </motion.div>

          {/* Hero Image Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group min-h-[380px]">
              <img
                src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1600&q=80"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=80';
                }}
                alt="Electric vehicle charging station"
                className="w-full h-[450px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/20 to-transparent" />

              {/* Floating Live Badge */}
              <div className="absolute bottom-6 left-6 right-6 glass-card p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-brand-400 animate-ping" />
                  <div>
                    <div className="text-xs text-slate-400">Verified Charger Nearby</div>
                    <div className="text-sm font-bold text-white">DHA Phase 5 — 22kW Fast Type 2</div>
                  </div>
                </div>
                <div className="text-brand-400 font-bold text-sm bg-brand-500/10 px-3 py-1 rounded-lg border border-brand-500/20">
                  PKR 25/kWh
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────── HOW IT WORKS ──────────────────────── */}
      <section className="py-24 bg-navy-950 relative border-t border-slate-800/60" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white mb-4">
              How VoltShare Works
            </h2>
            <p className="text-slate-400">
              Whether you want to charge your vehicle on the go or monetise your wallbox at home, we make it seamless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Locate & Select',
                desc: 'Filter nearby verified chargers on our interactive map by connector type, fast DC/AC capacity, and live availability.',
                icon: MapPin,
              },
              {
                step: '02',
                title: 'Book & Connect',
                desc: 'Reserve a time slot instantly. Chat directly with the host or call them for directions and arrival coordination.',
                icon: Clock,
              },
              {
                step: '03',
                title: 'Plug & Charge',
                desc: 'Charge your EV with peace of mind. Pay host directly or through automated platform tracking.',
                icon: Zap,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="glass-card glass-card-hover p-8 rounded-2xl relative group"
              >
                <div className="text-5xl font-extrabold font-display text-slate-800 group-hover:text-brand-500/20 transition-colors absolute top-6 right-6">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────── HOST CTA BANNER ──────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative border border-slate-800 glass-card">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center space-y-6">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
                Turn your home EV charger into passive income
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Have a 7kW or 11kW wallbox charger at home? List it on VoltShare and start earning whenever your charger is idle.
              </p>

              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400" />
                  <span>Set your own price per kWh & availability schedule</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400" />
                  <span>CNIC & Phone verified drivers for security</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400" />
                  <span>Direct JazzCash / EasyPaisa payouts</span>
                </li>
              </ul>

              <div>
                <Link
                  to="/signup?role=HOST"
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold shadow-lg shadow-brand-500/20 transition-all"
                >
                  <span>Register as Host Today</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="relative min-h-[350px] lg:min-h-full">
              <img
                src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=80"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1600&q=80';
                }}
                alt="Home electric vehicle charger"
                className="w-full h-full object-cover min-h-[350px]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-transparent to-transparent lg:block hidden" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
