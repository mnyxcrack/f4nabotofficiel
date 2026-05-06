const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const localConfig = require('../config.json');
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
// LOAD COMMANDS (ANTI CRASH)
// ==========================
const commandsPath = path.join(__dirname, 'commands');
const commandsArray = [];

if (fs.existsSync(commandsPath)) {

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            console.log(`📂 Chargement: ${file}`);

            const command = require(`./commands/${file}`);

            if (!command.data || !command.execute) {
                console.log(`❌ Invalide: ${file}`);
                continue;
            }

            // 🔥 TEST JSON (évite crash Discord)
            try {
                const json = command.data.toJSON();

                client.commands.set(command.data.name, command);
                commandsArray.push(json);

                console.log(`✅ OK: ${command.data.name}`);

            } catch (err) {
                console.log(`❌ Commande cassée ignorée: ${file}`);
                console.log(err.message);
                continue;
            }

        } catch (err) {
            console.log(`💥 Erreur chargement ${file}`);
            console.log(err);
        }
    }
}

console.log("📦 Commandes finales:", commandsArray.map(c => c.name));


// ==========================
// REGISTER COMMANDS
// ==========================
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    const spinner = ora('Synchronisation commandes...').start();

    try {

        // RESET
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: [] }
        );

        console.log("🧹 Reset OK");

        // REGISTER
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
// LOAD EVENTS
// ==========================
const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        try {
            console.log(`📡 Event: ${file}`);

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

            console.log(`✅ Event chargé: ${event.name}`);

        } catch (err) {
            console.log(`💥 Erreur event ${file}`);
            console.log(err);
        }
    }
}


// ==========================
// INTERACTIONS
// ==========================
client.on('interactionCreate', async interaction => {

    // MODAL
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

    // COMMANDES
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);

        interaction.reply({
            content: "❌ Une erreur est survenue.",
            ephemeral: true
        });
    }
});


// ==========================
// ANTI CRASH
// ==========================
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);


// ==========================
client.login(config.token);
