const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');
const ora = require('ora').default;

// ✅ CONFIG VIA RAILWAY (ENV)
const config = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    roleId: process.env.ROLE_ID
};

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
    client.commands.set(command.data.name, command);
}

logger.success(`${client.commands.size} commandes chargées`);

//
// ==========================
// 📡 ENREGISTREMENT COMMANDES
// ==========================
//

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
// 🎯 INTERACTIONS
// ==========================
//

client.on('interactionCreate', async interaction => {

    // 🧾 MODAL ANNONCE
    if (interaction.isModalSubmit()) {

        if (interaction.customId === 'annonceModal') {

            const titre = interaction.fields.getTextInputValue('titre');
            const sousTitre = interaction.fields.getTextInputValue('sousTitre');
            const description = interaction.fields.getTextInputValue('description');

            const embed = new EmbedBuilder()
                .setTitle(`📢 ${titre}`)
                .setDescription(description)
                .setColor('#5865F2')
                .setFooter({ text: sousTitre || 'Annonce' })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed]
            });
        }

        return;
    }

    // 🎯 COMMANDES SLASH
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
// 🔌 CONNEXION
// ==========================
//

client.login(config.token);
