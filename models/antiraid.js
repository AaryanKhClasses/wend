const mongoose = require('mongoose')

const antiraidSchema = new mongoose.Schema({
    guildID: String,
    userID: String,
    ROLE_CREATE: Number,
    createdRoles: [ String ],
    ROLE_DELETE: Number,
    CHANNEL_CREATE: Number,
    CHANNEL_DELETE: Number,
})

const antiraid = mongoose.model('antiraid', antiraidSchema)
module.exports = antiraid