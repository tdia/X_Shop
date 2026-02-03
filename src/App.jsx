import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/views/DashboardView';
import POSView from './components/views/POSView';
import InventoryView from './components/views/InventoryView';
import ReportsView from './components/views/ReportsView';
import LoginView from './components/views/LoginView';
import UserManagementView from './components/views/UserManagementView';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const MOCK_PRODUCTS = [
  { id: 1, name: 'Canapé Scandinave', category: 'Salon', price: 350000, stock: 5, image: '🛋️', createdAt: '2024-02-01' },
  { id: 2, name: 'Table Basse Bois', category: 'Salon', price: 75000, stock: 12, image: '🪵', createdAt: '2024-02-01' },
  { id: 3, name: 'Lit Double Premium', category: 'Chambre', price: 550000, stock: 3, image: '🛏️', createdAt: '2024-02-02' },
  { id: 4, name: 'Bureau de Travail', category: 'Bureau', price: 145000, stock: 8, image: '🖥️', createdAt: '2024-02-02' },
  { id: 5, name: 'Armoire 3 Portes', category: 'Chambre', price: 275000, stock: 4, image: '👗', createdAt: '2024-02-03' },
  { id: 6, name: 'Fauteuil Relax', category: 'Salon', price: 185000, stock: 6, image: '🪑', createdAt: '2024-02-03' },
  { id: 7, name: 'Buffet Moderne', category: 'Salle à manger', price: 220000, stock: 2, image: '🍽️', createdAt: '2024-02-04' },
  { id: 8, name: 'Lampe de Salon', category: 'Déco', price: 45000, stock: 20, image: '💡', createdAt: '2024-02-04' },
];

function AppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const savedProducts = localStorage.getItem('xshop_products');
    const savedSales = localStorage.getItem('xshop_sales');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSales) setSales(JSON.parse(savedSales));
  }, []);

  useEffect(() => {
    localStorage.setItem('xshop_products', JSON.stringify(products));
    localStorage.setItem('xshop_sales', JSON.stringify(sales));
  }, [products, sales]);

  // Adjust view if current restricted
  useEffect(() => {
    if (!user) return;
    const restrictedViews = {
      vendeur: ['dashboard', 'inventory', 'reports', 'users'],
      manager: ['pos', 'inventory', 'users'],
      gestionnaire: ['users']
    };

    if (restrictedViews[user.role]?.includes(currentView)) {
      if (user.role === 'vendeur') setCurrentView('pos');
      else if (user.role === 'manager') setCurrentView('reports');
      else setCurrentView('dashboard');
    }
  }, [user, currentView]);

  if (!user) {
    return <LoginView />;
  }

  const addSale = (cartItems) => {
    const newSale = {
      id: Math.floor(100000 + Math.random() * 900000),
      items: cartItems,
      total: cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      timestamp: new Date().toISOString(),
    };

    setSales([...sales, newSale]);

    const updatedProducts = products.map(p => {
      const cartItem = cartItems.find(item => item.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });
    setProducts(updatedProducts);
    return newSale; // Return to trigger receipt print
  };

  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      stock: parseInt(productData.stock)
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id, updatedData) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateStock = (productId, newStock) => {
    setProducts(products.map(p => p.id === productId ? { ...p, stock: parseInt(newStock) || 0 } : p));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView sales={sales} products={products} />;
      case 'pos':
        return <POSView products={products} addSale={addSale} />;
      case 'inventory':
        return (
          <InventoryView
            products={products}
            updateStock={updateStock}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            canEdit={['admin', 'gestionnaire'].includes(user.role)}
          />
        );
      case 'reports':
        return <ReportsView sales={sales} />;
      case 'users':
        return <UserManagementView />;
      default:
        return <DashboardView sales={sales} products={products} />;
    }
  };

  return (
    <div className="x-app-wrapper">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <div className="x-main-canvas">
        <Header currentView={currentView} />
        <main className="x-view-portal">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
