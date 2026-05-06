const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/warns.json');

function loadData() {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Système d’avertissement')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Ajouter un avertissement')
                .addUserOption(opt => opt.setName('user').setRequired(true))
                .addStringOption(opt => opt.setName('raison').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Voir les warns')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('Supprimer les warns')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('raison');

        let data = loadData();

        if (!data[user.id]) data[user.id] = [];

        // =========================
        // ADD WARN
        // =========================
        if (sub === "add") {

            const warn = {
                reason: reason,
                staff: interaction.user.tag,
                date: new Date().toLocaleString()
            };

            data[user.id].push(warn);
            saveData(data);

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('⚠️ Avertissement')
                .setDescription(`> **${user.tag}** a reçu un avertissement`)
                .addFields(
                    { name: "📄 Raison", value: reason },
                    { name: "👮 Staff", value: interaction.user.tag },
                    { name: "📊 Total", value: `${data[user.id].length} warn(s)` }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        // =========================
        // LIST WARN
        // =========================
        if (sub === "list") {

            if (!data[user.id] || data[user.id].length === 0) {
                return interaction.reply({
                    content: "✅ Aucun avertissement",
                    ephemeral: true
                });
            }

            const warns = data[user.id]
                .map((w, i) =>
                    `**#${i + 1}** • ${w.reason}\n👮 ${w.staff} | 🕒 ${w.date}`
                )
                .join("\n\n");

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📊 Warns de ${user.tag}`)
                .setDescription(warns)
                .setFooter({ text: `${data[user.id].length} warn(s)` });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // =========================
        // CLEAR WARN
        // =========================
        if (sub === "clear") {

            data[user.id] = [];
            saveData(data);

            await interaction.reply({
                content: `🧹 Warns supprimés pour ${user.tag}`,
                ephemeral: true
            });
        }
    }
};
