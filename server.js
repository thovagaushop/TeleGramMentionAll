const { TelegramClient } = require("telegram");
const cron = require("node-cron");
const { StringSession } = require("telegram/sessions");
require("dotenv").config();
require("./models");
const { connection } = require("./config/database");
const { Chat } = require("./models");
const { getChatOrChannelParticipants } = require("./telegramAPI");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const { mention, join, FmtString } = require("telegraf/format");
connection();
const stringSession = new StringSession(process.env.SESSION || "");
const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

(async () => {
  await client.start({
    botAuthToken: process.env.TELEGRAM_BOT_TOKEN,
  });
  client.floodSleepThreshold = 300;
  console.log(client.session.save());
  console.log(stringSession.save());
})();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

bot.on(message("text"), async (ctx) => {
  if (ctx.update.message.text.includes("@all")) {
    console.log(ctx.update.message);
    const telegramChat = ctx.update.message.chat;

    let chat = await Chat.findByPk(BigInt(telegramChat.id));

    if (!chat) {
      const participants = await client.getParticipants(
        BigInt(telegramChat.id)
      );
      const meta = participants.map((participant) => {
        const { id, firstName, lastName, username } = participant;
        return {
          id: BigInt(id).toString(),
          firstName,
          lastName,
          username,
        };
      });

      chat = await Chat.create({
        id: telegramChat.id,
        name: telegramChat.title,
        type: telegramChat.type,
        meta,
      });
    }

    const messageList = [];
    for (let i = 0; i < chat.meta.length; i++) {
      const formatString = mention("!", Number(chat.meta[i].id));
      messageList.push(formatString);
    }
    const messageSend = join(messageList, "");
    messageSend.text += " Mention @all📌📌";
    console.log(messageSend);

    await ctx.telegram.sendMessage(telegramChat.id, messageSend);
  }
});

async function sendMessageCronJob() {
  const chatId = -4046508961;
  let chat = await Chat.findByPk(chatId);
  if (chat) {
    const messageList = [];
    for (let i = 0; i < chat.meta.length; i++) {
      const formatString = mention("!", Number(chat.meta[i].id));
      messageList.push(formatString);
    }
    const messageSend = join(messageList, "");
    messageSend.text += " Mention @all📌📌";
    console.log(messageSend);

    await bot.telegram.sendMessage(chatId, messageSend);
  }
  await bot.telegram.sendMessage(
    chatId,
    `Cpn các Kvt @all

  Xin giúp đỡ đăng ký số lượng suất ăn trước 19h nhé.

  Xin cảm ơn nhiều ạ ~`
  );
}

cron.schedule(
  "0 17 * * *",
  () => {
    sendMessageCronJob();
  },
  {
    timezone: "Asia/Bangkok",
  }
);

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
