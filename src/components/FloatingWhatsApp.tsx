import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { buildWhatsAppLink } from '../utils/storeStatus';
import { useSiteContent } from '../context/SiteContentContext';

export const FloatingWhatsApp: React.FC = () => {
  const [closed, setClosed] = useState(false);
  const { content } = useSiteContent();
  const { storeInfo } = content;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 group">
      {!closed && (
        <div className="hidden sm:flex items-center gap-1.5 bg-white text-slate-800 text-xs font-bold py-2 px-3.5 rounded-2xl shadow-xl border border-emerald-100 animate-in fade-in slide-in-from-right">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>¿Dudas con tu disfraz? ¡Escríbenos!</span>
          <button
            onClick={() => setClosed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 ml-1 rounded-full cursor-pointer"
            aria-label="Cerrar aviso"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <a
        href={buildWhatsAppLink('¡Hola La Casa del Disfraz! Me gustaría consultar precios y disponibilidad de un disfraz.', storeInfo.whatsappNumber)}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-600/40 hover:scale-110 active:scale-95 transition-all duration-300 relative focus:outline-none cursor-pointer"
        aria-label="Contactar por WhatsApp"
        id="floating-whatsapp-btn"
      >
        <MessageCircle className="w-7 h-7 fill-white" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-black text-white items-center justify-center">
            1
          </span>
        </span>
      </a>
    </div>
  );
};
