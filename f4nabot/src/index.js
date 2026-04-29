const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const config = require('../config.json');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');
const ora = require('ora').default;

// ==========================
// 🧠 CLIENT DISCORD
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
// 📦 CHARGEMENT COMMANDES
// ==========================

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);

        if (!command.data || !command.data.name) {
            console.log(`❌ Commande invalide: ${file}`);
            continue;
        }

        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());

    } catch (err) {
        console.log(`❌ Erreur chargement commande ${file}`);
        console.error(err);
    }
}

logger.success(`${client.commands.size} commandes chargées`);

// ==========================
// 📡 ENREGISTREMENT COMMANDES
// ==========================

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    const spinner = ora('Déploiement commandes...').start();

    try {

        // 🔥 1. SUPPRIME les anciennes commandes globales (doublons)
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: [] }
        );

        // 🔥 2. ENREGISTRE commandes serveur (instant)
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );

        spinner.succeed('✅ Commandes propres + instant !');

    } catch (err) {
        spinner.fail('❌ Erreur commandes');
        console.error(err);
    }
})();

// ==========================
// ⚡ CHARGEMENT EVENTS
// ==========================

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    try {
        const event = require(`./events/${file}`);

        if (!event.name || !event.execute) {
            console.log(`❌ Event invalide: ${file}`);
            continue;
        }

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }

    } catch (err) {
        console.log(`❌ Erreur event ${file}`);
        console.error(err);
    }
}

// ==========================
// 🎯 INTERACTIONS
// ==========================

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const member = interaction.member;

    // 🔐 Vérification rôle
    if (command.permission) {
        if (!member.roles.cache.has(config.roleId)) {
            return interaction.reply({
                content: "❌ Tu n'as pas la permission.",
                ephemeral: true
            });
        }
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);

        if (!interaction.replied) {
            interaction.reply({
                content: "❌ Une erreur est survenue.",
                ephemeral: true
            });
        }
    }
});

// ==========================
// 🚨 ERREURS
// ==========================

process.on('unhandledRejection', err => {
    console.error('UnhandledRejection:', err);
});

process.on('uncaughtException', err => {
    console.error('UncaughtException:', err);
});

// ==========================
// 🔌 READY
// ==========================

client.once('ready', () => {
    logger.success(`Connecté en tant que ${client.user.tag}`);
});

// ==========================
// 🔌 LOGIN
// ==========================

client.login(process.env.TOKEN);
