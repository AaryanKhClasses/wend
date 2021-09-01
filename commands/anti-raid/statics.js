const { MessageEmbed } = require('discord.js')
const emojis = require('../../utils/emojis.json')
const { botname } = require('../../config.json')
const settings = require('../../models/settings')

module.exports = {
    name: 'statics',
    aliases: ['static', 's'],
    permLevel: 4,
    cooldown: 10,
    async run(client, message, args) {
        const guildSettings = await settings.findOne({ guildID: message.guild.id })
        if(!guildSettings) {
            const newSettings = new settings({ guildID: message.guild.id, helperRole: '', modRole: '', adminRole: '', trustedRole: '', trustedUsers: '' })
            newSettings.save()
        } else {
            let target
            if(message.mentions.roles.first()) target = message.mentions.roles.first()
            else if(args[0]) {
                if(message.guild.roles.cache.get(args[0])) target = message.guild.roles.cache.get(args[0])
                else {
                    const errorEmbed = new MessageEmbed() // Creating an embed
                    .setColor('RED')
                    .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                    .setFooter(botname)
                    .setTimestamp()
                    .setDescription(`${emojis.error} Cannot find the role with ID: ${args[0]}\n${emojis.fix} **Possible Fixes:** Here is a list of possible fixes\n${emojis.blank} ${emojis.id} Check if the ID is correct.\n`)
                    return message.reply({ embeds: [ errorEmbed ] })
                }

                if(args[1] === '-set') {
                    if(args[2] === '1' || args[2].toLowerCase() === 'helper') {
                        guildSettings.helperRole = target.id
                        guildSettings.save()
                        const successEmbed = new MessageEmbed() // Creating an embed
                        .setColor('GREEN')
                        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                        .setFooter(botname)
                        .setTimestamp()
                        .setDescription(`${emojis.success} Successfully set the helper role to **${target.name}**`)
                        return message.reply({ embeds: [ successEmbed ] })
                    } else if(args[2] === '2' || args[2].toLowerCase() === 'mod') {
                        guildSettings.modRole = target.id
                        guildSettings.save()
                        const successEmbed = new MessageEmbed() // Creating an embed
                        .setColor('GREEN')
                        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                        .setFooter(botname)
                        .setTimestamp()
                        .setDescription(`${emojis.success} Successfully set the mod role to **${target.name}**`)
                        return message.reply({ embeds: [ successEmbed ] })
                    } else if(args[2] === '3' || args[2].toLowerCase() === 'admin') {
                        guildSettings.adminRole = target.id
                        guildSettings.save()
                        const successEmbed = new MessageEmbed() // Creating an embed
                        .setColor('GREEN')
                        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                        .setFooter(botname)
                        .setTimestamp()
                        .setDescription(`${emojis.success} Successfully set the admin role to **${target.name}**`)
                        return message.reply({ embeds: [ successEmbed ] })
                    } else if(args[2] === '4' || args[2].toLowerCase() === 'trusted') {
                        guildSettings.trustedRole = target.id
                        guildSettings.save()
                        const successEmbed = new MessageEmbed() // Creating an embed
                        .setColor('GREEN')
                        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                        .setFooter(botname)
                        .setTimestamp()
                        .setDescription(`${emojis.success} Successfully set the trusted role to **${target.name}**`)
                        return message.reply({ embeds: [ successEmbed ] })
                    }
                }
            } else if(!args[0]) {
                const embed = new MessageEmbed()
                .setColor('BLUE')
                .setTitle('Server Statics')
                .setDescription(
                    `${emojis.userSettings} **Trusted Role:** ${guildSettings.trustedRole || 'No Trusted Role'}\n` +
                    `${emojis.admin} **Admin Role:** ${guildSettings.adminRole || 'No Admin Role'}\n` +
                    `${emojis.mod} **Moderator Role:** ${guildSettings.modRole || 'No Moderator Role'}\n` +
                    `${emojis.fix} **Helper Role:** ${guildSettings.helperRole || 'No Helper Role'}`,
                )
                .setFooter(botname)
                .setTimestamp()
                message.reply({ embeds: [embed] })
            }
        }
    },
}