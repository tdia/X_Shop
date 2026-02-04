const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = {
    // Auth
    login: async (username, password) => {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Identifiants invalides');
        return res.json();
    },

    // Users
    getUsers: () => fetch(`${API_URL}/users`).then(res => res.json()),
    addUser: (user) => fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    }).then(res => res.json()),
    updateUser: (id, user) => fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    }).then(res => res.json()),
    deleteUser: (id) => fetch(`${API_URL}/users/${id}`, { method: 'DELETE' }).then(res => res.json()),

    // Products
    getProducts: () => fetch(`${API_URL}/products`).then(res => res.json()),
    addProduct: (product) => fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    }).then(res => res.json()),
    updateProduct: (id, product) => fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    }).then(res => res.json()),
    deleteProduct: (id) => fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }).then(res => res.json()),

    // Sales
    getSales: () => fetch(`${API_URL}/sales`).then(res => res.json()),
    addSale: (saleData) => fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
    }).then(res => res.json())
};

export default api;
