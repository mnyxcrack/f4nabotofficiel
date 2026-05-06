const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const localConfig = require('../config.json');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');
const ora = require('ora').default;

// ==========================
// CONFIG
// ==========================
const config = {
    token: process.env.TOKEN || localConfig.token,
    clientId: localConfig.clientId,
    guildId: localConfig.guildId,
    roleId: localConfig.roleId
};

// ==========================
// CLIENT
// ==========================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Map();

// ==========================
// LOAD COMMANDS
// ==========================
const commandsPath = path.join(__dirname, 'commands');

const commandsArray = [];

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        console.log("📂 Chargement :", file);

        const command = require(`./commands/${file}`);

        if (!command.data || !command.execute) {
            console.log(`❌ Ignoré: ${file}`);
            continue;
        }

        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());

        console.log(`✅ OK: ${command.data.name}`);

    } catch (err) {
        console.log(`💥 ERREUR ${file}`, err);
    }
}

console.log("📦 COMMANDES FINALES :", commandsArray.map(c => c.name));


// ==========================
// REGISTER COMMANDS (RESET FIX)
// ==========================
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    const spinner = ora('Sync commandes...').start();

    try {

        // 🔥 RESET (OBLIGATOIRE)
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: [] }
        );

        console.log("🧹 Reset OK");

        // 🔥 REGISTER
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commandsArray }
        );

        spinner.succeed("✅ Commandes synchronisées");

    } catch (err) {
        spinner.fail("❌ Erreur sync");
        console.error(err);
    }
})();


// ==========================
// EVENTS
// ==========================
client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        interaction.reply({
            content: "❌ Erreur",
            ephemeral: true
        });
    }
});

// ==========================
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

client.login(config.token);
