const { TelegramClient, Api } = require("telegram");
const { NewMessage } = require("telegram/events");
const cron = require("node-cron");
const { StringSession } = require("telegram/sessions");
require("dotenv").config();
require("./models");
const { connection } = require("./config/database");
const { Chat } = require("./models");
const { getChatOrChannelParticipants } = require("./telegramAPI");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("helloworld");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Ruuning at 3000");
});

connection();
const stringSession = new StringSession(
  "1BQANOTEuMTA4LjU2LjE1MgG7abihHmA2T7khgIK09FIxVPgKjQmfwMuOquybV63Jx/b+K65INS57U0W1wNG8EAV5FZmPkdwEs72J83U/zwcslPOOOYTpWuXd39nNWTC+FXyIsIw11Skd/phUpm6nsfst/a8hdq4wKOp08wKZoltO4sXzLPSoGjQEKZ/3KoVf9KcAyUrDI/3ui71FBzTMi47Gy5rRSa0CedIv72KQSAX6kMae4SP/C+S5f38enah5muULFK2b1xhLWTqSFTcLGEhGOKZ0bOe+oM5Sm6nIH0x/QUxis4ywfkzUTeXMSa7ahrfjhgxFxKIhq7wLxzZTuD6+ztLlNLyrLNfczry8In3EQA=="
);
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
  const channelId = 2146406214;
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
