const emojis = require('../utils/emojis.json')
const { MessageEmbed } = require('discord.js')
const { botname } = require('../config.json')
const antiraid = require('../models/antiraid')

module.exports = (client) => {
    client.on('roleCreate', async (role) => {
        let logsChannel // Channel for logging.
        if(role.guild.channels.cache.find(ch => ch.name.includes('mod-logs'))) { // If there is a mod-logs channel in the server
            const logsChannelID = role.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
            logsChannel = role.guild.channels.cache.get(logsChannelID) // Sets the Mod-Logs channel from the server
        } else { // If there isn't a mod-logs channel in the server
            logsChannel = await role.guild.channels.create('mod-logs', { type: 'GUILD_TEXT', topic: 'Mod Logs channels for bots.', reason: 'Logging channel required by wend.' }) // Creates a new mod-logs channel and sets the logsChannel to that channel.
        }

        if(role.managed === true) return
        const log = await role.guild.fetchAuditLogs({ type: 'ROLE_CREATE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await role.guild.members.fetch(user.id)
        if(member.id === client.user.id) return
        if(member.roles.cache.find(r => r.name.includes('Trusted')) || member.id === role.guild.ownerId) return

        const data = await antiraid.findOne({ guildID: role.guild.id, userID: member.id })
        if(data) {
            let ROLE_CREATE_NUM = data.ROLE_CREATE
            if(!ROLE_CREATE_NUM) ROLE_CREATE_NUM = 0
                await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: ROLE_CREATE_NUM + 1 })
            console.log(ROLE_CREATE_NUM)
            setTimeout(async () => {
                while(ROLE_CREATE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: ROLE_CREATE_NUM - 1 })
                }
            }, 1800000)

            let limit = 5
            if(ROLE_CREATE_NUM > limit) {
                let quarantinedRole
                if(role.guild.roles.cache.find(r => r.name.includes('Quarantined'))) quarantinedRole = role.guild.roles.cache.find(r => r.name.includes('Quarantined'))
                else quarantinedRole = await role.guild.roles.create({ name: 'Quarantined', reason: 'Quarantined role required by Wend\'s Anti Raid Feature.' })

                const allChannels = role.guild.channels.cache.filter(ch => ch.type !== 'GUILD_CATEGORY')
                allChannels.forEach(ch => ch.permissionOverwrites.create(quarantinedRole, { SEND_MESSAGES: false, ADD_REACTIONS: false, VIEW_CHANNEL: false }))

                member.roles.set([quarantinedRole])
                const embed = new MessageEmbed()
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
                .setColor('GREEN')
                .setTitle('Member Quarantined.')
                .setDescription(`${emojis.user} **Member:** ${member.user.tag}\n${emojis.id} **Member ID:** ${member.id}\n${emojis.role} **All Roles Cleansed:** ${emojis.success}\n${emojis.mask} **Member Quarantined:** ${emojis.success}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`ROLE_CREATE\``)
                .setTimestamp()
                .setFooter(botname)
                logsChannel.send({ embeds: [ embed ] })
            }
            } else {
            const newData = new antiraid({ guildID: role.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: 1 })
        }
    })

    client.on('roleDelete', async (role) => {
        let logsChannel // Channel for logging.
        if(role.guild.channels.cache.find(ch => ch.name.includes('mod-logs'))) { // If there is a mod-logs channel in the server
            const logsChannelID = role.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
            logsChannel = role.guild.channels.cache.get(logsChannelID) // Sets the Mod-Logs channel from the server
        } else { // If there isn't a mod-logs channel in the server
            logsChannel = await role.guild.channels.create('mod-logs', { type: 'GUILD_TEXT', topic: 'Mod Logs channels for bots.', reason: 'Logging channel required by wend.' }) // Creates a new mod-logs channel and sets the logsChannel to that channel.
        }

        if(role.managed === true) return
        const log = await role.guild.fetchAuditLogs({ type: 'ROLE_DELETE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await role.guild.members.fetch(user.id)
        if(member.id === client.user.id) return
        if(member.roles.cache.find(r => r.name.includes('Trusted')) || member.id === role.guild.ownerId) return

        const data = await antiraid.findOne({ guildID: role.guild.id, userID: member.id })
        if(data) {
            let ROLE_DELETE_NUM = data.ROLE_DELETE
            if(!ROLE_DELETE_NUM) ROLE_DELETE_NUM = 0
                await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_DELETE: ROLE_DELETE_NUM + 1 })
            console.log(ROLE_DELETE_NUM)
            setTimeout(async () => {
                while(ROLE_DELETE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_DELETE: ROLE_DELETE_NUM - 1 })
                }
            }, 1800000)

            let limit = 5
            if(ROLE_DELETE_NUM > limit) {
                let quarantinedRole
                if(role.guild.roles.cache.find(r => r.name.includes('Quarantined'))) quarantinedRole = role.guild.roles.cache.find(r => r.name.includes('Quarantined'))
                else quarantinedRole = await role.guild.roles.create({ name: 'Quarantined', reason: 'Quarantined role required by Wend\'s Anti Raid Feature.' })

                const allChannels = role.guild.channels.cache.filter(ch => ch.type !== 'GUILD_CATEGORY')
                allChannels.forEach(ch => ch.permissionOverwrites.create(quarantinedRole, { SEND_MESSAGES: false, ADD_REACTIONS: false, VIEW_CHANNEL: false }))

                member.roles.set([quarantinedRole])
                const embed = new MessageEmbed()
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
                .setColor('GREEN')
                .setTitle('Member Quarantined.')
                .setDescription(`${emojis.user} **Member:** ${member.user.tag}\n${emojis.id} **Member ID:** ${member.id}\n${emojis.role} **All Roles Cleansed:** ${emojis.success}\n${emojis.mask} **Member Quarantined:** ${emojis.success}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`ROLE_DELETE\``)
                .setTimestamp()
                .setFooter(botname)
                logsChannel.send({ embeds: [ embed ] })
            }
            } else {
            const newData = new antiraid({ guildID: role.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_DELETE: 1 })
        }
    })

    client.on('channelCreate', async (role) => {
        let logsChannel // Channel for logging.
        if(role.guild.channels.cache.find(ch => ch.name.includes('mod-logs'))) { // If there is a mod-logs channel in the server
            const logsChannelID = role.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
            logsChannel = role.guild.channels.cache.get(logsChannelID) // Sets the Mod-Logs channel from the server
        } else { // If there isn't a mod-logs channel in the server
            logsChannel = await role.guild.channels.create('mod-logs', { type: 'GUILD_TEXT', topic: 'Mod Logs channels for bots.', reason: 'Logging channel required by wend.' }) // Creates a new mod-logs channel and sets the logsChannel to that channel.
        }

        if(role.managed === true) return
        const log = await role.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await role.guild.members.fetch(user.id)
        if(member.id === client.user.id) return
        if(member.roles.cache.find(r => r.name.includes('Trusted')) || member.id === role.guild.ownerId) return

        const data = await antiraid.findOne({ guildID: role.guild.id, userID: member.id })
        if(data) {
            let CHANNEL_CREATE_NUM = data.CHANNEL_CREATE
            if(!CHANNEL_CREATE_NUM) CHANNEL_CREATE_NUM = 0
                await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, CHANNEL_CREATE: CHANNEL_CREATE_NUM + 1 })
            console.log(CHANNEL_CREATE_NUM)
            setTimeout(async () => {
                while(CHANNEL_CREATE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, CHANNEL_CREATE: CHANNEL_CREATE_NUM - 1 })
                }
            }, 1800000)

            let limit = 5
            if(CHANNEL_CREATE_NUM > limit) {
                let quarantinedRole
                if(role.guild.roles.cache.find(r => r.name.includes('Quarantined'))) quarantinedRole = role.guild.roles.cache.find(r => r.name.includes('Quarantined'))
                else quarantinedRole = await role.guild.roles.create({ name: 'Quarantined', reason: 'Quarantined role required by Wend\'s Anti Raid Feature.' })

                const allChannels = role.guild.channels.cache.filter(ch => ch.type !== 'GUILD_CATEGORY')
                allChannels.forEach(ch => ch.permissionOverwrites.create(quarantinedRole, { SEND_MESSAGES: false, ADD_REACTIONS: false, VIEW_CHANNEL: false }))

                member.roles.set([quarantinedRole])
                const embed = new MessageEmbed()
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
                .setColor('GREEN')
                .setTitle('Member Quarantined.')
                .setDescription(`${emojis.user} **Member:** ${member.user.tag}\n${emojis.id} **Member ID:** ${member.id}\n${emojis.role} **All Roles Cleansed:** ${emojis.success}\n${emojis.mask} **Member Quarantined:** ${emojis.success}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`CHANNEL_CREATE\``)
                .setTimestamp()
                .setFooter(botname)
                logsChannel.send({ embeds: [ embed ] })
            }
            } else {
            const newData = new antiraid({ guildID: role.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, CHANNEL_CREATE: 1 })
        }
    })

    client.on('channelDelete', async (role) => {
        let logsChannel // Channel for logging.
        if(role.guild.channels.cache.find(ch => ch.name.includes('mod-logs'))) { // If there is a mod-logs channel in the server
            const logsChannelID = role.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
            logsChannel = role.guild.channels.cache.get(logsChannelID) // Sets the Mod-Logs channel from the server
        } else { // If there isn't a mod-logs channel in the server
            logsChannel = await role.guild.channels.create('mod-logs', { type: 'GUILD_TEXT', topic: 'Mod Logs channels for bots.', reason: 'Logging channel required by wend.' }) // Creates a new mod-logs channel and sets the logsChannel to that channel.
        }

        if(role.managed === true) return
        const log = await role.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await role.guild.members.fetch(user.id)
        if(member.id === client.user.id) return
        if(member.roles.cache.find(r => r.name.includes('Trusted')) || member.id === role.guild.ownerId) return

        const data = await antiraid.findOne({ guildID: role.guild.id, userID: member.id })
        if(data) {
            let CHANNEL_DELETE_NUM = data.CHANNEL_DELETE
            if(!CHANNEL_DELETE_NUM) CHANNEL_DELETE_NUM = 0
                await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, CHANNEL_DELETE: CHANNEL_DELETE_NUM + 1 })
            console.log(CHANNEL_DELETE_NUM)
            setTimeout(async () => {
                while(CHANNEL_DELETE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, CHANNEL_DELETE: CHANNEL_DELETE_NUM - 1 })
                }
            }, 1800000)

            let limit = 5
            if(CHANNEL_DELETE_NUM > limit) {
                let quarantinedRole
                if(role.guild.roles.cache.find(r => r.name.includes('Quarantined'))) quarantinedRole = role.guild.roles.cache.find(r => r.name.includes('Quarantined'))
                else quarantinedRole = await role.guild.roles.create({ name: 'Quarantined', reason: 'Quarantined role required by Wend\'s Anti Raid Feature.' })

                const allChannels = role.guild.channels.cache.filter(ch => ch.type !== 'GUILD_CATEGORY')
                allChannels.forEach(ch => ch.permissionOverwrites.create(quarantinedRole, { SEND_MESSAGES: false, ADD_REACTIONS: false, VIEW_CHANNEL: false }))

                member.roles.set([quarantinedRole])
                const embed = new MessageEmbed()
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
                .setColor('GREEN')
                .setTitle('Member Quarantined.')
                .setDescription(`${emojis.user} **Member:** ${member.user.tag}\n${emojis.id} **Member ID:** ${member.id}\n${emojis.role} **All Roles Cleansed:** ${emojis.success}\n${emojis.mask} **Member Quarantined:** ${emojis.success}\n${emojis.description} **Reason:** Member Triggered Anti-Raid | Trigger ID: \`CHANNEL_DELETE\``)
                .setTimestamp()
                .setFooter(botname)
                logsChannel.send({ embeds: [ embed ] })
            }
            } else {
            const newData = new antiraid({ guildID: role.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, CHANNEL_DELETE: 1 })
        }
    })
}