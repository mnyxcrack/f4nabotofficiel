const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const localConfig = require('../config.json');
const fs = require('fs');
const path = require('path');

const config = {
    token: process.env.TOKEN || localConfig.token,
    clientId: localConfig.clientId,
    guildId: localConfig.guildId
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Map();

const commands = [];

// ==========================
// LOAD COMMANDS SAFE
// ==========================
const commandsPath = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    try {
        const command = require(`./commands/${file}`);

        if (!command.data || !command.execute) {
            console.log(`❌ Invalide: ${file}`);
            continue;
        }

        try {
            const json = command.data.toJSON();

            client.commands.set(command.data.name, command);
            commands.push(json);

            console.log(`✅ Commande OK: ${command.data.name}`);
        } catch (err) {
            console.log(`❌ Commande cassée ignorée: ${file}`);
        }

    } catch (err) {
        console.log(`💥 Erreur require ${file}`, err);
    }
}

console.log("📦 Commandes envoyées:", commands.map(c => c.name));

// ==========================
// REGISTER COMMANDS
// ==========================
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );

        console.log("✅ Commandes synchronisées");
    } catch (err) {
        console.error(err);
    }
})();

// ==========================
// EVENTS
// ==========================
const eventsPath = path.join(__dirname, 'events');

for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
    const event = require(`./events/${file}`);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// ==========================
// INTERACTIONS
// ==========================
client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        interaction.reply({ content: "❌ Erreur", ephemeral: true });
    }
});

client.login(config.token);
