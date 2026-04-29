
module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {

        if (!interaction.isButton()) return;

        if (interaction.customId === 'accept_reglement') {

            const roleId = "1496955671852351528";
            const role = interaction.guild.roles.cache.get(roleId);

            if (!role) {
                return interaction.reply({
                    content: "❌ Rôle introuvable",
                    ephemeral: true
                });
            }

            if (interaction.member.roles.cache.has(roleId)) {
                return interaction.reply({
                    content: "✅ Déjà validé",
                    ephemeral: true
                });
            }

            await interaction.member.roles.add(role).catch(() => {});

            await interaction.reply({
                content: "✅ Règlement accepté !",
                ephemeral: true
            });
        }
    }
};
