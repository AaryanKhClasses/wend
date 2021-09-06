// Importing Modules
const { MessageEmbed, Permissions } = require('discord.js')
const config = require('../../config.json')
const modlogs = require('../../models/modlogs')
const emojis = require('../../utils/emojis.json')

const { botname } = config // Get variables from config

// Command Handler
module.exports = { // Exporting the command
    name: 'ban',
    description: 'Bans the mentioned user from the server',
    aliases: ['b'],
    permLevel: 2,
    cooldown: 10,
    async run(client, message, args) {
        let logsChannel // Channel for logging.
        if(message.guild.channels.cache.find(ch => ch.name.includes('mod-logs'))) { // If there is a mod-logs channel in the server
            const logsChannelID = message.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
            logsChannel = message.guild.channels.cache.get(logsChannelID) // Sets the Mod-Logs channel from the server
        } else { // If there isn't a mod-logs channel in the server
            logsChannel = await message.guild.channels.create('mod-logs', { type: 'GUILD_TEXT', topic: 'Mod Logs channels for bots.', reason: 'Logging channel required by wend.' }) // Creates a new mod-logs channel and sets the logsChannel to that channel.
        }

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
            .setDescription(`${emojis.error} Please mention a user to ban!`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        if(target.id === message.author.id) { // If the target is the user
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You cannot ban yourself!\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        if(target.permissions.has(Permissions.FLAGS.BAN_MEMBERS) || target.permissions.has(Permissions.FLAGS.KICK_MEMBERS) || target.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) { // If the target has permission to kick or ban members
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} Can't ban the mentioned member\n${emojis.bug} **Reason:** Member is a \`MODERATOR\` or an \`ADMINISTRATOR\`\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        if(target.roles.highest.position > message.member.roles.highest.position) { // If the target has a higher role than the user
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You cannot ban someone with a higher role than you!\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        if(target.roles.highest.position > message.guild.me.roles.highest.position) { // If the target has a higher role than the bot
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You cannot ban someone with a higher role than the bot!\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.`)
            return message.reply({ embeds: [ errorEmbed ] })
        }

        let reason = args[1] // Set reason to the second argument
        if(!reason) reason = "No Reason Specified" // If the reason is not set, set it to "No Reason Specified"

        let note
        if(message.content.includes('-n') && !message.content.includes('-note')) { // If the user has the -n flag but not the -note flag
            let x = message.content.split('-n')
            const multipleX = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You can only use one \`-n\` at a time!\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.tag} Remove one of the \`-n\` tag.`)
            if(x.length > 2) return message.reply({ embeds: [ multipleX ] })
            note = x[1].slice(' ')
        } else if(message.content.includes('-note') && !message.content.includes('-n')) { // If the user has the -note flag but not the -n flag
            let x = message.content.split('-note')
            const multipleX = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You can only use one \`-note\` at a time!\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.tag} Remove one of the \`-note\` tag.`)
            if(x.length > 2) return message.reply({ embeds: [ multipleX ] })
            note = x[1].slice(' ')
        } else if(message.content.includes('-n') && message.content.includes('-note')) { // If the user has both the -n and -note flags
            const multipleX = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} You can only use one \`-n\` or \`-note\` at a time!\n${emojis.fix} **Possible Fixes:** Here is a the list of possible fixes\n${emojis.blank} ${emojis.tag} Remove one of the \`-n\` or \`-note\` tag.`)
            return message.reply({ embeds: [ multipleX ] })
        } else { // If the user doesn't have any flags
            note = "No Note Specified"
        }

        await message.guild.ban(target, { reason }) // Ban the target
        const successEmbed = new MessageEmbed() // Embed to show that the member has been banned.
        .setColor('GREEN')
        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
        .setFooter(botname)
        .setTimestamp()
        .setDescription(`${emojis.success} Successfully banned the mentioned user!`)
        message.reply({ embeds: [ successEmbed ] })

        const logEmbed = new MessageEmbed() // Log Embed to show that the member has been banned
        .setTitle('Member Banned')
        .setColor('GREEN')
        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
        .setFooter(botname)
        .setTimestamp()
        .addField(`${emojis.user} User`, target.user.tag, true)
        .addField(`${emojis.id} User ID`, target.id, true)
        .addField(`${emojis.mod} Moderator`, `${message.author.tag} (${message.author.id})`)
        .addField(`${emojis.description} Reason`, reason)
        .addField(`${emojis.tag} Moderator Note`, note)
        await logsChannel.send({ embeds: [ logEmbed ] }) // Send the embed to the log channel

        const userEmbed = new MessageEmbed() // Embed to show that the user has been banned
        .setAuthor(`${message.guild.name}`, message.guild.iconURL())
        .setColor('RED')
        .setDescription(`${emojis.guildRemove} You were banned from **${message.guild.name}**\n${emojis.description} **Reason:** ${reason}\n${emojis.tag} **Moderator Note:** ${note}`)
        .setFooter(botname)
        .setTimestamp()
        target.send({ embeds: [ userEmbed ] }) // Sends the embed to the target

        const userID = target.id // Set userID to the target's ID
        const guildID = message.guild.id // Set guildID to the guild's ID
        const log = {
            logType: 'Ban',
            userID: userID,
            moderator: message.author.id,
            timestamp: new Date(),
            reason: reason,
            note: note,
        }

        await modlogs.findOneAndUpdate({ guildID: guildID }, { userID: userID, guildID: guildID, $push: { logs: log } }, { upsert: true }) // Adds the log to the database
    },
}