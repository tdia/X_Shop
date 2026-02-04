import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ShoppingCart,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Receipt from '../Receipt';

const POSView = ({ products, addSale }) => {
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [recentSale, setRecentSale] = useState(null);

  const categories = ['Tous', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p =>
    (filter === 'Tous' || p.category === filter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const sale = await addSale(cart);
    if (sale) {
      setRecentSale(sale);
      setCart([]);
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
                  <p className="item-p">{new Intl.NumberFormat('fr-FR').format(item.price)} F CFA</p>
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
          <div className="check-row">
            <span>Sous-total</span>
            <span>{new Intl.NumberFormat('fr-FR').format(cartTotal)} F CFA</span>
          </div>
          <div className="check-row total">
            <span>Total TTC</span>
            <span className="gradient-text">{new Intl.NumberFormat('fr-FR').format(cartTotal)} F CFA</span>
          </div>

          <div className="pay-methods">
            <button className="pay-btn active"><Banknote size={16} /> Cash</button>
            <button className="pay-btn"><CreditCard size={16} /> Carte</button>
          </div>

          <button
            className="btn-glow checkout-action"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            CONFIRMER LA VENTE <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .pos-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
          height: calc(100vh - 180px);
        }

        .pos-main-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
          overflow: hidden;
        }

        .pos-nav-glass {
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 16px 24px;
        }

        .search-pill {
          display: flex;
          align-items: center;
          background: var(--bg-main);
          padding: 8px 16px;
          border-radius: 12px;
          width: 280px;
          border: 1px solid #e2e8f0;
        }

        .search-pill input { border: none; background: transparent; margin-left: 12px; width: 100%; font-weight: 500; }

        .cat-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .cat-pill {
          white-space: nowrap;
          padding: 8px 20px;
          border-radius: 12px;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid #e2e8f0;
        }

        .cat-pill.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 10px var(--primary-glow);
        }

        .pos-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .pos-item-card {
          background: white;
          border-radius: 20px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.3s;
        }

        .pos-item-card.disabled { opacity: 0.5; filter: grayscale(1); cursor: not-allowed; }

        .item-img-box {
          height: 120px;
          background: var(--bg-main);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          margin-bottom: 12px;
          overflow: hidden;
        }

        .product-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-item-id {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .item-name { font-weight: 700; margin-bottom: 8px; font-size: 1rem; }
        .item-price-tag { display: flex; justify-content: space-between; align-items: center; }
        .item-price-tag span { font-weight: 800; color: var(--primary); }
        .stock-indicator { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; background: #d1fae5; color: #059669; border-radius: 6px; }
        .stock-indicator.low { background: #fee2e2; color: #dc2626; }

        .pos-cart-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 32px;
        }

        .cart-title { display: flex; align-items: center; gap: 12px; }
        .cart-icon { width: 40px; height: 40px; background: var(--grad-primary); border-radius: 12px; color: white; display: flex; align-items: center; justify-content: center; }
        .cart-tag { background: var(--bg-main); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }

        .cart-scroller { flex: 1; overflow-y: auto; margin: 32px 0; display: flex; flex-direction: column; gap: 16px; }

        .cart-row { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
        .cart-item-mid { flex: 1; }
        .item-n { font-weight: 700; font-size: 0.95rem; }
        .item-p { color: var(--text-muted); font-size: 0.85rem; }

        .cart-item-ctrl { display: flex; align-items: center; gap: 12px; background: var(--bg-main); padding: 6px; border-radius: 10px; }
        .cart-item-ctrl button { width: 24px; height: 24px; border-radius: 6px; background: white; display: flex; align-items: center; justify-content: center; }

        .cart-checkout { border-top: 1px dashed #e2e8f0; padding-top: 24px; }
        .check-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 600; color: var(--text-secondary); }
        .check-row.total { font-size: 1.5rem; color: var(--text-primary); margin-bottom: 24px; }

        .pay-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .pay-btn { padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 8px; }
        .pay-btn.active { border-color: var(--primary); color: var(--primary); background: #f5f3ff; }

        .checkout-action { width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px; }

        @media (max-width: 1400px) {
          .pos-layout { grid-template-columns: 1fr; height: auto; }
          .pos-cart-panel { height: 600px; }
        }
      `}} />
    </div>
  );
};

export default POSView;
