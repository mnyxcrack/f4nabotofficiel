const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Map();

// ==========================
// 📦 LOAD COMMANDS
// ==========================

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    if (!command.data || !command.execute) continue;

    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// ==========================
// 📡 REGISTER COMMANDS
// ==========================

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("🔄 Enregistrement commandes...");

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );

        console.log("✅ Commandes prêtes !");
    } catch (err) {
        console.error(err);
    }
})();

// ==========================
// ⚡ LOAD EVENTS
// ==========================

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath);

for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    client.on(event.name, (...args) => event.execute(...args));
}

// ==========================
// 🎯 INTERACTION
// ==========================

client.on('interactionCreate', async interaction => {

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        await command.execute(interaction);
    }
});

// ==========================
// READY
// ==========================

client.once('ready', () => {
    console.log(`✅ Connecté : ${client.user.tag}`);
});

client.login(process.env.TOKEN);
