import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Sale from './models/Sale.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username, password } });
        if (user) {
            res.json(user);
        } else {
            res.status(401).json({ message: 'Identifiants invalides' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User Management
app.get('/api/users', async (req, res) => {
    const users = await User.findAll();
    res.json(users);
});

app.post('/api/users', async (req, res) => {
    const user = await User.create(req.body);
    res.json(user);
});

app.put('/api/users/:id', async (req, res) => {
    await User.update(req.body, { where: { id: req.params.id } });
    const updated = await User.findByPk(req.params.id);
    res.json(updated);
});

app.delete('/api/users/:id', async (req, res) => {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
});

// Product Management
app.get('/api/products', async (req, res) => {
    const products = await Product.findAll();
    res.json(products);
});

app.post('/api/products', async (req, res) => {
    const product = await Product.create(req.body);
    res.json(product);
});

app.put('/api/products/:id', async (req, res) => {
    await Product.update(req.body, { where: { id: req.params.id } });
    const updated = await Product.findByPk(req.params.id);
    res.json(updated);
});

app.delete('/api/products/:id', async (req, res) => {
    await Product.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
});

// Sales Management
app.get('/api/sales', async (req, res) => {
    const sales = await Sale.findAll({ order: [['timestamp', 'DESC']] });
    // Map items string back to objects
    const formatted = sales.map(s => ({
        ...s.toJSON(),
        items: JSON.parse(s.items)
    }));
    res.json(formatted);
});

app.post('/api/sales', async (req, res) => {
    const { items, total } = req.body;

    // Start transaction for stock update
    const t = await sequelize.transaction();
    try {
        const sale = await Sale.create({
            items: JSON.stringify(items),
            total
        }, { transaction: t });

        // Update stock for each product
        for (const item of items) {
            const product = await Product.findByPk(item.id);
            if (product) {
                await product.update({
                    stock: Math.max(0, product.stock - item.quantity)
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ ...sale.toJSON(), items });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;

sequelize.sync().then(async () => {
    // Seed admin if not exists
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
        await User.create({
            username: 'admin',
            password: 'password',
            name: 'Administrateur Principal',
            role: 'admin'
        });
        console.log('Admin user created');
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error('DB Sync Error:', err));
