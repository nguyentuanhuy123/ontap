const {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const { ddbDocClient } = require("../config/awsConfig");
const bcrypt = require("bcrypt");

const TABLE = "Users";

/**
 * CREATE USER
 */
const createUser = async (user) => {
  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        ...user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      ConditionExpression: "attribute_not_exists(userId)"
    })
  );
};

/**
 * GET USER BY EMAIL
 */
const getUserByEmail = async (email) => {
  const res = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "email = :e",
      ExpressionAttributeValues: { ":e": email.toLowerCase() },
      Limit: 1
    })
  );

  return res.Items?.[0] || null;
};

/**
 * GET USER BY ID
 */
const getUserById = async (userId) => {
  const res = await ddbDocClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { userId }
    })
  );

  return res.Item;
};

/**
 * UPDATE USER
 */
const updateUser = async (userId, data) => {
  const keys = Object.keys(data);
  if (keys.length === 0) return;

  let UpdateExpression = "SET ";
  let ExpressionAttributeNames = {};
  let ExpressionAttributeValues = {};

  keys.forEach((key, i) => {
    UpdateExpression += `#${key} = :${key}`;
    if (i < keys.length - 1) UpdateExpression += ", ";

    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = data[key];
  });

  UpdateExpression += ", #updatedAt = :updatedAt";
  ExpressionAttributeNames["#updatedAt"] = "updatedAt";
  ExpressionAttributeValues[":updatedAt"] = new Date().toISOString();

  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ConditionExpression: "attribute_exists(userId)"
    })
  );
};

/**
 * SET RESET TOKEN (HASH)
 */
const setResetToken = async (userId, token) => {
  const hash = await bcrypt.hash(token, 10);

  await updateUser(userId, {
    resetTokenHash: hash,
    resetExpire: Date.now() + 15 * 60 * 1000
  });
};

/**
 * VERIFY RESET TOKEN
 */
const verifyResetToken = async (userId, token) => {
  const user = await getUserById(userId);
  if (!user || !user.resetTokenHash) return null;

  if (!user.resetExpire || Date.now() > user.resetExpire) return null;

  const match = await bcrypt.compare(token, user.resetTokenHash);
  if (!match) return null;

  return user;
};

/**
 * CLEAR RESET TOKEN
 */
const clearResetToken = async (userId) => {
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId },
      UpdateExpression: "REMOVE resetTokenHash, resetExpire"
    })
  );
};

/**
 * GET USER BY USERNAME
 */
const getUserByUsername = async (username) => {
  const res = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "username-index",
      KeyConditionExpression: "username = :u",
      ExpressionAttributeValues: { ":u": username.toLowerCase() },
      Limit: 1
    })
  );

  return res.Items?.[0] || null;
};

/**
 GET USER BY USERNAME + DISCRIMINATOR
*/
const getUserByUsernameAndDiscriminator = async (username, discriminator) => {
  const res = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "username-index",
      KeyConditionExpression: "username = :u",
      FilterExpression: "discriminator = :d",
      ExpressionAttributeValues: {
        ":u": username.toLowerCase(),
        ":d": discriminator
      }
    })
  );

  return res.Items?.[0] || null;
};

const disableAccount = async (userId) => {
  await updateUser(userId, {
    status: "disabled",
    disabledAt: Date.now(),
    deletionRequestedAt: null,
    deleteAt: null
  });
};

const restoreDisabledAccount = async (userId) => {
  await updateUser(userId, {
    status: "active",
    disabledAt: null
  });
};

const requestDeleteAccount = async (userId) => {
  const now = Date.now();
  await updateUser(userId, {
    status: "pending_delete",
    deletionRequestedAt: now,
    deleteAt: now + 15 * 24 * 60 * 60 * 1000
  });
};

const cancelDeleteAccount = async (userId) => {
  await updateUser(userId, {
    status: "active",
    deletionRequestedAt: null,
    deleteAt: null
  });
};

const hardDeleteUser = async (userId) => {
  await ddbDocClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { userId }
    })
  );
};

const restoreAccountState = async (userId) => {
  await updateUser(userId, {
    status: "active",
    disabledAt: null,
    deletionRequestedAt: null,
    deleteAt: null,
    deletedAt: null
  });
};

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  setResetToken,
  verifyResetToken,
  clearResetToken,
  getUserByUsername,
  getUserByUsernameAndDiscriminator,
  disableAccount,
  restoreDisabledAccount,
  requestDeleteAccount,
  cancelDeleteAccount,
  hardDeleteUser,
  restoreAccountState
};