const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ==========================
// ⚙️ CONFIG (HYBRIDE)
// ==========================
const localConfig = require('../config.json');

const config = {
    token: process.env.TOKEN || localConfig.token,
    clientId: localConfig.clientId,   // FORCÉ depuis config.json
    guildId: localConfig.guildId,     // FORCÉ depuis config.json
    roleId: localConfig.roleId
};

// 🧪 DEBUG (tu peux supprimer après)
console.log("TOKEN =", config.token ? "OK" : "NULL");
console.log("CLIENT_ID =", config.clientId);
console.log("GUILD_ID =", config.guildId);

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

// ==========================
// 📦 LOAD COMMANDS
// ==========================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

console.log(`${client.commands.size} commandes chargées`);

// ==========================
// 📡 REGISTER COMMANDS
// ==========================
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );

        console.log("✔ Commandes chargées !");
    } catch (err) {
        console.error("❌ Erreur chargement commandes :", err);
    }
})();

// ==========================
// ✅ READY
// ==========================
client.once('clientReady', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// ==========================
// 🎯 INTERACTIONS
// ==========================
client.on('interactionCreate', async interaction => {

    // 🧾 MODAL
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

            await interaction.reply({ embeds: [embed] });
        }

        return;
    }

    // 🎯 COMMANDES
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
    } catch (err) {
        console.error(err);
        interaction.reply({ content: "❌ Une erreur est survenue.", ephemeral: true });
    }
});

// ==========================
// 🔌 LOGIN
// ==========================
client.login(config.token);
