
import { SlashCommandBuilder, PermissionsBitField, MessageFlags } from "discord.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = process.env.XPENCHAN_CONFIG_PATH || path.join(__dirname, "..", "config.json");


export const data = new SlashCommandBuilder()
    .setName("set-auto-role")
    .setDescription("새로운 멤버에게 자동으로 부여할 역할을 설정합니다.")
    .addRoleOption((option) => option.setName("role").setDescription("자동으로 부여할 역할").setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles);

export async function execute(interaction) {
    const { options } = interaction;
    const role = options.getRole("role");

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

        config.autoRole = role.id;

        await fs.writeFile(configPath, JSON.stringify(config, null, 4));

        await interaction.editReply({ content: `이제 새로운 멤버에게 자동으로 '${role.name}' 역할이 부여됩니다.`, flags: [MessageFlags.Ephemeral] });
    } catch (error) {
        console.error("자동 역할 설정 중 오류 발생:", error);
        await interaction.editReply({ content: "자동 역할을 설정하는 데 실패했어요. 파일 시스템 권한을 확인해주세요.", flags: [MessageFlags.Ephemeral] });
    }
}
