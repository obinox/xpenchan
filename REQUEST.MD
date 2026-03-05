discord 봇을 만들거고, javascript를 사용할거야. 봇이 하는 역할

- 관리자의 요구에 의해 특정 이모티콘으로 반응하면 해당 역할을 지급하는 기능
- 빈 권한의 역할 생성을 생성하여 역할을 지급(역할에는 권한적 의미보다 카테고리 분류적인 의미가 강함)
- 봇 이름은 모찌모찌 봇이야 (TAK의 VOCALOID 곡에서 따왔음)
- 관리자가 역할 - 이모티콘 목록을 수정할 수도 있어야함
- 이모티콘 반응을 해제하면 역할을 빼줘야함
- json이나 DB에 저장하지 말고 봇이 작성한 채팅에 이모티콘-역할으로 저장하기.
- 명령어는 /로 시작하는 디스코드 표준을 따라야함
- embed 메세지로 역할부여 해당 채팅을 제공
- 기본적으로 embed 된 반응을 넣어서 이모티콘이 없는 사람도 반응 가능하게 해야함
- 관리자가 설정하지 않은 다른 이모티콘이 반응으로 추가되면 없애줘야함

questions:
[
{
"header": "봇 설정 안내",
"question": "봇의 기본 설정이 완료되었습니다! 봇을 실행하려면 몇 가지 정보가 필요합니다.\n\n1. **`.env` 파일 수정:** 프로젝트 폴더에 있는 `.env` 파일을 열고 아래 정보를 채워주세요.\n _ `DISCORD_TOKEN`: [Discord 개발자 포털](https://discord.com/developers/applications)에서 생성한 봇의 토큰\n _ `GUILD_ID`: 봇을 추가할 서버(길드)의 ID\n _ `CLIENT_ID`: 봇의 애플리케이션(클라이언트) ID\n\n2. **서버 ID 확인 방법:**\n _ Discord 클라이언트 `설정 > 고급`에서 '개발자 모드'를 활성화하세요.\n _ 서버 아이콘을 마우스 오른쪽 버튼으로 클릭하고 '서버 ID 복사'를 선택하세요.\n\n3. **권한 설정:**\n _ Discord 개발자 포털의 'Bot' 탭에서 **MESSAGE CONTENT INTENT**를 활성화해주세요. 메시지 내용을 읽기 위해 필요합니다.\n\n4. **봇 초대:**\n _ `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands`\n _ 위 URL에서 `YOUR_CLIENT_ID`를 본인 봇의 ID로 바꾸고 접속하여 봇을 서버에 추가하세요. (`permissions=8`은 관리자 권한을 의미합니다.)\n\n모든 정보를 `..env` 파일에 입력하셨으면, \"계속\" 버튼을 눌러주세요. 다음 단계인 슬래시 명령어 등록을 시작하겠습니다.",
"type": "yesno"
}
]

questions:
[
{
"header": "봇 실행 안내",
"question": "이제 모든 준비가 끝났습니다! 아래 단계에 따라 봇을 실행하고 명령어를 등록해 주세요.\n\n**1단계: 명령어 등록 (터미널에 입력)**\n먼저, 우리가 만든 `/setup` 명령어를 디스코드 서버에 등록해야 합니다. 이 작업은 명령어를 변경할 때마다 한 번만 해주면 됩니다.\n`node deploy-commands.js`\n\n(실행하면 \"Successfully reloaded 1 application (/) commands.\" 같은 메시지가 보여야 합니다.)\n\n**2단계: 봇 실행 (터미널에 입력)**\n아래 명령어로 봇을 실행하세요.\n`npm start`\n\n(실행하면 \"Ready! Logged in as [봇이름]\" 같은 메시지가 보여야 합니다.)\n\n**3단계: 명령어 사용**\n봇이 실행된 후, 디스코드 채널에서 `/setup` 명령어를 사용해 보세요.\n\n예시: `/setup roles: ✨ @디자이너 ⭐ @개발자`\n\n위 단계들을 모두 수행하셨으면 \"완료\"를 눌러주세요. 다음 기능 구현으로 넘어가겠습니다.",
"type": "yesno"
}
]

General Permissions

- Administrator
- View Audit Log
- Manage Server
- Manage Roles
- Manage Channels
- Kick Members
- Ban Members
- Create Instant Invite
- Change Nickname
- Manage Nicknames
- Manage Expressions
- Create Expressions
- Manage Webhooks
- View Channels
- Manage Events
- Create Events
- Moderate Members
- View Server Insights
- View Server Subscription Insights

Text Permissions

- Send Messages
- Create Public Threads
- Create Private Threads
- Send Messages in Threads
- Send TTS Messages
- Manage Messages
- Pin Messages
- Manage Threads
- Embed Links
- Attach Files
- Read Message History
- Mention Everyone
- Use External Emojis
- Use External Stickers
- Add Reactions
- Use Slash Commands
- Use Embedded Activities
- Use External Apps
- Create Polls
- Bypass Slowmode
- Send Voice Messages

Voice Permissions

- Connect
- Speak
- Video
- Mute Members
- Deafen Members
- Move Members
- Use Voice Activity
- Priority Speaker
- Request To Speak
- Use Embedded Activities
- Use Soundboard
- Use External Sounds
- Set Voice Channel Status
