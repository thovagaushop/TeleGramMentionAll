const { Api } = require("telegram");

const getChatOrChannelParticipants = async (
  client,
  groupId,
  groupType,
  namePeerID
) => {
  return await client.getParticipants(
    new Api[groupType]({
      [namePeerID]: groupId,
    })
  );
};

module.exports = {
  getChatOrChannelParticipants,
};
