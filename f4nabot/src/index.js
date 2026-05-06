require("dotenv").config()

const { Client, GatewayIntentBits, Collection } = require("discord.js")
const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")

const config = require("./config.json")

// =======================
// 🤖 CLIENT DISCORD
// =======================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
})

client.commands = new Collection()

// =======================
// 🧠 CONNEXION MONGO
// =======================
mongoose.connect(process.env.MONGO_URI || config.mongoURI || "mongodb://127.0.0.1:27017/bot")
    .then(() => console.log("✅ Mongo connecté"))
    .catch(err => console.log("❌ Mongo erreur :", err))

// =======================
// 📦 LOAD COMMANDS (RÉCURSIF)
// =======================
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
                console.log(`✅ Commande chargée : ${command.data.name}`)
            }
        }
    }
}

// adapte si ton dossier est différent
loadCommands(path.join(__dirname, "src", "commands"))

// =======================
// ⚡ LOAD EVENTS
// =======================
const eventsPath = path.join(__dirname, "src", "events")
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"))

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file))

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client))
    } else {
        client.on(event.name, (...args) => event.execute(...args, client))
    }

    console.log(`📡 Event chargé : ${event.name}`)
}

// =======================
// 🚀 READY
// =======================
client.once("ready", () => {
    console.log(`🤖 Connecté en tant que ${client.user.tag}`)
})

// =======================
// ❌ GESTION ERREURS GLOBALES
// =======================
process.on("unhandledRejection", (reason, promise) => {
    console.log("❌ Erreur non gérée :", reason)
})

process.on("uncaughtException", (err) => {
    console.log("❌ Exception :", err)
})

// =======================
// 🔐 LOGIN
// =======================
client.login(config.token)
