import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Lock, User, AlertCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      setError('');
    } else {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="login-screen-clean">
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-logo-big">
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.5rem' }}>X</span>
          </div>
          <h1>X-Shop <span>Manager</span></h1>
        </div>

        <div className="login-card-clean">
          <div className="login-header-text">
            <h2>Ravie de vous revoir !</h2>
            <p>Connectez-vous pour continuer sur votre boutique</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-clean">
            {error && (
              <div className="error-pill">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-input-group">
              <label>Nom d'utilisateur</label>
              <div className="input-with-icon-light">
                <User size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="form-input-group">
              <label>Mot de passe</label>
              <div className="input-with-icon-light">
                <Lock size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-glow login-btn-wide">
              Se Connecter
            </button>
          </form>

          <p className="login-help">Accès restreint. Mot de passe perdu ? Contactez le support.</p>
        </div>
      </div>

      <div className="login-right">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="login-graphic"
        >
          <div className="graphic-circle main"></div>
          <div className="graphic-circle secondary"></div>
          <div className="pos-mockup">
            <div className="mockup-header"></div>
            <div className="mockup-content">
              <div className="mock-item anim-1"></div>
              <div className="mock-item anim-2"></div>
              <div className="mock-item anim-3"></div>
            </div>
          </div>
        </motion.div>
        <div className="login-overlay-text">
          <h3>Gérez votre boutique en toute simplicité</h3>
          <p>Le meilleur système POS moderne pour votre entreprise.</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .login-screen-clean {
          height: 100vh;
          width: 100vw;
          display: flex;
          background: white;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 2000;
          overflow: hidden;
        }

        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 60px 100px;
          justify-content: center;
          background: white;
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 80px;
          position: absolute;
          top: 60px;
        }

        .brand-logo-big {
          width: 56px;
          height: 56px;
          background: var(--primary);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px var(--primary-glow);
        }

        .login-brand h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .login-brand h1 span { color: var(--primary); }

        .login-card-clean {
          max-width: 440px;
          width: 100%;
        }

        .login-header-text { margin-bottom: 40px; }
        .login-header-text h2 { font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .login-header-text p { color: var(--text-muted); font-weight: 600; }

        .login-form-clean { display: flex; flex-direction: column; gap: 24px; }
        
        .form-input-group { display: flex; flex-direction: column; gap: 8px; }
        .form-input-group label { font-size: 0.9rem; font-weight: 700; color: var(--text-secondary); }

        .input-with-icon-light {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon-light svg { position: absolute; left: 16px; color: var(--text-muted); }
        .input-with-icon-light input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: var(--bg-main);
          border: 1px solid var(--border);
          border-radius: 14px;
          font-weight: 600;
          font-size: 1rem;
        }

        .input-with-icon-light input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px var(--primary-glow); }

        .error-pill {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: var(--danger);
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .login-btn-wide { width: 100%; padding: 16px; font-size: 1.1rem; margin-top: 12px; }

        .login-help { margin-top: 40px; color: var(--text-muted); font-size: 0.85rem; text-align: center; font-weight: 500; }

        .login-right {
          flex: 1.2;
          background: var(--primary);
          background: var(--grad-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .login-graphic { position: relative; width: 500px; height: 500px; }
        .graphic-circle { position: absolute; border-radius: 50%; border: 20px solid rgba(255,255,255,0.1); }
        .graphic-circle.main { width: 400px; height: 400px; top: 0; left: 0; }
        .graphic-circle.secondary { width: 300px; height: 300px; bottom: 0; right: 0; }

        .pos-mockup {
          position: absolute;
          top: 100px;
          left: 50px;
          width: 400px;
          height: 300px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.2);
          overflow: hidden;
        }

        .mockup-header { height: 60px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .mockup-content { padding: 32px; display: flex; flex-direction: column; gap: 20px; }
        .mock-item { height: 16px; border-radius: 4px; background: #e2e8f0; }
        .anim-1 { width: 60%; }
        .anim-2 { width: 80%; }
        .anim-3 { width: 40%; }

        .login-overlay-text {
          position: absolute;
          bottom: 100px;
          text-align: center;
          color: white;
          padding: 0 60px;
        }

        .login-overlay-text h3 { font-size: 1.75rem; font-weight: 800; margin-bottom: 16px; }
        .login-overlay-text p { font-size: 1.1rem; opacity: 0.9; font-weight: 500; }

        @media (max-width: 1100px) {
          .login-right { display: none; }
          .login-left { padding: 40px; }
          .login-brand { position: relative; top: 0; margin-bottom: 60px; }
        }
      `}} />
    </div>
  );
};

export default LoginView;
