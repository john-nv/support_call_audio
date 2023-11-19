const mongoose = require('mongoose')
const Schema = mongoose.Schema

const historyCall = new Schema({
    nameUser: String,
    whoEndCall: String,
    idRoom: String,
    timeInCall: String,
    timeCall: String,
    status: String,
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    },
    timezone: 'Asia/Ho_Chi_Minh'
})

module.exports = mongoose.model('historyCall', historyCall)