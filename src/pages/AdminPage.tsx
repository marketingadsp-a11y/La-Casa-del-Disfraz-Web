import React, { useState, useEffect } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import { useAdminUsers } from '../context/AdminUsersContext';
import { AdminExpensesTab } from '../components/admin/AdminExpensesTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminIncomesTab } from '../components/admin/AdminIncomesTab';
import { 
  SiteContent, 
  NavigationItem, 
  CustomPageSection, 
  CustomPageItem, 
  AdminUser 
} from '../types/siteContent';
import { DEFAULT_SITE_CONTENT } from '../data/defaultSiteContent';
import { 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  CloudOff, 
  Lock, 
  LogOut, 
  Store, 
  Sparkles, 
  MapPin, 
  Clock, 
  Phone, 
  HelpCircle, 
  Star, 
  Plus, 
  Trash2, 
  Palette, 
  Megaphone, 
  FileText, 
  Image as ImageIcon,
  ExternalLink,
  Send,
  Layers,
  Users,
  Menu as MenuIcon,
  Navigation,
  ArrowUp,
  ArrowDown,
  Edit3,
  Check,
  X,
  Key,
  Receipt,
  Sliders,
  TrendingUp
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

type AdminTab = 
  | 'ingresos'
  | 'ajustes'
  | 'gastos'
  | 'menu'
  | 'secciones'
  | 'usuarios'
  | 'general' 
  | 'colores'
  | 'anuncio' 
  | 'ubicacion' 
  | 'hero' 
  | 'requisitos' 
  | 'historia' 
  | 'personalizados' 
  | 'faq' 
  | 'testimonios';

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { content, isSaving, isCloudSynced, syncError, saveContent, resetToDefaults } = useSiteContent();
  const { 
    users: adminUsersList, 
    addUser: createAdminUser, 
    updateUserPassword: changeAdminUserPassword, 
    deleteUser: removeAdminUser, 
    authenticate: authenticateAdminUser,
    isCloudSynced: isUsersCloudSynced 
  } = useAdminUsers();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('lcd_admin_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return sessionStorage.getItem('lcd_admin_user') || 'Cristobal';
  });
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');

  // Working copy of content for editing
  const [draft, setDraft] = useState<SiteContent>(content);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Dynamic Page editing state
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageDraft, setPageDraft] = useState<CustomPageSection | null>(null);

  // New Menu Item state
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuPath, setNewMenuPath] = useState('');
  const [newMenuIcon, setNewMenuIcon] = useState('layers');

  // Admin user creation state inside panel
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');

  // Sync draft when initial content loads
  useEffect(() => {
    setDraft(content);
  }, [content]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanUser = authUsername.trim();
    const cleanPass = authPassword.trim();

    if (!cleanUser || !cleanPass) {
      setAuthError('Por favor completa todos los campos.');
      return;
    }

    const authResult = authenticateAdminUser(cleanUser, cleanPass);
    if (authResult.success && authResult.user) {
      sessionStorage.setItem('lcd_admin_auth', 'true');
      sessionStorage.setItem('lcd_admin_user', authResult.user.username);
      setCurrentUser(authResult.user.username);
      setIsAuthenticated(true);
      setAuthError('');
      setAuthPassword('');
    } else {
      setAuthError(authResult.error || 'Usuario o contraseña incorrectos.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('lcd_admin_auth');
    sessionStorage.removeItem('lcd_admin_user');
    setIsAuthenticated(false);
  };

  const handleSave = async () => {
    const res = await saveContent(draft);
    setToastMessage({
      text: res.message,
      type: res.success ? 'success' : 'error'
    });
  };

  // Helper for updating nested fields
  const updateStoreInfo = (field: string, value: any) => {
    setDraft(prev => ({
      ...prev,
      storeInfo: {
        ...prev.storeInfo,
        [field]: value
      }
    }));
  };

  const updateStoreHours = (field: string, value: string) => {
    setDraft(prev => ({
      ...prev,
      storeInfo: {
        ...prev.storeInfo,
        hours: {
          ...prev.storeInfo.hours,
          [field]: value
        }
      }
    }));
  };

  const updateHero = (field: string, value: string) => {
    setDraft(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: value
      }
    }));
  };

  const updateLocationSection = (field: string, value: string) => {
    setDraft(prev => ({
      ...prev,
      locationSection: {
        ...prev.locationSection,
        [field]: value
      }
    }));
  };

  const updateRentalSteps = (field: string, value: any) => {
    setDraft(prev => ({
      ...prev,
      rentalSteps: {
        ...prev.rentalSteps,
        [field]: value
      }
    }));
  };

  const updateStory = (field: string, value: any) => {
    setDraft(prev => ({
      ...prev,
      story: {
        ...prev.story,
        [field]: value
      }
    }));
  };

  const updateCustomOrders = (field: string, value: any) => {
    setDraft(prev => ({
      ...prev,
      customOrders: {
        ...prev.customOrders,
        [field]: value
      }
    }));
  };

  const updateFaq = (index: number, field: 'q' | 'a', value: string) => {
    setDraft(prev => {
      const newItems = [...prev.faqSection.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return {
        ...prev,
        faqSection: {
          ...prev.faqSection,
          items: newItems
        }
      };
    });
  };

  const addFaq = () => {
    setDraft(prev => ({
      ...prev,
      faqSection: {
        ...prev.faqSection,
        items: [
          ...prev.faqSection.items,
          { q: 'Nueva pregunta frecuente', a: 'Respuesta detallada para tus clientes...' }
        ]
      }
    }));
  };

  const removeFaq = (index: number) => {
    setDraft(prev => ({
      ...prev,
      faqSection: {
        ...prev.faqSection,
        items: prev.faqSection.items.filter((_, i) => i !== index)
      }
    }));
  };

  const updateReview = (index: number, field: string, value: any) => {
    setDraft(prev => {
      const newItems = [...prev.reviewsSection.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return {
        ...prev,
        reviewsSection: {
          ...prev.reviewsSection,
          items: newItems
        }
      };
    });
  };

  const addReview = () => {
    setDraft(prev => ({
      ...prev,
      reviewsSection: {
        ...prev.reviewsSection,
        items: [
          ...prev.reviewsSection.items,
          {
            id: 'rev-' + Date.now(),
            author: 'Nuevo Cliente',
            role: 'Cliente verificado',
            rating: 5,
            comment: 'Excelente atención y variedad de disfraces...',
            date: 'Reciente',
            costumeName: 'Disfraz en Renta'
          }
        ]
      }
    }));
  };

  const removeReview = (index: number) => {
    setDraft(prev => ({
      ...prev,
      reviewsSection: {
        ...prev.reviewsSection,
        items: prev.reviewsSection.items.filter((_, i) => i !== index)
      }
    }));
  };

  // Navigation Menu management
  const updateMenuItem = (id: string, field: keyof NavigationItem, value: any) => {
    setDraft(prev => ({
      ...prev,
      navigationMenu: (prev.navigationMenu || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addMenuItem = () => {
    if (!newMenuLabel.trim()) return;
    const cleanPath = newMenuPath.trim() || `/${newMenuLabel.trim().toLowerCase().replace(/\s+/g, '-')}`;
    const newItem: NavigationItem = {
      id: 'nav-' + Date.now(),
      label: newMenuLabel.trim(),
      path: cleanPath,
      icon: newMenuIcon || 'layers',
      order: (draft.navigationMenu?.length || 0) + 1,
      enabled: true
    };
    setDraft(prev => ({
      ...prev,
      navigationMenu: [...(prev.navigationMenu || []), newItem]
    }));
    setNewMenuLabel('');
    setNewMenuPath('');
    setToastMessage({ text: `Enlace "${newItem.label}" agregado al menú.`, type: 'success' });
  };

  const removeMenuItem = (id: string) => {
    setDraft(prev => ({
      ...prev,
      navigationMenu: (prev.navigationMenu || []).filter(item => item.id !== id)
    }));
  };

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const list = [...(draft.navigationMenu || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    setDraft(prev => ({
      ...prev,
      navigationMenu: reordered
    }));
  };

  const resetMenuToDefaults = () => {
    if (window.confirm('¿Restablecer el menú de navegación al original?')) {
      setDraft(prev => ({
        ...prev,
        navigationMenu: DEFAULT_SITE_CONTENT.navigationMenu
      }));
      setToastMessage({ text: 'Menú restablecido a los valores originales.', type: 'success' });
    }
  };

  // Custom Pages & Sections management (/seccion)
  const startCreateCustomPage = () => {
    const newPage: CustomPageSection = {
      id: 'page-' + Date.now(),
      slug: 'nueva-seccion',
      title: 'Nueva Sección',
      subtitle: 'Descripción breve de la sección',
      badge: 'Destacado',
      content: 'Escribe aquí la información detallada para tus clientes sobre tus disfraces o servicios...',
      showInMenu: true,
      items: [
        {
          id: 'item-1',
          title: 'Ejemplo de Producto o Servicio',
          description: 'Detalles del disfraz, accesorio o servicio especial.',
          price: 'Consultar WhatsApp',
          tag: 'Especial'
        }
      ],
      whatsappCtaText: 'Cotizar por WhatsApp',
      whatsappMessage: 'Hola, me interesa cotizar de su sección personalizada.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPageDraft(newPage);
    setEditingPageId('new');
  };

  const startEditCustomPage = (page: CustomPageSection) => {
    setPageDraft({ ...page, items: [...(page.items || [])] });
    setEditingPageId(page.id);
  };

  const saveCustomPageDraft = () => {
    if (!pageDraft) return;
    const cleanSlug = pageDraft.slug.trim().toLowerCase().replace(/^\//, '').replace(/\s+/g, '-');
    const finalPage: CustomPageSection = {
      ...pageDraft,
      slug: cleanSlug
    };

    setDraft(prev => {
      const existingPages = prev.customPages || [];
      const isNew = editingPageId === 'new';
      let updatedPages: CustomPageSection[];

      if (isNew) {
        updatedPages = [...existingPages, finalPage];
      } else {
        updatedPages = existingPages.map(p => p.id === finalPage.id ? finalPage : p);
      }

      // Sync with navigation menu
      let updatedNav = [...(prev.navigationMenu || [])];
      const pageNavPath = `/${cleanSlug}`;
      const existingNavIdx = updatedNav.findIndex(n => n.path.toLowerCase() === pageNavPath);

      if (finalPage.showInMenu) {
        if (existingNavIdx === -1) {
          updatedNav.push({
            id: 'nav-' + finalPage.id,
            label: finalPage.title,
            path: pageNavPath,
            icon: 'layers',
            order: updatedNav.length + 1,
            enabled: true
          });
        } else {
          updatedNav[existingNavIdx] = {
            ...updatedNav[existingNavIdx],
            label: finalPage.title,
            enabled: true
          };
        }
      } else if (existingNavIdx !== -1) {
        updatedNav = updatedNav.filter(n => n.path.toLowerCase() !== pageNavPath);
      }

      return {
        ...prev,
        customPages: updatedPages,
        navigationMenu: updatedNav
      };
    });

    setEditingPageId(null);
    setPageDraft(null);
    setToastMessage({
      text: `Sección /${cleanSlug} guardada con éxito.`,
      type: 'success'
    });
  };

  const deleteCustomPage = (id: string) => {
    const pageToDelete = (draft.customPages || []).find(p => p.id === id);
    if (!pageToDelete) return;
    if (window.confirm(`¿Seguro que deseas eliminar la sección "/${pageToDelete.slug}"?`)) {
      setDraft(prev => {
        const pageSlugPath = `/${pageToDelete.slug.toLowerCase()}`;
        return {
          ...prev,
          customPages: (prev.customPages || []).filter(p => p.id !== id),
          navigationMenu: (prev.navigationMenu || []).filter(n => n.path.toLowerCase() !== pageSlugPath)
        };
      });
      if (editingPageId === id) {
        setEditingPageId(null);
        setPageDraft(null);
      }
      setToastMessage({ text: `Sección eliminada.`, type: 'success' });
    }
  };

  // User management in Admin (Stored in dedicated Firestore collection 'admin_users')
  const handleAddAdminUser = async () => {
    if (!newAdminName.trim() || !newAdminPass.trim()) return;
    const res = await createAdminUser(newAdminName, newAdminPass, newAdminDisplayName);
    if (res.success) {
      setNewAdminName('');
      setNewAdminPass('');
      setNewAdminDisplayName('');
      setToastMessage({ text: res.message, type: 'success' });
    } else {
      setToastMessage({ text: res.message, type: 'error' });
    }
  };

  const handleDeleteAdminUser = async (id: string, username: string) => {
    if (username.toLowerCase() === 'cristobal') {
      setToastMessage({ text: 'No se puede eliminar al Administrador Principal.', type: 'error' });
      return;
    }
    if (window.confirm(`¿Eliminar al usuario administrador "${username}" de la base de datos?`)) {
      const res = await removeAdminUser(id, username);
      setToastMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    }
  };

  const handleChangeUserPassword = async (id: string, username: string) => {
    const newPass = window.prompt(`Ingresa la nueva contraseña para el usuario "${username}":`);
    if (newPass && newPass.trim().length >= 4) {
      const res = await changeAdminUserPassword(id, username, newPass.trim());
      setToastMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    } else if (newPass !== null) {
      setToastMessage({ text: 'La contraseña debe tener al menos 4 caracteres.', type: 'error' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 text-white">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-fun text-white tracking-tight">
              Acceso CyC
            </h1>
            <p className="text-xs text-slate-400">
              Panel de Administración
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Usuario"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                  required
                />
              </div>
            </div>

            {authError && (
              <p className="text-xs text-rose-400 font-medium text-center">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl text-sm transition-transform active:scale-98 cursor-pointer shadow-lg"
            >
              Entrar
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              ← Volver al sitio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24">
      {/* Admin Top Sticky Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-amber-500 flex items-center justify-center font-fun font-bold text-white shadow-sm">
              CyC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Panel de Control /cyc
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  Modo Editor Total
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                {isCloudSynced ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Cloud className="w-3 h-3" />
                    Sincronizado con Firebase Firestore
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-medium" title={syncError || ''}>
                    <CloudOff className="w-3 h-3" />
                    Guardado en caché local
                  </span>
                )}
                <span>•</span>
                <span>ID: la-casa-del-disfraz-web</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Usuario: <strong className="text-white">{currentUser}</strong></span>
            </div>

            <button
              onClick={() => onNavigate('/')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Previsualizar sitio público"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Sitio Web</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border transition-all animate-slide-up ${
          toastMessage.type === 'success' 
            ? 'bg-slate-900 text-white border-emerald-500/40' 
            : 'bg-rose-900 text-white border-rose-500/40'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Admin Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm sticky top-20 space-y-1">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Navegación & Secciones
              </div>

              {[
                { id: 'ingresos', label: 'Ingresos (Loyverse POS)', icon: TrendingUp },
                { id: 'gastos', label: 'Gastos & Egresos', icon: Receipt },
                { id: 'ajustes', label: 'Ajustes & Ficha API', icon: Sliders },
                { id: 'menu', label: 'Menú Público de la Web', icon: MenuIcon },
                { id: 'secciones', label: 'Páginas Dinámicas (/seccion)', icon: Navigation },
                { id: 'usuarios', label: 'Usuarios CyC (Cristobal)', icon: Users },
              ].map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as AdminTab)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                      active 
                        ? 'bg-fuchsia-600 text-white shadow-xs' 
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-fuchsia-600'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 mt-2">
                Contenido del Sitio
              </div>

              {[
                { id: 'general', label: '1. General y Marca', icon: Store },
                { id: 'colores', label: '2. Colores y Estilo', icon: Palette },
                { id: 'anuncio', label: '3. Cintillo de Avisos', icon: Megaphone },
                { id: 'ubicacion', label: '4. Horarios y Ubicación', icon: MapPin },
                { id: 'hero', label: '5. Banner Principal (Hero)', icon: Sparkles },
                { id: 'requisitos', label: '6. Requisitos de Renta', icon: ShieldCheck },
                { id: 'historia', label: '7. Nuestra Historia', icon: ImageIcon },
                { id: 'personalizados', label: '8. Personalizados CyC', icon: Layers },
                { id: 'faq', label: '9. Preguntas Frecuentes', icon: HelpCircle },
                { id: 'testimonios', label: '10. Reseñas y Opiniones', icon: Star },
              ].map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as AdminTab)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                      active 
                        ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-fuchsia-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-3 mt-3 border-t border-slate-100 px-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar a Firebase</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Editing Workspace */}
          <main className="lg:col-span-9 space-y-6">
            {/* TAB: MENÚ PÚBLICO */}
            {activeTab === 'menu' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                      <MenuIcon className="w-5 h-5 text-fuchsia-600" />
                      Menú Público de Navegación
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Gestiona los enlaces visibles en la barra superior de la web. Puedes cambiar el nombre, enlace o reordenarlos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetMenuToDefaults}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Restablecer Menú Predeterminado</span>
                  </button>
                </div>

                {/* List of Menu items */}
                <div className="space-y-3">
                  {(draft.navigationMenu || []).map((item, idx) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        item.enabled 
                          ? 'bg-slate-50/80 border-slate-200' 
                          : 'bg-slate-100/50 border-dashed border-slate-300 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Order & Move buttons */}
                        <div className="flex items-center gap-1">
                          <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveMenuItem(idx, 'up')}
                            className="p-1 text-slate-500 hover:text-fuchsia-600 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                            title="Mover arriba"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (draft.navigationMenu?.length || 0) - 1}
                            onClick={() => moveMenuItem(idx, 'down')}
                            className="p-1 text-slate-500 hover:text-fuchsia-600 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                            title="Mover abajo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Label */}
                        <div className="flex-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                            Texto Visible en el Menú
                          </label>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateMenuItem(item.id, 'label', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-fuchsia-500"
                          />
                        </div>

                        {/* Path / Ruta */}
                        <div className="w-full sm:w-48">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                            Ruta / Enlace
                          </label>
                          <input
                            type="text"
                            value={item.path}
                            onChange={(e) => updateMenuItem(item.id, 'path', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:border-fuchsia-500"
                          />
                        </div>

                        {/* Toggle Active */}
                        <div className="flex items-center gap-2 pt-2 sm:pt-0">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => updateMenuItem(item.id, 'enabled', e.target.checked)}
                              className="rounded text-fuchsia-600 focus:ring-fuchsia-500"
                            />
                            <span>{item.enabled ? 'Visible' : 'Oculto'}</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeMenuItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-auto"
                            title="Eliminar del menú"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new link to menu */}
                <div className="p-5 bg-fuchsia-50/50 rounded-2xl border border-fuchsia-100 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fuchsia-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-fuchsia-600" />
                    Agregar Nuevo Enlace al Menú
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Nombre en el Menú
                      </label>
                      <input
                        type="text"
                        value={newMenuLabel}
                        onChange={(e) => setNewMenuLabel(e.target.value)}
                        placeholder="Ej. Promociones"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Ruta (URL o ancla)
                      </label>
                      <input
                        type="text"
                        value={newMenuPath}
                        onChange={(e) => setNewMenuPath(e.target.value)}
                        placeholder="Ej. /promociones o /#catalogo"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addMenuItem}
                        disabled={!newMenuLabel.trim()}
                        className="w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar al Menú</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PÁGINAS Y SECCIONES DINÁMICAS (/seccion) */}
            {activeTab === 'secciones' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-fuchsia-600" />
                      Páginas y Secciones Dinámicas (/seccion)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Crea y edita secciones personalizadas con su propia URL (/promociones, /catalogo, etc.), tarjetas y contacto directo.
                    </p>
                  </div>

                  {!editingPageId && (
                    <button
                      type="button"
                      onClick={startCreateCustomPage}
                      className="px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear Nueva Sección (/seccion)</span>
                    </button>
                  )}
                </div>

                {/* Editor Modal / Card if editing or creating */}
                {editingPageId && pageDraft && (
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-fuchsia-500/40 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-fuchsia-600 text-white flex items-center justify-center text-xs font-bold">
                          /
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {editingPageId === 'new' ? 'Crear Nueva Sección Dinámica' : `Editando /${pageDraft.slug}`}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEditingPageId(null); setPageDraft(null); }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Ruta / Slug (URL visible)
                        </label>
                        <div className="flex items-center">
                          <span className="px-3 py-2.5 bg-slate-200 text-slate-600 font-mono text-xs rounded-l-xl border border-r-0 border-slate-300">
                            lacasadeldisfraz.mx/
                          </span>
                          <input
                            type="text"
                            value={pageDraft.slug}
                            onChange={(e) => setPageDraft({ ...pageDraft, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            placeholder="ejemplo-seccion"
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-r-xl text-xs font-mono font-bold focus:outline-none focus:border-fuchsia-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Título Principal
                        </label>
                        <input
                          type="text"
                          value={pageDraft.title}
                          onChange={(e) => setPageDraft({ ...pageDraft, title: e.target.value })}
                          placeholder="Título de la página"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Subtítulo o Bajada
                        </label>
                        <input
                          type="text"
                          value={pageDraft.subtitle || ''}
                          onChange={(e) => setPageDraft({ ...pageDraft, subtitle: e.target.value })}
                          placeholder="Descripción breve"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Etiqueta / Badge Superior
                        </label>
                        <input
                          type="text"
                          value={pageDraft.badge || ''}
                          onChange={(e) => setPageDraft({ ...pageDraft, badge: e.target.value })}
                          placeholder="Ej. Temporada, Nuevo, Exclusivo"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Contenido / Descripción Detallada
                        </label>
                        <textarea
                          rows={3}
                          value={pageDraft.content}
                          onChange={(e) => setPageDraft({ ...pageDraft, content: e.target.value })}
                          placeholder="Escribe la información detallada para tus clientes..."
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          URL de Imagen Destacada (Opcional)
                        </label>
                        <input
                          type="text"
                          value={pageDraft.heroImage || ''}
                          onChange={(e) => setPageDraft({ ...pageDraft, heroImage: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Texto Botón WhatsApp
                        </label>
                        <input
                          type="text"
                          value={pageDraft.whatsappCtaText || ''}
                          onChange={(e) => setPageDraft({ ...pageDraft, whatsappCtaText: e.target.value })}
                          placeholder="Cotizar por WhatsApp"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Mensaje Predeterminado de WhatsApp
                        </label>
                        <input
                          type="text"
                          value={pageDraft.whatsappMessage || ''}
                          onChange={(e) => setPageDraft({ ...pageDraft, whatsappMessage: e.target.value })}
                          placeholder="Hola, me interesa información sobre..."
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <div className="sm:col-span-2 py-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pageDraft.showInMenu}
                            onChange={(e) => setPageDraft({ ...pageDraft, showInMenu: e.target.checked })}
                            className="rounded text-fuchsia-600 focus:ring-fuchsia-500 w-4 h-4"
                          />
                          <span>Mostrar automáticamente en el Menú Superior de la web</span>
                        </label>
                      </div>
                    </div>

                    {/* Items / Sub-tarjetas */}
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase text-slate-700">
                          Tarjetas / Elementos de la Sección ({pageDraft.items?.length || 0})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...(pageDraft.items || [])];
                            newItems.push({
                              id: 'item-' + Date.now(),
                              title: 'Nuevo Producto o Paquete',
                              description: 'Descripción breve del artículo o paquete.',
                              price: 'Consultar',
                              tag: 'Destacado'
                            });
                            setPageDraft({ ...pageDraft, items: newItems });
                          }}
                          className="px-2.5 py-1 bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Agregar Tarjeta</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(pageDraft.items || []).map((card, cIdx) => (
                          <div key={card.id || cIdx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500">
                                Tarjeta #{cIdx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (pageDraft.items || []).filter((_, i) => i !== cIdx);
                                  setPageDraft({ ...pageDraft, items: updated });
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Título</label>
                                <input
                                  type="text"
                                  value={card.title}
                                  onChange={(e) => {
                                    const updated = [...(pageDraft.items || [])];
                                    updated[cIdx] = { ...updated[cIdx], title: e.target.value };
                                    setPageDraft({ ...pageDraft, items: updated });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Etiqueta / Badge</label>
                                <input
                                  type="text"
                                  value={card.tag || ''}
                                  onChange={(e) => {
                                    const updated = [...(pageDraft.items || [])];
                                    updated[cIdx] = { ...updated[cIdx], tag: e.target.value };
                                    setPageDraft({ ...pageDraft, items: updated });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Precio / Detalle</label>
                                <input
                                  type="text"
                                  value={card.price || ''}
                                  onChange={(e) => {
                                    const updated = [...(pageDraft.items || [])];
                                    updated[cIdx] = { ...updated[cIdx], price: e.target.value };
                                    setPageDraft({ ...pageDraft, items: updated });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-emerald-700"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Descripción</label>
                                <textarea
                                  rows={2}
                                  value={card.description}
                                  onChange={(e) => {
                                    const updated = [...(pageDraft.items || [])];
                                    updated[cIdx] = { ...updated[cIdx], description: e.target.value };
                                    setPageDraft({ ...pageDraft, items: updated });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => { setEditingPageId(null); setPageDraft(null); }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={saveCustomPageDraft}
                        className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Guardar Sección
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Custom Pages List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(draft.customPages || []).map(page => (
                    <div 
                      key={page.id} 
                      className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2.5 py-1 bg-fuchsia-100 text-fuchsia-800 text-[11px] font-mono font-bold rounded-lg">
                            /{page.slug}
                          </span>
                          {page.showInMenu ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              En Menú
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-bold">
                              Oculto en Menú
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 font-fun">
                          {page.title}
                        </h3>
                        {page.subtitle && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {page.subtitle}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {page.content}
                        </p>

                        <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
                          <span>{page.items?.length || 0} tarjetas de producto</span>
                          {page.heroImage && <span>• Con foto</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => onNavigate(`/${page.slug}`)}
                          className="text-xs text-fuchsia-700 hover:text-fuchsia-900 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Página</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditCustomPage(page)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCustomPage(page.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar sección"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!draft.customPages || draft.customPages.length === 0) && (
                    <div className="md:col-span-2 text-center py-8 text-slate-400 text-xs">
                      No hay secciones dinámicas creadas todavía. Haz clic en "Crear Nueva Sección" para comenzar.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: INGRESOS (LOYVERSE POS) */}
            {activeTab === 'ingresos' && (
              <AdminIncomesTab
                onNavigateToSettings={() => setActiveTab('ajustes')}
              />
            )}

            {/* TAB: AJUSTES & PWA LOGOTIPOS */}
            {activeTab === 'ajustes' && (
              <AdminSettingsTab
                draft={draft}
                onChange={setDraft}
                onSave={handleSave}
                isSaving={isSaving}
              />
            )}

            {/* TAB: GASTOS Y REPORTES */}
            {activeTab === 'gastos' && (
              <AdminExpensesTab />
            )}

            {/* TAB: USUARIOS Y ACCESOS */}
            {activeTab === 'usuarios' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-fuchsia-600" />
                      Usuarios y Accesos CyC
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Gestiona los administradores autorizados. Los usuarios se guardan en la colección independiente <code className="bg-slate-100 text-fuchsia-700 px-1.5 py-0.5 rounded font-mono font-bold">/admin_users</code> de Firebase Firestore.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Colección: /admin_users</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-fuchsia-50 border border-fuchsia-200 text-xs font-bold text-fuchsia-800 flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-fuchsia-600" />
                      <span>Sesión: {currentUser}</span>
                    </div>
                  </div>
                </div>

                {/* List of registered users from admin_users collection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Administradores Registrados ({adminUsersList.length})
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Total control de accesos
                    </span>
                  </div>

                  {adminUsersList.map(user => {
                    const isSuperadmin = user.username.toLowerCase() === 'cristobal';
                    return (
                      <div 
                        key={user.id} 
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                            isSuperadmin 
                              ? 'bg-amber-500 text-slate-950 font-fun' 
                              : 'bg-slate-800 text-white'
                          }`}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {user.username}
                              </span>
                              {user.name && user.name !== user.username && (
                                <span className="text-xs text-slate-500">
                                  ({user.name})
                                </span>
                              )}
                              {isSuperadmin ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                                  Admin Principal
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                                  Administrador
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {user.createdAt ? `Registrado: ${new Date(user.createdAt).toLocaleDateString()}` : 'Usuario base del sistema'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleChangeUserPassword(user.id, user.username)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            Cambiar Contraseña
                          </button>
                          {!isSuperadmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAdminUser(user.id, user.username)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar usuario administrador"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add new user form */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-fuchsia-600" />
                      Crear Nuevo Usuario Administrador
                    </h3>
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Se guarda directamente en /admin_users
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Nombre de Usuario (Login)
                      </label>
                      <input
                        type="text"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="Ej. Cyntia"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Nombre / Cargo (Opcional)
                      </label>
                      <input
                        type="text"
                        value={newAdminDisplayName}
                        onChange={(e) => setNewAdminDisplayName(e.target.value)}
                        placeholder="Ej. Cyntia Morales"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={newAdminPass}
                        onChange={(e) => setNewAdminPass(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddAdminUser}
                      disabled={!newAdminName.trim() || !newAdminPass.trim()}
                      className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear Usuario Administrador</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: GENERAL & MARCA */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                    <Store className="w-5 h-5 text-fuchsia-600" />
                    Información General y Datos de Contacto
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Edita los datos que se muestran en el encabezado, pie de página, enlaces de WhatsApp y redes sociales.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Comercial</label>
                    <input
                      type="text"
                      value={draft.storeInfo.name}
                      onChange={(e) => updateStoreInfo('name', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Eslogan / Lema</label>
                    <input
                      type="text"
                      value={draft.storeInfo.tagline}
                      onChange={(e) => updateStoreInfo('tagline', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono visible</label>
                    <input
                      type="text"
                      value={draft.storeInfo.phoneFormatted}
                      onChange={(e) => updateStoreInfo('phoneFormatted', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Número de WhatsApp (con lada, sin espacios)</label>
                    <input
                      type="text"
                      value={draft.storeInfo.whatsappNumber}
                      onChange={(e) => updateStoreInfo('whatsappNumber', e.target.value)}
                      placeholder="523411460580"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={draft.storeInfo.email}
                      onChange={(e) => updateStoreInfo('email', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Años de Trayectoria (Insignia)</label>
                    <input
                      type="text"
                      value={draft.storeInfo.experienceYears}
                      onChange={(e) => updateStoreInfo('experienceYears', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Redes Sociales Oficiales</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Enlace a Facebook</label>
                      <input
                        type="url"
                        value={draft.storeInfo.facebookUrl}
                        onChange={(e) => updateStoreInfo('facebookUrl', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Enlace a Instagram</label>
                      <input
                        type="url"
                        value={draft.storeInfo.instagramUrl}
                        onChange={(e) => updateStoreInfo('instagramUrl', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Pie de Página (Footer)</h3>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Descripción breve del negocio</label>
                    <textarea
                      rows={3}
                      value={draft.footer.aboutText}
                      onChange={(e) => setDraft(prev => ({ ...prev, footer: { ...prev.footer, aboutText: e.target.value } }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Texto de derechos de autor (Copyright)</label>
                    <input
                      type="text"
                      value={draft.footer.copyright}
                      onChange={(e) => setDraft(prev => ({ ...prev, footer: { ...prev.footer, copyright: e.target.value } }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COLORES & ESTILO */}
            {activeTab === 'colores' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-fuchsia-600" />
                    Colores y Estilo Visual del Sitio Web
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Personaliza la atmósfera de color dominante para promociones o temporadas especiales (ej. Festivo, Primavera, Halloween).
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-700 block">Color de Acento Principal</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'fuchsia', label: 'Fucsia Mágico (Original)', bg: 'bg-fuchsia-600' },
                      { id: 'purple', label: 'Púrpura Elegante', bg: 'bg-purple-700' },
                      { id: 'rose', label: 'Rosa Fiesta', bg: 'bg-rose-600' },
                      { id: 'amber', label: 'Ámbar Primavera', bg: 'bg-amber-500' },
                      { id: 'emerald', label: 'Esmeralda Fresco', bg: 'bg-emerald-600' },
                      { id: 'indigo', label: 'Índigo Nocturno', bg: 'bg-indigo-700' },
                    ].map(col => {
                      const selected = draft.theme.primaryColor === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => setDraft(prev => ({ ...prev, theme: { ...prev.theme, primaryColor: col.id as any } }))}
                          className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            selected 
                              ? 'border-slate-900 ring-2 ring-slate-900 bg-slate-50 shadow-sm' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full shrink-0 ${col.bg} shadow-inner`}></div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">{col.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>
                    Al cambiar el color de acento, se actualizan dinámicamente los botones principales, cintillos, insignias de sección y destacados de toda la web pública.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: CINTILLO DE AVISOS */}
            {activeTab === 'anuncio' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-fuchsia-600" />
                    Cintillo de Novedades y Avisos (Top Bar)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Muestra un anuncio llamativo en la parte superior de toda la web para temporadas de alta demanda o comunicados urgentes.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Activar Cintillo Superior</span>
                    <span className="text-xs text-slate-500">Muestra u oculta la barra en la parte superior del sitio</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.announcement.enabled}
                      onChange={(e) => setDraft(prev => ({
                        ...prev,
                        announcement: { ...prev.announcement, enabled: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Etiqueta de la Insignia (Badge)</label>
                    <input
                      type="text"
                      value={draft.announcement.badge}
                      onChange={(e) => setDraft(prev => ({
                        ...prev,
                        announcement: { ...prev.announcement, badge: e.target.value }
                      }))}
                      placeholder="Ej. ¡Temporada Primavera 2026!"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Texto del Mensaje</label>
                    <textarea
                      rows={2}
                      value={draft.announcement.text}
                      onChange={(e) => setDraft(prev => ({
                        ...prev,
                        announcement: { ...prev.announcement, text: e.target.value }
                      }))}
                      placeholder="Escribe el texto del anuncio..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Texto del Botón / Enlace (Opcional)</label>
                      <input
                        type="text"
                        value={draft.announcement.buttonText || ''}
                        onChange={(e) => setDraft(prev => ({
                          ...prev,
                          announcement: { ...prev.announcement, buttonText: e.target.value }
                        }))}
                        placeholder="Ej. Ver Requisitos"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Destino del Enlace</label>
                      <input
                        type="text"
                        value={draft.announcement.buttonLink || ''}
                        onChange={(e) => setDraft(prev => ({
                          ...prev,
                          announcement: { ...prev.announcement, buttonLink: e.target.value }
                        }))}
                        placeholder="Ej. /#requisitos o /#ubicacion"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: UBICACIÓN Y HORARIOS */}
            {activeTab === 'ubicacion' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-fuchsia-600" />
                    Ubicación Física y Horarios de Atención
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Modifica la dirección de la sucursal, coordenadas de GPS y los turnos de atención.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <label className="text-xs font-bold text-amber-900 block">
                    Control Manual del Indicador de Abierto / Cerrado
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'auto', label: 'Automático (Reloj Real)' },
                      { id: 'open', label: 'Forzar Siempre Abierto' },
                      { id: 'closed', label: 'Forzar Cerrado (Vacaciones/Evento)' }
                    ].map(st => {
                      const selected = (draft.storeInfo.manualStatusOverride || 'auto') === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => updateStoreInfo('manualStatusOverride', st.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            selected 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Horarios de Sucursal</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Lunes a Viernes</label>
                      <input
                        type="text"
                        value={draft.storeInfo.hours.weekdays}
                        onChange={(e) => updateStoreHours('weekdays', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Sábados</label>
                      <input
                        type="text"
                        value={draft.storeInfo.hours.saturday}
                        onChange={(e) => updateStoreHours('saturday', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Domingos</label>
                      <input
                        type="text"
                        value={draft.storeInfo.hours.sunday}
                        onChange={(e) => updateStoreHours('sunday', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Dirección y Navegación</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Calle, Número y Colonia</label>
                      <input
                        type="text"
                        value={draft.locationSection.addressLine}
                        onChange={(e) => {
                          updateLocationSection('addressLine', e.target.value);
                          updateStoreInfo('addressLine', e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Municipio, Estado y País</label>
                      <input
                        type="text"
                        value={draft.locationSection.addressCity}
                        onChange={(e) => {
                          updateLocationSection('addressCity', e.target.value);
                          updateStoreInfo('cityState', e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Enlace a Google Maps</label>
                      <input
                        type="url"
                        value={draft.storeInfo.googleMapsUrl}
                        onChange={(e) => updateStoreInfo('googleMapsUrl', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: HERO BANNER */}
            {activeTab === 'hero' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-600" />
                    Banner Principal de Entrada (Hero)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Modifica el título central, la descripción y los 4 botones de acción rápida de la pantalla principal.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Título Principal (H1)</label>
                    <textarea
                      rows={2}
                      value={draft.hero.title}
                      onChange={(e) => updateHero('title', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold font-fun focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Descripción / Subtítulo</label>
                    <textarea
                      rows={3}
                      value={draft.hero.description}
                      onChange={(e) => updateHero('description', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Botones de Acción</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Botón 1 (Llegar a la tienda)</label>
                        <input
                          type="text"
                          value={draft.hero.btn1Text}
                          onChange={(e) => updateHero('btn1Text', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Botón 2 (Requisitos de Renta)</label>
                        <input
                          type="text"
                          value={draft.hero.btn2Text}
                          onChange={(e) => updateHero('btn2Text', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Botón 3 (Escríbenos por WhatsApp)</label>
                        <input
                          type="text"
                          value={draft.hero.btn3Text}
                          onChange={(e) => updateHero('btn3Text', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Mensaje Inicial de WhatsApp al hacer clic</label>
                        <input
                          type="text"
                          value={draft.hero.whatsappCustomMessage}
                          onChange={(e) => updateHero('whatsappCustomMessage', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Botón 4 (Contrato / Términos)</label>
                        <input
                          type="text"
                          value={draft.hero.btn4Text}
                          onChange={(e) => updateHero('btn4Text', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: REQUISITOS DE RENTA */}
            {activeTab === 'requisitos' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-fuchsia-600" />
                    Requisitos y Pasos del Proceso de Renta
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Edita el encabezado y el texto de cada uno de los 4 pasos del proceso de renta.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Título de la Sección</label>
                    <input
                      type="text"
                      value={draft.rentalSteps.title}
                      onChange={(e) => updateRentalSteps('title', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Subtítulo / Descripción</label>
                    <input
                      type="text"
                      value={draft.rentalSteps.description}
                      onChange={(e) => updateRentalSteps('description', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">Los 4 Pasos</h3>

                  <div className="space-y-4">
                    {draft.rentalSteps.steps.map((st, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-fuchsia-600 text-white font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Paso {st.step}
                          </span>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Título del Paso</label>
                          <input
                            type="text"
                            value={st.title}
                            onChange={(e) => {
                              const newSteps = [...draft.rentalSteps.steps];
                              newSteps[idx] = { ...newSteps[idx], title: e.target.value };
                              updateRentalSteps('steps', newSteps);
                            }}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Descripción explicativa</label>
                          <textarea
                            rows={2}
                            value={st.desc}
                            onChange={(e) => {
                              const newSteps = [...draft.rentalSteps.steps];
                              newSteps[idx] = { ...newSteps[idx], desc: e.target.value };
                              updateRentalSteps('steps', newSteps);
                            }}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500 leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Tarjeta de Acceso al Contrato Legal</h3>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Título de la tarjeta</label>
                    <input
                      type="text"
                      value={draft.rentalSteps.contractBannerTitle}
                      onChange={(e) => updateRentalSteps('contractBannerTitle', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Texto del botón</label>
                    <input
                      type="text"
                      value={draft.rentalSteps.contractBannerBtnText}
                      onChange={(e) => updateRentalSteps('contractBannerBtnText', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: NUESTRA HISTORIA */}
            {activeTab === 'historia' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-fuchsia-600" />
                    Sección: Nuestra Historia y Taller JoJo's
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Cambia la fotografía oficial horizontal, la insignia de aniversario, los párrafos de la historia y las fortalezas.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Título de la Sección</label>
                    <input
                      type="text"
                      value={draft.story.title}
                      onChange={(e) => updateStory('title', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">URL de la Foto Oficial (Horizontal)</label>
                    <input
                      type="url"
                      value={draft.story.imageUrl}
                      onChange={(e) => updateStory('imageUrl', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-mono text-xs"
                    />
                    {draft.story.imageUrl && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 max-w-sm bg-slate-100">
                        <img
                          src={draft.story.imageUrl}
                          alt="Vista previa"
                          className="w-full h-36 object-cover"
                        />
                        <span className="text-[10px] text-slate-500 p-1.5 block bg-white text-center">
                          Vista previa de la fotografía
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Texto de Insignia Principal</label>
                      <input
                        type="text"
                        value={draft.story.badgeNumber}
                        onChange={(e) => updateStory('badgeNumber', e.target.value)}
                        placeholder="Ej. 9+ Años"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Texto de Insignia Secundario</label>
                      <input
                        type="text"
                        value={draft.story.badgeSub}
                        onChange={(e) => updateStory('badgeSub', e.target.value)}
                        placeholder="Ej. En Ciudad Guzmán"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Párrafos de la Historia</h3>
                      <button
                        type="button"
                        onClick={() => {
                          updateStory('paragraphs', [...draft.story.paragraphs, 'Nuevo párrafo narrativo...']);
                        }}
                        className="text-xs text-fuchsia-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar Párrafo
                      </button>
                    </div>

                    {draft.story.paragraphs.map((p, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <textarea
                          rows={3}
                          value={p}
                          onChange={(e) => {
                            const newParagraphs = [...draft.story.paragraphs];
                            newParagraphs[idx] = e.target.value;
                            updateStory('paragraphs', newParagraphs);
                          }}
                          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-fuchsia-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateStory('paragraphs', draft.story.paragraphs.filter((_, i) => i !== idx));
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Eliminar párrafo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Botón de WhatsApp para Confección</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Texto del Botón</label>
                        <input
                          type="text"
                          value={draft.story.ctaButtonText}
                          onChange={(e) => updateStory('ctaButtonText', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Mensaje Inicial de WhatsApp</label>
                        <input
                          type="text"
                          value={draft.story.ctaWhatsappMessage}
                          onChange={(e) => updateStory('ctaWhatsappMessage', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: PERSONALIZADOS CYC E INVITACIONES */}
            {activeTab === 'personalizados' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-fuchsia-600" />
                    Personalizados CyC e Invitaciones Digitales
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Modifica los títulos, tarjetas de recuerdos, playeras e invitaciones interactivas.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Título de la Sección</label>
                    <input
                      type="text"
                      value={draft.customOrders.title}
                      onChange={(e) => updateCustomOrders('title', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Descripción</label>
                    <textarea
                      rows={2}
                      value={draft.customOrders.description}
                      onChange={(e) => updateCustomOrders('description', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 font-medium"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Tarjetas de Productos y Servicios</h3>

                    <div className="space-y-4">
                      {draft.customOrders.items.map((it, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">Título del Producto</label>
                              <input
                                type="text"
                                value={it.title}
                                onChange={(e) => {
                                  const newItems = [...draft.customOrders.items];
                                  newItems[idx] = { ...newItems[idx], title: e.target.value };
                                  updateCustomOrders('items', newItems);
                                }}
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">Insignia (Badge)</label>
                              <input
                                type="text"
                                value={it.badge}
                                onChange={(e) => {
                                  const newItems = [...draft.customOrders.items];
                                  newItems[idx] = { ...newItems[idx], badge: e.target.value };
                                  updateCustomOrders('items', newItems);
                                }}
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-xs font-bold text-slate-700 block mb-1">Descripción detallada</label>
                              <textarea
                                rows={2}
                                value={it.desc}
                                onChange={(e) => {
                                  const newItems = [...draft.customOrders.items];
                                  newItems[idx] = { ...newItems[idx], desc: e.target.value };
                                  updateCustomOrders('items', newItems);
                                }}
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Texto del Botón WhatsApp</label>
                      <input
                        type="text"
                        value={draft.customOrders.ctaButtonText}
                        onChange={(e) => updateCustomOrders('ctaButtonText', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Mensaje de WhatsApp</label>
                      <input
                        type="text"
                        value={draft.customOrders.ctaWhatsappMessage}
                        onChange={(e) => updateCustomOrders('ctaWhatsappMessage', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: PREGUNTAS FRECUENTES (FAQ) */}
            {activeTab === 'faq' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-fuchsia-600" />
                      Preguntas Frecuentes (FAQ)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Agrega, edita o elimina las preguntas y respuestas interactivas.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addFaq}
                    className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Pregunta</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.faqSection.items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">
                          Pregunta #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFaq(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Pregunta (Título)</label>
                        <input
                          type="text"
                          value={item.q}
                          onChange={(e) => updateFaq(idx, 'q', e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Respuesta</label>
                        <textarea
                          rows={3}
                          value={item.a}
                          onChange={(e) => updateFaq(idx, 'a', e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 10: TESTIMONIOS Y OPINIONES */}
            {activeTab === 'testimonios' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold font-fun text-slate-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      Reseñas y Testimonios de Clientes
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Gestiona los comentarios reales de maestros, escuelas y familias que aparecen en la página.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addReview}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-950" />
                    <span>Agregar Testimonio</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.reviewsSection.items.map((rev, idx) => (
                    <div key={rev.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">
                          Testimonio #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeReview(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar testimonio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Cliente</label>
                          <input
                            type="text"
                            value={rev.author}
                            onChange={(e) => updateReview(idx, 'author', e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Rol / Ocasión</label>
                          <input
                            type="text"
                            value={rev.role}
                            onChange={(e) => updateReview(idx, 'role', e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Disfraz / Paquete</label>
                          <input
                            type="text"
                            value={rev.costumeName}
                            onChange={(e) => updateReview(idx, 'costumeName', e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-xs font-bold text-slate-700 block mb-1">Comentario</label>
                          <textarea
                            rows={2}
                            value={rev.comment}
                            onChange={(e) => updateReview(idx, 'comment', e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
