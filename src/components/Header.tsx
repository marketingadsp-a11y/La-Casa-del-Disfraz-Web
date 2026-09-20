import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Menu, 
  X, 
  ShieldCheck, 
  FileText, 
  MessageCircle,
  Sparkles,
  Lock,
  Palette,
  Layers,
  Home,
  Star,
  ExternalLink
} from 'lucide-react';
import { getStoreLiveStatus, buildWhatsAppLink } from '../utils/storeStatus';
import { useSiteContent } from '../context/SiteContentContext';
import { NavigationItem } from '../types/siteContent';

interface HeaderProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  activePath
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(true);
  const { content } = useSiteContent();
  const { storeInfo, theme, navigationMenu } = content;
  const webLogo = content.branding?.webLogoUrl || 'https://lacasadeldisfraz.mx/images/logo-horizontal-web_one.png';

  useEffect(() => {
    setLogoLoaded(true);
  }, [webLogo]);

  const liveStatus = getStoreLiveStatus(storeInfo.manualStatusOverride);

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const getNavIcon = (iconName?: string, path?: string) => {
    const key = (iconName || '').toLowerCase();
    if (key === 'map-pin' || path?.includes('ubicacion')) return <MapPin className="w-3.5 h-3.5 text-rose-500" />;
    if (key === 'shield' || path?.includes('requisitos')) return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
    if (key === 'file-text' || path?.includes('tyc')) return <FileText className="w-3.5 h-3.5 text-amber-500" />;
    if (key === 'lock' || path?.includes('privacidad')) return <Lock className="w-3.5 h-3.5 text-emerald-600" />;
    if (key === 'sparkles' || path?.includes('historia')) return <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />;
    if (key === 'palette' || path?.includes('invitaciones')) return <Palette className="w-3.5 h-3.5 text-indigo-500" />;
    if (key === 'home') return <Home className="w-3.5 h-3.5 text-slate-500" />;
    if (key === 'star') return <Star className="w-3.5 h-3.5 text-amber-400" />;
    if (path?.startsWith('/')) return <Layers className="w-3.5 h-3.5 text-fuchsia-500" />;
    return null;
  };

  const activeMenuItems = (navigationMenu || [])
    .filter(item => item.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-fuchsia-100 shadow-2xs">
      {/* Top Banner: Store status, address & quick phone */}
      <div className="bg-gradient-to-r from-purple-900 via-fuchsia-900 to-rose-900 text-white text-[11px] sm:text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Live store indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveStatus.isOpen ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${liveStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-bold tracking-wide">
              {liveStatus.statusText}
            </span>
            <span className="hidden md:inline text-fuchsia-200">
              — {liveStatus.detail}
            </span>
          </div>

          {/* Location reference & quick contact */}
          <div className="flex items-center gap-4 text-fuchsia-100">
            <span className="hidden sm:inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>{storeInfo.addressLine}, Ciudad Guzmán</span>
            </span>

            <a 
              href={`tel:${storeInfo.phone}`} 
              className="flex items-center gap-1 hover:text-white font-semibold transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{storeInfo.phoneFormatted}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
          id="main-logo-btn"
          aria-label="Ir al inicio"
        >
          {logoLoaded ? (
            <img
              src={webLogo}
              alt={storeInfo.name}
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-102"
              onError={() => setLogoLoaded(false)}
            />
          ) : (
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-fun font-bold tracking-tight bg-gradient-to-r from-purple-700 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent">
                {storeInfo.name}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Ciudad Guzmán, Jal.
              </span>
            </div>
          )}
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {activeMenuItems.map((item) => {
            const isActive = activePath === item.path;
            const icon = getNavIcon(item.icon, item.path);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-fuchsia-100/90 text-fuchsia-900 border border-fuchsia-200'
                    : 'text-slate-700 hover:text-fuchsia-600 hover:bg-slate-100'
                }`}
              >
                {icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={buildWhatsAppLink('¡Hola La Casa del Disfraz! Me gustaría consultar información.', storeInfo.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95"
            id="header-whatsapp-cta"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>WhatsApp ({storeInfo.phoneFormatted})</span>
          </a>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            id="mobile-menu-toggle-btn"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-fuchsia-100 bg-white px-4 py-4 space-y-2 shadow-xl animate-in slide-in-from-top duration-200">
          {activeMenuItems.map((item) => {
            const isActive = activePath === item.path;
            const icon = getNavIcon(item.icon, item.path);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200' 
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                {icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={buildWhatsAppLink('¡Hola La Casa del Disfraz! Me gustaría consultar información.', storeInfo.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 text-center"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Contactar por WhatsApp</span>
            </a>
            <a
              href={`tel:${storeInfo.phone}`}
              className="w-full py-2 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 text-center"
            >
              <Phone className="w-4 h-4" />
              <span>Llamar: {storeInfo.phoneFormatted}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
