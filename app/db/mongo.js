const mongoose = require('mongoose')
mongoose.set('strictQuery', true)
require('dotenv').config({ path: 'local.env' })

async function connect() {
    try {
        mongoose.connect(process.env.CONNECT_MONGODB, {
            auth: {
                username: process.env.CONNECT_MONGODB_USER,
                password: process.env.CONNECT_MONGODB_PASS,
            },
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
            .then(() => console.info(`=> connect database ${process.env.CONNECT_MONGODB} success`))
            .catch(err => console.error('🛠🛠🛠 : ' + err));
    } catch (error) {
        console.info(`=> connect DB ${process.env.CONNECT_MONGODB} failure`);
        console.error(error);
    }
}

module.exports = { connect };