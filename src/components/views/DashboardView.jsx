import React, { useMemo } from 'react';
import {
    TrendingUp,
    Users,
    Package,
    DollarSign,
    ArrowUpRight,
    ShoppingCart,
    Calendar,
    ShoppingBag,
    Hash
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';

const DashboardView = ({ sales, products }) => {
    // Calculs réels basés sur les données
    const totalRevenue = useMemo(() => sales.reduce((acc, sale) => acc + sale.total, 0), [sales]);
    const totalSalesCount = sales.length;
    const totalItemsSold = useMemo(() =>
        sales.reduce((acc, sale) => acc + sale.items.reduce((sum, item) => sum + item.quantity, 0), 0)
        , [sales]);
    const lowStockCount = products.filter(p => p.stock < 10).length;

    // Formattage FCFA
    const formatCFA = (value) => {
        return new Intl.NumberFormat('fr-FR').format(value) + ' F CFA';
    };

    const chartData = useMemo(() => {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = days[date.getDay()];

            const daySales = sales.filter(s => s.timestamp.startsWith(dateStr));
            const total = daySales.reduce((acc, s) => acc + s.total, 0);

            data.push({ name: dayName, sales: total });
        }
        return data;
    }, [sales]);

    const stats = [
        { label: 'Chiffre d\'Affaires', value: formatCFA(totalRevenue), icon: DollarSign, color: '#4f46e5' },
        { label: 'Total des Ventes', value: totalSalesCount, icon: ShoppingCart, color: '#06b6d4' },
        { label: 'Articles Vendus', value: totalItemsSold, icon: ShoppingBag, color: '#10b981' },
        { label: 'Alerte Stock', value: lowStockCount, icon: Package, color: '#f43f5e' },
    ];

    return (
        <div className="dash-view-light animate-fade-in">
            <div className="stats-row">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="card-premium stat-item"
                        >
                            <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                                <Icon size={24} />
                            </div>
                            <div className="stat-data">
                                <span className="label text-muted">{stat.label}</span>
                                <h3 className="value">{stat.value}</h3>
                            </div>
                            <div className="trend-badge-light up">
                                <ArrowUpRight size={14} /> 100%
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="charts-row">
                <div className="card-premium chart-container-light main-chart">
                    <div className="chart-head">
                        <h3>Evolution des Ventes (FCFA)</h3>
                        <div className="period-selector">
                            <Calendar size={16} /> 7 derniers jours
                        </div>
                    </div>
                    <div className="chart-content">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => formatCFA(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#primaryGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="side-stats-stack">
                    <div className="card-premium mini-card">
                        <div className="mini-head">
                            <Hash size={18} />
                            <h4>Articles en Stock</h4>
                        </div>
                        <div className="mini-body">
                            <h2 className="gradient-text">{products.reduce((acc, p) => acc + p.stock, 0)}</h2>
                            <p>Unités totales</p>
                        </div>
                    </div>
                    <div className="card-premium mini-card">
                        <div className="mini-head">
                            <TrendingUp size={18} />
                            <h4>Performance</h4>
                        </div>
                        <div className="mini-body">
                            <h2 style={{ color: '#10b981' }}>Excellent</h2>
                            <p>Statut global</p>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .dash-view-light {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-data {
          display: flex;
          flex-direction: column;
        }

        .stat-data .label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .stat-data .value { font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-top: 2px; }

        .trend-badge-light {
          position: absolute;
          top: 24px;
          right: 24px;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .trend-badge-light.up { background: #d1fae5; color: #059669; }

        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .chart-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .chart-head h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .period-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-main);
          padding: 6px 12px;
          border-radius: 10px;
        }

        .side-stats-stack {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .mini-card {
            padding: 32px;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .mini-head {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            color: var(--text-muted);
            font-weight: 700;
        }

        .mini-body h2 {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 4px;
        }

        .mini-body p {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-muted);
        }

        @media (max-width: 1200px) {
          .charts-row { grid-template-columns: 1fr; }
        }
      `}} />
        </div>
    );
};

export default DashboardView;
