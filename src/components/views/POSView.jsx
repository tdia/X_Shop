import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ShoppingCart,
  Search,
  ChevronRight,
  UserPlus,
  Wallet,
  Clock,
  User,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Receipt from '../Receipt';

const POSView = ({ products, customers, addSale, addCustomer }) => {
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [recentSale, setRecentSale] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [paidAmount, setPaidAmount] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

  const categories = ['Tous', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p =>
    (filter === 'Tous' || p.category === filter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const customerSuggestions = customers.filter(c =>
    c.name.toLowerCase().includes(customerInfo.name.toLowerCase()) ||
    c.phone.includes(customerInfo.name)
  ).slice(0, 5);

  const selectCustomer = (c) => {
    setCustomerInfo({ name: c.name, phone: c.phone });
    setShowSuggestions(false);
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const prod = products.find(p => p.id === id);
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > prod.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updatePrice = (id, newPrice) => {
    setCart(cart.map(item =>
      item.id === id ? { ...item, price: newPrice } : item
    ));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const actualPaid = isPartial ? (parseFloat(paidAmount) || 0) : cartTotal;
    const status = actualPaid >= cartTotal ? 'paid' : actualPaid > 0 ? 'partial' : 'pending';

    const sale = await addSale(cart, {
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      paidAmount: actualPaid,
      paymentStatus: status
    });

    if (sale) {
      setRecentSale(sale);
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
      setPaidAmount('');
      setIsPartial(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      if (!newCustomer.name || !newCustomer.phone) {
        alert("Nom et téléphone sont obligatoires");
        return;
      }
      await addCustomer(newCustomer);
      setCustomerInfo({ name: newCustomer.name, phone: newCustomer.phone });
      setShowCreateModal(false);
      setNewCustomer({ name: '', phone: '', address: '' });
    } catch (error) {
      alert("Erreur lors de la création du client");
    }
  };

  return (
    <div className="pos-layout animate-fade-in">
      {recentSale && <Receipt sale={recentSale} onClose={() => setRecentSale(null)} />}

      <div className="pos-main-content">
        <div className="pos-nav-glass card-premium">
          <div className="search-pill">
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="cat-scroll">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-pill ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="pos-items-grid">
          {filteredProducts.map(product => (
            <motion.div
              layout
              key={product.id}
              className={`pos-item-card ${product.stock <= 0 ? 'disabled' : ''}`}
              onClick={() => addToCart(product)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="item-img-box">
                {product.photo ? (
                  <img src={product.photo} alt={product.name} className="product-photo-img" />
                ) : (
                  product.image
                )}
              </div>
              <div className="item-details">
                <h4 className="item-name">{product.name}</h4>
                <div className="item-price-tag">
                  <span>{new Intl.NumberFormat('fr-FR').format(product.price)} F CFA</span>
                  <div className={`stock-indicator ${product.stock < 5 ? 'low' : ''}`}>
                    {product.stock}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pos-cart-panel card-premium">
        <div className="cart-top">
          <div className="cart-title">
            <div className="cart-icon"><ShoppingCart size={20} /></div>
            <h3>Panier actuel</h3>
          </div>
          <span className="cart-tag">{cart.length} articles</span>
        </div>

        <div className="cart-scroller">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div
                key={item.id}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                className="cart-row"
              >
                <div className="cart-item-id">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="product-photo-img" />
                  ) : (
                    <span>{item.image}</span>
                  )}
                </div>
                <div className="cart-item-mid">
                  <p className="item-n">{item.name}</p>
                  <div className="item-p-editable">
                    <div className="price-input-wrapper">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                        className="price-edit-input"
                      />
                      <span className="currency-label">FCFA</span>
                    </div>
                  </div>
                </div>
                <div className="cart-item-ctrl">
                  <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="empty-cart-state">
              <ShoppingCart size={40} />
              <p>Le panier est vide</p>
            </div>
          )}
        </div>

        <div className="cart-checkout">
          <div className="pos-section-title">
            <div className="flex-between w-full">
              <div className="flex gap-1">
                <UserPlus size={16} />
                <span>Client (Recherche par nom/tel)</span>
              </div>
              <button
                className="btn-create-c-pos"
                onClick={() => setShowCreateModal(true)}
                title="Nouveau Client"
              >
                <Plus size={14} /> Nouveau
              </button>
            </div>
          </div>

          <div className="customer-details-pos" style={{ position: 'relative' }}>
            <div className="input-group-pos">
              <input
                type="text"
                placeholder="Nom ou téléphone..."
                value={customerInfo.name}
                onChange={(e) => {
                  setCustomerInfo({ ...customerInfo, name: e.target.value });
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pos-input-p"
              />
              <AnimatePresence>
                {showSuggestions && customerInfo.name && customerSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="suggestions-dropdown"
                  >
                    {customerSuggestions.map(c => (
                      <div key={c.id} className="suggestion-item" onClick={() => selectCustomer(c)}>
                        <User size={14} />
                        <div className="s-info">
                          <span className="s-name">{c.name}</span>
                          <span className="s-phone">{c.phone}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="input-group-pos" style={{ marginTop: '8px' }}>
              <input
                type="text"
                placeholder="Téléphone (Auto)"
                value={customerInfo.phone}
                readOnly
                className="pos-input-p read-only"
              />
            </div>
          </div>

          <div className="pos-section-title" style={{ marginTop: '24px' }}>
            <Wallet size={16} />
            <span>Mode de Règlement</span>
          </div>

          <div className="pay-methods-grid">
            <button
              className={`pay-option-card ${!isPartial ? 'active' : ''}`}
              onClick={() => setIsPartial(false)}
            >
              <Banknote size={20} />
              <div>
                <span className="p-opt-title">Complet</span>
                <span className="p-opt-desc">Total Cash</span>
              </div>
            </button>
            <button
              className={`pay-option-card ${isPartial ? 'active' : ''}`}
              onClick={() => setIsPartial(true)}
            >
              <Clock size={20} />
              <div>
                <span className="p-opt-title">Acrédit</span>
                <span className="p-opt-desc">Versement partiel</span>
              </div>
            </button>
          </div>

          {isPartial && (
            <div className="partial-details-box">
              <label>Premier versement (F CFA)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="pos-input-p highlight"
              />
            </div>
          )}

          <div className="checkout-summary-final">
            <div className="check-row total">
              <span>TOTAL</span>
              <span className="grand-total">{new Intl.NumberFormat('fr-FR').format(cartTotal)} F</span>
            </div>
          </div>

          <button
            className="btn-confirm-pos checkout-action"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            VALIDER LA VENTE <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="elite-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="customer-modal-pos card-premium"
            >
              <div className="modal-head-p">
                <div className="flex gap-2 items-center">
                  <div className="icon-box-c"><UserPlus size={20} /></div>
                  <h3>Nouveau Client</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="btn-close-p"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateCustomer} className="customer-form-pos">
                <div className="form-grid-pos">
                  <div className="input-field-p">
                    <label>Nom Complet</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Ex: Jean Dupont"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    />
                  </div>
                  <div className="input-field-p">
                    <label>Téléphone</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 77 000 00 00"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                  </div>
                  <div className="input-field-p">
                    <label>Adresse (Optionnel)</label>
                    <input
                      type="text"
                      placeholder="Ex: Dakar, Plateau"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer-pos">
                  <button type="button" className="btn-cancel-p" onClick={() => setShowCreateModal(false)}>Annuler</button>
                  <button type="submit" className="btn-confirm-pos-mini">Créer et Sélectionner</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .pos-layout { display: grid; grid-template-columns: 1fr 400px; gap: 24px; height: calc(100vh - 180px); }
        .pos-main-content { display: flex; flex-direction: column; gap: 24px; overflow: hidden; }
        .pos-nav-glass { display: flex; align-items: center; gap: 32px; padding: 16px 24px; }
        .search-pill { display: flex; align-items: center; background: var(--bg-main); padding: 8px 16px; border-radius: 12px; width: 280px; border: 1px solid #e2e8f0; }
        .search-pill input { border: none; background: transparent; margin-left: 12px; width: 100%; font-weight: 500; }
        .cat-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; }
        .cat-pill { white-space: nowrap; padding: 8px 20px; border-radius: 12px; font-weight: 700; border: 1px solid #e2e8f0; }
        .cat-pill.active { background: var(--primary); color: white; border-color: var(--primary); }
        
        .pos-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; overflow-y: auto; padding-right: 8px; }
        .pos-item-card { background: white; border-radius: 20px; padding: 16px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.3s; }
        .pos-item-card.disabled { opacity: 0.5; filter: grayscale(1); cursor: not-allowed; }
        .item-img-box { height: 120px; background: var(--bg-main); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin-bottom: 12px; overflow: hidden; }
        .product-photo-img { width: 100%; height: 100%; object-fit: cover; }
        .item-name { font-weight: 700; margin-bottom: 8px; font-size: 0.95rem; }
        .item-price-tag { display: flex; justify-content: space-between; align-items: center; }
        .item-price-tag span { font-weight: 800; color: var(--primary); }
        .stock-indicator { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; background: #d1fae5; color: #059669; border-radius: 6px; }

        .pos-cart-panel { height: 100%; display: flex; flex-direction: column; padding: 32px; }
        .cart-icon { width: 40px; height: 40px; background: var(--grad-primary); border-radius: 12px; color: white; display: flex; align-items: center; justify-content: center; }
        .cart-tag { background: var(--bg-main); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }
        .cart-scroller { flex: 1; overflow-y: auto; margin: 32px 0; display: flex; flex-direction: column; gap: 16px; }
        .cart-row { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
        .cart-item-id { width: 48px; height: 48px; border-radius: 10px; background: var(--bg-main); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
        .item-n { font-weight: 700; font-size: 0.9rem; }
        
        .price-edit-input { width: 100px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 800; font-size: 0.9rem; }
        .currency-label { font-size: 0.7rem; font-weight: 700; margin-left: 4px; }
        
        .cart-item-ctrl { display: flex; align-items: center; gap: 12px; background: var(--bg-main); padding: 6px; border-radius: 10px; }
        .cart-item-ctrl button { width: 24px; height: 24px; border-radius: 6px; background: white; display: flex; align-items: center; justify-content: center; }

        .pos-section-title { display: flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; }
        .pos-input-p { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.9rem; font-weight: 600; }
        .pos-input-p.read-only { background: #f1f5f9; color: #94a3b8; }
        .pos-input-p.highlight { border-color: var(--primary); background: #f5f3ff; color: var(--primary); font-size: 1.1rem; }

        .suggestions-dropdown { position: absolute; bottom: 100%; left: 0; width: 100%; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid var(--border); overflow: hidden; z-index: 100; margin-bottom: 10px; }
        .suggestion-item { padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; }
        .suggestion-item:hover { background: var(--bg-main); }
        .s-info { display: flex; flex-direction: column; }
        .s-name { font-weight: 700; font-size: 0.9rem; }
        .s-phone { font-size: 0.75rem; color: var(--text-muted); }

        .pay-methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .pay-option-card { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 16px; border: 2px solid #f1f5f9; background: white; cursor: pointer; transition: all 0.2s; text-align: left; }
        .pay-option-card.active { border-color: var(--primary); background: #f5f3ff; }
        .p-opt-title { display: block; font-weight: 800; font-size: 0.85rem; }
        .p-opt-desc { display: block; font-size: 0.7rem; color: var(--text-muted); }

        .partial-details-box { background: #fffcf0; padding: 16px; border-radius: 16px; border: 1px dashed #fcd34d; margin-bottom: 24px; }
        .partial-details-box label { font-size: 0.7rem; font-weight: 800; color: #d97706; display: block; margin-bottom: 8px; }

        .checkout-summary-final { margin-bottom: 24px; }
        .check-row.total { border-top: 2px solid #f1f5f9; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; }
        .grand-total { font-size: 1.8rem; font-weight: 900; color: var(--primary); }

        .btn-confirm-pos { width: 100%; padding: 16px; background: var(--grad-primary); color: white; border-radius: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 10px 20px var(--primary-glow); }
        
        /* New Styles for Client Creation */
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .btn-create-c-pos { display: flex; align-items: center; gap: 4px; padding: 4px 10px; background: #eef2ff; color: var(--primary); border-radius: 8px; font-size: 0.65rem; font-weight: 900; transition: all 0.2s; }
        .btn-create-c-pos:hover { background: var(--primary); color: white; }
        
        .elite-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
        .customer-modal-pos { width: 100%; max-width: 450px; padding: 32px; border-radius: 28px; background: white; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .modal-head-p { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .modal-head-p h3 { font-size: 1.25rem; font-weight: 900; color: #1e293b; }
        .icon-box-c { width: 40px; height: 40px; background: #f0fdf4; color: #16a34a; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .btn-close-p { padding: 8px; border-radius: 50%; color: #94a3b8; transition: all 0.2s; }
        .btn-close-p:hover { background: #f1f5f9; color: #1e293b; }
        
        .form-grid-pos { display: flex; flex-direction: column; gap: 16px; }
        .input-field-p { display: flex; flex-direction: column; gap: 6px; }
        .input-field-p label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .input-field-p input { padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-weight: 600; font-size: 0.95rem; transition: all 0.2s; }
        .input-field-p input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        
        .modal-footer-pos { display: flex; gap: 12px; margin-top: 32px; }
        .btn-cancel-p { flex: 1; padding: 12px; border-radius: 12px; font-weight: 700; color: #64748b; background: #f8fafc; transition: all 0.2s; }
        .btn-cancel-p:hover { background: #f1f5f9; }
        .btn-confirm-pos-mini { flex: 2; padding: 12px; border-radius: 12px; font-weight: 800; color: white; background: var(--grad-primary); box-shadow: 0 4px 12px var(--primary-glow); }
        
        @media (max-width: 1400px) { .pos-layout { grid-template-columns: 1fr; height: auto; } .pos-cart-panel { height: 600px; } }
      `}} />
    </div>
  );
};

export default POSView;
