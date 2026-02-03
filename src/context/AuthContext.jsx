import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('xshop_users');
        return saved ? JSON.parse(saved) : [
            { id: 1, username: 'admin', password: 'password', role: 'admin', name: 'Administrateur Principal' }
        ];
    });

    useEffect(() => {
        localStorage.setItem('xshop_users', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        const savedSession = localStorage.getItem('xshop_session');
        if (savedSession) {
            setUser(JSON.parse(savedSession));
        }
    }, []);

    const login = (username, password) => {
        const foundUser = users.find(u => u.username === username && u.password === password);
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('xshop_session', JSON.stringify(foundUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('xshop_session');
    };

    const addUser = (userData) => {
        const newUser = { ...userData, id: Date.now() };
        setUsers([...users, newUser]);
    };

    const updateUser = (id, userData) => {
        setUsers(users.map(u => u.id === id ? { ...u, ...userData } : u));
        if (user && user.id === id) {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            localStorage.setItem('xshop_session', JSON.stringify(updatedUser));
        }
    };

    const deleteUser = (id) => {
        setUsers(users.filter(u => u.id !== id));
    };

    return (
        <AuthContext.Provider value={{ user, users, login, logout, addUser, updateUser, deleteUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
