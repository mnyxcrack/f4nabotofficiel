const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const config = require('../config.json');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');
const ora = require('ora').default;

// 🔐 Vérif TOKEN
if (!process.env.TOKEN) {
    console.error("❌ TOKEN manquant dans Railway !");
    process.exit(1);
}

// 🧠 Client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Map();

//
// ==========================
// 📦 CHARGEMENT COMMANDES
// ==========================
//

const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    }

    logger.success(`${client.commands.size} commandes chargées`);
} else {
    logger.warn("⚠️ Aucun dossier commands trouvé");
}

//
// ==========================
// 📡 ENREGISTREMENT COMMANDES
// ==========================
//

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    const spinner = ora('Chargement des commandes...').start();

    try {
        const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());

        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        spinner.succeed('Commandes chargées !');
    } catch (err) {
        spinner.fail('Erreur chargement commandes');
        logger.error(err);
    }
})();

//
// ==========================
// ⚡ CHARGEMENT EVENTS
// ==========================
//

const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = require(`./events/${file}`);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }

    logger.success(`${eventFiles.length} events chargés`);
} else {
    logger.warn("⚠️ Aucun dossier events trouvé");
}

//
// ==========================
// 🎯 INTERACTIONS COMMANDES
// ==========================
//

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
        logger.error(error);

        if (!interaction.replied) {
            interaction.reply({
                content: "❌ Une erreur est survenue.",
                ephemeral: true
            });
        }
    }
});

//
// ==========================
// 🚨 ERREURS GLOBALES
// ==========================
//

process.on('unhandledRejection', err => {
    logger.error(`UnhandledRejection: ${err}`);
});

process.on('uncaughtException', err => {
    logger.error(`UncaughtException: ${err}`);
});

//
// ==========================
// 🔌 READY
// ==========================
//

client.once('ready', () => {
    logger.success(`🤖 Connecté en tant que ${client.user.tag}`);
});

//
// ==========================
// 🔌 CONNEXION
// ==========================
//

client.login(process.env.TOKEN);
