// Importing Modules
const { MessageEmbed } = require('discord.js')
const { botname } = require('../../config.json')
const emojis = require('../../utils/emojis.json')

module.exports = {
    name: 'ping',
    aliases: ['pong'],
    description: 'Ping the bot',
    run(client, message, args) {
        const preEmbed = new MessageEmbed()
        .setColor('BLUE')
        .setTimestamp()
        .setFooter(botname)
        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
        .setDescription(`Pinging...`)
        message.reply({ embeds: [ preEmbed ] }).then(m => {
            const ping = m.createdTimestamp - message.createdTimestamp
            const embed = new MessageEmbed()
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setColor('GREEN')
            .setTimestamp()
            .setFooter(botname)
            .setDescription(`Pong! The ping is \`${ping}\`ms`)
            m.edit({ embeds: [ embed ] })
        })
    },
}