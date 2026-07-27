import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ currentView }) => {
  const { user } = useAuth();

  const titles = {
    dashboard: 'Tableau de Bord',
    pos: 'Interface de Vente (POS)',
    inventory: 'Gestion du Stock',
    customers: 'Base de Données Clients',
    reports: 'Rapports d\'Activité',
    users: 'Gestion des Utilisateurs'
  };

  return (
    <header className="header-light">
      <div className="header-left">
        <h1 className="header-title">{titles[currentView] || 'Aperçu'}</h1>
        <p className="header-subtitle">Bienvenue, {user?.name}</p>
      </div>

      <div className="header-right">
        <div className="header-search">
          <Search size={18} />
          <input type="text" placeholder="Recherche globale..." />
        </div>

        <div className="header-actions">
          <button className="notif-btn">
            <Bell size={20} />
            <span className="notif-badge"></span>
          </button>

          <div className="user-pill">
            <div className="user-avatar-wrap">
              <User size={18} />
            </div>
            <div className="user-text">
              <span className="u-name">{user?.name}</span>
              <span className="u-role">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .header-light {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
        }

        .header-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -1px;
        }

        .header-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .header-search {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 10px 20px;
          border-radius: 14px;
          width: 300px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }

        .header-search input {
          border: none;
          background: transparent;
          width: 100%;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .notif-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: white;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          position: relative;
        }

        .notif-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 50%;
          border: 2px solid white;
        }

        .user-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 16px 6px 6px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 40px;
          box-shadow: var(--shadow-sm);
        }

        .user-avatar-wrap {
          width: 32px;
          height: 32px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-text {
          display: flex;
          flex-direction: column;
        }

        .u-name { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
        .u-role { font-size: 0.7rem; color: var(--text-muted); text-transform: capitalize; }

        @media (max-width: 850px) {
          .header-search, .header-subtitle { display: none; }
        }
      `}} />
    </header>
  );
};

export default Header;
