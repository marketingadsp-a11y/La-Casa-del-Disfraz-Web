import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook, 
  FileText,
  Lock
} from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [logoLoaded, setLogoLoaded] = useState(true);
  const { content } = useSiteContent();
  const { storeInfo, footer } = content;
  const footerLogo = content.branding?.webLogoFooterUrl || content.branding?.webLogoUrl || 'https://lacasadeldisfraz.mx/images/2024/04/12/logo-blanco-2024.png';

  useEffect(() => {
    setLogoLoaded(true);
  }, [footerLogo]);

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Col 1 & 2: Brand and Story */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {logoLoaded ? (
                <img
                  src={footerLogo}
                  alt={storeInfo.name}
                  className="h-10 sm:h-12 w-auto object-contain cursor-pointer"
                  onClick={() => onNavigate('/')}
                  onError={() => setLogoLoaded(false)}
                />
              ) : (
                <span 
                  onClick={() => onNavigate('/')} 
                  className="text-2xl font-fun font-bold text-white cursor-pointer"
                >
                  {storeInfo.name}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              {footer.aboutText}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-amber-300 font-bold">
                {footer.brandsText || "Disfraces JoJo's & Personalizados CyC"}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {storeInfo.instagramUrl && (
                <a
                  href={storeInfo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-fuchsia-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
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
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 3: Navegación Rápida */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Información
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => onNavigate('/')}
                  className="hover:text-fuchsia-400 transition-colors text-left cursor-pointer"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/#ubicacion')}
                  className="hover:text-fuchsia-400 transition-colors text-left cursor-pointer"
                >
                  Ubicación y Horarios
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/#requisitos')}
                  className="hover:text-fuchsia-400 transition-colors text-left cursor-pointer"
                >
                  Requisitos de Renta
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/#historia')}
                  className="hover:text-fuchsia-400 transition-colors text-left cursor-pointer"
                >
                  Nuestra Historia (JoJo's)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/#invitaciones')}
                  className="hover:text-fuchsia-400 transition-colors text-left cursor-pointer"
                >
                  Invitaciones CyC
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Términos y Avisos Legales */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Legal y Políticas
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button 
                  onClick={() => onNavigate('/tyc')}
                  className="hover:text-amber-400 transition-colors text-left flex items-center gap-1.5 font-medium text-slate-300 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Términos de Uso y Renta (/tyc)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('/privacidad')}
                  className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5 font-medium text-slate-300 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aviso de Privacidad (/privacidad)</span>
                </button>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                Transparencia en depósitos, contratos mercantiles y protección de datos.
              </li>
            </ul>
          </div>

          {/* Col 5: Contacto Directo */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Sucursal Centro
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
                <span>{storeInfo.addressLine}, {storeInfo.cityState}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${storeInfo.phone}`} className="hover:text-emerald-400">
                  {storeInfo.phoneFormatted}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`mailto:${storeInfo.email}`} className="hover:text-amber-400">
                  {storeInfo.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {footer.copyright}
          </p>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('/tyc')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Términos y Condiciones (/tyc)
            </button>
            <span>•</span>
            <button 
              onClick={() => onNavigate('/privacidad')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Aviso de Privacidad (/privacidad)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
