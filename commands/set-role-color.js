import { SlashCommandBuilder, PermissionsBitField, MessageFlags } from "discord.js";

const colorChoices = [
    { name: "Default", value: "Default" },
    { name: "Red", value: "Red" },
    { name: "Orange", value: "Orange" },
    { name: "Gold", value: "Gold" },
    { name: "Yellow", value: "Yellow" },
    { name: "Green", value: "Green" },
    { name: "Aqua", value: "Aqua" },
    { name: "Blue", value: "Blue" },
    { name: "Purple", value: "Purple" },
    { name: "Fuchsia", value: "Fuchsia" },
    { name: "LuminousVividPink", value: "LuminousVividPink" },
    { name: "White", value: "White" },
    { name: "Grey", value: "Grey" },
    { name: "Navy", value: "Navy" },
    { name: "DarkRed", value: "DarkRed" },
    { name: "DarkOrange", value: "DarkOrange" },
    { name: "DarkGold", value: "DarkGold" },
    { name: "DarkGreen", value: "DarkGreen" },
    { name: "DarkAqua", value: "DarkAqua" },
    { name: "DarkBlue", value: "DarkBlue" },
    { name: "DarkPurple", value: "DarkPurple" },
];

export const data = new SlashCommandBuilder()
    .setName("set-role-color")
    .setDescription("기존 역할의 색상을 변경합니다.")
    .addRoleOption((option) => option.setName("role").setDescription("색상을 변경할 역할").setRequired(true))
    .addStringOption((option) =>
        option
            .setName("preset-color")
            .setDescription("미리 설정된 역할 색상을 선택하세요.")
            .setRequired(false)
            .addChoices(...colorChoices),
    )
    .addStringOption((option) => option.setName("hex-color").setDescription("16진수 색상 코드를 입력하세요. (예: #FF0000)").setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles);

export async function execute(interaction) {
    const { options, guild } = interaction;
    const role = options.getRole("role");
    const presetColor = options.getString("preset-color");
    const hexColor = options.getString("hex-color");

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    let roleColor = "Default";

    if (hexColor) {
        if (!/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
            return interaction.reply({ content: "유효하지 않은 16진수 색상 코드입니다. `#RRGGBB` 형식을 사용해주세요.", flags: [MessageFlags.Ephemeral] });
        }
        roleColor = hexColor;
    } else if (presetColor) {
        roleColor = presetColor;
    }

    try {
        await role.setColors({ primaryColor: roleColor });
        await interaction.editReply(`@${role.name} 역할의 색상을 성공적으로 변경했어요.`);
    } catch (error) {
        console.error("역할 색상 변경 중 오류 발생:", error);
        await interaction.editReply("역할 색상을 변경하는 데 실패했어요. 봇의 역할이 대상 역할보다 상위에 있는지, 그리고 역할 관리 권한이 있는지 확인해주세요.");
    }
}
