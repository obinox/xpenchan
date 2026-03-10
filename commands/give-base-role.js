import { SlashCommandBuilder, PermissionsBitField, MessageFlags } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("give-base-role")
    .setDescription("서버 내에서 역할이 없는 모든 멤버에게 지정된 역할을 부여합니다.")
    .addRoleOption((option) => option.setName("role").setDescription("부여할 역할").setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles);

export async function execute(interaction) {
    const { options, guild } = interaction;
    const role = options.getRole("role");

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
        await guild.members.fetch();
        const membersWithoutRoles = guild.members.cache.filter((member) => member.roles.cache.size === 1); // @everyone role only

        if (membersWithoutRoles.size === 0) {
            return interaction.editReply({ content: "역할이 없는 멤버가 없습니다.", flags: [MessageFlags.Ephemeral] });
        }

        let grantedCount = 0;
        await Promise.all(
            membersWithoutRoles.map(async (member) => {
                try {
                    await member.roles.add(role);
                    grantedCount++;
                } catch (error) {
                    console.error(`Failed to add role to ${member.user.tag}:`, error);
                }
            }),
        );

        await interaction.editReply({ content: `총 ${membersWithoutRoles.size}명의 역할 없는 멤버 중 ${grantedCount}명에게 '${role.name}' 역할을 부여했습니다.`, flags: [MessageFlags.Ephemeral] });
    } catch (error) {
        console.error("역할 부여 중 오류 발생:", error);
        await interaction.editReply({ content: "역할을 부여하는 데 실패했어요. 봇 권한을 점검해주세요.", flags: [MessageFlags.Ephemeral] });
    }
}
