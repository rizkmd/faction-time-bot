// index.js
// Discord.js v14+
// Slash command: /factiontime
// Refreshes the posted clock every 60 seconds for 15 minutes.

require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");

const members = [
  {name:"Kim", tz:"Asia/Jakarta"},
  {name:"Nemo", tz:"America/Chicago"},
  {name:"Tony", tz:"America/Chicago"},
  {name:"Gerroe", tz:"Africa/Johannesburg"},
  {name:"Heliosvx", tz:"Europe/Amsterdam"},
  {name:"Kobe", tz:"Europe/Paris"},
  {name:"Mothenise", tz:"Europe/Amsterdam"},
  {name:"VoidWhisp", tz:"Europe/Amsterdam"},
  {name:"Jblack", tz:"Asia/Yangon"},
  {name:"Belry", tz:"Asia/Singapore"},
  {name:"Deadlocks", tz:"Asia/Singapore"},
  {name:"Braxton", tz:"America/Chicago"},
  {name:"Pepe", tz:"America/Toronto"},
  {name:"Bender", tz:"America/Sao_Paulo"},
];

function fmt(tz) {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: tz,
  });
}

function fmtDate(tz) {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  });
}

function tzLabel(tz) {
  return new Date()
    .toLocaleTimeString("en-GB", {
      timeZoneName: "short",
      timeZone: tz,
    })
    .split(" ")
    .pop();
}

/* function roleName(role) {
  if (role === "bx") return "BX";
  if (role === "b") return "B";
  return "M";
} */

function buildEmbed() {
  const utcClock = fmt("UTC");
  const utcDate = `${fmtDate("UTC")} · UTC`;

  const lines = members.map((m) => {
    const clock = fmt(m.tz);
    const sub = `${fmtDate(m.tz)} · ${tzLabel(m.tz)}`;
    return `**${m.name}**\n${clock} · ${sub}`;
  });

  return new EmbedBuilder()
    .setTitle("Faction Time")
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: "UTC Clock", value: utcClock, inline: true },
      { name: "UTC Date", value: utcDate, inline: true }
    )
    .setColor(0x2b8a3e)
    .setTimestamp(new Date());
}

async function registerSlashCommand() {
  const command = new SlashCommandBuilder()
    .setName("factiontime")
    .setDescription("Show faction member local times");
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: [command.toJSON()] }
  );
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  try {
    await registerSlashCommand();
    console.log(`Logged in as ${client.user.tag}`);
    console.log("Slash command registered.");
  } catch (err) {
    console.error("Command registration failed:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "factiontime") return;

  await interaction.deferReply();
  const message = await interaction.editReply({ embeds: [buildEmbed()] });

  // Refresh every 60s; stop after 15 minutes to avoid endless intervals.
  const intervalMs = 60 * 1000;
  const maxRuns = 15;
  let runs = 0;

  const timer = setInterval(async () => {
    try {
      runs += 1;
      await message.edit({ embeds: [buildEmbed()] });
      if (runs >= maxRuns) clearInterval(timer);
    } catch (err) {
      clearInterval(timer);
      console.error("Failed to refresh message:", err);
    }
  }, intervalMs);
});

client.login(process.env.DISCORD_TOKEN);