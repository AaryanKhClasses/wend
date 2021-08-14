// Importing Modules
const { Client, Intents, Collection } = require('discord.js')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const AsciiTable = require('ascii-table')

const table = new AsciiTable('commands') // Creating a table
table.setHeading('File') // Setting the table heading

class client extends Client {
    constructor() {
        super({
            partials: ['USER', 'REACTION', 'CHANNEL', 'MESSAGE', 'GUILD_MEMBER'],
            intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGES ],
        })

        this._loadClient()
        this._loadCommands()
        // this._loadEvents()
    }

    _loadClient() {
        this.commands = new Collection()
        this.aliases = new Collection()
        this.categories = fs.readdirSync(path.join(__dirname, '../commands'))
    }

    _loadCommands() {
        fs.readdirSync(path.join(__dirname, '../commands')).forEach(dir => {
            const files = fs.readdirSync(path.join(__dirname, '../commands', dir)).filter(name => name.endsWith('.js'))

            for(const file of files) {
                const commands = require(`../commands/${dir}/${file}`)

                if(commands.name) {
                    commands.category = dir

                    this.commands.set(commands.name.toLowerCase(), commands)
                    table.addRow(chalk.green(file))
                } else {
                    table.addRow(chalk.red(file))
                    continue
                }

                if(commands.aliases) {
                    if(!Array.isArray(commands.aliases)) return console.log(chalk.yellow(`${file} -> Aliases not an array!`))
                    for(const alias of commands.aliases) {
                        this.aliases.set(alias.toLowerCase(), commands.name.toLowerCase())
                    }
                }
            }
        })
        console.log(table.toString())
    }
}

module.exports = client