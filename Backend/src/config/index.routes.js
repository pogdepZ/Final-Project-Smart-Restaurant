<<<<<<< HEAD
const authRoutes = require("../routes/authRoutes");
const menuRoutes = require("../routes/menuRoutes");
const tableRoutes = require("../routes/tableRoutes");
const orderRoutes = require("../routes/orderRoutes");
const modifierRoutes = require("../routes/modifierRoutes");
const dashboardRoutes = require("../routes/dashboardRoutes");

const setUpRoutes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/menu", menuRoutes);
  app.use("/api/tables", tableRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/menu/modifiers", modifierRoutes);
  app.use("/api/admin", dashboardRoutes);
};
=======
const publicRoutes = require('../routes/public/index.routes')
const backofficeRoutes = require('../routes/backoffice/index.routes');

const setUpRoutes = (app) => {
    app.use('/api', publicRoutes);
    app.use('/api/admin', backofficeRoutes);
}
>>>>>>> 440c410d8ffd58408bffd6f406afbd535d463dda

module.exports = setUpRoutes;
