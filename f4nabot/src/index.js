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

const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
    console.log("❌ Dossier /commands introuvable !");
} else {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);

        try {
            const command = require(filePath);

            if (!command.data || !command.data.name) {
                console.log(`❌ Commande invalide: ${file}`);
                continue;
            }

            client.commands.set(command.data.name, command);

        } catch (err) {
            console.log(`❌ Erreur chargement commande ${file}`);
            console.error(err);
        }
    }

    logger.success(`${client.commands.size} commandes chargées`);
}

// ==========================
// 📡 ENREGISTREMENT COMMANDES (FIX IMPORTANT)
// ==========================

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    const spinner = ora('Chargement des commandes...').start();

    try {
        const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());

        // 🔥 ICI LA CORRECTION
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );

        spinner.succeed('Commandes chargées INSTANT !');
    } catch (err) {
        spinner.fail('Erreur chargement commandes');
        console.error(err);
    }
})();

// ==========================
// 📡 CHARGEMENT EVENTS
// ==========================

const eventsPath = path.join(__dirname, 'events');

if (!fs.existsSync(eventsPath)) {
    console.log("❌ Dossier /events introuvable !");
} else {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);

        try {
            const event = require(filePath);

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
            console.log(`❌ Erreur chargement event ${file}`);
            console.error(err);
        }
    }
}

// ==========================
// 🎯 INTERACTIONS COMMANDES
// ==========================

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const member = interaction.member;

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
// 🔌 READY
// ==========================

client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// ==========================
// 🔌 CONNEXION
// ==========================

client.login(process.env.TOKEN);
