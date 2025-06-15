const { authenticate } = require('../middleware');


module.exports = (app, express) => {
  const router = express.Router();
  router.use('/auth', require('./allowed.routes.js'));
  router.use('/users',authenticate, require('../routes/auth.routes'));
  router.use('/appointments', authenticate, require('../routes/appointment.route'));
  router.use('/patient-summary', authenticate, require('./patientSummary.route'));
  router.use('/analytics', authenticate, require('./analytics.routes.js'));

  app.use('/api', router);
};
