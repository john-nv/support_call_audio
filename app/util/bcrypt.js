const bcrypt = require('bcrypt')

module.exports = {
    bcryptCompare: async function (passDB, pass) {
        const isMatch = await bcrypt.compare(pass, passDB);
        return isMatch
    },
}