import React from 'react';
import { 
  MapPin, 
  ShieldCheck, 
  MessageCircle, 
  CheckCircle2, 
  Scissors, 
  Heart,
  FileText
} from 'lucide-react';
import { buildWhatsAppLink, getStoreLiveStatus } from '../utils/storeStatus';
import { useSiteContent } from '../context/SiteContentContext';

interface HeroBannerProps {
  onScrollToLocation: () => void;
  onScrollToRequirements: () => void;
  onNavigateTyc: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onScrollToLocation,
  onScrollToRequirements,
  onNavigateTyc,
}) => {
  const { content } = useSiteContent();
  const { hero, storeInfo, theme } = content;

  const liveStatus = getStoreLiveStatus(storeInfo.manualStatusOverride);

  // Dynamic gradient themes
  const gradientThemes: Record<string, string> = {
    fuchsia: 'bg-gradient-to-br from-purple-950 via-fuchsia-900 to-rose-950',
    purple: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950',
    rose: 'bg-gradient-to-br from-rose-950 via-fuchsia-950 to-purple-950',
    amber: 'bg-gradient-to-br from-amber-950 via-orange-950 to-stone-950',
    emerald: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950',
    indigo: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950'
  };

  const currentGradient = gradientThemes[theme.primaryColor] || gradientThemes.fuchsia;

  return (
    <section className={`relative overflow-hidden ${currentGradient} text-white pt-12 pb-16 px-4 sm:px-6`}>
      {/* Festive background sparkles */}
      <div className="absolute inset-0 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
        {/* Live Store Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs shadow-lg mx-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveStatus.isOpen ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${liveStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="font-bold text-amber-300">
            {liveStatus.statusText}
          </span>
          <span className="text-white/60">|</span>
          <span className="text-slate-200">{hero.livePillLocation || storeInfo.addressLine}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-fun font-bold text-white tracking-tight leading-tight max-w-3xl mx-auto">
          {hero.title}
        </h1>

        <p className="text-sm sm:text-lg text-fuchsia-100/90 max-w-2xl mx-auto leading-relaxed font-normal">
          {hero.description}
        </p>

        {/* Quick Action Buttons for Location and Requirements */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {hero.btn1Text && (
            <button
              onClick={onScrollToLocation}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-fun font-bold text-xs sm:text-sm rounded-2xl shadow-xl hover:shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              id="hero-btn-ubicacion"
            >
              <MapPin className="w-4 h-4 text-slate-950" />
              <span>{hero.btn1Text}</span>
            </button>
          )}

          {hero.btn2Text && (
            <button
              onClick={onScrollToRequirements}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-fun font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              id="hero-btn-requisitos"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{hero.btn2Text}</span>
            </button>
          )}

          {hero.btn3Text && (
            <a
              href={buildWhatsAppLink(hero.whatsappCustomMessage, storeInfo.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-fun font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              id="hero-btn-whatsapp"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{hero.btn3Text}</span>
            </a>
          )}

          {hero.btn4Text && (
            <button
              onClick={onNavigateTyc}
              className="px-5 py-3.5 bg-white/5 hover:bg-white/15 border border-white/15 text-fuchsia-100 hover:text-white font-fun font-bold text-xs sm:text-sm rounded-2xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              id="hero-btn-tyc"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>{hero.btn4Text}</span>
            </button>
          )}
        </div>

        {/* Confidence checkmarks */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-fuchsia-100/90 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{storeInfo.experienceYears} Años en Ciudad Guzmán</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Taller de Confección JoJo's</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Prendas Sanitizadas y al Vapor</span>
          </div>
        </div>
      </div>
    </section>
  );
};
