const { PutCommand, QueryCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient } = require("../config/awsConfig");

const TABLE = "UserSessions";

/**
 * CREATE SESSION
 */
const createSession = async (session) => {
  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: session
    })
  );
};

/**
 * GET SESSIONS BY USER
 */
const getSessionsByUserId = async (userId) => {
  const res = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: {
        ":u": userId
      },
      ScanIndexForward: false // newest first
    })
  );

  return res.Items || [];
};

/**
 * DELETE SESSION
 */
const deleteSession = async (sessionId) => {
  await ddbDocClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { sessionId }
    })
  );
};

/**
 * DELETE ALL SESSIONS OF USER
 */
const deleteAllSessions = async (userId) => {
  const sessions = await getSessionsByUserId(userId);

  await Promise.all(
    sessions.map((s) =>
      deleteSession(s.sessionId)
    )
  );
};

/**
 * DELETE OLDEST SESSION (LIMIT DEVICE)
 */
const deleteOldestSession = async (userId) => {
  const sessions = await getSessionsByUserId(userId);

  if (!sessions.length) return;

  const oldest = sessions[sessions.length - 1];
  await deleteSession(oldest.sessionId);
};

const updateSession = async (sessionId, data) => {
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: "UserSessions",
      Key: { sessionId },
      UpdateExpression: "SET refreshTokenHash = :r",
      ExpressionAttributeValues: {
        ":r": data.refreshTokenHash
      }
    })
  );
};

module.exports = {
  createSession,
  getSessionsByUserId,
  deleteSession,
  deleteAllSessions,
  deleteOldestSession,
  updateSession
};