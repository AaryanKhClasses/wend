// Importing Modules
const { Client, Intents } = require('discord.js')
const client = new Client({ partials: ['USER', 'CHANNEL', 'REACTION', 'MESSAGE'], intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_TYPING ] })
const mongoose = require('mongoose')
const config = require('./config.json')
require('dotenv').config()

const { prefix, botname } = config // Import variables from config

// Importing Handlers
const commandsLoader = require('./commands/commandsLoader')

client.on('ready', () => { // Emits when the client is ready
    console.log(`${botname} is ready!`) // Logs that the bot is ready
    client.user.setActivity(`${prefix}help`, { type: 'LISTENING' }) // Sets the activity to the `LISTENING to >help`

    // Initiating Handlers
    commandsLoader(client)
})

client.login(process.env.TOKEN) // Logs into the bot