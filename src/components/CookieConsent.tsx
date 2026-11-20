'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

export interface CookiePreferences {
  essential: boolean; // Always true
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'poblancer_cookie_consent_v1';

export default function CookieConsent() {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [consent, setConsent] = useState<CookiePreferences | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Preference draft in modal
  const [prefsDraft, setPrefsDraft] = useState({
    preferences: true,
    analytics: false,
    marketing: false
  });

  const dialogId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Load existing consent on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setConsent(parsed);
        setPrefsDraft({
          preferences: Boolean(parsed.preferences),
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing)
        });
      } else {
        // Show banner after brief delay
        const timer = setTimeout(() => setShowBanner(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // In private browsing or storage errors, show banner
      setShowBanner(true);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  // Listen for global open requests (e.g., from footer links)
  useEffect(() => {
    const handleOpen = () => {
      setShowModal(true);
      setShowBanner(false);
    };
    window.addEventListener('poblancer:open-cookie-preferences', handleOpen);
    return () => window.removeEventListener('poblancer:open-cookie-preferences', handleOpen);
  }, []);

  // Save consent helper
  const saveConsent = useCallback((preferences: { preferences: boolean; analytics: boolean; marketing: boolean }) => {
    const record: CookiePreferences = {
      essential: true,
      preferences: preferences.preferences,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      // Set a client cookie for server/worker header checks
      const val = encodeURIComponent(JSON.stringify({
        p: record.preferences ? 1 : 0,
        a: record.analytics ? 1 : 0,
        m: record.marketing ? 1 : 0
      }));
      document.cookie = `poblancer_consent=${val}; path=/; max-age=31536000; SameSite=Lax; Secure`;
    } catch {}

    setConsent(record);
    setShowBanner(false);
    setShowModal(false);

    // Dispatch update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('poblancer:consent-updated', { detail: record }));
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    saveConsent({ preferences: true, analytics: true, marketing: true });
  }, [saveConsent]);

  const handleRejectNonEssential = useCallback(() => {
    saveConsent({ preferences: false, analytics: false, marketing: false });
  }, [saveConsent]);

  const handleSavePreferences = useCallback(() => {
    saveConsent(prefsDraft);
  }, [saveConsent, prefsDraft]);

  // Modal keyboard accessibility
  useEffect(() => {
    if (!showModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showModal]);

  if (!hasLoaded) return null;

  return (
    <>
      {/* Cookie Banner (Bottom Bar) */}
      {showBanner && !showModal && (
        <aside
          className="pob-cookie-banner"
          role="region"
          aria-label="Cookie consent and privacy options"
        >
          <div className="cookie-banner-content">
            <div className="cookie-banner-text">
              <span className="cookie-eyebrow">PRIVACY &amp; DATA PROTECTION</span>
              <p>
                We use cookies and secure local storage to authenticate your sessions, maintain dashboard stability, and improve platform performance under the <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and international standards.
              </p>
            </div>
            <div className="cookie-banner-actions">
              <button
                type="button"
                className="button primary cookie-btn"
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
              <button
                type="button"
                className="button cookie-btn"
                onClick={handleRejectNonEssential}
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                className="cookie-link-btn"
                onClick={() => {
                  setShowBanner(false);
                  setShowModal(true);
                }}
              >
                Manage Preferences
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Dialog Modal */}
      {showModal && (
        <div className="pob-cookie-modal-root" role="dialog" aria-modal="true" aria-labelledby={`${dialogId}-title`}>
          <div 
            className="cookie-modal-backdrop" 
            onClick={() => setShowModal(false)} 
            aria-hidden="true" 
          />
          <div className="cookie-modal-dialog" ref={modalRef}>
            <div className="cookie-modal-header">
              <div>
                <span className="cookie-eyebrow">POBLANCER PRIVACY PREFERENCES</span>
                <h2 id={`${dialogId}-title`}>Cookie &amp; Data Consent Settings</h2>
              </div>
              <button
                type="button"
                className="cookie-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close preferences dialog"
              >
                ×
              </button>
            </div>

            <div className="cookie-modal-body">
              <p className="cookie-modal-intro">
                You can customize your cookie preferences below. Essential cookies are required to authenticate your account and ensure secure transaction processing. Optional cookies help us refine marketplace performance and rich media embeds.
              </p>

              <div className="cookie-category-list">
                {/* Essential Cookies */}
                <div className="cookie-category-card">
                  <div className="cookie-cat-header">
                    <div>
                      <strong>Strictly Essential Cookies</strong>
                      <span className="cookie-cat-badge always-active">Always Active</span>
                    </div>
                  </div>
                  <p className="cookie-cat-desc">
                    Required for core website operations, session authentication (WordPress &amp; Next.js cookies), anti-forgery nonces, and checkout security. Cannot be switched off.
                  </p>
                </div>

                {/* Preference & Functionality Cookies */}
                <div className="cookie-category-card">
                  <div className="cookie-cat-header">
                    <div>
                      <strong>Preferences &amp; User Experience</strong>
                      <span className="cookie-cat-badge">Functional</span>
                    </div>
                    <label className="cookie-switch" aria-label="Toggle Preferences cookies">
                      <input
                        type="checkbox"
                        checked={prefsDraft.preferences}
                        onChange={e => setPrefsDraft(p => ({ ...p, preferences: e.target.checked }))}
                      />
                      <span className="cookie-slider" />
                    </label>
                  </div>
                  <p className="cookie-cat-desc">
                    Remembers dashboard layout preferences, guided tour completion markers, and role view filters so you do not have to reconfigure them each visit.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="cookie-category-card">
                  <div className="cookie-cat-header">
                    <div>
                      <strong>Performance &amp; Analytics</strong>
                      <span className="cookie-cat-badge">Analytics</span>
                    </div>
                    <label className="cookie-switch" aria-label="Toggle Analytics cookies">
                      <input
                        type="checkbox"
                        checked={prefsDraft.analytics}
                        onChange={e => setPrefsDraft(p => ({ ...p, analytics: e.target.checked }))}
                      />
                      <span className="cookie-slider" />
                    </label>
                  </div>
                  <p className="cookie-cat-desc">
                    Aggregated metrics on page performance, API latency, and navigation flow. Data is strictly anonymized and never sold.
                  </p>
                </div>

                {/* Marketing / Media Cookies */}
                <div className="cookie-category-card">
                  <div className="cookie-cat-header">
                    <div>
                      <strong>Third-Party Media Embeds</strong>
                      <span className="cookie-cat-badge">Media</span>
                    </div>
                    <label className="cookie-switch" aria-label="Toggle Media cookies">
                      <input
                        type="checkbox"
                        checked={prefsDraft.marketing}
                        onChange={e => setPrefsDraft(p => ({ ...p, marketing: e.target.checked }))}
                      />
                      <span className="cookie-slider" />
                    </label>
                  </div>
                  <p className="cookie-cat-desc">
                    Controls external media players (YouTube privacy-enhanced embeds and Instagram portfolio showcases) that provide rich preview experiences.
                  </p>
                </div>
              </div>
            </div>

            <div className="cookie-modal-footer">
              <button
                type="button"
                className="button cookie-btn"
                onClick={handleRejectNonEssential}
              >
                Reject Non-Essential
              </button>
              <button
                ref={firstFocusRef}
                type="button"
                className="button primary cookie-btn"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
