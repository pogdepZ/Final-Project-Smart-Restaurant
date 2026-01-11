const authRoutes = require('../routes/authRoutes');
const menuRoutes = require('../routes/menuRoutes');
const tableRoutes = require('../routes/tableRoutes');
const orderRoutes = require('../routes/orderRoutes');
const modifierRoutes = require('../routes/modifierRoutes')

const setUpRoutes = (app) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/menu', menuRoutes);
    app.use('/api/tables', tableRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/menu/modifiers', modifierRoutes);
}

module.exports = setUpRoutes;