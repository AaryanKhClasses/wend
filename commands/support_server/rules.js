const { MessageEmbed } = require('discord.js')
const { botname } = require('../../config.json')

module.exports = {
    name: 'rules',
    description: 'Shows the rules of the server',
    permLevel: 6,
    run(client, message, args) {
        const embed = new MessageEmbed()
        .setTitle('Rules for Wend Support Server')
        .setAuthor(`${message.guild.name}`, message.guild.iconURL())
        .setColor(0x00AE86)
        .setFooter(botname, message.guild.iconURL())
        .setTimestamp()
        .setDescription(`Following are the rules to be strictly followed while in this server. Violation of any of the rules might result in a strict action.`)
        .addField(`1. Follow Discord's ToS`, `You have to follow discord's official Terms of Service (ToS) and Community Guidelines.\n> Discord's Terms of Service: https://discord.com/terms\n> Community Guidelines: https://discord.com/guidelines`)
        .addField(`2. No Toxicity`, `Don't be toxic or rude to anyone in this server. You must respect other's opinions too. Any type of toxicity is not allowed here.`)
        .addField(`3. No NSFW`, `Any type of NSFW, NSFL, racist, homophobic, xenophobic, transphobic, or any other type of phobic content is not allowed. This is a LGBTQIA+ server.`)
        .addField(`4. No Swearing`, `Swearing or bypassing is not allowed. This includes spoilers and bypassing (example, fu|| n||)`)
        .addField(`5. Spamming & Pinging`, `Do not ping anyone in this server for no reason, as its annoyng for many people. Also spamming is not allowed and will get you muted.`)
        .addField(`6. No Advertising`, `Advertising is not allowed. This includes links to other servers, websites, or any other type of advertisement. DM Advertising is bannable.`)
        .addField(`7. No Begging`, `Begging for anything, like nitro, code or premium is not allowed and multiple infractions might get you banned.`)
        .addField(`9. Moderators have final say`, `Our staff team can mute / ban you at any time without any warnings. If something not mentioned in the rule, it doesn't mean that you are allowed to do it.`)
        message.channel.send({ embeds: [embed] })
    },
}