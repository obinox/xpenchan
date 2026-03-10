import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("setup")
    .setDescription("이모티콘 반응으로 역할을 부여하는 메시지를 설정합니다.")
    .addStringOption((option) => option.setName("roles").setDescription(`'이모티콘 @역할명' 형식으로 짝을 지어 입력하세요. 예: "👍 @역할1 👎 @역할2"`).setRequired(true))
    .addChannelOption((option) => option.setName("channel").setDescription("메시지를 보낼 채널을 선택하세요. (기본값: 현재 채널)").setRequired(false))
    .addStringOption((option) => option.setName("title").setDescription("임베드 메시지의 제목을 설정합니다. (기본값: 역할 선택)").setRequired(false))
    .addStringOption((option) => option.setName("message").setDescription("임베드에 추가할 텍스트를 입력합니다. (서식 없는 텍스트로 표시됩니다)").setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles); // 이 명령어는 역할 관리 권한이 있는 사람만 사용할 수 있습니다.

export async function execute(interaction) {
    const { options, guild } = interaction;
    const rolesString = options.getString("roles");
    const targetChannel = options.getChannel("channel") || interaction.channel;
    const title = options.getString("title") || "역할을 선택하세요";
    const customMessageInput = options.getString("message");

    // 1. 입력값 파싱
    const rolePairs = rolesString.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|:\w+:\s*<@&\d+>|<a?:\w+:\d+>)\s*<@&(\d+)>/gu);

    if (!rolePairs) {
        return interaction.reply({ content: '입력 형식이 올바르지 않아요. `이모티콘 @역할` 형식으로 입력해주세요. 예: "👍 @역할1 👎 @역할2"', flags: [MessageFlags.Ephemeral] });
    }

    // 2. 설명란 구성
    let description = "";
    if (customMessageInput) {
        const sanitizedMessage = customMessageInput.replace(/`/g, "");
        description += sanitizedMessage + "\n\n"; // 사용자 입력 메시지와 역할 목록 사이에 줄바꿈 추가
    } else {
        description += "아래 이모티콘을 눌러 역할을 받으세요!\n\n";
    }

    const emojis = [];
    for (const pair of rolePairs) {
        const emojiMatch = pair.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|:\w+:\s*<@&\d+>|<a?:\w+:\d+>)/u);
        const roleIdMatch = pair.match(/<@&(\d+)>/);

        if (emojiMatch && roleIdMatch) {
            const emoji = emojiMatch[1].trim();
            const roleId = roleIdMatch[1];
            const role = guild.roles.cache.get(roleId);

            if (role) {
                description += `${emoji} : ${role}\n`; // 역할 멘션과 줄바꿈 추가
                emojis.push(emoji);
            }
        }
    }

    // 3. 임베드 생성
    const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x77cedc).setFooter({ text: "엑펜쨩봇" });

    try {
        // 4. 메시지 전송 및 반응 추가
        const message = await targetChannel.send({ embeds: [embed] });
        for (const emoji of emojis) {
            await message.react(emoji);
        }
        await interaction.reply({ content: `역할 부여 메시지를 ${targetChannel}에 성공적으로 생성했어요.`, flags: [MessageFlags.Ephemeral] });
    } catch (error) {
        console.error("역할 부여 메시지 생성 중 오류 발생:", error);
        await interaction.reply({ content: "메시지를 보내거나 반응을 추가하는 데 실패했어요. 봇이 해당 채널에 대한 권한을 가지고 있는지 확인해주세요.", flags: [MessageFlags.Ephemeral] });
    }
}
