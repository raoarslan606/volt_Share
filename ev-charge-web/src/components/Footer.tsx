import React from 'react';
import { Zap, ShieldCheck, Heart, MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 border-t border-slate-800/80 pt-16 pb-8 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-400 fill-brand-400" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Volt<span className="text-brand-400">Share</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Pakistan's first community-driven peer-to-peer EV charging sharing infrastructure.
              Monetize your home charger or find fast charging anywhere.
            </p>
            <div className="flex items-center space-x-2 text-xs text-brand-400 font-semibold bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Enterprise Grade Security</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/map" className="hover:text-brand-400 transition-colors">Find Nearby Charger</a></li>
              <li><a href="/signup" className="hover:text-brand-400 transition-colors">Become a Host</a></li>
              <li><a href="#how-it-works" className="hover:text-brand-400 transition-colors">How It Works</a></li>
              <li><a href="/bookings" className="hover:text-brand-400 transition-colors">Driver Portal</a></li>
            </ul>
          </div>

          {/* Connectors Supported */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Supported Connectors</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                <span>Type 2 (IEC 62196)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                <span>CCS 2 (Combined Charging)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                <span>GB/T (Chinese Standard)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                <span>CHAdeMO (Fast DC)</span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Support & Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Lahore, Islamabad, Karachi — Pakistan</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span>+92 300 1234567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>support@voltshare.pk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} VoltShare Enterprise. All rights reserved.
          </div>
          <div className="flex items-center space-x-1">
            <span>Built with precision for EV sustainability</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
