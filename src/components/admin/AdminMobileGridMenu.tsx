import React from 'react';
import {
  Scissors,
  Calculator,
  Coins,
  Settings,
  Globe,
  Layout,
  Users,
  ChevronRight,
  Sparkles,
  Store,
  Palette,
  Megaphone,
  MapPin,
  ShieldCheck,
  Image as ImageIcon,
  Layers,
  HelpCircle,
  Star,
  LogOut,
  ExternalLink
} from 'lucide-react';

export interface MobileMenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  // Liquid glass styling matching the uploaded mockup
  gradientClass: string;
  iconBadgeClass: string;
  borderClass: string;
  shadowClass: string;
  arrowBgClass: string;
  isWide?: boolean;
}

interface AdminMobileGridMenuProps {
  onSelectTab: (tabId: string) => void;
  activeTab: string;
  onNavigateToPublicWeb: () => void;
  onLogout: () => void;
  currentUser: string;
  logoUrl?: string;
}

export const AdminMobileGridMenu: React.FC<AdminMobileGridMenuProps> = ({
  onSelectTab,
  activeTab,
  onNavigateToPublicWeb,
  onLogout,
  currentUser,
  logoUrl
}) => {
  // Exact 7 primary items as shown in the mockup image
  const primaryCards: MobileMenuItem[] = [
    {
      id: 'corte',
      title: 'Corte',
      icon: Scissors,
      gradientClass: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
      iconBadgeClass: 'bg-white/25 border-white/40 text-white shadow-inner',
      borderClass: 'border-white/40',
      shadowClass: 'shadow-lg shadow-blue-500/30',
      arrowBgClass: 'bg-white/20 text-white'
    },
    {
      id: 'ingresos',
      title: 'Ingresos',
      subtitle: '(Loyverse POS)',
      icon: Calculator,
      gradientClass: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
      iconBadgeClass: 'bg-white/25 border-white/40 text-white shadow-inner',
      borderClass: 'border-white/40',
      shadowClass: 'shadow-lg shadow-emerald-500/30',
      arrowBgClass: 'bg-white/20 text-white'
    },
    {
      id: 'gastos',
      title: 'Gastos &',
      subtitle: 'Egresos',
      icon: Coins,
      gradientClass: 'bg-gradient-to-br from-rose-400 via-red-500 to-pink-600',
      iconBadgeClass: 'bg-white/25 border-white/40 text-white shadow-inner',
      borderClass: 'border-white/40',
      shadowClass: 'shadow-lg shadow-rose-500/30',
      arrowBgClass: 'bg-white/20 text-white'
    },
    {
      id: 'ajustes',
      title: 'Ajustes &',
      subtitle: 'Ficha API',
      icon: Settings,
      gradientClass: 'bg-gradient-to-br from-purple-400 via-indigo-500 to-violet-600',
      iconBadgeClass: 'bg-white/25 border-white/40 text-white shadow-inner',
      borderClass: 'border-white/40',
      shadowClass: 'shadow-lg shadow-indigo-500/30',
      arrowBgClass: 'bg-white/20 text-white'
    },
    {
      id: 'menu',
      title: 'Menú Público',
      subtitle: 'de la Web',
      icon: Globe,
      gradientClass: 'bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600',
      iconBadgeClass: 'bg-white/25 border-white/40 text-white shadow-inner',
      borderClass: 'border-white/40',
      shadowClass: 'shadow-lg shadow-cyan-500/30',
      arrowBgClass: 'bg-white/20 text-white'
    },
    {
      id: 'secciones',
      title: 'Páginas',
      subtitle: 'Dinámicas',
      icon: Layout,
      gradientClass: 'bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600',
      iconBadgeClass: 'bg-white/25 border-white/40 text-white shadow-inner',
      borderClass: 'border-white/40',
      shadowClass: 'shadow-lg shadow-teal-500/30',
      arrowBgClass: 'bg-white/20 text-white'
    },
    {
      id: 'usuarios',
      title: 'Usuarios CyC',
      subtitle: `(${currentUser})`,
      icon: Users,
      gradientClass: 'bg-gradient-to-br from-blue-400 via-indigo-500 to-sky-600',
      iconBadgeClass: 'bg-white/25 border-white/40 text-white shadow-inner',
      borderClass: 'border-white/40',
      shadowClass: 'shadow-lg shadow-blue-500/30',
      arrowBgClass: 'bg-white/20 text-white',
      isWide: true
    }
  ];

  const contentCards = [
    { id: 'general', title: 'General & Marca', icon: Store },
    { id: 'colores', title: 'Colores & Estilo', icon: Palette },
    { id: 'anuncio', title: 'Cintillo de Avisos', icon: Megaphone },
    { id: 'ubicacion', title: 'Horarios & Mapa', icon: MapPin },
    { id: 'hero', title: 'Banner Principal', icon: Sparkles },
    { id: 'requisitos', title: 'Requisitos Renta', icon: ShieldCheck },
    { id: 'historia', title: 'Nuestra Historia', icon: ImageIcon },
    { id: 'personalizados', title: 'Personalizados', icon: Layers },
    { id: 'faq', title: 'Preguntas Frec.', icon: HelpCircle },
    { id: 'testimonios', title: 'Reseñas Clientes', icon: Star }
  ];

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-sky-50 via-indigo-50/50 to-purple-100/60 pb-16 pt-4 px-4 sm:px-6">
      {/* Glossy background ambient glow spheres */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-16 w-80 h-80 rounded-full bg-purple-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/4 w-96 h-96 rounded-full bg-blue-300/30 blur-3xl" />

      <div className="relative z-10 max-w-md mx-auto space-y-6">
        {/* Brand Header with colorful playful typography or logo matching the mockup */}
        <div className="text-center pt-2 pb-1 space-y-2">
          {logoUrl ? (
            <div className="flex justify-center items-center">
              <img
                src={logoUrl}
                alt="La Casa del Disfraz"
                className="max-h-16 w-auto object-contain drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : null}

          <div className="inline-block">
            <h1 className="font-fun text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
              <span className="text-sky-500">La </span>
              <span className="text-cyan-500">Casa </span>
              <span className="text-pink-500">del </span>
              <span className="text-fuchsia-600">Dis</span>
              <span className="text-amber-500">fraz</span>
              <span className="text-emerald-500">🎭</span>
            </h1>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
              Panel Administrativo • CyC
            </p>
          </div>
        </div>

        {/* 2-Column Grid of 3D Glassmorphism Cards (Matches uploaded reference image) */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {primaryCards.map((card) => {
            const Icon = card.icon;
            const isSelected = activeTab === card.id;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectTab(card.id)}
                className={`group relative overflow-hidden rounded-3xl p-4 text-left transition-all duration-200 active:scale-[0.97] cursor-pointer flex flex-col justify-between h-36 sm:h-40 border ${card.borderClass} ${card.gradientClass} ${card.shadowClass} ${
                  card.isWide ? 'col-span-2 sm:col-span-1' : ''
                } ${isSelected ? 'ring-4 ring-white/70 scale-[1.02]' : 'hover:brightness-105'}`}
              >
                {/* 3D Glass shine reflection overlay */}
                <div className="pointer-events-none absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/30 blur-xl group-hover:scale-110 transition-transform duration-300" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/20" />

                {/* Top row: Glossy Icon badge */}
                <div className="relative z-10 flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border backdrop-blur-md transition-transform group-hover:scale-105 ${card.iconBadgeClass}`}
                  >
                    <Icon className="w-6 h-6 drop-shadow-sm" />
                  </div>

                  {/* Notification or status indicator if needed */}
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full bg-white/90 text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Activo
                    </span>
                  )}
                </div>

                {/* Bottom row: Title, Subtitle and glossy Chevron circle */}
                <div className="relative z-10 flex items-end justify-between gap-2 mt-auto">
                  <div className="text-white drop-shadow-sm pr-1">
                    <h3 className="font-fun text-lg sm:text-xl font-bold leading-tight">
                      {card.title}
                    </h3>
                    {card.subtitle && (
                      <p className="text-xs text-white/90 font-medium leading-tight">
                        {card.subtitle}
                      </p>
                    )}
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/40 backdrop-blur-md transition-transform group-hover:translate-x-0.5 ${card.arrowBgClass}`}
                  >
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Secondary Accordion / Quick links for website content */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-white/60 shadow-lg shadow-indigo-950/5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-fuchsia-600" />
              <span>Contenido Web & Secciones</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">10 módulos</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {contentCards.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                    isSelected
                      ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-fuchsia-50 text-fuchsia-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Footer Action Buttons for Mobile */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onNavigateToPublicWeb}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-sky-600" />
            <span>Ver Sitio Web</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
