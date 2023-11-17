const router = require('express').Router()

router.post('/call', (req,res) => {
    res.json('test')
})

module.exports = router