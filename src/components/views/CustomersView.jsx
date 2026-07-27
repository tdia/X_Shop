import React, { useMemo, useState } from 'react';
import {
    Users,
    Search,
    Phone,
    Mail,
    MapPin,
    ChevronRight,
    Filter,
    UserPlus,
    Edit,
    Trash2,
    X,
    CreditCard,
    History,
    ArrowLeft,
    Calendar,
    ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomersView = ({ sales, customers, addCustomer, updateCustomer, deleteCustomer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

    // Detail View State
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Merge customer database with sales activity
    const customerStats = useMemo(() => {
        const statsMap = {};

        if (customers && Array.isArray(customers)) {
            customers.forEach(c => {
                statsMap[`${c.phone}`] = {
                    ...c,
                    dbId: c.id,
                    totalSpent: 0,
                    totalOrders: 0,
                    totalDebt: 0,
                    lastPurchase: null,
                    isFromDB: true,
                    salesHistory: []
                };
            });
        }

        if (sales && Array.isArray(sales)) {
            sales.forEach(sale => {
                const phone = sale.customerPhone || 'N/A';
                const name = sale.customerName || 'Client Passager';

                const paid = sale.paidAmount || sale.total;
                const debt = sale.total - paid;

                if (!statsMap[phone]) {
                    statsMap[phone] = {
                        name,
                        phone,
                        totalSpent: 0,
                        totalOrders: 0,
                        totalDebt: 0,
                        lastPurchase: sale.timestamp,
                        isFromDB: false,
                        salesHistory: []
                    };
                }

                statsMap[phone].totalSpent += sale.total;
                statsMap[phone].totalOrders += 1;
                statsMap[phone].totalDebt += debt;
                statsMap[phone].salesHistory.push(sale);

                if (!statsMap[phone].lastPurchase || new Date(sale.timestamp) > new Date(statsMap[phone].lastPurchase)) {
                    statsMap[phone].lastPurchase = sale.timestamp;
                }
            });
        }

        return Object.values(statsMap).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [sales, customers]);

    const filteredCustomers = customerStats.filter(c => {
        const nameMatch = c.name ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        const phoneMatch = c.phone ? c.phone.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        const matchesSearch = nameMatch || phoneMatch;

        if (filter === 'debtor') return matchesSearch && c.totalDebt > 0;
        if (filter === 'regular') return matchesSearch && c.totalOrders > 5;
        return matchesSearch;
    });

    const totalDebt = customerStats.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
    const activeCustomers = customerStats.length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.dbId, formData);
            } else {
                await addCustomer(formData);
            }
            closeModal();
        } catch (err) {
            alert("Erreur lors de l'enregistrement");
        }
    };

    const openModal = (cust = null) => {
        if (cust && cust.isFromDB) {
            setEditingCustomer(cust);
            setFormData({ name: cust.name, phone: cust.phone || '', email: cust.email || '', address: cust.address || '' });
        } else if (cust && !cust.isFromDB) {
            setEditingCustomer(null);
            setFormData({ name: cust.name, phone: (cust.phone && cust.phone !== 'N/A') ? cust.phone : '', email: '', address: '' });
        } else {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', email: '', address: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({ name: '', phone: '', email: '', address: '' });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Supprimer définitivement ce client ?")) {
            await deleteCustomer(id);
        }
    };

    if (selectedCustomer) {
        return (
            <div className="customer-detail-view animate-fade-in">
                <button className="btn-back" onClick={() => setSelectedCustomer(null)}>
                    <ArrowLeft size={20} /> Retour à la liste
                </button>

                <div className="detail-header-card card-premium">
                    <div className="d-avatar">{selectedCustomer.name.charAt(0)}</div>
                    <div className="d-info">
                        <h2>{selectedCustomer.name}</h2>
                        <p><Phone size={14} /> {selectedCustomer.phone}</p>
                        <p><Mail size={14} /> {selectedCustomer.email || 'Pas d\'email'}</p>
                    </div>
                    <div className="d-stats">
                        <div className="s-pill">
                            <span>Total Achats</span>
                            <strong>{selectedCustomer.totalSpent.toLocaleString()} F</strong>
                        </div>
                        <div className="s-pill debt">
                            <span>Dette Actuelle</span>
                            <strong className={selectedCustomer.totalDebt > 0 ? 'text-danger' : ''}>{selectedCustomer.totalDebt.toLocaleString()} F</strong>
                        </div>
                    </div>
                </div>

                <div className="sales-history-section">
                    <h3><History size={20} /> Historique des Ventes</h3>
                    <div className="history-list">
                        {selectedCustomer.salesHistory.length > 0 ? (
                            selectedCustomer.salesHistory.map((sale, i) => (
                                <div key={i} className="history-item card-premium">
                                    <div className="h-date">
                                        <Calendar size={16} />
                                        <span>{new Date(sale.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <div className="h-items">
                                        <ShoppingBag size={16} />
                                        <span>{sale.items.length} articles</span>
                                    </div>
                                    <div className="h-amount">
                                        <strong>{sale.total.toLocaleString()} F</strong>
                                        <span className={`status-tag ${sale.paymentStatus}`}>{sale.paymentStatus}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-history">Aucune vente enregistrée pour ce client</div>
                        )}
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                .btn-back { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-muted); margin-bottom: 24px; }
                .detail-header-card { display: flex; align-items: center; gap: 32px; padding: 40px; border-radius: 32px; }
                .d-avatar { width: 80px; height: 80px; background: var(--grad-primary); color: white; border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 900; }
                .d-info h2 { font-size: 2rem; font-weight: 900; letter-spacing: -1px; }
                .d-info p { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-weight: 600; margin-top: 4px; }
                .d-stats { display: flex; gap: 20px; margin-left: auto; }
                .s-pill { background: var(--bg-main); padding: 16px 24px; border-radius: 20px; text-align: center; display: flex; flex-direction: column; min-width: 150px; }
                .s-pill span { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
                .s-pill strong { font-size: 1.25rem; font-weight: 900; margin-top: 4px; }
                .sales-history-section { margin-top: 40px; }
                .sales-history-section h3 { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; font-weight: 800; }
                .history-list { display: flex; flex-direction: column; gap: 12px; }
                .history-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-radius: 18px; }
                .h-date, .h-items { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); font-weight: 600; font-size: 0.9rem; }
                .h-amount { text-align: right; display: flex; flex-direction: column; gap: 4px; }
                .status-tag { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; }
                .status-tag.paid { background: #d1fae5; color: #059669; }
                .status-tag.partial { background: #fef3c7; color: #d97706; }
            `}} />
            </div>
        );
    }

    return (
        <div className="customers-view animate-fade-in">
            <div className="customers-header">
                <div className="header-main">
                    <h2>Portefeuille Clients</h2>
                    <p>Base de données relationnelle et suivi financier</p>
                </div>

                <div className="header-actions-c">
                    <div className="header-stats-c">
                        <div className="card-mini-stat">
                            <span className="label">Engagements Globaux</span>
                            <span className="value text-danger">{totalDebt.toLocaleString()} F</span>
                        </div>
                    </div>
                    <button className="btn-glow-alt" onClick={() => openModal()}>
                        <UserPlus size={18} /> Nouveau Client
                    </button>
                </div>
            </div>

            <div className="customers-controls">
                <div className="search-box-premium">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Nom ou téléphone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-pills-wrap">
                    <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tous</button>
                    <button className={`filter-pill ${filter === 'debtor' ? 'active' : ''}`} onClick={() => setFilter('debtor')}>Débiteurs</button>
                    <button className={`filter-pill ${filter === 'regular' ? 'active' : ''}`} onClick={() => setFilter('regular')}>Fidèles</button>
                </div>
            </div>

            <div className="customers-grid">
                <AnimatePresence>
                    {filteredCustomers.map((customer, idx) => (
                        <motion.div
                            key={customer.phone}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="customer-card card-premium"
                            onClick={() => setSelectedCustomer(customer)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-top">
                                <div className="avatar-placeholder">{customer.name.charAt(0)}</div>
                                <div className="top-info">
                                    <h3>{customer.name}</h3>
                                    <div className="contact-line"><Phone size={14} /> {customer.phone}</div>
                                </div>
                                <div className="card-ctrl-btns">
                                    {customer.isFromDB && (
                                        <button className="btn-icon-tiny edit" onClick={(e) => { e.stopPropagation(); openModal(customer); }}><Edit size={14} /></button>
                                    )}
                                    {!customer.isFromDB && (
                                        <button className="btn-icon-tiny save" onClick={(e) => { e.stopPropagation(); openModal(customer); }}><UserPlus size={14} /> Fixer</button>
                                    )}
                                </div>
                            </div>

                            <div className="card-stats-grid">
                                <div className="stat-box">
                                    <span className="s-label">Consommation</span>
                                    <span className="s-value">{customer.totalSpent.toLocaleString()} F</span>
                                </div>
                                <div className="stat-box">
                                    <span className="s-label">Créance</span>
                                    <span className={`s-value ${customer.totalDebt > 0 ? 'text-danger' : 'text-success'}`}>{customer.totalDebt.toLocaleString()} F</span>
                                </div>
                            </div>

                            <div className="card-footer-p">
                                <span className="last-seen">Dernier passage : {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A'}</span>
                                <ChevronRight size={18} className="chevron" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="elite-modal-overlay">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="customer-modal card-premium">
                            <div className="modal-head-p">
                                <h3>{editingCustomer ? 'Modifier Fiche' : 'Nouveau Dossier'}</h3>
                                <button onClick={closeModal}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="customer-form">
                                <div className="form-grid-p">
                                    <div className="input-field-p">
                                        <label>Nom Complet</label>
                                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="input-field-p">
                                        <label>Téléphone</label>
                                        <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="input-field-p">
                                        <label>Email</label>
                                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="input-field-p">
                                        <label>Adresse</label>
                                        <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="btn-confirm-elite w-full">Enregistrer</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
        .customers-view { display: flex; flex-direction: column; gap: 32px; }
        .customers-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .header-main h2 { font-size: 2.25rem; font-weight: 900; letter-spacing: -1.5px; }
        .header-main p { color: var(--text-muted); font-weight: 600; }
        .card-mini-stat { background: white; padding: 12px 24px; border-radius: 18px; border: 1px solid var(--border); }
        .card-mini-stat .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .card-mini-stat .value { font-size: 1.25rem; font-weight: 900; margin-top: 4px; display: block; }
        
        .customers-controls { display: flex; justify-content: space-between; gap: 24px; }
        .search-box-premium { flex: 1; display: flex; background: white; padding: 12px 24px; border-radius: 20px; border: 1px solid var(--border); }
        .search-box-premium input { border: none; margin-left: 14px; width: 100%; font-weight: 600; }
        
        .filter-pills-wrap { display: flex; background: #f1f5f9; padding: 5px; border-radius: 14px; gap: 4px; }
        .filter-pill { padding: 8px 18px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; color: var(--text-muted); }
        .filter-pill.active { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }

        .customers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .customer-card { padding: 24px; border-radius: 24px; transition: all 0.2s; border: 1px solid transparent; }
        .customer-card:hover { transform: translateY(-5px); border-color: var(--primary-light); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        
        .card-top { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .avatar-placeholder { width: 50px; height: 50px; background: var(--grad-primary); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 900; }
        .top-info h3 { font-size: 1.1rem; font-weight: 800; }
        .contact-line { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; }
        
        .card-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .stat-box { background: var(--bg-main); padding: 12px; border-radius: 14px; }
        .s-label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .s-value { font-size: 0.95rem; font-weight: 900; display: block; margin-top: 4px; }

        .card-footer-p { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--border); }
        .last-seen { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
        .chevron { opacity: 0.3; }

        .elite-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; items: center; justify-content: center; z-index: 2000; }
        .customer-modal { width: 400px; padding: 32px; border-radius: 24px; }
        .modal-head-p { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .input-field-p { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .input-field-p label { font-size: 0.8rem; font-weight: 800; color: var(--text-muted); }
        .input-field-p input { padding: 12px; border-radius: 10px; border: 1px solid var(--border); font-weight: 600; }
      `}} />
        </div>
    );
};

export default CustomersView;
