const mongoose = require('mongoose')
const Schema = mongoose.Schema

const room = new Schema({
    name: String,
    idAdmin: String,
    nameUser: String,
    idRoom: String,
    timeLast: Date
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    },
    timezone: 'Asia/Ho_Chi_Minh'
})

module.exports = mongoose.model('room', room)