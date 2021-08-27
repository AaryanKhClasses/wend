const mongoose = require('mongoose')

const antiraidSchema = new mongoose.Schema({
    guildID: String,
    userID: String,
    ROLE_CREATE: Number,
    ROLE_DELETE: Number,
})

const antiraid = mongoose.model('antiraid', antiraidSchema)
module.exports = antiraid