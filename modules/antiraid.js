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

    client.on('interactionCreate', async (interaction) => {
        if(!interaction.isButton()) return
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
            .setDescription(`${emojis.success} Successfully restored the member\n${emojis.user} **Member:** ${quarantinedUser}\n${emojis.id} **Member ID:** ${userID}\n${emojis.mod} **Moderator:** ${interaction.member.user.tag}\n${emojis.description} **Reason for getting quarantined:** Member Triggered Antiraid | Trigger ID: \`ROLE_CREATE\``)
            interaction.channel.send({ embeds: [ successEmbed ] })
        } else if(interaction.customId === 'ban') {
            quarantinedUser.ban({ reason: `Member Triggered Antiraid and was Banned by ${interaction.member.user.tag}` })
            interaction.update({ components: [ disabledLogsRow ] })

            const successEmbed = new MessageEmbed() // Creating an embed
            .setColor('GREEN')
            .setAuthor(`${interaction.member.user.tag}`, interaction.member.user.displayAvatarURL({ dynamic: true }))
            .setFooter(botname)
            .setTimestamp()
            .setDescription(`${emojis.success} Successfully banned the member\n${emojis.user} **Member:** ${quarantinedUser}\n${emojis.id} **Member ID:** ${userID}\n${emojis.mod} **Moderator:** ${interaction.member.user.tag}\n${emojis.description} **Reason for getting quarantined:** Member Triggered Antiraid | Trigger ID: \`ROLE_CREATE\``)
            interaction.channel.send({ embeds: [ successEmbed ] })
        }
    })

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
            if(!ROLE_CREATE_NUM) ROLE_CREATE_NUM = 1
                await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: ROLE_CREATE_NUM + 1, $push: { createdRoles: `+ ${role.name}` } })
            console.log(ROLE_CREATE_NUM, `+ ${role.name}`)
            setTimeout(async () => {
                while(ROLE_CREATE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: role.guild.id, userID: member.id }, { guildID: role.guild.id, userID: member.id, ROLE_CREATE: ROLE_CREATE_NUM - 1, $pull: { createdRoles: `+ ${role.name}` } })
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
                logsChannel.send({ embeds: [ embed ], components: [ logsRow ] })

                const userEmbed = new MessageEmbed()
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
                .setColor('RED')
                .setDescription(`${emojis.mask} You have been quarantined in **${role.guild.name}**\n${emojis.description} **Reason:** Anti-Raid Triggered | ID: \`ROLE_CREATE\`\n${emojis.blank} User created more than 5 roles in the last 30 minutes.\n${emojis.role} **Roles:** \`\`\`diff\n${data.createdRoles.join('\n')}\`\`\``)
                .setTimestamp()
                .setFooter(botname)
                member.send({ embeds: [ userEmbed ] })
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

    client.on('channelCreate', async (channel) => {
        let logsChannel // Channel for logging.
        if(channel.guild.channels.cache.find(ch => ch.name.includes('mod-logs'))) { // If there is a mod-logs channel in the server
            const logsChannelID = channel.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
            logsChannel = channel.guild.channels.cache.get(logsChannelID) // Sets the Mod-Logs channel from the server
        } else { // If there isn't a mod-logs channel in the server
            logsChannel = await channel.guild.channels.create('mod-logs', { type: 'GUILD_TEXT', topic: 'Mod Logs channels for bots.', reason: 'Logging channel required by wend.' }) // Creates a new mod-logs channel and sets the logsChannel to that channel.
        }

        const log = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await channel.guild.members.fetch(user.id)
        if(member.id === client.user.id) return
        if(member.roles.cache.find(r => r.name.includes('Trusted')) || member.id === channel.guild.ownerId) return

        const data = await antiraid.findOne({ guildID: channel.guild.id, userID: member.id })
        if(data) {
            let CHANNEL_CREATE_NUM = data.CHANNEL_CREATE
            if(!CHANNEL_CREATE_NUM) CHANNEL_CREATE_NUM = 0
                await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_CREATE: CHANNEL_CREATE_NUM + 1 })
            console.log(CHANNEL_CREATE_NUM)
            setTimeout(async () => {
                while(CHANNEL_CREATE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_CREATE: CHANNEL_CREATE_NUM - 1 })
                }
            }, 1800000)

            let limit = 5
            if(CHANNEL_CREATE_NUM > limit) {
                let quarantinedRole
                if(channel.guild.roles.cache.find(r => r.name.includes('Quarantined'))) quarantinedRole = channel.guild.roles.cache.find(r => r.name.includes('Quarantined'))
                else quarantinedRole = await channel.guild.roles.create({ name: 'Quarantined', reason: 'Quarantined role required by Wend\'s Anti Raid Feature.' })

                const allChannels = channel.guild.channels.cache.filter(ch => ch.type !== 'GUILD_CATEGORY')
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
            const newData = new antiraid({ guildID: channel.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_CREATE: 1 })
        }
    })

    client.on('channelDelete', async (channel) => {
        let logsChannel // Channel for logging.
        if(channel.guild.channels.cache.find(ch => ch.name.includes('mod-logs'))) { // If there is a mod-logs channel in the server
            const logsChannelID = channel.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).id // Getting the ID of the Mod-Logs channel in the server
            logsChannel = channel.guild.channels.cache.get(logsChannelID) // Sets the Mod-Logs channel from the server
        } else { // If there isn't a mod-logs channel in the server
            logsChannel = await channel.guild.channels.create('mod-logs', { type: 'GUILD_TEXT', topic: 'Mod Logs channels for bots.', reason: 'Logging channel required by wend.' }) // Creates a new mod-logs channel and sets the logsChannel to that channel.
        }

        const log = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await channel.guild.members.fetch(user.id)
        if(member.id === client.user.id) return
        if(member.roles.cache.find(r => r.name.includes('Trusted')) || member.id === channel.guild.ownerId) return

        const data = await antiraid.findOne({ guildID: channel.guild.id, userID: member.id })
        if(data) {
            let CHANNEL_DELETE_NUM = data.CHANNEL_DELETE
            if(!CHANNEL_DELETE_NUM) CHANNEL_DELETE_NUM = 0
                await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_DELETE: CHANNEL_DELETE_NUM + 1 })
            console.log(CHANNEL_DELETE_NUM)
            setTimeout(async () => {
                while(CHANNEL_DELETE_NUM > 0) {
                    await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_DELETE: CHANNEL_DELETE_NUM - 1 })
                }
            }, 1800000)

            let limit = 5
            if(CHANNEL_DELETE_NUM > limit) {
                let quarantinedRole
                if(channel.guild.roles.cache.find(r => r.name.includes('Quarantined'))) quarantinedRole = channel.guild.roles.cache.find(r => r.name.includes('Quarantined'))
                else quarantinedRole = await channel.guild.roles.create({ name: 'Quarantined', reason: 'Quarantined role required by Wend\'s Anti Raid Feature.' })

                const allChannels = channel.guild.channels.cache.filter(ch => ch.type !== 'GUILD_CATEGORY')
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
            const newData = new antiraid({ guildID: channel.guild.id, userID: member.id })
            newData.save()
            await antiraid.findOneAndUpdate({ guildID: channel.guild.id, userID: member.id }, { guildID: channel.guild.id, userID: member.id, CHANNEL_DELETE: 1 })
        }
    })
}