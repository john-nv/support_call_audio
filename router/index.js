const admin = require('./admin')

function router(app) {
  app.use('/admin', admin)
}

module.exports = router