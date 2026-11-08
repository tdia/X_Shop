import React, { useEffect, useState } from 'react';
import { Download, X, Share, SquarePlus } from 'lucide-react';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

const InstallButton = () => {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferred(null);
    } else if (isIOS()) {
      setShowIOS(true);
    } else {
      // Navigateur sans prompt : on explique où trouver « Installer »
      setShowIOS(true);
    }
  };

  return (
    <>
      <button className="pwa-install-btn" onClick={handleClick} title="Installer / télécharger l'application">
        <Download size={18} />
        <span>Installer l'app</span>
      </button>

      {showIOS && (
        <div className="pwa-ios-overlay" onClick={() => setShowIOS(false)}>
          <div className="pwa-ios-card" onClick={(e) => e.stopPropagation()}>
            <button className="pwa-ios-close" onClick={() => setShowIOS(false)}><X size={18} /></button>
            <h3>Installer X-Shop</h3>
            {isIOS() ? (
              <ol>
                <li>Touchez <Share size={16} /> <b>Partager</b> dans la barre Safari.</li>
                <li>Choisissez <SquarePlus size={16} /> <b>« Sur l'écran d'accueil »</b>.</li>
                <li>Validez : l'app s'ajoute comme une application.</li>
              </ol>
            ) : (
              <ol>
                <li>Ouvrez le menu <b>⋮</b> du navigateur.</li>
                <li>Choisissez <b>« Installer l'application »</b> (ou « Ajouter à l'écran d'accueil »).</li>
                <li>Validez : l'app s'installe sur l'appareil.</li>
              </ol>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .pwa-install-btn {
          position: fixed; right: 18px; bottom: 18px; z-index: 5000;
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 18px; border-radius: 999px; border: none;
          background: linear-gradient(135deg,#4f46e5,#38bdf8); color: #fff;
          font-weight: 800; font-size: 0.9rem; cursor: pointer;
          box-shadow: 0 12px 28px rgba(79,70,229,0.4);
        }
        .pwa-install-btn:hover { filter: brightness(1.05); }
        @media (max-width: 768px) {
          /* au-dessus de la barre de navigation mobile */
          .pwa-install-btn { bottom: 78px; right: 14px; padding: 11px 16px; }
        }
        .pwa-ios-overlay {
          position: fixed; inset: 0; z-index: 6000; background: rgba(15,23,42,0.55);
          backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .pwa-ios-card {
          position: relative; background: #fff; border-radius: 22px; padding: 26px 24px;
          max-width: 380px; width: 100%; box-shadow: 0 25px 60px rgba(0,0,0,0.3);
        }
        .pwa-ios-close { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px;
          border-radius: 10px; border: none; background: #f1f5f9; color: #64748b; cursor: pointer;
          display: flex; align-items: center; justify-content: center; }
        .pwa-ios-card h3 { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin-bottom: 14px; }
        .pwa-ios-card ol { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 10px; }
        .pwa-ios-card li { font-size: 0.92rem; color: #334155; font-weight: 600; line-height: 1.5; }
        .pwa-ios-card li svg { vertical-align: -3px; color: #4f46e5; }
      `}} />
    </>
  );
};

export default InstallButton;
