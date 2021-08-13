// Importing Modules
const { MessageEmbed, Permissions } = require('discord.js')
const config = require('../config.json')
const emojis = require('../utils/emojis.json')
let recentlyRan = []

const { prefix, botname } = config // Imprting variables from config

module.exports = (client, commandOptions) => { // Exports the command handler
    let {
        commands,
        cooldown = 1,
        callbacc,
        // permLevel
    } = commandOptions // Assigning variables from commandOptions

    if(!commands) return // If there are no commands, return
    if(typeof commands === 'string') commands = [commands] // If commands is a string, make it an array
    console.log(`Registering command "${commands[0]}"`) // Logging the command being registered

    client.on('messageCreate', async (message) => { // Emits when a message is sent
        if(message.bot || !message.guild.id) return // If the message is from the bot or isn't in a guild, return
        const { content, guild, member, author } = message // Assigning variables from the message
        const args = content.split(/[ ]+/) // Splitting the message into an array of arguments
        args.shift() // Removing the command from the array

        for(const alias of commands) { // For each command
            const command = `${prefix}${alias.toLowerCase()}` // The command to check
            if(content.toLowerCase().startsWith(command) || content.toLowerCase() === command) { // If the message starts with the command
                let cooldownString = `${guild.id}-${member.id}-${commands[0]}` // The string to check for cooldowns
                console.log('Cooldown String: ', cooldownString) // Logging the cooldown string

                if(cooldown > 0 && recentlyRan.includes(cooldownString)) { // If the command is on cooldown
                    const embed = new MessageEmbed() // Creating an embed
                    .setAuthor(`${author.tag}`, author.displayAvatarURL({ dynamic: true }))
                    .setColor('RED')
                    .setDescription(`${emojis.no} The command is still on cooldown! Wait for some more time to use the command again!`)
                    .setFooter(botname)
                    .setTimestamp()
                    return message.reply({ embeds: [ embed ] }) // Sending the embed
                }

                if(cooldown > 0) { // If the command is on cooldown
                    recentlyRan.push(cooldownString) // Pushing the cooldown string to the recentlyRan array
                    return setTimeout(() => { // Setting a timeout to remove the cooldown string from the recentlyRan array
                        console.log(`BEFORE: ${recentlyRan}`) // Logging the recentlyRan array
                        recentlyRan = recentlyRan.filter(x => x !== cooldownString) // Removing the cooldown string from the recentlyRan array
                        console.log(`AFTER: ${recentlyRan}`) // Logging the recentlyRan array
                    }, cooldown * 1000) // Setting the timeout
                }
            }
            return callbacc(client, message, args, args.join(' ')) // If the message doesn't start with the command, call the callback
        }
    })
}