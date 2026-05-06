const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const localConfig = require('../config.json');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');
const ora = require('ora').default;

// ==========================
// ⚙️ CONFIG
// ==========================
const config = {
    token: process.env.TOKEN || localConfig.token,
    clientId: localConfig.clientId,
    guildId: localConfig.guildId,
    roleId: localConfig.roleId
};

// ==========================
// 🧠 CLIENT
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

//
// ==========================
// 📦 LOAD COMMANDS (SAFE)
// ==========================
//
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const command = require(`./commands/${file}`);

            // 🔒 sécurité anti crash
            if (!command.data || !command.execute) {
                console.log(`❌ Commande invalide ignorée: ${file}`);
                continue;
            }

            client.commands.set(command.data.name, command);
            console.log(`✅ Commande chargée: ${command.data.name}`);

        } catch (err) {
            console.log(`💥 Erreur chargement ${file}:`, err);
        }
    }
}

logger.success(`${client.commands.size} commandes chargées`);

//
// ==========================
// 📡 REGISTER COMMANDS
// ==========================
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    const spinner = ora('Chargement des commandes...').start();

    try {
        const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
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
// ⚡ LOAD EVENTS
// ==========================
const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
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

            console.log(`📡 Event chargé: ${event.name}`);

        } catch (err) {
            console.log(`💥 Erreur event ${file}:`, err);
        }
    }
}

//
// ==========================
// 🎯 INTERACTIONS
// ==========================
client.on('interactionCreate', async interaction => {

    // ==========================
    // 🧾 MODAL
    // ==========================
    if (interaction.isModalSubmit()) {

        if (interaction.customId === 'annonceModal') {

            await interaction.deferReply();

            const titre = interaction.fields.getTextInputValue('titre');
            const sousTitre = interaction.fields.getTextInputValue('sousTitre');
            const description = interaction.fields.getTextInputValue('description');
            const image = interaction.fields.getTextInputValue('image');

            const embed = new EmbedBuilder()
                .setColor('#00bfff')
                .setTitle(titre)
                .setDescription(`> ${description}`)
                .addFields({
                    name: ' ',
                    value: `**${sousTitre || 'Annonce'}**`
                })
                .setTimestamp();

            if (image && image.startsWith("http")) {
                embed.setThumbnail(image);
            }

            await interaction.editReply({ embeds: [embed] });
        }

        return;
    }

    // ==========================
    // 🎯 COMMANDES
    // ==========================
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
// 🚨 ERREURS
// ==========================
process.on('unhandledRejection', err => {
    logger.error(`UnhandledRejection: ${err}`);
});

process.on('uncaughtException', err => {
    logger.error(`UncaughtException: ${err}`);
});

//
// ==========================
// 🔌 LOGIN
// ==========================
client.login(config.token);
