import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    UserPlus,
    Shield,
    User as UserIcon,
    Trash2,
    Mail,
    Key,
    Edit3,
    X,
    ChevronRight,
    ShieldCheck,
    UserCircle,
    MoreVertical,
    Users as UsersIcon,
    CheckCircle2,
    Lock,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagementView = () => {
    const { users, addUser, updateUser, deleteUser, user: currentUser } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        role: 'vendeur'
    });

    const roles = [
        { value: 'admin', label: 'Administrateur', desc: 'Contrôle total du système', icon: <ShieldCheck size={18} />, color: '#4f46e5' },
        { value: 'gestionnaire', label: 'Gestionnaire', desc: 'Stocks et inventaires', icon: <Shield size={18} />, color: '#10b981' },
        { value: 'vendeur', label: 'Vendeur', desc: 'Interface de caisse/POS', icon: <UserIcon size={18} />, color: '#f59e0b' },
        { value: 'manager', label: 'Manager', desc: 'Rapports et statistiques', icon: <UserCircle size={18} />, color: '#8b5cf6' }
    ];

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: user.password,
                name: user.name,
                role: user.role
            });
        } else {
            setEditingUser(null);
            setFormData({ username: '', password: '', name: '', role: 'vendeur' });
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            updateUser(editingUser.id, formData);
        } else {
            addUser(formData);
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
            deleteUser(id);
        }
    };

    return (
        <div className="elite-user-management animate-fade-in">
            <div className="view-header-elite">
                <div className="header-info-box">
                    <div className="title-icon-main">
                        <UsersIcon size={28} />
                    </div>
                    <div>
                        <h2>Gestion de l'Équipe</h2>
                        <p>{users.length} collaborateurs enregistrés dans le système</p>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="search-bar-lite">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher un membre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary-elite" onClick={() => handleOpenModal()}>
                        <UserPlus size={20} />
                        <span>Nouveau Collaborateur</span>
                    </button>
                </div>
            </div>

            <div className="users-table-container card-premium">
                <div className="table-responsive">
                    <table className="elite-table-alt">
                        <thead>
                            <tr>
                                <th>COLLABORATEUR</th>
                                <th>IDENTIFIANTS</th>
                                <th>NIVEAU D'ACCÈS</th>
                                <th>LOGS D'ACTIVITÉ</th>
                                <th className="text-right">OPERATIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u, idx) => {
                                const roleObj = roles.find(r => r.value === u.role);
                                return (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <td>
                                            <div className="user-profile-cell">
                                                <div className="avatar-ring" style={{ borderColor: roleObj?.color }}>
                                                    <div className="user-avatar-initials" style={{ background: roleObj?.color }}>
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="user-meta">
                                                    <span className="u-name">{u.name}</span>
                                                    <span className="u-id">ID: {u.id.toString().slice(-6)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="u-credentials">
                                                <div className="cred-item">
                                                    <Mail size={12} />
                                                    <span>{u.username}</span>
                                                </div>
                                                <div className="cred-item">
                                                    <Lock size={12} />
                                                    <span>••••••••</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`role-pill-elite ${u.role}`}>
                                                {roleObj?.icon}
                                                <span>{roleObj?.label}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="status-indicator-lite">
                                                <CheckCircle2 size={14} className="success-icon" />
                                                <span>Session active</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="actions-cell-lite">
                                                <button
                                                    className="icon-btn edit"
                                                    onClick={() => handleOpenModal(u)}
                                                    title="Modifier"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                {u.username !== 'admin' && u.id !== currentUser?.id ? (
                                                    <button
                                                        className="icon-btn delete"
                                                        onClick={() => handleDelete(u.id)}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <button className="icon-btn disabled" title="Action restreinte">
                                                        <Lock size={14} />
                                                    </button>
                                                )}
                                                <button className="icon-btn more"><MoreVertical size={16} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="elite-modal-overlay">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="elite-user-modal card-premium"
                        >
                            <div className="modal-header-elite">
                                <div className="header-title-wrap">
                                    <div className="icon-badge">
                                        {editingUser ? <Edit3 size={24} /> : <UserPlus size={24} />}
                                    </div>
                                    <div>
                                        <h3>{editingUser ? 'Mise à jour du Compte' : 'Inscription Collaborateur'}</h3>
                                        <p>Remplissez les informations d'accès de l'agent</p>
                                    </div>
                                </div>
                                <button className="btn-close-elite" onClick={() => setShowModal(false)}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="elite-form-p">
                                <div className="form-main-content">
                                    <div className="form-column">
                                        <div className="p-input-field">
                                            <label>Identité du membre</label>
                                            <div className="p-input-box">
                                                <UserCircle size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Prénom & Nom"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="p-input-field">
                                            <label>Identifiant de connexion (Username)</label>
                                            <div className="p-input-box">
                                                <Mail size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="nom.utilisateur"
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="p-input-field">
                                            <label>Mot de passe</label>
                                            <div className="p-input-box">
                                                <Key size={18} />
                                                <input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-column">
                                        <label className="section-label">Rôle & Niveau de privilèges</label>
                                        <div className="roles-grid-selection">
                                            {roles.map(r => (
                                                <div
                                                    key={r.value}
                                                    className={`role-card-p ${formData.role === r.value ? 'selected' : ''}`}
                                                    onClick={() => setFormData({ ...formData, role: r.value })}
                                                >
                                                    <div className="role-icon-box" style={{ background: `${r.color}15`, color: r.color }}>
                                                        {r.icon}
                                                    </div>
                                                    <div className="role-text">
                                                        <span className="name">{r.label}</span>
                                                        <span className="desc">{r.desc}</span>
                                                    </div>
                                                    {formData.role === r.value && (
                                                        <div className="selected-check">
                                                            <CheckCircle2 size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer-p">
                                    <button type="button" className="btn-cancel-p" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn-submit-p">
                                        {editingUser ? 'Sauvegarder les modifications' : 'Finaliser le compte'}
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .elite-user-management { display: flex; flex-direction: column; gap: 32px; height: 100%; }
                
                .view-header-elite { display: flex; justify-content: space-between; align-items: center; }
                .header-info-box { display: flex; align-items: center; gap: 20px; }
                .title-icon-main { width: 64px; height: 64px; background: white; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
                .header-info-box h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }
                .header-info-box p { color: var(--text-muted); font-weight: 600; margin-top: 2px; }

                .header-actions { display: flex; align-items: center; gap: 16px; }
                .search-bar-lite { display: flex; align-items: center; background: white; padding: 10px 16px; border-radius: 14px; border: 1px solid var(--border); width: 280px; gap: 10px; }
                .search-bar-lite input { border: none; outline: none; font-weight: 600; font-size: 0.9rem; width: 100%; }
                .search-bar-lite svg { color: var(--text-muted); }

                .btn-primary-elite { display: flex; align-items: center; gap: 10px; padding: 14px 28px; background: var(--grad-primary); color: white; border-radius: 16px; font-weight: 800; box-shadow: 0 10px 25px var(--primary-glow); }

                .users-table-container { padding: 0; background: white; border-radius: 24px; border: 1px solid var(--border); }
                .elite-table-alt { width: 100%; border-collapse: separate; border-spacing: 0; }
                .elite-table-alt th { padding: 24px 32px; background: #fcfcfd; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid var(--border); }
                .elite-table-alt td { padding: 24px 32px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
                .elite-table-alt tr:last-child td { border-bottom: none; }

                .user-profile-cell { display: flex; align-items: center; gap: 16px; }
                .avatar-ring { padding: 3px; border: 2px solid transparent; border-radius: 16px; }
                .user-avatar-initials { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 1.2rem; }

                .user-meta { display: flex; flex-direction: column; }
                .u-name { font-weight: 800; color: var(--text-primary); font-size: 1rem; }
                .u-id { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; background: var(--bg-main); padding: 2px 6px; border-radius: 4px; width: fit-content; margin-top: 4px; }

                .u-credentials { display: flex; flex-direction: column; gap: 6px; }
                .cred-item { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 0.85rem; font-weight: 600; }
                .cred-item svg { color: var(--text-muted); }

                .role-pill-elite { display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 12px; font-size: 0.8rem; font-weight: 800; width: fit-content; }
                .role-pill-elite.admin { color: #4f46e5; background: #eeeffe; }
                .role-pill-elite.gestionnaire { color: #059669; background: #ecfdf5; }
                .role-pill-elite.vendeur { color: #d97706; background: #fffbeb; }
                .role-pill-elite.manager { color: #7c3aed; background: #f5f3ff; }

                .status-indicator-lite { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; color: #10b981; }
                .success-icon { color: #10b981; }

                .actions-cell-lite { display: flex; gap: 8px; justify-content: flex-end; }
                .icon-btn { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); background: white; color: var(--text-secondary); transition: all 0.2s; }
                .icon-btn:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
                .icon-btn.delete:hover { border-color: var(--danger); color: var(--danger); }
                .icon-btn.disabled { opacity: 0.3; cursor: not-allowed; background: var(--bg-main); color: var(--text-muted); }

                /* Elite Modal Styling */
                .elite-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 4000; padding: 20px; }
                .elite-user-modal { background: white; width: 100%; max-width: 900px; padding: 0; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.4); }
                
                .modal-header-elite { padding: 40px; background: white; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
                .header-title-wrap { display: flex; gap: 20px; align-items: center; }
                .icon-badge { width: 56px; height: 56px; background: var(--grad-primary); color: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
                .modal-header-elite h3 { font-size: 1.5rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px; }
                .modal-header-elite p { color: var(--text-muted); font-weight: 600; margin-top: 4px; }
                .btn-close-elite { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-main); display: flex; align-items: center; justify-content: center; color: var(--text-muted); }

                .elite-form-p { padding: 40px; }
                .form-main-content { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                .form-column { display: flex; flex-direction: column; gap: 24px; }
                
                .p-input-field label { display: block; font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 12px; }
                .section-label { font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 12px; display: block; }

                .p-input-box { display: flex; align-items: center; background: var(--bg-main); border: 2px solid transparent; border-radius: 16px; padding: 4px 16px; transition: all 0.2s; }
                .p-input-box:focus-within { border-color: var(--primary); background: white; box-shadow: 0 0 0 5px var(--primary-glow); }
                .p-input-box svg { color: var(--text-muted); margin-right: 12px; }
                .p-input-box input { border: none; background: transparent; padding: 12px 0; width: 100%; font-weight: 700; font-size: 1rem; color: var(--text-primary); }

                .roles-grid-selection { display: grid; grid-template-columns: 1fr; gap: 12px; }
                .role-card-p { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 20px; border: 2px solid var(--bg-main); cursor: pointer; transition: all 0.2s; position: relative; }
                .role-card-p:hover { border-color: var(--border); }
                .role-card-p.selected { border-color: var(--primary); background: #f5f3ff; }
                
                .role-icon-box { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .role-text { display: flex; flex-direction: column; }
                .role-text .name { font-weight: 800; font-size: 0.95rem; color: var(--text-primary); }
                .role-text .desc { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
                .selected-check { position: absolute; right: 16px; color: var(--primary); }

                .modal-footer-p { display: flex; justify-content: flex-end; gap: 16px; border-top: 1px solid var(--border); padding-top: 32px; }
                .btn-cancel-p { padding: 14px 28px; font-weight: 700; color: var(--text-secondary); border-radius: 16px; background: var(--bg-main); }
                .btn-submit-p { padding: 14px 32px; background: var(--grad-primary); color: white; border-radius: 16px; font-weight: 800; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px var(--primary-glow); }

                @media (max-width: 800px) {
                    .form-main-content { grid-template-columns: 1fr; }
                    .header-actions { flex-direction: column; align-items: stretch; }
                    .search-bar-lite { width: 100%; }
                }
            `}} />
        </div>
    );
};

export default UserManagementView;
