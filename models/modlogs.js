const mongoose = require('mongoose') // Importing mongoose

const modlogsSchema = new mongoose.Schema({ // Creating a schema for modlogs
    userID: String,
    guildID: String,
    logs: [ Object ],
})

const modlogs = mongoose.model('modlogs', modlogsSchema) // Creating a modlogs model
module.exports = modlogs // Exporting the model