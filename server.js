const { TelegramClient, Api } = require("telegram");
const { NewMessage } = require("telegram/events");
const cron = require("node-cron");
const { StringSession } = require("telegram/sessions");
require("dotenv").config();
require("./models");
const { connection } = require("./config/database");
const { Chat } = require("./models");
const { getChatOrChannelParticipants } = require("./telegramAPI");
connection();
const stringSession = new StringSession(
  "1BQANOTEuMTA4LjU2LjE1MgG7EwkAj+mELE6W9QM8G/qpWyTjaV9QgFq4IqZx4lPxWVe5i8TlR/L7OCKCXZd0txjTJAmzX3ha0ODTcCVQdVKyI7eYUYzlJ94N0JnJSSMcNm5vr9qvE7RJUaGC/s3/cB8p3W3pZMNZ/WqTnvoDjD117qdgFQ633GyqbXb+oTa2dIDFOouamfUE9FXRoVUTIuvB26X5IW3KjDHkjpi+DG8xY3GWfhzv0eyhLpExcnOqVjd+6Z2xQIL05L0o1mCorn0/8xcCFNWWHORcisy4zypQM0NTA8xr47C0RkOdwHUtjAULABWCZztpw4PIdw+XXWMwuB8yIXW/Omk1ecWlQw/i9w=="
);
const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

client.floodSleepThreshold = 300;
(async () => {
  await client.start({
    botAuthToken: process.env.TELEGRAM_BOT_TOKEN,
  });
  console.log(client.session.save());
  console.log(stringSession.save());
})();

client.addEventHandler(async (event) => {
  const message = event.message;
  console.log(message);
  // Command (/all)
  if (message.message.includes("@all")) {
    const namePeerID = Object.keys(message.peerId).find((str) =>
      str.includes("Id")
    );
    const channelId = BigInt(message.peerId[namePeerID]);
    console.log(channelId);

    const typePeer = message.peerId.className;

    let chat = await Chat.findByPk(channelId);

    if (!chat) {
      // Get participants
      const participants = await getChatOrChannelParticipants(
        client,
        channelId,
        typePeer,
        namePeerID
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
        id: channelId,
        typePeer,
        namePeerID,
        name: `Chat_${channelId}`,
        meta,
      });
    }

    const padString = "!";
    let sendMessage = "";
    for (let i = 0; i < chat.meta.length; i++) {
      sendMessage += padString;
    }

    const entities = chat.meta.map((user, index) => {
      return new Api.InputMessageEntityMentionName({
        offset: index,
        length: 1,
        userId: new Api.InputUser({ userId: BigInt(user.id) }),
      });
    });

    await client.invoke(
      new Api.messages.SendMessage({
        peer: channelId,
        message: `${sendMessage} Mention @all📌📌`,
        entities: entities,
      })
    );
  }
}, new NewMessage({}));

async function sendMessageCronJob() {
  const channelId = 4046508961;
  let chat = await Chat.findByPk(channelId);
  if (chat) {
    const padString = "!";
    let sendMessage = "";
    for (let i = 0; i < chat.meta.length; i++) {
      sendMessage += padString;
    }

    const entities = chat.meta.map((user, index) => {
      return new Api.InputMessageEntityMentionName({
        offset: index,
        length: 1,
        userId: new Api.InputUser({ userId: BigInt(user.id) }),
      });
    });

    await client.invoke(
      new Api.messages.SendMessage({
        peer: new Api[chat.typePeer]({ [chat.namePeerID]: chat.id }),
        message: `${sendMessage} Mention @all📌📌`,
        entities: entities,
      })
    );
  }

  await client.invoke(
    new Api.messages.SendMessage({
      peer: new Api.PeerChannel({ channelId }),
      message: `Cpn các Kvt @all

      Xin giúp đỡ đăng ký số lượng suất ăn trước 19h nhé.
      
      Xin cảm ơn nhiều ạ ~`,
      entities: [],
    })
  );
}

cron.schedule(
  "* * * * *",
  () => {
    sendMessageCronJob();
  },
  {
    timezone: "Asia/Bangkok",
  }
);
