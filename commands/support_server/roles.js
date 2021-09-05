const { MessageEmbed } = require('discord.js')
const { botname } = require('../../config.json')

module.exports = {
    name: 'roles',
    description: 'List all the roles in the server',
    permLevel: 6,
    run(client, message, args) {
        const embed = new MessageEmbed()
        .setTitle('Role Info of Wend Support Server')
        .setColor(0x00AE86)
        .setAuthor(`${message.guild.name}`, message.guild.iconURL())
        .setFooter(botname, message.guild.iconURL())
        .setTimestamp()
        .setDescription(`Below are the roles in this server and how to obtain them.`)
        .addField(`1. Owner Role`, `The <@&882891350809407498> role is just the **Owner Role**.`)
        .addField(`2. Trusted Admins`, `The <@&882894608915386368> role is for admins who are trusted by the owner and have permissions to bypass the anti-raid system.`)
        .addField(`3. Administrators`, `The <@&882891453448204338> role is for admins having just administrator permissions, but don't have anti-raid permissions.`)
        .addField(`4. Moderators`, `The <@&882891508783656980> role is for chat moderators who keep the community clean and help members regarding the bot.`)
        .addField(`5. Helpers`, `The <@&882891645622841365> role is for helpers who got selected as staff and are helping members regarding the bot.`)
        .addField(`6. Bug Hunters`, `The <@&882893614429122570> is awarded to members reporting a bug in <#882894412194131978>.`)
        .addField(`7. Beta Testers`, `The <@&882894460437024809> role is awarded to the first 50 members of this server.`)
        message.channel.send({ embeds: [embed] })
    },
}