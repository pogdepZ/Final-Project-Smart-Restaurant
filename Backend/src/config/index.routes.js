const publicRoutes = require('../routes/public/index.routes')
const backofficeRoutes = require('../routes/backoffice/index.routes');

const setUpRoutes = (app) => {
    app.use('/api', publicRoutes);
    app.use('/api/admin', backofficeRoutes);
}

module.exports = setUpRoutes;