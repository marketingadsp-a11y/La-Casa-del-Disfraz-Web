import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteContent } from '../types/siteContent';
import { DEFAULT_SITE_CONTENT } from '../data/defaultSiteContent';

const LOCAL_STORAGE_KEY = 'lcd_site_content_cache';
const FIRESTORE_COLLECTION = 'site_content';
const FIRESTORE_DOC = 'global';

interface SiteContentContextType {
  content: SiteContent;
  isLoaded: boolean;
  isSaving: boolean;
  isCloudSynced: boolean;
  syncError: string | null;
  saveContent: (newContent: SiteContent) => Promise<{ success: boolean; message: string }>;
  resetToDefaults: () => Promise<{ success: boolean; message: string }>;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const SiteContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_SITE_CONTENT, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Error reading from localStorage cache', e);
    }
    return DEFAULT_SITE_CONTENT;
  });

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Real-time listener with Firestore
  useEffect(() => {
    let isSubscribed = true;

    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (!isSubscribed) return;

          if (snapshot.exists()) {
            const data = snapshot.data() as SiteContent;
            // Merge gracefully with default content to ensure all fields are present
            const merged: SiteContent = {
              ...DEFAULT_SITE_CONTENT,
              ...data,
              branding: { 
                webLogoUrl: data.branding?.webLogoUrl || DEFAULT_SITE_CONTENT.branding?.webLogoUrl || '',
                webLogoFooterUrl: data.branding?.webLogoFooterUrl || DEFAULT_SITE_CONTENT.branding?.webLogoFooterUrl,
                pwaIconUrl: data.branding?.pwaIconUrl || DEFAULT_SITE_CONTENT.branding?.pwaIconUrl || '',
                pwaAppName: data.branding?.pwaAppName || DEFAULT_SITE_CONTENT.branding?.pwaAppName,
                pwaShortName: data.branding?.pwaShortName || DEFAULT_SITE_CONTENT.branding?.pwaShortName,
              },
              theme: { ...DEFAULT_SITE_CONTENT.theme, ...(data.theme || {}) },
              announcement: { ...DEFAULT_SITE_CONTENT.announcement, ...(data.announcement || {}) },
              storeInfo: { 
                ...DEFAULT_SITE_CONTENT.storeInfo, 
                ...(data.storeInfo || {}),
                hours: { ...DEFAULT_SITE_CONTENT.storeInfo.hours, ...(data.storeInfo?.hours || {}) }
              },
              hero: { ...DEFAULT_SITE_CONTENT.hero, ...(data.hero || {}) },
              locationSection: { ...DEFAULT_SITE_CONTENT.locationSection, ...(data.locationSection || {}) },
              rentalSteps: { ...DEFAULT_SITE_CONTENT.rentalSteps, ...(data.rentalSteps || {}) },
              story: { ...DEFAULT_SITE_CONTENT.story, ...(data.story || {}) },
              customOrders: { ...DEFAULT_SITE_CONTENT.customOrders, ...(data.customOrders || {}) },
              faqSection: { ...DEFAULT_SITE_CONTENT.faqSection, ...(data.faqSection || {}) },
              reviewsSection: { ...DEFAULT_SITE_CONTENT.reviewsSection, ...(data.reviewsSection || {}) },
              footer: { ...DEFAULT_SITE_CONTENT.footer, ...(data.footer || {}) },
              navigationMenu: Array.isArray(data.navigationMenu) && data.navigationMenu.length > 0 
                ? data.navigationMenu 
                : DEFAULT_SITE_CONTENT.navigationMenu,
              customPages: Array.isArray(data.customPages) 
                ? data.customPages 
                : DEFAULT_SITE_CONTENT.customPages,
              adminUsers: (() => {
                const users = Array.isArray(data.adminUsers) ? [...data.adminUsers] : [];
                // Ensure Cristobal always exists
                const hasCristobal = users.some(u => u.username.toLowerCase() === 'cristobal');
                if (!hasCristobal) {
                  users.unshift(DEFAULT_SITE_CONTENT.adminUsers[0]);
                }
                return users;
              })()
            };

            setContent(merged);
            setIsCloudSynced(true);
            setSyncError(null);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // ignore storage quotas
            }
          } else {
            // If the document doesn't exist yet in the user's project, initialize it!
            setDoc(docRef, DEFAULT_SITE_CONTENT, { merge: true })
              .then(() => {
                setIsCloudSynced(true);
                setSyncError(null);
              })
              .catch((err) => {
                console.warn('Initial Firestore seed notice:', err);
                // Keep local cache active
              });
          }
          setIsLoaded(true);
        },
        (error) => {
          console.warn('Firestore snapshot notice (working with local cache):', error);
          if (isSubscribed) {
            setIsLoaded(true);
            setIsCloudSynced(false);
            setSyncError(error.message || 'Sin conexión directa a Firestore');
          }
        }
      );

      return () => {
        isSubscribed = false;
        unsubscribe();
      };
    } catch (err: unknown) {
      console.warn('Error setting up Firestore listener:', err);
      setIsLoaded(true);
      setIsCloudSynced(false);
      setSyncError(err instanceof Error ? err.message : 'Error de inicialización');
    }
  }, []);

  const saveContent = async (newContent: SiteContent): Promise<{ success: boolean; message: string }> => {
    setIsSaving(true);
    const updatedWithTimestamp: SiteContent = {
      ...newContent,
      updatedAt: new Date().toISOString()
    };

    // Update local state and cache immediately for instantaneous UI response
    setContent(updatedWithTimestamp);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedWithTimestamp));
    } catch {
      // ignore
    }

    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
      await setDoc(docRef, updatedWithTimestamp, { merge: true });
      setIsSaving(false);
      setIsCloudSynced(true);
      setSyncError(null);
      return { success: true, message: '¡Cambios guardados con éxito en Firebase!' };
    } catch (err: unknown) {
      console.error('Error saving to Firestore:', err);
      setIsSaving(false);
      const errMsg = err instanceof Error ? err.message : 'Error desconocido al conectar con Firebase';
      setSyncError(errMsg);
      return { 
        success: true, 
        message: 'Cambios guardados en caché local (pendiente de sincronizar con Firebase: ' + errMsg + ')' 
      };
    }
  };

  const resetToDefaults = async (): Promise<{ success: boolean; message: string }> => {
    return await saveContent(DEFAULT_SITE_CONTENT);
  };

  return (
    <SiteContentContext.Provider
      value={{
        content,
        isLoaded,
        isSaving,
        isCloudSynced,
        syncError,
        saveContent,
        resetToDefaults
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = (): SiteContentContextType => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
};
