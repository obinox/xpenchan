import { SlashCommandBuilder, PermissionsBitField, MessageFlags } from "discord.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = process.env.XPENCHAN_CONFIG_PATH || path.join(__dirname, "..", "config.json");

export const data = new SlashCommandBuilder()
    .setName("set-auto-rename")
    .setDescription("새로운 멤버의 닉네임을 자동으로 변경하는 규칙을 설정합니다.")
    .addBooleanOption((option) => option.setName("enabled").setDescription("자동 닉네임 변경을 활성화할지 여부").setRequired(true))
    .addStringOption((option) => option.setName("nickname").setDescription("새 멤버에게 부여할 닉네임. 활성화 시 필수."))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageNicknames);

export async function execute(interaction) {
    const { options } = interaction;
    const enabled = options.getBoolean("enabled");
    const nickname = options.getString("nickname");

    if (enabled && !nickname) {
        return interaction.reply({
            content: "자동 닉네임 변경을 활성화하려면 `nickname`을 반드시 입력해야 합니다.",
            flags: [MessageFlags.Ephemeral],
        });
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
        let config = {};
        try {
            const data = await fs.readFile(configPath, "utf-8");
            config = JSON.parse(data);
        } catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }

        config.autoRename = {
            enabled,
            nickname: nickname,
        };

        await fs.writeFile(configPath, JSON.stringify(config, null, 4));

        if (enabled) {
            await interaction.editReply({
                content: `이제 새로운 멤버의 닉네임이 '${nickname}'(으)로 자동으로 변경됩니다.`,
                flags: [MessageFlags.Ephemeral],
            });
        } else {
            await interaction.editReply({
                content: "자동 닉네임 변경 기능이 비활성화되었습니다.",
                flags: [MessageFlags.Ephemeral],
            });
        }
    } catch (error) {
        console.error("자동 닉네임 변경 설정 중 오류 발생:", error);
        await interaction.editReply({ content: "자동 닉네임 변경을 설정하는 데 실패했어요. 파일 시스템 권한을 확인해주세요.", flags: [MessageFlags.Ephemeral] });
    }
}
