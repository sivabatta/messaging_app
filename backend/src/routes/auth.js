const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

router.post('/signup', ctrl.signup);
router.post('/login', ctrl.login);
router.get('/me', authRequired, ctrl.me);
router.get('/users', authRequired, ctrl.listUsers);

module.exports = router;
