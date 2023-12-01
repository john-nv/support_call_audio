const mongoose = require('mongoose')
const Schema = mongoose.Schema

const telegram = new Schema({
    token: String,
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    },
    timezone: 'Asia/Ho_Chi_Minh'
})

module.exports = mongoose.model('telegram', telegram)