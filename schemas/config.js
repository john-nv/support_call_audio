const mongoose = require('mongoose')
const Schema = mongoose.Schema

const config = new Schema({
    timeAwaitUser: Number,
    titleUser: String,
    titleHome: String,
    msgStart: String,
    msgBusy: String,
    msgDone: String,
    msgConnect: String,
})

module.exports = mongoose.model('config', config)