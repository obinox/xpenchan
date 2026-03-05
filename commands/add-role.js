import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("add-role")
    .setDescription("기존 역할 부여 메시지에 이모티콘-역할 쌍을 추가합니다.")
    .addStringOption((option) => option.setName("message-id").setDescription("수정할 역할 부여 메시지의 ID").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("추가할 이모티콘").setRequired(true))
    .addRoleOption((option) => option.setName("role").setDescription("추가할 역할").setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles);

export async function execute(interaction) {
    const { options, guild, channel } = interaction;
    const messageId = options.getString("message-id");
    const emoji = options.getString("emoji");
    const role = options.getRole("role");

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
        const targetMessage = await channel.messages.fetch(messageId);

        // 1. 봇이 만든 역할 메시지인지 확인
        if (targetMessage.author.id !== interaction.client.user.id) {
            return interaction.editReply({ content: "제가 만든 역할 부여 메시지가 아니거나, 인식할 수 없는 형식의 메시지입니다.", flags: [MessageFlags.Ephemeral] });
        }

        const oldEmbed = targetMessage.embeds[0];

        // 2. 설명란을 파싱하여 이미 등록된 이모티콘인지 확인
        if (oldEmbed.description && oldEmbed.description.includes(emoji)) {
            // 간단한 문자열 포함으로 확인. 더 정확한 파싱이 필요할 수 있음.
            return interaction.editReply({ content: "이미 등록된 이모티콘입니다.", flags: [MessageFlags.Ephemeral] });
        }

        // 3. 새 역할 정보 추가
        const newDescription = (oldEmbed.description || "") + `\n${emoji} : ${role}`;

        const newEmbed = EmbedBuilder.from(oldEmbed).setDescription(newDescription);

        // 4. 메시지 수정 및 반응 추가
        await targetMessage.edit({ embeds: [newEmbed] });
        await targetMessage.react(emoji);

        await interaction.editReply({ content: "역할을 성공적으로 추가했어요.", flags: [MessageFlags.Ephemeral] });
    } catch (error) {
        console.error("역할 추가 중 오류 발생:", error);
        if (error.code === 10008) {
            // Unknown Message
            return interaction.editReply({ content: "메시지를 찾을 수 없습니다. 메시지 ID를 확인하고, 명령어를 실행한 채널이 올바른지 확인해주세요.", flags: [MessageFlags.Ephemeral] });
        }
        await interaction.editReply({ content: "역할을 추가하는 데 실패했어요. 봇 권한을 점검해주세요.", flags: [MessageFlags.Ephemeral] });
    }
}
