// Importing Modules
const { MessageEmbed, Permissions } = require('discord.js')
const config = require('../../config.json')
const modlogs = require('../../models/modlogs')
const emojis = require('../../utils/emojis.json')

const { botname } = config // Get variables from config

// Command Handler
module.exports = { // Exporting the command
    name: 'kick',
    description: 'Kicks the mentioned user from the server',
    aliases: [],
    cooldown: 10,
    async run(client, message, args) {
        const logsChannelID = message.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
        const logsChannel = message.guild.channels.cache.get(logsChannelID) // Getting the Mod-Logs channel from the server

        let target // Variable for the target
        if(message.mentions.members.first()) { // If the user mentioned someone
            target = message.mentions.members.first() // If the user is mentioned, set target to the mentioned user
        } else if(args[0]) {
            if(message.guild.members.cache.get(args[0])) { // If the mentioned user is a valid member of the server
                target = await message.guild.members.fetch(args[0]) // Set target to the mentioned user
            } else { // If the mentioned user is not a valid member of the server
                const errorEmbed = new MessageEmbed() // Creating an embed
                .setColor('RED')
                .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setFooter(botname)
                .setTimestamp()
                .setDescription(`${emojis.error} Cannot find the member with ID: ${args[0]}\n${emojis.fix} **Possible Fixes:** Here is a list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.\n ${emojis.blank} ${emojis.guildRemove} The user may have left the server.`)
                return message.reply({ embeds: [ errorEmbed ] })
            }
        }

        if(!target) { // If the target is not set
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} Please mention a user to kick!`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        if(!message.member.permissions.has(Permissions.FLAGS.KICK_MEMBERS)) { // If the user does not have permission to kick members
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You do not have permission to run this command!\n${emojis.blank} ${emojis.doubleArrow} Permissions required: \`KICK_MEMBERS\``)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        if(target.id === message.author.id) { // If the target is the user
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You cannot kick yourself!\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        if(target.permissions.has(Permissions.FLAGS.BAN_MEMBERS) || target.permissions.has(Permissions.FLAGS.KICK_MEMBERS) || target.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) { // If the target has permission to kick or ban members
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} Can't kick the mentioned member\n${emojis.bug} **Reason:** Member is a \`MODERATOR\` or an \`ADMINISTRATOR\`\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        if(target.roles.highest.position > message.member.roles.highest.position) { // If the target has a higher role than the user
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You cannot kick someone with a higher role than you!\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        if(target.roles.highest.position > message.guild.member.roles.highest.position) { // If the target has a higher role than the bot
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You cannot kick someone with a higher role than the bot!\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        let reason = args[1] // Set reason to the second argument
        if(!reason) reason = "No Reason Specified" // If the reason is not set, set it to "No Reason Specified"

        await target.kick(reason) // Kick the target
        const successEmbed = new MessageEmbed() // Creating an embed
        .setColor('GREEN')
        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
        .setFooter(botname)
        .setTimestamp()
        .setDescription(`${emojis.success} Successfully kicked the mentioned user!`)
        message.reply({ embeds: [ successEmbed ] })

        const logEmbed = new MessageEmbed() // Creating an embed
        .setTitle('Member Kicked')
        .setColor('GREEN')
        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
        .setFooter(botname)
        .setTimestamp()
        .addField(`${emojis.user} User`, target.tag, true)
        .addField(`${emojis.id} User ID`, target.id, true)
        .addField(`${emojis.mod} Moderator`, `${message.author.tag} (${message.author.id})`)
        .addField(`${emojis.description} Reason`, reason)
        await message.guild.channels.get(logsChannel).send({ embed: logEmbed }) // Send the embed to the log channel

        const userID = target.id // Set userID to the target's ID
        const guildID = message.guild.id // Set guildID to the guild's ID
        const log = {
            logType: 'Kick',
            userID: userID,
            moderator: message.author.id,
            timestamp: new Date(),
            reason: reason,
        }

        await modlogs.findOneAndUpdate({ guildID: guildID }, { userID: userID, guildID: guildID, $push: { logs: log } }, { upsert: true })
    },
}