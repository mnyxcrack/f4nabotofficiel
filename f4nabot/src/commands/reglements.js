
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reglements')
        .setDescription('Affiche le règlement'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle("📜 Règlement du serveur")
            .setDescription(
                `Merci de lire et respecter le règlement.\n\n` +
                `• Respect obligatoire\n` +
                `• Pas de spam\n` +
                `• Pas de pub\n\n` +
                `Clique sur le bouton pour accepter.`
            )
            .setFooter({ text: "F4na • Serveur Officiel" })
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId('accept_reglement')
            .setLabel('✅ Accepter')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
