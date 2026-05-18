const router = require('express').Router();
const ctrl = require('../controllers/mediaController');
const { authRequired } = require('../middleware/auth');

// Token may also arrive as a query param so <img>/<video> tags can authenticate.
function tokenFromQuery(req, _res, next) {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}

router.get('/:id', tokenFromQuery, authRequired, ctrl.download);
router.get('/:id/meta', authRequired, ctrl.meta);

module.exports = router;
