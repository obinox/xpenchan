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
    .setName("create-role")
    .setDescription("서버에 권한 없는 빈 역할을 생성합니다.")
    .addStringOption((option) => option.setName("name").setDescription("생성할 역할의 이름").setRequired(true))
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
    const roleName = options.getString("name");
    const presetColor = options.getString("preset-color");
    const hexColor = options.getString("hex-color");

    let roleColor = "Default";

    if (hexColor) {
        if (!/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
            return interaction.reply({ content: "유효하지 않은 16진수 색상 코드입니다. `#RRGGBB` 형식을 사용해주세요.", flags: [MessageFlags.Ephemeral] });
        }
        roleColor = hexColor;
    } else if (presetColor) {
        roleColor = presetColor;
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
        // Check if role with the same name already exists
        const existingRole = guild.roles.cache.find((role) => role.name === roleName);
        if (existingRole) {
            return interaction.editReply(`이미 @${roleName} 이름의 역할이 존재해요.`);
        }

        // Create the role
        const newRole = await guild.roles.create({
            name: roleName,
            colors: { primaryColor: roleColor },
            permissions: [], // No permissions
            reason: `'${interaction.user.tag}' 사용자가 /create-role 명령어로 생성`,
        });

        await interaction.editReply(`@${newRole.name} 역할을 성공적으로 생성했어요!`);
    } catch (error) {
        console.error("역할 생성 중 오류 발생:", error);
        await interaction.editReply("역할을 생성하는 데 실패했어요. 봇의 권한을 확인해주세요.");
    }
}
