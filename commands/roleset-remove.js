import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("roleset-remove")
    .setDescription("기존 역할 부여 메시지에서 이모티콘-역할 쌍을 제거합니다.")
    .addStringOption((option) => option.setName("message-id").setDescription("수정할 역할 부여 메시지의 ID").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("제거할 이모티콘").setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles);

export async function execute(interaction) {
    const { options, channel } = interaction;
    const messageId = options.getString("message-id");
    const emojiToRemove = options.getString("emoji");

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
        const targetMessage = await channel.messages.fetch(messageId);

        // 1. 봇이 만든 역할 메시지인지 확인 (푸터를 기준으로)
        if (targetMessage.author.id !== interaction.client.user.id) {
            return interaction.editReply({ content: "제가 만든 역할 부여 메시지가 아니거나, 인식할 수 없는 형식의 메시지입니다.", flags: [MessageFlags.Ephemeral] });
        }

        const oldEmbed = targetMessage.embeds[0];
        const description = oldEmbed.description;

        if (!description) {
            return interaction.editReply({ content: "메시지에 설정된 역할이 없습니다.", flags: [MessageFlags.Ephemeral] });
        }

        // 2. 설명란을 파싱하여 해당 이모티콘이 포함된 줄을 찾고, 해당 줄이 있는지 확인
        const lines = description.split("\n");
        const originalLineCount = lines.length;
        const newDescriptionLines = lines.filter((line) => !line.trim().startsWith(emojiToRemove));

        if (originalLineCount === newDescriptionLines.length) {
            return interaction.editReply({ content: "해당 이모티콘은 역할 목록에 없습니다.", flags: [MessageFlags.Ephemeral] });
        }

        const newDescription = newDescriptionLines.join("\n");

        const newEmbed = EmbedBuilder.from(oldEmbed).setDescription(newDescription);

        // 4. 메시지 수정 및 반응 제거
        await targetMessage.edit({ embeds: [newEmbed] });

        // 사용자가 입력한 이모티콘 식별자와 일치하는 반응을 찾습니다.
        const reaction = targetMessage.reactions.cache.find((r) => r.emoji.name === emojiToRemove || r.emoji.toString() === emojiToRemove);
        if (reaction) {
            // 봇의 반응만 제거하기 위해 반응한 사용자 목록을 가져와 봇만 제거할 수도 있지만,
            // 여기서는 해당 이모티콘 반응 전체를 제거하는 것이 더 간단하고 명확합니다.
            await reaction.remove();
        }

        await interaction.editReply({ content: "역할을 성공적으로 제거했어요.", flags: [MessageFlags.Ephemeral] });
    } catch (error) {
        console.error("역할 제거 중 오류 발생:", error);
        if (error.code === 10008) {
            // Unknown Message
            return interaction.editReply({ content: "메시지를 찾을 수 없습니다. 메시지 ID를 확인하고, 명령어를 실행한 채널이 올바른지 확인해주세요.", flags: [MessageFlags.Ephemeral] });
        }
        await interaction.editReply({ content: "역할을 제거하는 데 실패했어요. 봇 권한을 점검해주세요.", flags: [MessageFlags.Ephemeral] });
    }
}
