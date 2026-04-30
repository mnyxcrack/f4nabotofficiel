const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ==========================
// ⚙️ CONFIG RAILWAY (ENV)
// ==========================
const localConfig = require('../config.json');

const config = {
    token: process.env.TOKEN || localConfig.token,
    clientId: process.env.CLIENT_ID || localConfig.clientId,
    guildId: process.env.GUILD_ID || localConfig.guildId,
    roleId: process.env.ROLE_ID || localConfig.roleId
};

// 🧪 DEBUG TOKEN
console.log("TOKEN ENV =", config.token);

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
// ✅ BOT READY
// ==========================
client.once('ready', () => {
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

    // 🎯 SLASH COMMAND
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        interaction.reply({ content: "❌ Erreur.", ephemeral: true });
    }
});

// ==========================
// 🔌 LOGIN
// ==========================
client.login(config.token);
