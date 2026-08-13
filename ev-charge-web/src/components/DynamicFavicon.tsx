import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Sleek, high-end vector SVG Favicons with metallic dark backdrops & neon glows
const FAVICONS = {
  // Default: Sleek Neon Volt Emblem
  DEFAULT: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%230F172A"/>
        <stop offset="100%" stop-color="%23060A12"/>
      </linearGradient>
      <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%2334D399"/>
        <stop offset="100%" stop-color="%2310B981"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="36" fill="url(%23bg)" stroke="%2334D399" stroke-width="4" stroke-opacity="0.4"/>
    <path d="M72 16 L32 70 H60 L54 112 L96 56 H68 Z" fill="url(%23neon)"/>
  </svg>`,

  // Driver: Sleek Cyber-Cyan EV Aero Emblem
  DRIVER: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="bgD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23083344"/>
        <stop offset="100%" stop-color="%23060A12"/>
      </linearGradient>
      <linearGradient id="cyanG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%2322D3EE"/>
        <stop offset="100%" stop-color="%230891B2"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="36" fill="url(%23bgD)" stroke="%2322D3EE" stroke-width="4" stroke-opacity="0.5"/>
    <path d="M28 76 C24 76 20 72 20 68 L26 44 C28 36 36 30 46 30 H82 C92 30 100 36 102 44 L108 68 C108 72 104 76 100 76 H94 V86 C94 90 90 94 84 94 H76 C70 94 66 90 66 86 V76 H62 V86 C62 90 58 94 52 94 H44 C38 94 34 90 34 86 V76 Z M38 52 H90 M40 66 A 6 6 0 1 0 40 66.1 M88 66 A 6 6 0 1 0 88 66.1" fill="none" stroke="url(%23cyanG)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Host: Enterprise Emerald Power Wallbox Emblem
  HOST: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="bgH" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23064E3B"/>
        <stop offset="100%" stop-color="%23060A12"/>
      </linearGradient>
      <linearGradient id="emG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%2310B981"/>
        <stop offset="100%" stop-color="%23059669"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="36" fill="url(%23bgH)" stroke="%2310B981" stroke-width="4" stroke-opacity="0.5"/>
    <rect x="34" y="24" width="60" height="80" rx="14" fill="none" stroke="url(%23emG)" stroke-width="7"/>
    <path d="M68 38 L48 68 H62 L56 90 L78 58 H64 Z" fill="url(%23emG)"/>
  </svg>`,

  // Admin: Royal Gold Chrome Shield Emblem
  ADMIN: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="bgA" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23451A03"/>
        <stop offset="100%" stop-color="%23060A12"/>
      </linearGradient>
      <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23FBBF24"/>
        <stop offset="50%" stop-color="%23F59E0B"/>
        <stop offset="100%" stop-color="%23B45309"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="36" fill="url(%23bgA)" stroke="%23F59E0B" stroke-width="4" stroke-opacity="0.6"/>
    <path d="M64 22 L98 36 V66 C98 88 83 104 64 110 C45 104 30 88 30 66 V36 Z" fill="none" stroke="url(%23goldG)" stroke-width="7" stroke-linejoin="round"/>
    <path d="M64 42 L56 60 H66 L60 82 L72 58 H62 Z" fill="url(%23goldG)"/>
  </svg>`,
};

export const DynamicFavicon: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    let iconUrl = FAVICONS.DEFAULT;
    let pageTitle = 'VoltShare — EV Network';

    const pathname = location.pathname;

    if (user?.role === 'ADMIN' || pathname.startsWith('/admin')) {
      iconUrl = FAVICONS.ADMIN;
      pageTitle = 'VoltShare Admin — Control Center';
    } else if (user?.role === 'HOST' || pathname.startsWith('/host')) {
      iconUrl = FAVICONS.HOST;
      pageTitle = 'VoltShare Host — Station Management';
    } else if (user?.role === 'DRIVER' || pathname === '/bookings' || pathname === '/map') {
      iconUrl = FAVICONS.DRIVER;
      pageTitle = 'VoltShare — Driver Portal';
    } else {
      iconUrl = FAVICONS.DEFAULT;
      pageTitle = 'VoltShare — Enterprise EV Charging Network';
    }

    // 1. Update Document Title
    document.title = pageTitle;

    // 2. Update Favicon Link tag in <head>
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = iconUrl;
  }, [user, location.pathname]);

  return null;
};
