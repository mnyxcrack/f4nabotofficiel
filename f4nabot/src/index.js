const { Client, GatewayIntentBits, Collection } = require("discord.js")
const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")

const config = require("./config.json")

// ===== CLIENT =====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
})

client.commands = new Collection()

// ===== MONGO =====
mongoose.connect(process.env.MONGO_URI || config.mongoURI || "mongodb://127.0.0.1:27017/bot")
    .then(() => console.log("✅ Mongo connecté"))
    .catch(err => console.log("❌ Mongo erreur :", err))

// ===== LOAD COMMANDS =====
function loadCommands(dir) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        const fullPath = path.join(dir, file)

        if (fs.lstatSync(fullPath).isDirectory()) {
            loadCommands(fullPath)
        } else if (file.endsWith(".js")) {
            const command = require(fullPath)

            if (command.data && command.execute) {
                client.commands.set(command.data.name, command)
            }
        }
    }
}

loadCommands(path.join(__dirname, "commands"))

// ===== LOAD EVENTS =====
const eventsPath = path.join(__dirname, "events")
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"))

for (const file of eventFiles) {
    const event = require(`./events/${file}`)

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client))
    } else {
        client.on(event.name, (...args) => event.execute(...args, client))
    }
}

// ===== READY =====
client.once("ready", () => {
    console.log(`🤖 Connecté : ${client.user.tag}`)
})

// ===== LOGIN =====
client.login(process.env.TOKEN || config.token)
