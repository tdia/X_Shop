import React from 'react';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BarChart3,
    Users,
    LogOut,
    Store,
    Settings,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = ({ currentView, setCurrentView }) => {
    const { user, logout } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, roles: ['admin', 'gestionnaire', 'manager'] },
        { id: 'pos', label: 'Ventes (POS)', icon: ShoppingCart, roles: ['admin', 'vendeur'] },
        { id: 'inventory', label: 'Inventaire', icon: Package, roles: ['admin', 'gestionnaire'] },
        { id: 'reports', label: 'Rapports', icon: BarChart3, roles: ['admin', 'manager'] },
        { id: 'users', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className="x-sidebar-light">
            <div className="sidebar-brand">
                <div className="brand-logo-wrap">
                    <span style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>X</span>
                </div>
                <span className="brand-name">X-Shop</span>
            </div>

            <nav className="sidebar-nav">
                {filteredMenu.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            className={`nav-link-light ${isActive ? 'active' : ''}`}
                            onClick={() => setCurrentView(item.id)}
                        >
                            <div className="icon-container">
                                <Icon size={20} />
                            </div>
                            <span className="label">{item.label}</span>
                            {isActive && <motion.div layoutId="active-dot" className="active-indicator" />}
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="settings-link">
                    <Settings size={20} />
                    <span>Paramètres</span>
                </div>
                <button className="logout-button" onClick={logout}>
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .x-sidebar-light {
          width: 280px;
          height: 100vh;
          background: white;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 32px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
          padding-left: 8px;
        }

        .brand-logo-wrap {
          width: 40px;
          height: 40px;
          background: var(--primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px var(--primary-glow);
        }

        .brand-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-link-light {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: 14px;
          color: var(--text-secondary);
          font-weight: 600;
          background: transparent;
          position: relative;
          transition: all 0.2s;
        }

        .nav-link-light:hover {
          background: var(--bg-main);
          color: var(--primary);
        }

        .nav-link-light.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .active-indicator {
          position: absolute;
          left: -24px;
          width: 4px;
          height: 20px;
          background: var(--primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding-top: 24px;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .settings-link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: 14px;
          color: var(--danger);
          background: #fee2e2;
          font-weight: 700;
          width: 100%;
          border: none;
        }

        .logout-button:hover {
          background: var(--danger);
          color: white;
        }

        @media (max-width: 1024px) {
          .x-sidebar-light { width: 88px; padding: 32px 16px; }
          .brand-name, .label, .settings-link span, .logout-button span { display: none; }
          .sidebar-brand { justify-content: center; padding: 0; }
          .nav-link-light { justify-content: center; padding: 16px 0; }
          .logout-button { justify-content: center; width: 50px; margin: 0 auto; }
        }
      `}} />
        </aside>
    );
};

export default Sidebar;
