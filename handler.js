// Importing modules
const { Collection, MessageEmbed } = require('discord.js')
const fs = require('fs')
const config = require('./config.json')
const emojis = require('./utils/emojis.json')
const settings = require('./models/settings')

const { botname, prefix, ownerID } = config

module.exports = (client) => {
    const folders = fs.readdirSync('./commands') // Gets all folders in commands folder
    for(const folder of folders) { // Loops through all folders
        const files = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js')) // Gets all files in folder
        for(const file of files) { // Loops through all files
            const command = require(`./commands/${folder}/${file}`) // Require the file
            client.commands.set(command.name, command) // Sets the command
            console.log(`Registered ${file}`) // Logs that the file was registered
        }
    }

    client.on('messageCreate', async (message) => { // Emits when a message is created
        if(message.author.bot || !message.content.startsWith(prefix) || !message.guild) return // If the message is a bot, or the prefix is not used, or the message is not in a guild, do nothing

        const args = message.content.slice(prefix.length).trim().split(/ +/) // Gets the arguments
        const commandName = args.shift().toLowerCase() // Gets the command name

        const command = client.commands.get(commandName) // Gets the command
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName)) // Gets the command by alias
        if(!command) return // If the command does not exist, do nothing

        const { cooldowns } = client // Gets the cooldowns
        if(!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection()) // If the cooldowns do not have the command, set it to a new collection

        const now = Date.now() // Gets the current time
        const timestamps = cooldowns.get(command.name) // Gets the timestamps
        const cooldownAMT = (command.cooldown || 3) * 1000 // Gets the cooldown amount

        if(timestamps.has(message.author.id)) { // If the author has a cooldown
            const expirationTime = timestamps.get(message.author.id) + cooldownAMT // Gets the expiration time
            if(now < expirationTime) { // If the current time is less than the expiration time
                const timeLeft = (expirationTime - now) / 1000 // Gets the time left
                const embed = new MessageEmbed() // Creates a new embed
                .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setColor('RED')
                .setDescription(`${emojis.slowmode} You need to wait ${timeLeft.toFixed(1)} seconds before using this command again.`)
                .setFooter(botname)
                .setTimestamp()
                return message.reply({ embeds: [embed] })
            }
        }

        timestamps.set(message.author.id, now) // Sets the author's cooldown
        setTimeout(() => timestamps.delete(message.author.id), cooldownAMT) // Deletes the author's cooldown after the cooldown amount

        const guildSettings = await settings.findOne({ guildID: message.guild.id }) // Gets the guild settings
        if(!guildSettings) {
            const newSettings = new settings({ guildID: message.guild.id, helperRole: '', modRole: '', adminRole: '', trustedUsers: '', trustedRole: '' })
            newSettings.save()
        } else {
            let userPermissions, userPermissionsLevel
            if(message.member.id === ownerID) { userPermissions = 'OWNER', userPermissionsLevel = 6 } // If the user is the bot owner, set the permissions to bot owner
            else if(message.member.id === message.guild.ownerId) { userPermissions = 'SERVER OWNER', userPermissionsLevel = 5 } // If the user is the server owner, set the permissions to server owner
            else if(message.member.roles.cache.find(r => r.id === guildSettings.trustedRole) || guildSettings.trustedUsers.indexOf(message.author.id) > -1) { userPermissions = 'TRUSTED', userPermissionsLevel = 4 } // If the user has the trusted role, set the permissions to trusted
            else if(message.member.roles.cache.find(r => r.id === guildSettings.adminRole)) { userPermissions = 'ADMIN', userPermissionsLevel = 3 } // If the user has the admin role, set the permissions to admin
            else if(message.member.roles.cache.find(r => r.id === guildSettings.modRole)) { userPermissions = 'MODERATOR', userPermissionsLevel = 2 } // If the user has the mod role, set the permissions to mod
            else if(message.member.roles.cache.find(r => r.id === guildSettings.helperRole)) { userPermissions = 'HELPER', userPermissionsLevel = 1 } // If the user has the helper role, set the permissions to helper
            else { userPermissions = 'MEMBER', userPermissionsLevel = 0 } // If the user is a member, set the permissions to member

            if(command.permLevel) {
                let permissions
                if(command.permLevel === 6) permissions = 'OWNER'
                else if(command.permLevel === 5) permissions = 'SERVER OWNER'
                else if(command.permLevel === 4) permissions = 'TRUSTED'
                else if(command.permLevel === 3) permissions = 'ADMIN'
                else if(command.permLevel === 2) permissions = 'MODERATOR'
                else if(command.permLevel === 1) permissions = 'HELPER'
                else permissions = 'MEMBER'

                if(command.permLevel > userPermissionsLevel) { // If the command requires permissions
                    const embed = new MessageEmbed() // Creates a new embed
                    .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                    .setColor('RED')
                    .setDescription(`${emojis.error} You do not have permissions to use this command.\n${emojis.doubleArrow} **Permission Level Required:** ${command.permLevel} (\`${permissions}\`)\n${emojis.blank} ${emojis.doubleArrowRed} **Your Permission Level:** ${userPermissionsLevel} (\`${userPermissions}\`)`)
                    .setFooter(botname)
                    .setTimestamp()
                    return message.reply({ embeds: [embed] })
                }
            }
        }

        try { // Tries to execute the command
            command.run(client, message, args) // Runs the command
        } catch(err) { // Catches any errors
            console.error(err) // Logs the error
            message.reply('There was an error while executing the command!') // Replies with an error
        }
    })

}