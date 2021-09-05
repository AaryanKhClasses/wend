const { MessageEmbed } = require('discord.js')
const { botname } = require('../../config.json')

module.exports = {
    name: 'faq',
    description: 'Frequently asked questions',
    permLevel: 6,
    run(client, message, args) {
        const embed = new MessageEmbed()
        .setTitle('Frequently Asked Questions')
        .setColor('#0099ff')
        .setAuthor(`${message.guild.name}`, message.guild.iconURL())
        .setFooter(botname, message.guild.iconURL())
        .setTimestamp()
        .setDescription(`Following are some of the Frequently Asked Questions about this server and the bot.`)
        .addField(`1. What is this server about?`, `This server is about a discord moderation & anti-raid bot **Wend**`)
        .addField(`2. How do you use this bot?`, `For info and documentation for this bot, check the <#882915300427857950> channel.`)
        .addField(`3. How to be a staff here?`, `There are currently no staff applications in this server. We will open staff applications when this server will reach 100+ members.`)
        .addField(`4. Can I help in making the bot?`, `You can't directly join the bot development as the bot is not on a team, but you can [create a pull request](https://github.com/AaryanKhClasses/Wend/pulls) on github and wait until it gets approved.`)
        message.channel.send({ embeds: [embed] })
    },
}