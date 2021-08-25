const emojis = require('../utils/emojis.json')
const { MessageEmbed } = require('discord.js')
const { botname } = require('../config.json')
// const antiraid = require('../models/antiraid')

module.exports = (client) => {
    client.on('roleCreate', async (role) => {
        if(role.managed === true) return
        const log = await role.guild.fetchAuditLogs({ type: 'ROLE_CREATE' }).then(audit => audit.entries.first())
        const user = log.executor
        const member = await role.guild.members.fetch(user.id)
        if(member.id === client.user.id) return
        if(member.roles.cache.find(r => r.name.includes('Trusted'))) return

        // const DBGuild = await antiraid.findOne({ guildID: role.guild.id })
        // if(DBGuild.whitelistedUsers.indexOf(member.id) > -1) return
        // const plusEventNO = DBGuild.triggeredUsers.eventNO + 1
        // await DBGuild.findOneAndUpdate({ guildID: role.guild.id }, { $push: { triggeredUsers: { userID: member.id, eventNO: plusEventNO } })

        let limit = 5
        // if(plusEventNO > limit) {
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
            .setDescription(`${emojis.user} **Member:** ${member.user.tag}\n${emojis.id} **Member ID:** ${member.id}\n${emojis.role} **All Roles Cleansed:** ${emojis.success}\n **Member Quarantined:** ${emojis.success}`)
            .addField(`${emojis.description} Reason`, `Member tried to raid the server by breaking the role creatiom limit.`)
            .setTimestamp()
            .setFooter(botname)
            role.guild.channels.cache.find(ch => ch.name.includes('mod-logs')).send({ embeds: [ embed ] })
        // }
    })
}