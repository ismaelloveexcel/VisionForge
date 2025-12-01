import { Tool } from "@langchain/core/tools";
import * as fs from "fs";
import * as path from "path";

export class DiscordBotGeneratorTool extends Tool {
  name = "discord_bot_generator";
  description = `Generate a complete Discord bot project with the specified functionality.
Input should be a JSON object with:
- botName: name of the bot
- features: array of feature descriptions (e.g., ["greeting on join", "moderation commands", "music player"])
- prefix: command prefix (default: "!")
Example: {"botName": "MyBot", "features": ["welcome new members", "poll commands", "remind me command"], "prefix": "!"}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { botName, features = [], prefix = "!" } = parsed;

      if (!botName) {
        return JSON.stringify({ success: false, error: "Bot name is required" });
      }

      const projectPath = path.join(process.cwd(), "generated", `${botName.toLowerCase().replace(/\s+/g, "-")}-bot`);

      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      const packageJson = {
        name: `${botName.toLowerCase().replace(/\s+/g, "-")}-bot`,
        version: "1.0.0",
        main: "index.js",
        type: "module",
        scripts: {
          start: "node index.js"
        },
        dependencies: {
          "discord.js": "^14.14.0",
          "dotenv": "^16.3.1"
        }
      };

      fs.writeFileSync(
        path.join(projectPath, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );

      const envExample = `# Discord Bot Token - Get this from Discord Developer Portal
DISCORD_TOKEN=your_bot_token_here
# Your Discord User ID (for owner commands)
OWNER_ID=your_discord_id`;

      fs.writeFileSync(path.join(projectPath, ".env.example"), envExample);

      const botCode = this.generateBotCode(botName, features, prefix);
      fs.writeFileSync(path.join(projectPath, "index.js"), botCode);

      const readme = `# ${botName} Discord Bot

A Discord bot created by AI-DAN.

## Features
${features.map((f: string) => `- ${f}`).join("\n")}

## Setup

1. Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Copy your bot token
3. Rename \`.env.example\` to \`.env\` and add your token
4. Run \`npm install\`
5. Run \`npm start\`

## Commands

Prefix: \`${prefix}\`

Check the code for available commands.

## Invite Link

Replace YOUR_CLIENT_ID with your bot's client ID:
\`https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands\`
`;

      fs.writeFileSync(path.join(projectPath, "README.md"), readme);

      return JSON.stringify({
        success: true,
        message: `Discord bot "${botName}" created successfully!`,
        projectPath: `generated/${botName.toLowerCase().replace(/\s+/g, "-")}-bot`,
        files: ["package.json", "index.js", ".env.example", "README.md"],
        nextSteps: [
          "Get a bot token from Discord Developer Portal",
          "Add the token to .env file",
          "Run npm install && npm start"
        ]
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to generate Discord bot"
      });
    }
  }

  private generateBotCode(botName: string, features: string[], prefix: string): string {
    const hasWelcome = features.some(f => f.toLowerCase().includes("welcome") || f.toLowerCase().includes("greet"));
    const hasModeration = features.some(f => f.toLowerCase().includes("moderat") || f.toLowerCase().includes("kick") || f.toLowerCase().includes("ban"));
    const hasPoll = features.some(f => f.toLowerCase().includes("poll"));
    const hasReminder = features.some(f => f.toLowerCase().includes("remind"));

    return `import { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel],
});

const PREFIX = '${prefix}';

client.once('ready', () => {
  console.log(\`🤖 ${botName} is online! Logged in as \${client.user.tag}\`);
  client.user.setActivity('${prefix}help for commands');
});

${hasWelcome ? `
// Welcome new members
client.on('guildMemberAdd', (member) => {
  const welcomeChannel = member.guild.channels.cache.find(
    ch => ch.name.includes('welcome') || ch.name.includes('general')
  );
  if (welcomeChannel && welcomeChannel.isTextBased()) {
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Welcome!')
      .setDescription(\`Hey <@\${member.id}>, welcome to **\${member.guild.name}**! 🎉\`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();
    welcomeChannel.send({ embeds: [embed] });
  }
});
` : ''}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  // Help command
  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('${botName} Commands')
      .setDescription('Here are all available commands:')
      .addFields(
        { name: \`\${PREFIX}help\`, value: 'Show this help message' },
        { name: \`\${PREFIX}ping\`, value: 'Check bot latency' },
${hasModeration ? `        { name: \`\${PREFIX}kick @user [reason]\`, value: 'Kick a member' },
        { name: \`\${PREFIX}ban @user [reason]\`, value: 'Ban a member' },` : ''}
${hasPoll ? `        { name: \`\${PREFIX}poll "question" "opt1" "opt2"\`, value: 'Create a poll' },` : ''}
${hasReminder ? `        { name: \`\${PREFIX}remind [time] [message]\`, value: 'Set a reminder (e.g., 10m, 1h)' },` : ''}
      )
      .setFooter({ text: 'Created by AI-DAN' });
    return message.reply({ embeds: [embed] });
  }

  // Ping command
  if (command === 'ping') {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    sent.edit(\`🏓 Pong! Latency: \${latency}ms | API: \${Math.round(client.ws.ping)}ms\`);
  }

${hasModeration ? `
  // Kick command
  if (command === 'kick') {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ You need Kick Members permission!');
    }
    const member = message.mentions.members?.first();
    if (!member) return message.reply('Please mention a user to kick.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    try {
      await member.kick(reason);
      message.reply(\`✅ Kicked \${member.user.tag} | Reason: \${reason}\`);
    } catch (err) {
      message.reply('❌ Failed to kick member.');
    }
  }

  // Ban command  
  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ You need Ban Members permission!');
    }
    const member = message.mentions.members?.first();
    if (!member) return message.reply('Please mention a user to ban.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    try {
      await member.ban({ reason });
      message.reply(\`✅ Banned \${member.user.tag} | Reason: \${reason}\`);
    } catch (err) {
      message.reply('❌ Failed to ban member.');
    }
  }
` : ''}

${hasPoll ? `
  // Poll command
  if (command === 'poll') {
    const pollRegex = /"([^"]+)"/g;
    const matches = [...message.content.matchAll(pollRegex)].map(m => m[1]);
    if (matches.length < 3) {
      return message.reply('Usage: ${prefix}poll "question" "option1" "option2" ...');
    }
    const [question, ...options] = matches;
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('📊 ' + question)
      .setDescription(options.map((opt, i) => \`\${emojis[i]} \${opt}\`).join('\\n'))
      .setFooter({ text: \`Poll by \${message.author.tag}\` });
    const pollMsg = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < Math.min(options.length, 10); i++) {
      await pollMsg.react(emojis[i]);
    }
  }
` : ''}

${hasReminder ? `
  // Reminder command
  if (command === 'remind') {
    const timeArg = args[0];
    const reminderText = args.slice(1).join(' ');
    if (!timeArg || !reminderText) {
      return message.reply('Usage: ${prefix}remind [time] [message] (e.g., 10m, 1h, 2d)');
    }
    const timeMatch = timeArg.match(/^(\\d+)(s|m|h|d)$/);
    if (!timeMatch) return message.reply('Invalid time format. Use: 10s, 5m, 1h, 2d');
    const [, num, unit] = timeMatch;
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(num) * multipliers[unit];
    if (ms > 86400000 * 7) return message.reply('Max reminder time is 7 days.');
    message.reply(\`⏰ I'll remind you in \${timeArg}!\`);
    setTimeout(() => {
      message.author.send(\`⏰ Reminder: \${reminderText}\`).catch(() => {
        message.channel.send(\`<@\${message.author.id}> ⏰ Reminder: \${reminderText}\`);
      });
    }, ms);
  }
` : ''}
});

client.login(process.env.DISCORD_TOKEN);
`;
  }
}
