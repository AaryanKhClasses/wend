const emojis = require('../utils/emojis.json')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { botname } = require('../config.json')
const antiraid = require('../models/antiraid')

module.exports = (client) => {
    const logsRow = new MessageActionRow().addComponents(
        new MessageButton()
        .setCustomId('unquarantine')
        .setLabel('Restore User')
        .setStyle('SUCCESS'),

        new MessageButton()
        .setCustomId('ban')
        .setLabel('Ban User')
        .setStyle('DANGER'),
    )

    const disabledLogsRow = new MessageActionRow().addComponents(
        new MessageButton()
        .setCustomId('unquarantine_disabled')
        .setLabel('Restore User')
        .setStyle('SUCCESS')
        .setDisabled(),

        new MessageButton()
        .setCustomId('ban_disabled')
        .setLabel('Ban User')
        .setStyle('DANGER')
        .setDisabled(),
    )

    async function quarantine(action, logType) {
        let limit = 5
        let logsChannel // Channel for logging.
        if(action.guild.channels.cache.find(ch => ch.name.includes('mod-logs'))) { // If there is a mod-logs channel in the server
            const logsChannelID = action.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
            logsChannel = action.guild.channels.cache.get(logsChannelID) // Sets the Mod-Logs channel from the server
        } else { // If there isn't a mod-logs channel in the server
            logsChannel = await action.guild.channels.create('mod-logs', { type: 'GUILD_TEXT', topic: 'Mod Logs channels for bots.', reason: 'Logging channel required by wend.' }) // Creates a new mod-logs channel and sets the logsChannel to that channel.
        }

        const log = await action.guild.fetchAuditLogs({ type: logType }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await action.guild.members.fetch(user.id)
        if(member.id === client.user.id) return
        if(member.roles.cache.find(r => r.name.includes('Trusted')) || member.id === action.guild.ownerId) return

        const data = await antiraid.findOne({ guildID: action.guild.id, userID: member.id })
        if(data) {
            let ROLE_CREATE_NUM = data.ROLE_CREATE
            if(!ROLE_CREATE_NUM) ROLE_CREATE_NUM = 1
            if(ROLE_CREATE_NUM > limit) {
                let quarantinedRole
                if(action.guild.roles.cache.find(r => r.name.includes('Quarantined'))) quarantinedRole = action.guild.roles.cache.find(r => r.name.includes('Quarantined'))
                else quarantinedRole = await action.guild.roles.create({ name: 'Quarantined', reason: 'Quarantined role required by Wend\'s Anti Raid Feature.' })

                const allChannels = action.guild.channels.cache.filter(ch => ch.type !== 'GUILD_CATEGORY')
                allChannels.forEach(ch => ch.permissionOverwrites.create(quarantinedRole, { SEND_MESSAGES: false, ADD_REACTIONS: false, VIEW_CHANNEL: false }))

                member.roles.set([quarantinedRole])
                const embed = new MessageEmbed()
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
                .setColor('GREEN')
                .setTitle('Member Quarantined.')
                .setDescription(`${emojis.user} **Member:** ${member.user.tag}\n${emojis.id} **Member ID:** ${member.id}\n${emojis.role} **All Roles Cleansed:** ${emojis.success}\n${emojis.mask} **Member Quarantined:** ${emojis.success}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`${logType}\``)
                .setTimestamp()
                .setFooter(botname)
                logsChannel.send({ embeds: [ embed ], components: [ logsRow ] })

                const userEmbed = new MessageEmbed()
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
                .setColor('RED')
                .setDescription(`${emojis.mask} You have been quarantined in **${action.guild.name}**\n${emojis.description} **Reason:** Anti-Raid Triggered | ID: \`${logType}\`\n${emojis.blank} User created more than 5 roles in the last 30 minutes.\n${emojis.role} **Roles:** \`\`\`diff\n${data.createdRoles.join('\n')}\`\`\``)
                .setTimestamp()
                .setFooter(botname)
                member.send({ embeds: [ userEmbed ] })
            }
        }
    }

    async function unquarantine(interaction, logType) {
        if(!interaction.isButton()) return
        if(!interaction.member.roles.cache.find(r => r.name.includes('Trusted')) || interaction.member.id !== interaction.guild.ownerId) {
            const embed = new MessageEmbed()
            .setAuthor(`${interaction.member.user.tag}`, interaction.member.user.displayAvatarURL({ dynamic: true }))
            .setColor('RED')
            .setDescription(`${emojis.error} You do not have the permission to use this command.\n${emojis.doubleArrow} **Permissions Required:** \`Trusted Administrator\` OR \`Server Owner\``)
            .setTimestamp()
            .setFooter(botname)
            interaction.message.reply({ embeds: [ embed ] })
        }

        const userID = interaction.message.embeds[0].description.split('ID:** ')[1].substring(0, 18)
        let quarantinedUser
        if(interaction.guild.members.fetch(userID)) quarantinedUser = await interaction.guild.members.fetch(userID)
        else {
            const errorEmbed = new MessageEmbed() // Creating an embed
            .setColor('RED')
            .setAuthor(`${interaction.member.user.tag}`, interaction.member.user.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.error} Cannot find the quarantined member\n${emojis.fix} **Possible Fixes:** Here is a list of possible fixes\n${emojis.blank} ${emojis.guildRemove} The user may have left the server.`)
            return interaction.reply({ embeds: [ errorEmbed ] })
        }

        if(interaction.customId === "unquarantine") {
            const quarantinedRole = interaction.guild.roles.cache.find(r => r.name.includes('Quarantined'))
            quarantinedUser.roles.remove(quarantinedRole)
            interaction.update({ components: [ disabledLogsRow ] })

            const successEmbed = new MessageEmbed() // Creating an embed
            .setColor('GREEN')
            .setAuthor(`${interaction.member.user.tag}`, interaction.member.user.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.success} Successfully restored the member\n${emojis.user} **Member:** ${quarantinedUser}\n${emojis.id} **Member ID:** ${userID}\n${emojis.mod} **Moderator:** ${interaction.member.user.tag}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`${logType}\``)
            interaction.message.reply({ embeds: [ successEmbed ] })
        } else if(interaction.customId === 'ban') {
            quarantinedUser.ban({ reason: `Member Triggered Anti-Raid and was Banned by ${interaction.member.user.tag}` })
            interaction.update({ components: [ disabledLogsRow ] })

            const successEmbed = new MessageEmbed() // Creating an embed
            .setColor('GREEN')
            .setAuthor(`${interaction.member.user.tag}`, interaction.member.user.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.success} Successfully banned the member\n${emojis.user} **Member:** ${quarantinedUser}\n${emojis.id} **Member ID:** ${userID}\n${emojis.mod} **Moderator:** ${interaction.member.user.tag}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`${logType}\``)
            interaction.message.reply({ embeds: [ successEmbed ] })
        }
    }

    client.on('interactionCreate', async (interaction) => {
        unquarantine(interaction, 'ROLE_CREATE')
    })

    client.on('roleCreate', async (role) => {
        quarantine(role, 'ROLE_CREATE')

        const log = await role.guild.fetchAuditLogs({ type: 'ROLE_CREATE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await role.guild.members.fetch(user.id)
        const data = await antiraid.findOne({ guildID: role.guild.id, userID: member.id })

        if(data) {
            let ROLE_CREATE_NUM = data.ROLE_CREATE
            if(!ROLE_CREATE_NUM) ROLE_CREATE_NUM = 1
                await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: ROLE_CREATE_NUM + 1, $push: { createdRoles: `+ ${role.name}` } })
            console.log(ROLE_CREATE_NUM, `+ ${role.name}`)
            setTimeout(async () => {
                while(ROLE_CREATE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: ROLE_CREATE_NUM - 1, $pull: { createdRoles: `+ ${role.name}` } })
                }
            }, 1800000)

        } else {
            const newData = new antiraid({ guildID: role.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: 1 })
        }
    })

    client.on('roleDelete', async (role) => {
        quarantine(role, 'ROLE_DELETE')

        const log = await role.guild.fetchAuditLogs({ type: 'ROLE_DELETE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await role.guild.members.fetch(user.id)
        const data = await antiraid.findOne({ guildID: role.guild.id, userID: member.id })

        if(data) {
            let ROLE_DELETE_NUM = data.ROLE_DELETE
            if(!ROLE_DELETE_NUM) ROLE_DELETE_NUM = 1
                await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_DELETE: ROLE_DELETE_NUM + 1, $push: { createdRoles: `+ ${role.name}` } })
            console.log(ROLE_DELETE_NUM, `+ ${role.name}`)
            setTimeout(async () => {
                while(ROLE_DELETE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_DELETE: ROLE_DELETE_NUM - 1, $pull: { createdRoles: `+ ${role.name}` } })
                }
            }, 1800000)

        } else {
            const newData = new antiraid({ guildID: role.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_DELETE: 1 })
        }
    })

    client.on('channelCreate', async (channel) => {
        quarantine(channel, 'CHANNEL_CREATE')

        const log = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await channel.guild.members.fetch(user.id)
        const data = await antiraid.findOne({ guildID: channel.guild.id, userID: member.id })

        if(data) {
            let CHANNEL_CREATE_NUM = data.CHANNEL_CREATE
            if(!CHANNEL_CREATE_NUM) CHANNEL_CREATE_NUM = 1
                await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_CREATE: CHANNEL_CREATE_NUM + 1, $push: { createdchannels: `+ ${channel.name}` } })
            console.log(CHANNEL_CREATE_NUM, `+ ${channel.name}`)
            setTimeout(async () => {
                while(CHANNEL_CREATE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_CREATE: CHANNEL_CREATE_NUM - 1, $pull: { createdchannels: `+ ${channel.name}` } })
                }
            }, 1800000)

        } else {
            const newData = new antiraid({ guildID: channel.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_CREATE: 1 })
        }
    })

    client.on('channelDelete', async (channel) => {
        quarantine(channel, 'CHANNEL_DELETE')

        const log = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await channel.guild.members.fetch(user.id)
        const data = await antiraid.findOne({ guildID: channel.guild.id, userID: member.id })

        if(data) {
            let CHANNEL_DELETE_NUM = data.CHANNEL_DELETE
            if(!CHANNEL_DELETE_NUM) CHANNEL_DELETE_NUM = 1
                await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_DELETE: CHANNEL_DELETE_NUM + 1, $push: { DELETEdchannels: `+ ${channel.name}` } })
            console.log(CHANNEL_DELETE_NUM, `+ ${channel.name}`)
            setTimeout(async () => {
                while(CHANNEL_DELETE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_DELETE: CHANNEL_DELETE_NUM - 1, $pull: { DELETEdchannels: `+ ${channel.name}` } })
                }
            }, 1800000)

        } else {
            const newData = new antiraid({ guildID: channel.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_DELETE: 1 })
        }
    })
}