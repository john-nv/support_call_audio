const bcrypt = require('bcrypt');
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const admin = new Schema({
    user: String,
    pass: String,
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    },
    timezone: 'Asia/Ho_Chi_Minh'
})

// ma hoa password truoc khi dua vao db
admin.pre('save', async function (next) {
    try {
        if (!this.pass) return next()
        const salt = await bcrypt.genSalt(10)
        const hasPass = await bcrypt.hash(this.pass, salt)
        this.pass = hasPass
        next()
    } catch (error) {
        next(error)
    }
})

module.exports = mongoose.model('admin_account', admin)