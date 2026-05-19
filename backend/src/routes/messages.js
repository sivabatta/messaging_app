const router = require('express').Router();
const ctrl = require('../controllers/messageController');
const { authRequired } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', authRequired, ctrl.sendText);
router.post('/media', authRequired, upload.single('file'), ctrl.sendMedia);
router.get('/history/:userId', authRequired, ctrl.history);
router.post('/seen', authRequired, ctrl.markSeen);
router.delete('/conversation/:userId', authRequired, ctrl.deleteConversation);
router.delete('/:id', authRequired, ctrl.deleteMessage);

module.exports = router;
