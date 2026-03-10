import { SlashCommandBuilder, PermissionsBitField, MessageFlags } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("give-base-name")
    .setDescription("특정 역할을 가진 모든 멤버의 닉네임을 지정된 이름으로 일괄 변경합니다.")
    .addRoleOption((option) => option.setName("role").setDescription("대상이 되는 역할").setRequired(true))
    .addStringOption((option) => option.setName("nickname").setDescription("새로운 닉네임").setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageNicknames);

export async function execute(interaction) {
    const { options, guild } = interaction;
    const role = options.getRole("role");
    const newNickname = options.getString("nickname");

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
        await guild.members.fetch();
        const membersWithRole = guild.members.cache.filter((member) => member.roles.cache.has(role.id));

        if (membersWithRole.size === 0) {
            return interaction.editReply({ content: `'${role.name}' 역할을 가진 멤버가 없습니다.`, flags: [MessageFlags.Ephemeral] });
        }

        let changedCount = 0;
        let failedCount = 0;
        const failedMembers = [];

        for (const member of membersWithRole.values()) {
            try {
                // 봇보다 높은 역할을 가진 유저나 서버 주인은 변경 불가
                if (member.manageable) {
                    await member.setNickname(newNickname);
                    changedCount++;
                } else {
                    failedCount++;
                    failedMembers.push(member.user.tag);
                }
            } catch (error) {
                console.error(`Failed to change nickname for ${member.user.tag}:`, error);
                failedCount++;
                failedMembers.push(member.user.tag);
            }
        }

        let replyMessage = `총 ${membersWithRole.size}명의 대상 중 ${changedCount}명의 닉네임을 '${newNickname}'(으)로 성공적으로 변경했습니다.`;
        if (failedCount > 0) {
            replyMessage += `\n${failedCount}명은 변경에 실패했습니다 (권한 부족 등). 실패한 멤버: ${failedMembers.join(", ")}`;
        }

        await interaction.editReply({ content: replyMessage, flags: [MessageFlags.Ephemeral] });
    } catch (error) {
        console.error("닉네임 일괄 변경 중 오류 발생:", error);
        await interaction.editReply({ content: "닉네임을 변경하는 중 오류가 발생했습니다. 봇 권한을 확인해주세요.", flags: [MessageFlags.Ephemeral] });
    }
}
