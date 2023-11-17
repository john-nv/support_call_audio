const userCall = require('./userCall')

function router(app) {
  app.use('/user', userCall)
}

module.exports = router