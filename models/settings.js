const mongoose = require('mongoose') // Importing mongoose

const settingsSchema = new mongoose.Schema({ // Creating a new schema
    guildID: String,
    trustedRoles: [String],
    trustedUsers: [String],
    adminRole: String,
    modRole: String,
    helperRole: String,
})

const settings = mongoose.model('settings', settingsSchema) // Creating a model for the settings
module.exports = settings // Exporting the settings model