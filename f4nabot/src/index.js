const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const config = require('../config.json');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');
const ora = require('ora').default;

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
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // 🔒 sécurité anti crash
    if (!command.data || !command.data.name) {
        console.log(`❌ Commande invalide: ${file}`);
        continue;
    }

    client.commands.set(command.data.name, command);
}

logger.success(`${client.commands.size} commandes chargées`);

//
// ==========================
// 📡 ENREGISTREMENT COMMANDES
// ==========================
//

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN); // 🔥 FIX TOKEN

(async () => {
    const spinner = ora('Chargement des commandes...').start();

    try {
        const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());

        // 🔥 FIX IMPORTANT → commandes instant
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );

        spinner.succeed('Commandes chargées instant !');
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
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

//
// ==========================
// 🎯 INTERACTIONS COMMANDES
// ==========================
//

client.on('interactionCreate', async interaction => {

    if (interaction.isChatInputCommand()) {
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
    logger.success(`Connecté en tant que ${client.user.tag}`);
});

//
// ==========================
// 🔌 CONNEXION
// ==========================
//

client.login(process.env.TOKEN); // 🔥 FIX TOKEN
