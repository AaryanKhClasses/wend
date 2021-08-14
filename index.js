// Importing Modules
const client = require('./utils/client')
require('dotenv').config()

const bot = new client() // Creates a new bot on basis of the client
bot.login(process.env.TOKEN) // Logs into the bot