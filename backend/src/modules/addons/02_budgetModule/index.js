// backend/src/modules/addons/02_budgetModule/index.js
const budgetRoutes = require('./budget.routes');
// const budgetServices = require('./budget.services'); // Example if you had services to export

module.exports = {
  routes: budgetRoutes, // Make sure this is the Express router instance
  // services: budgetServices, // Example for future expansion
  // hooks: {} // Example for future expansion
};