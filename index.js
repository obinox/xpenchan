import { Client, GatewayIntentBits, Collection, Partials, MessageFlags } from "discord.js";
import "dotenv/config";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// --- 전역 오류 처리 ---
process.on("unhandledRejection", (reason, promise) => {
    console.error("처리되지 않은 프로미스 거부:", promise, "이유:", reason);
    // 프로덕션 환경에서는 여기에 오류 로깅 서비스를 연동하는 것이 좋습니다.
});

process.on("uncaughtException", (error) => {
    console.error("잡히지 않은 예외:", error);
    // uncaughtException이 발생하면 애플리케이션 상태가 불안정할 수 있으므로,
    // 로깅 후에는 프로세스를 재시작하는 것이 가장 안전한 방법입니다.
    // 여기서는 일단 로깅만 하여 봇이 죽는 것을 방지합니다.
});

// --- Client and Command Setup ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

client.commands = new Collection();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "commands");
const configPath = process.env.XPENCHAN_CONFIG_PATH || path.join(__dirname, "config.json");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(pathToFileURL(filePath));
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// --- Event Handlers ---

// Ready Event
client.once("clientReady", () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    global.botReady = true;
});

// Slash Command Handler
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: "There was an error while executing this command!", flags: [MessageFlags.Ephemeral] });
        } else {
            await interaction.reply({ content: "There was an error while executing this command!", flags: [MessageFlags.Ephemeral] });
        }
    }
});

// 통합 반응 이벤트 핸들러
async function onReaction(reaction, user, add) {
    // 1. 봇이 추가한 반응은 무시
    if (user.bot) return;

    // 2. Partial 데이터 모두 불러오기 (봇 재시작 후 이전 메시지에 반응 시 오류 방지)
    try {
        if (reaction.partial) await reaction.fetch();
        if (user.partial) await user.fetch();
        // message가 partial일 수 있으므로 `reaction.message`를 사용
        if (reaction.message.partial) await reaction.message.fetch();
    } catch (error) {
        // DM에서 반응을 제거하는 등 권한이 없는 경우 오류가 발생할 수 있음
        if (error.code === 10008 || error.code === 50001) {
            // 10008: Unknown Message, 50001: Missing Access
            // 이 오류는 무시하고 계속 진행하지 않음
            return;
        }
        console.error("반응 처리 중 Partial 데이터를 가져오는 데 실패했습니다:", error);
        return;
    }

    const { message, emoji } = reaction;

    // 3. 역할 부여 메시지인지 확인
    if (message.author.id !== client.user.id || !message.embeds[0] || message.embeds[0].footer?.text !== "엑펜쨩봇") {
        return;
    }

    const embed = message.embeds[0];
    if (!embed.description) return;

    // 4. 임베드에서 이모지-역할 맵 생성
    const roleMap = new Map();
    const roleRegex = /((?:<a?:\w+:\d+>|\p{Emoji_Presentation}|\p{Emoji}\uFE0F))\s*:\s*<@&(\d+)>/gu;
    let match;
    while ((match = roleRegex.exec(embed.description)) !== null) {
        roleMap.set(match[1].trim(), match[2]);
    }

    if (roleMap.size === 0) return;

    // 5. 반응한 이모지가 역할 이모지인지 확인
    const emojiIdentifier = emoji.toString();
    const roleId = roleMap.get(emojiIdentifier);

    // 6. 역할 이모지가 아닌 경우, 사용자가 추가한 반응이라면 제거
    if (!roleId) {
        if (add) {
            try {
                await reaction.remove();
            } catch (error) {
                if (error.code !== 10008) {
                    // Unknown Message 오류는 무시
                    console.error("유효하지 않은 반응을 제거하는 데 실패했습니다:", error);
                }
            }
        }
        return; // 역할과 관련 없으므로 처리 종료
    }

    // 7. 멤버(사용자) 정보 불러오기
    const guild = message.guild;
    if (!guild) return; // 길드가 없는 경우(DM 등) 처리 중단
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    // 8. 역할 추가 또는 제거 처리
    try {
        if (add) {
            // 사용자가 반응을 추가했으므로 역할을 부여합니다.
            await member.roles.add(roleId);
        } else {
            // 사용자가 반응을 제거했으므로 역할을 회수합니다.
            await member.roles.remove(roleId);

            // 유지보수: 봇이 설정한 반응이 사용자에 의해 모두 제거된 경우, 봇이 다시 추가
            const reactionCount = message.reactions.cache.get(emoji.id ?? emoji.name)?.count ?? 0;
            if (reactionCount === 0) {
                await message.react(emoji);
            }
        }
    } catch (error) {
        console.error(`역할을 ${add ? "추가" : "제거"}하는 데 실패했습니다 (역할 ID: ${roleId}, 사용자 ID: ${user.id}):`, error);
        // 사용자에게 DM으로 실패 알림 (선택적)
        try {
            const roleName = guild.roles.cache.get(roleId)?.name || "알 수 없는 역할";
            await user.send(`'${guild.name}' 서버에서 '${roleName}' 역할을 ${add ? "부여" : "제거"}하는 데 실패했습니다. 서버 관리자에게 문의해주세요.`);
        } catch (dmError) {
            console.error("실패 알림 DM을 보내는 데 실패했습니다:", dmError);
        }
    }
}

client.on("messageReactionAdd", (reaction, user) => onReaction(reaction, user, true));

client.on("messageReactionRemove", (reaction, user) => onReaction(reaction, user, false));

client.on("guildMemberAdd", async (member) => {
    try {
        const data = await fsPromises.readFile(configPath, "utf-8");
        const config = JSON.parse(data);

        // 자동 역할 부여
        if (config.autoRole) {
            const role = member.guild.roles.cache.get(config.autoRole);
            if (role) {
                try {
                    await member.roles.add(role);
                    console.log(`Assigned auto-role '${role.name}' to ${member.user.tag}`);
                } catch (error) {
                    console.error(`Failed to assign auto-role to ${member.user.tag}:`, error);
                }
            } else {
                console.error(`Auto-role with ID '${config.autoRole}' not found.`);
            }
        }

        // 자동 닉네임 변경
        if (config.autoRename && config.autoRename.enabled && config.autoRename.nickname) {
            const { nickname } = config.autoRename;
            try {
                if (member.manageable) {
                    await member.setNickname(nickname);
                    console.log(`Set auto-nickname '${nickname}' for ${member.user.tag}`);
                } else {
                     console.error(`Cannot set nickname for ${member.user.tag}: Insufficient permissions.`);
                }
            } catch (error) {
                console.error(`Failed to set auto-nickname for ${member.user.tag}:`, error);
            }
        }
    } catch (error) {
        if (error.code === "ENOENT") {
            // Config file doesn't exist, which is fine.
        } else {
            console.error("Error processing guildMemberAdd event:", error);
        }
    }
});

// --- Login ---
client.login(process.env.DISCORD_TOKEN);
