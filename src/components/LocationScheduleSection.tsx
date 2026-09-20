import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  ExternalLink, 
  Navigation, 
  CheckCircle2,
  Instagram,
  Facebook,
  Copy,
  MessageCircle,
  Car
} from 'lucide-react';
import { getStoreLiveStatus, buildWhatsAppLink } from '../utils/storeStatus';
import { useSiteContent } from '../context/SiteContentContext';

interface LocationScheduleSectionProps {
  onNavigateToTyc?: () => void;
  onNavigateToPrivacy?: () => void;
}

export const LocationScheduleSection: React.FC<LocationScheduleSectionProps> = ({
  onNavigateToTyc,
  onNavigateToPrivacy
}) => {
  const { content } = useSiteContent();
  const { storeInfo, locationSection } = content;

  const liveStatus = getStoreLiveStatus(storeInfo.manualStatusOverride);
  const [copied, setCopied] = useState(false);

  const fullAddressString = `${storeInfo.name}: ${locationSection.addressLine}, ${locationSection.addressCity}.`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddressString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section id="ubicacion" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20">
      {/* Section Title */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2">
          <MapPin className="w-3.5 h-3.5 text-rose-600" />
          <span>{locationSection.badgeText}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-fun font-bold text-slate-900 tracking-tight">
          {locationSection.title}
        </h2>
        <p className="text-slate-600 text-sm sm:text-base mt-2">
          {locationSection.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Schedule & Address Card */}
        <div className="lg:col-span-6 space-y-6">
          {/* Live Status Header */}
          <div className={`p-5 rounded-3xl border ${liveStatus.isOpen ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-200'}`}>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveStatus.isOpen ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${liveStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <h3 className="font-fun font-bold text-base sm:text-lg text-slate-900">
                {liveStatus.statusText}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 ml-5.5">
              {liveStatus.detail}
            </p>
          </div>

          {/* Full Schedule Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-fuchsia-600" />
              Horarios Oficiales de Atención:
            </h4>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Lunes a Viernes</span>
                  <span className="text-[11px] text-slate-400">Turno matutino y vespertino</span>
                </div>
                <div className="text-right font-medium text-slate-700">
                  <span className="text-fuchsia-600 font-bold">{storeInfo.hours.weekdays}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Sábados</span>
                  <span className="text-[11px] text-slate-400">Horario matutino continuo</span>
                </div>
                <div className="text-right font-medium text-slate-700">
                  <span className="text-fuchsia-600 font-bold">{storeInfo.hours.saturday}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 text-slate-400">
                <div>
                  <span className="font-bold text-slate-500 block">Domingos</span>
                  <span className="text-[11px]">Día de descanso</span>
                </div>
                <span className="italic text-slate-500">{storeInfo.hours.sunday}</span>
              </div>
            </div>
          </div>

          {/* Address & Quick Copy */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {locationSection.addressTitle}
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-900">
                    {locationSection.addressLine}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {locationSection.addressCity}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyAddress}
                className="p-2 rounded-xl text-slate-500 hover:text-fuchsia-600 hover:bg-fuchsia-50 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                title="Copiar dirección"
                id="copy-address-btn"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Direct Phone and WhatsApp */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={`tel:${storeInfo.phone}`}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200 transition-colors flex items-center gap-2.5"
              >
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Teléfono</span>
                  <span className="text-xs font-bold text-slate-800">{storeInfo.phoneFormatted}</span>
                </div>
              </a>

              <a
                href={buildWhatsAppLink('¡Hola La Casa del Disfraz! Me gustaría consultar disponibilidad de un traje.', storeInfo.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-left border border-emerald-200 transition-colors flex items-center gap-2.5"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">WhatsApp</span>
                  <span className="text-xs font-bold text-emerald-800">Enviar mensaje directo</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Right: Map and Navigation Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col h-full space-y-5">
          <div>
            <h3 className="font-fun font-bold text-lg text-slate-900">
              {locationSection.gpsCardTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {locationSection.gpsCardSubtitle}
            </p>
          </div>

          {/* Visual Map Canvas */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-16/10 flex flex-col items-center justify-center text-center p-6 group">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
            
            <div className="relative z-10 max-w-xs">
              <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto mb-3 shadow-xl animate-bounce">
                <MapPin className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">
                {storeInfo.name}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {locationSection.addressLine}, {storeInfo.cityState}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <a
                  href={storeInfo.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-transform group-hover:scale-105"
                  id="open-maps-btn"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-300" />
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(`${locationSection.addressLine} ${locationSection.addressCity}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                  id="open-waze-btn"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Waze</span>
                </a>
              </div>
            </div>
          </div>

          {/* Social Links & Legal Direct Links */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Redes:</span>
              {storeInfo.instagramUrl && (
                <a
                  href={storeInfo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {storeInfo.facebookUrl && (
                <a
                  href={storeInfo.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-3">
              {onNavigateToTyc && (
                <button
                  onClick={onNavigateToTyc}
                  className="text-fuchsia-700 hover:underline font-bold cursor-pointer"
                >
                  Términos (/tyc)
                </button>
              )}
              {onNavigateToPrivacy && (
                <button
                  onClick={onNavigateToPrivacy}
                  className="text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  Privacidad (/privacidad)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
