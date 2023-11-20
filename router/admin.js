const router = require('express').Router()

const adminControllers = require('../app/controllers/admin/admin.controller')

router.post('/login', adminControllers.login)
router.post('/verify', adminControllers.verifyJWT)
router.post('/getConfig', adminControllers.mdwVerifyJWT, adminControllers.getConfig)
router.post('/config', adminControllers.mdwVerifyJWT, adminControllers.editConfig)
router.post('/getHistoryCall', adminControllers.mdwVerifyJWT, adminControllers.getHistoryCall)
router.post('/deleteAllHistoryCall', adminControllers.mdwVerifyJWT, adminControllers.deleteAllHistoryCall)

module.exports = router