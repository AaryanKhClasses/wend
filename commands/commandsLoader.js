// Importing Modules
const path = require('path')
const fs = require('fs')

module.exports = (client) => { // Exports the client
    const baseFile = 'commandHandler.js'
    const commandBase = require(`./${baseFile}`) // Imports the base command handler

    const commands = [] // Creates an array to hold all the commands

    const readCommands = (dir) => { // Reads the commands from the directory
        const files = fs.readdirSync(path.join(__dirname, dir)) // Gets the files from the directory
        for(const file of files) { // For each file
            const stat = fs.lstatSync(path.join(__dirname, dir, file)) // Gets the stats of the file
            if(stat.isDirectory()) { // If the file is a directory
                readCommands(path.join(dir, file)) // Recursively read the directory
            } else if(file !== baseFile && file != 'commandsLoader.js') { // If the file is not the base file and not the loader
                const option = require(path.join(__dirname, dir, file)) // Imports the file
                commands.push(option) // Adds the command to the array
                if(client) { // If the client is connected
                    commandBase(client, option) // Calls the base command handler
                }
            }
        }
    }
    readCommands('.') // Reads the commands from the directory
    return commands // Returns the commands
}