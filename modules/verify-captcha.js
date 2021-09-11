const { MessageEmbed } = require('discord.js')
const { CaptchaGenerator } = require('captcha-canvas')
const fs = require('fs')
const emojis = require('../utils/emojis.json')
const { botname } = require('../config.json')

module.exports = (client) => {
    client.on('guildMemberAdd', async (member) => {
        const { guild } = member
        let quarantinedRole // Quarantined role
        if(guild.roles.cache.find(r => r.name.includes('Quarantined'))) quarantinedRole = guild.roles.cache.find(r => r.name.includes('Quarantined')) // If there is a quarantined role in the server
        else quarantinedRole = await guild.roles.create({ name: 'Quarantined', reason: 'Quarantined role required by Wend\'s Anti Raid Feature.' }) // If there isn't a quarantined role in the server, create one

        const allChannels = guild.channels.cache.filter(ch => ch.type !== 'GUILD_CATEGORY') // Gets all channels in the server
        allChannels.forEach(ch => ch.permissionOverwrites.create(quarantinedRole, { SEND_MESSAGES: false, ADD_REACTIONS: false, VIEW_CHANNEL: false })) // Sets the permissions for all channels to the quarantined role

        member.roles.set([quarantinedRole]) // Adds the quarantined role to the user

        const captcha = new CaptchaGenerator().setTrace({ size: 3, color: '#1ABC9C' }).setCaptcha({ color: '#00bfff' }) // Creates a new captcha generator
        const buffer = await captcha.generate() // Generates the captcha
        fs.writeFileSync('./assets/captcha/image.png', buffer)

        const embed = new MessageEmbed()
        .setTitle('Verification System')
        .setDescription(
            `${emojis.group} You need to message the given captcha in order to access **<@${guild.name}**\n` +
            `${emojis.warning} **Things to be noted while filling captcha:**\n` +
            `${emojis.blank} ${emojis.checklist} Type the colored characters from Left to Right.\n` +
            `${emojis.blank} ${emojis.rulesgray} Ignore the light gray characters as they are decoy characters.\n` +
            `${emojis.blank} ${emojis.capitalization} All the characters are to be typed capitalized, small letters won't be considered.\n` +
            `${emojis.blank} ${emojis.slowmode} You only have 15 seconds to complete the verification process.`,
        )
        .setImage('./assets/captcha/image.png')
        .setFooter(botname)
        .setTimestamp()
        .setColor('#1ABC9C')
        member.send({ embeds: [embed] }) // Sends the captcha to the user

        const filter = (m) => { return m.author.id === member.id } // Filters the message to the user
        const msgs = await member.user.dmChannel.awaitMessages({ filter, max: 1, time: 15000 })
        if(!msgs.size) return
        console.log(msgs.first().content)
        if(msgs.first().content === captcha.text) {
            member.roles.remove(quarantinedRole) // Removes the quarantined role from the user
       } else {
            member.kick(`${member.user.tag} was kicked for not verifying their captcha.`) // Kicks the user
       }
    })
}