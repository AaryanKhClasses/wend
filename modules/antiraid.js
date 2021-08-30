// Importing modules
const emojis = require('../utils/emojis.json')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { botname } = require('../config.json')
const antiraid = require('../models/antiraid')

module.exports = (client) => { // Exporting the module
    const logsRow = new MessageActionRow().addComponents( // Creating the logs row
        new MessageButton() // First Button to unquarantine user
        .setCustomId('unquarantine')
        .setLabel('Restore User')
        .setStyle('SUCCESS'),

        new MessageButton() // Second Button to ban user
        .setCustomId('ban')
        .setLabel('Ban User')
        .setStyle('DANGER'),
    )

    const disabledLogsRow = new MessageActionRow().addComponents( // Creating the disabled logs row
        new MessageButton() // Disabled button after either unquarantine or ban
        .setCustomId('unquarantine_disabled')
        .setLabel('Restore User')
        .setStyle('SUCCESS')
        .setDisabled(),

        new MessageButton() // Disabled button after either unquarantine or ban
        .setCustomId('ban_disabled')
        .setLabel('Ban User')
        .setStyle('DANGER')
        .setDisabled(),
    )

    async function quarantine(action, logType) { // Quarantine function
        let limit = 5 // Setting the limit to 5
        let logsChannel // Channel for logging.
        if(action.guild.channels.cache.find(ch => ch.name.includes('mod-logs'))) { // If there is a mod-logs channel in the server
            const logsChannelID = action.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
            logsChannel = action.guild.channels.cache.get(logsChannelID) // Sets the Mod-Logs channel from the server
        } else { // If there isn't a mod-logs channel in the server
            logsChannel = await action.guild.channels.create('mod-logs', { type: 'GUILD_TEXT', topic: 'Mod Logs channels for bots.', reason: 'Logging channel required by wend.' }) // Creates a new mod-logs channel and sets the logsChannel to that channel.
        }

        const log = await action.guild.fetchAuditLogs({ type: logType }).then(audit => audit.entries.first()) // Gets the first entry of the audit log
        const user = log.executor // Gets the user who executed the action
        const member = await action.guild.members.fetch(user.id) // Gets the member who executed the action
        if(member.id === client.user.id) return // If the user who executed the action is the bot, return
        if(member.roles.cache.find(r => r.name.includes('Trusted')) || member.id === action.guild.ownerId) return // If the user who executed the action is trusted or the owner of the server, return

        const data = await antiraid.findOne({ guildID: action.guild.id, userID: member.id }) // Finds the user in the database
        if(data) { // If the user is in the database
            let ROLE_CREATE_NUM = data.ROLE_CREATE // Gets the number of role creations
            if(!ROLE_CREATE_NUM) ROLE_CREATE_NUM = 1 // If the number of role creations is undefined, set it to 1
            if(ROLE_CREATE_NUM > limit) { // If the number of role creations is greater than the limit
                let quarantinedRole // Quarantined role
                if(action.guild.roles.cache.find(r => r.name.includes('Quarantined'))) quarantinedRole = action.guild.roles.cache.find(r => r.name.includes('Quarantined')) // If there is a quarantined role in the server
                else quarantinedRole = await action.guild.roles.create({ name: 'Quarantined', reason: 'Quarantined role required by Wend\'s Anti Raid Feature.' }) // If there isn't a quarantined role in the server, create one

                const allChannels = action.guild.channels.cache.filter(ch => ch.type !== 'GUILD_CATEGORY') // Gets all channels in the server
                allChannels.forEach(ch => ch.permissionOverwrites.create(quarantinedRole, { SEND_MESSAGES: false, ADD_REACTIONS: false, VIEW_CHANNEL: false })) // Sets the permissions for all channels to the quarantined role

                member.roles.set([quarantinedRole]) // Adds the quarantined role to the user
                const embed = new MessageEmbed() // Creates an embed
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
                .setColor('GREEN')
                .setTitle('Member Quarantined.')
                .setDescription(`${emojis.user} **Member:** ${member.user.tag}\n${emojis.id} **Member ID:** ${member.id}\n${emojis.role} **All Roles Cleansed:** ${emojis.success}\n${emojis.mask} **Member Quarantined:** ${emojis.success}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`${logType}\``)
                .setTimestamp()
                .setFooter(botname)
                logsChannel.send({ embeds: [ embed ], components: [ logsRow ] }) // Sends the embed to the logs channel

                const userEmbed = new MessageEmbed() // Creates an embed
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
                .setColor('RED')
                .setDescription(`${emojis.mask} You have been quarantined in **${action.guild.name}**\n${emojis.description} **Reason:** Anti-Raid Triggered | ID: \`${logType}\`\n${emojis.blank} User created more than 5 roles in the last 30 minutes.\n${emojis.role} **Roles:** \`\`\`diff\n${data.createdRoles.join('\n')}\`\`\``)
                .setTimestamp()
                .setFooter(botname)
                member.send({ embeds: [ userEmbed ] }) // Sends the embed to the user
            }
        }
    }

    async function unquarantine(interaction, logType) { // Unquarantine function
        if(!interaction.isButton()) return // If the interaction isn't a button, return
        if(!interaction.member.roles.cache.find(r => r.name.includes('Trusted')) && interaction.user.id !== interaction.guild.ownerId) { // If the user who executed the action isn't trusted or the owner of the server, return
            const embed = new MessageEmbed() // Creates an embed
            .setAuthor(`${interaction.member.user.tag}`, interaction.member.user.displayAvatarURL({ dynamic: true }))
            .setColor('RED')
            .setDescription(`${emojis.error} You do not have the permission to use this command.\n${emojis.doubleArrow} **Permissions Required:** \`Trusted Administrator\` OR \`Server Owner\``)
            .setTimestamp()
            .setFooter(botname)
            return interaction.message.reply({ embeds: [ embed ] })
        }

        const userID = interaction.message.embeds[0].description.split('ID:** ')[1].substring(0, 18) // Gets the user ID from the embed
        let quarantinedUser // Quarantined user
        if(interaction.guild.members.fetch(userID)) quarantinedUser = await interaction.guild.members.fetch(userID) // If the user ID is valid, get the user
        else {
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${interaction.member.user.tag}`, interaction.member.user.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} Cannot find the quarantined member\n${emojis.fix} **Possible Fixes:** Here is a list of possible fixes\n${emojis.blank} ${emojis.guildRemove} The user may have left the server.`)
            return interaction.reply({ embeds: [ errorEmbed ] })
        }

        if(interaction.customId === "unquarantine") { // If the interaction is the unquarantine button
            const quarantinedRole = interaction.guild.roles.cache.find(r => r.name.includes('Quarantined')) // Gets the quarantined role
            quarantinedUser.roles.remove(quarantinedRole) // Removes the quarantined role from the user
            interaction.update({ components: [ disabledLogsRow ] }) // Updates the interaction to remove the logs row

            const successEmbed = new MessageEmbed() // Creating an embed
            .setColor('GREEN')
            .setAuthor(`${interaction.member.user.tag}`, interaction.member.user.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.success} Successfully restored the member\n${emojis.user} **Member:** ${quarantinedUser}\n${emojis.id} **Member ID:** ${userID}\n${emojis.mod} **Moderator:** ${interaction.member.user.tag}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`${logType}\``)
            interaction.message.reply({ embeds: [ successEmbed ] }) // Replies with the embed
        } else if(interaction.customId === 'ban') { // If the interaction is the ban button
            quarantinedUser.ban({ reason: `Member Triggered Anti-Raid and was Banned by ${interaction.member.user.tag}` }) // Bans the user
            interaction.update({ components: [ disabledLogsRow ] }) // Updates the interaction to remove the logs row

            const successEmbed = new MessageEmbed() // Creating an embed
            .setColor('GREEN')
            .setAuthor(`${interaction.member.user.tag}`, interaction.member.user.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.success} Successfully banned the member\n${emojis.user} **Member:** ${quarantinedUser}\n${emojis.id} **Member ID:** ${userID}\n${emojis.mod} **Moderator:** ${interaction.member.user.tag}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`${logType}\``)
            interaction.message.reply({ embeds: [ successEmbed ] }) // Replies with the embed
        }
    }

    client.on('interactionCreate', async (interaction) => { // When an interaction is created
        unquarantine(interaction, 'ROLE_CREATE') // Unquarantine the user for ROLE_CREATE log
    })

    client.on('roleCreate', async (role) => { // When a role is created
        quarantine(role, 'ROLE_CREATE') // Quarantine the user for ROLE_CREATE log

        const log = await role.guild.fetchAuditLogs({ type: 'ROLE_CREATE' }).then(audit => audit.entries.first()) // Gets the audit log for the role create
        const user = log.executor // Gets the user who created the role
        const member = await role.guild.members.fetch(user.id) // Gets the member who created the role
        const data = await antiraid.findOne({ guildID: role.guild.id, userID: member.id }) // Gets the antiraid data for the member who created the role

        if(data) { // If the antiraid data exists
            let ROLE_CREATE_NUM = data.ROLE_CREATE // Gets the ROLE_CREATE number
            if(!ROLE_CREATE_NUM) ROLE_CREATE_NUM = 1 // If the ROLE_CREATE number doesn't exist, set it to 1
                await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: ROLE_CREATE_NUM + 1, $push: { createdRoles: `+ ${role.name}` } }) // Updates the antiraid data with the new ROLE_CREATE number and the new role name
            console.log(ROLE_CREATE_NUM, `+ ${role.name}`) // Logs the new ROLE_CREATE number and the new role name
            setTimeout(async () => { // Sets a timeout
                while(ROLE_CREATE_NUM > 0) { // While the ROLE_CREATE number is greater than 0
                    await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: ROLE_CREATE_NUM - 1, $pull: { createdRoles: `+ ${role.name}` } }) // Updates the antiraid data with the new ROLE_CREATE number and the new role name
                }
            }, 1800000) // Sets the timeout to 30 minutes

        } else { // If the antiraid data doesn't exist
            const newData = new antiraid({ guildID: role.guild.id, userID: member.id }) // Creates a new antiraid data
            newData.save() // Saves the new antiraid data
            await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: 1 }) // Updates the antiraid data with the new ROLE_CREATE number
        }
    })

    client.on('roleDelete', async (role) => { // When a role is deleted
        quarantine(role, 'ROLE_DELETE') // Quarantine the user for ROLE_DELETE log

        const log = await role.guild.fetchAuditLogs({ type: 'ROLE_DELETE' }).then(audit => audit.entries.first()) // Gets the audit log for the role delete
        const user = log.executor // Gets the user who deleted the role
        const member = await role.guild.members.fetch(user.id) // Gets the member who deleted the role
        const data = await antiraid.findOne({ guildID: role.guild.id, userID: member.id }) // Gets the antiraid data for the member who deleted the role

        if(data) { // If the antiraid data exists
            let ROLE_DELETE_NUM = data.ROLE_DELETE // Gets the ROLE_DELETE number
            if(!ROLE_DELETE_NUM) ROLE_DELETE_NUM = 1 // If the ROLE_DELETE number doesn't exist, set it to 1
                await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_DELETE: ROLE_DELETE_NUM + 1, $push: { createdRoles: `+ ${role.name}` } }) // Updates the antiraid data with the new ROLE_DELETE number and the new role name
            console.log(ROLE_DELETE_NUM, `+ ${role.name}`) // Logs the new ROLE_DELETE number and the new role name
            setTimeout(async () => { // Sets a timeout
                while(ROLE_DELETE_NUM > 0) { // While the ROLE_DELETE number is greater than 0
                    await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_DELETE: ROLE_DELETE_NUM - 1, $pull: { createdRoles: `+ ${role.name}` } }) // Updates the antiraid data with the new ROLE_DELETE number and the new role name
                }
            }, 1800000) // Sets the timeout to 30 minutes

        } else { // If the antiraid data doesn't exist
            const newData = new antiraid({ guildID: role.guild.id, userID: member.id }) // Creates a new antiraid data
            newData.save() // Saves the new antiraid data
            await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_DELETE: 1 }) // Updates the antiraid data with the new ROLE_DELETE number
        }
    })

    client.on('channelCreate', async (channel) => { // When a channel is created
        quarantine(channel, 'CHANNEL_CREATE') // Quarantine the user for CHANNEL_CREATE log

        const log = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE' }).then(audit => audit.entries.first()) // Gets the audit log for the channel create
        const user = log.executor // Gets the user who created the channel
        const member = await channel.guild.members.fetch(user.id) // Gets the member who created the channel
        const data = await antiraid.findOne({ guildID: channel.guild.id, userID: member.id }) // Gets the antiraid data for the member who created the channel

        if(data) { // If the antiraid data exists
            let CHANNEL_CREATE_NUM = data.CHANNEL_CREATE // Gets the CHANNEL_CREATE number
            if(!CHANNEL_CREATE_NUM) CHANNEL_CREATE_NUM = 1 // If the CHANNEL_CREATE number doesn't exist, set it to 1
                await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_CREATE: CHANNEL_CREATE_NUM + 1, $push: { createdchannels: `+ ${channel.name}` } }) // Updates the antiraid data with the new CHANNEL_CREATE number and the new channel name
            console.log(CHANNEL_CREATE_NUM, `+ ${channel.name}`) // Logs the new CHANNEL_CREATE number and the new channel name
            setTimeout(async () => { // Sets a timeout
                while(CHANNEL_CREATE_NUM > 0) { // While the CHANNEL_CREATE number is greater than 0
                    await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_CREATE: CHANNEL_CREATE_NUM - 1, $pull: { createdchannels: `+ ${channel.name}` } }) // Updates the antiraid data with the new CHANNEL_CREATE number and the new channel name
                }
            }, 1800000) // Sets the timeout to 30 minutes

        } else { // If the antiraid data doesn't exist
            const newData = new antiraid({ guildID: channel.guild.id, userID: member.id }) // Creates a new antiraid data
            newData.save() // Saves the new antiraid data
            await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_CREATE: 1 }) // Updates the antiraid data with the new CHANNEL_CREATE number
        }
    })

    client.on('channelDelete', async (channel) => { // When a channel is deleted
        quarantine(channel, 'CHANNEL_DELETE') // Quarantine the user for CHANNEL_DELETE log

        const log = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE' }).then(audit => audit.entries.first()) // Gets the audit log for the channel delete
        const user = log.executor // Gets the user who deleted the channel
        const member = await channel.guild.members.fetch(user.id) // Gets the member who deleted the channel
        const data = await antiraid.findOne({ guildID: channel.guild.id, userID: member.id }) // Gets the antiraid data for the member who deleted the channel

        if(data) { // If the antiraid data exists
            let CHANNEL_DELETE_NUM = data.CHANNEL_DELETE // Gets the CHANNEL_DELETE number
            if(!CHANNEL_DELETE_NUM) CHANNEL_DELETE_NUM = 1 // If the CHANNEL_DELETE number doesn't exist, set it to 1
                await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_DELETE: CHANNEL_DELETE_NUM + 1, $push: { DELETEdchannels: `+ ${channel.name}` } }) // Updates the antiraid data with the new CHANNEL_DELETE number and the new channel name
            console.log(CHANNEL_DELETE_NUM, `+ ${channel.name}`) // Logs the new CHANNEL_DELETE number and the new channel name
            setTimeout(async () => { // Sets a timeout
                while(CHANNEL_DELETE_NUM > 0) { // While the CHANNEL_DELETE number is greater than 0
                    await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_DELETE: CHANNEL_DELETE_NUM - 1, $pull: { DELETEdchannels: `+ ${channel.name}` } }) // Updates the antiraid data with the new CHANNEL_DELETE number and the new channel name
                }
            }, 1800000) // Sets the timeout to 30 minutes

        } else { // If the antiraid data doesn't exist
            const newData = new antiraid({ guildID: channel.guild.id, userID: member.id }) // Creates a new antiraid data
            newData.save() // Saves the new antiraid data
            await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_DELETE: 1 }) // Updates the antiraid data with the new CHANNEL_DELETE number
        }
    })

    client.on('guildBanAdd', async (ban) => {
        quarantine(ban, 'MEMBER_BAN_ADD') // Quarantine the user for MEMBER_BAN_ADD log

        const log = ban.guild.fetchAuditLogs({ type: 'MEMBER_BAN_ADD' }).then(audit => audit.entries.first()) // Gets the audit log for the member ban add
        const user = log.executor // Gets the user who banned the member
        const member = ban.guild.members.cache.get(ban.user.id) // Gets the member who was banned
        const data = antiraid.findOne({ guildID: ban.guild.id, userID: user.id }) // Gets the antiraid data for the user who banned the member

        if(data) { // If the antiraid data exists
            let MEMBER_BAN_ADD_NUM = data.MEMBER_BAN_ADD // Gets the MEMBER_BAN_ADD number
            if(!MEMBER_BAN_ADD_NUM) MEMBER_BAN_ADD_NUM = 1 // If the MEMBER_BAN_ADD number doesn't exist, set it to 1
                await antiraid.findOneAndUpdate({ guildID: ban.guild.id, userID: user.id }, { guildID: ban.guild.id, userID: user.id, MEMBER_BAN_ADD: MEMBER_BAN_ADD_NUM + 1, $push: { BANNEDmembers: `+ ${member.user.tag}` } }) // Updates the antiraid data with the new MEMBER_BAN_ADD number and the new member name
            console.log(MEMBER_BAN_ADD_NUM, `+ ${member.user.tag}`) // Logs the new MEMBER_BAN_ADD number and the new member name
            setTimeout(async () => { // Sets a timeout
                while(MEMBER_BAN_ADD_NUM > 0) { // While the MEMBER_BAN_ADD number is greater than 0
                    await antiraid.findOneAndUpdate({ guildID: ban.guild.id, userID: user.id }, { guildID: ban.guild.id, userID: user.id, MEMBER_BAN_ADD: MEMBER_BAN_ADD_NUM - 1, $pull: { BANNEDmembers: `+ ${member.user.tag}` } }) // Updates the antiraid data with the new MEMBER_BAN_ADD number and the new member name
                }
            }, 1800000) // Sets the timeout to 30 minutes

        } else { // If the antiraid data doesn't exist
            const newData = new antiraid({ guildID: ban.guild.id, userID: user.id }) // Creates a new antiraid data
            newData.save() // Saves the new antiraid data
            await antiraid.findOneAndUpdate({ guildID: ban.guild.id, userID: user.id }, { guildID: ban.guild.id, userID: user.id, MEMBER_BAN_ADD: 1 }) // Updates the antiraid data with the new MEMBER_BAN_ADD number
        }
    })

    client.on('guildBanRemove', async (ban) => {
        quarantine(ban, 'MEMBER_BAN_REMOVE') // Quarantine the user for MEMBER_BAN_REMOVE log

        const log = ban.guild.fetchAuditLogs({ type: 'MEMBER_BAN_REMOVE' }).then(audit => audit.entries.first()) // Gets the audit log for the member ban remove
        const user = log.executor // Gets the user who unbanned the member
        const member = ban.guild.members.cache.get(ban.user.id) // Gets the member who was unbanned
        const data = antiraid.findOne({ guildID: ban.guild.id, userID: user.id }) // Gets the antiraid data for the user who unbanned the member

        if(data) { // If the antiraid data exists
            let MEMBER_BAN_REMOVE_NUM = data.MEMBER_BAN_REMOVE // Gets the MEMBER_BAN_REMOVE number
            if(!MEMBER_BAN_REMOVE_NUM) MEMBER_BAN_REMOVE_NUM = 1 // If the MEMBER_BAN_REMOVE number doesn't exist, set it to 1
                await antiraid.findOneAndUpdate({ guildID: ban.guild.id, userID: user.id }, { guildID: ban.guild.id, userID: user.id, MEMBER_BAN_REMOVE: MEMBER_BAN_REMOVE_NUM + 1, $push: { UNBANNEDmembers: `+ ${member.user.tag}` } }) // Updates the antiraid data with the new MEMBER_BAN_REMOVE number and the new member name
            console.log(MEMBER_BAN_REMOVE_NUM, `+ ${member.user.tag}`) // Logs the new MEMBER_BAN_REMOVE number and the new member name
            setTimeout(async () => { // Sets a timeout
                while(MEMBER_BAN_REMOVE_NUM > 0) { // While the MEMBER_BAN_REMOVE number is greater than 0
                    await antiraid.findOneAndUpdate({ guildID: ban.guild.id, userID: user.id }, { guildID: ban.guild.id, userID: user.id, MEMBER_BAN_REMOVE: MEMBER_BAN_REMOVE_NUM - 1, $pull: { UNBANNEDmembers: `+ ${member.user.tag}` } }) // Updates the antiraid data with the new MEMBER_BAN_REMOVE number and the new member name
                }
            }, 1800000) // Sets the timeout to 30 minutes

        } else { // If the antiraid data doesn't exist
            const newData = new antiraid({ guildID: ban.guild.id, userID: user.id }) // Creates a new antiraid data
            newData.save() // Saves the new antiraid data
            await antiraid.findOneAndUpdate({ guildID: ban.guild.id, userID: user.id }, { guildID: ban.guild.id, userID: user.id, MEMBER_BAN_REMOVE: 1 }) // Updates the antiraid data with the new MEMBER_BAN_REMOVE number
        }
    })
}