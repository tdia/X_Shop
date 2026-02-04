import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Sale = sequelize.define('Sale', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    items: {
        type: DataTypes.TEXT('long'), // Stored as JSON string
        allowNull: false
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

export default Sale;
