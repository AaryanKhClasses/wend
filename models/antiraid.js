const mongoose = require('mongoose')

const antiraidSchema = new mongoose.Schema({
    guildID: String,
    whitelistedUsers: [String],
    triggeredUsers: [Object],
})

const antiraid = mongoose.model('antiraid', antiraidSchema)
module.exports = antiraid