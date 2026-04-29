const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reglements')
        .setDescription('Afficher le règlement du serveur'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor(0x5865F2) // 🔥 couleur discord propre
            .setTitle("📜 • Règlement du serveur")
            .setDescription(
                "Bienvenue 👋\n\n" +
                "Merci de lire attentivement le règlement avant d'accéder au serveur.\n\n" +
                "```" +
                "• Respect des membres\n" +
                "• Pas de spam\n" +
                "• Pas de publicité\n" +
                "• Pas de contenu interdit\n" +
                "```\n" +
                "👉 Clique sur le bouton ci-dessous pour accepter."
            )
            .setFooter({ text: "F4na • Vérification" })
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId('accept_reglement')
            .setLabel('Accepter')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: false // 🔥 visible pour tout le monde
        });
    }
};
