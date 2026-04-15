const { PutCommand, QueryCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient } = require("../config/awsConfig");

const TABLE = "UserOtps";

/**
 * CREATE OTP
 */
const createOtp = async (otp) => {
  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: otp
    })
  );
};

/**
 * GET OTPs BY USER + TYPE
 */
const getOtpsByUser = async (userId, type) => {
  const res = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "userId = :u",
      FilterExpression: "#type = :t",
      ExpressionAttributeNames: {
        "#type": "type"
      },
      ExpressionAttributeValues: {
        ":u": userId,
        ":t": type
      }
    })
  );

  return res.Items || [];
};

/**
 * DELETE OTP
 */
const deleteOtp = async (otpId) => {
  await ddbDocClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { otpId }
    })
  );
};

/**
 * INCREASE ATTEMPTS
 */
const increaseAttempts = async (otpId) => {
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { otpId },
      UpdateExpression: "SET attempts = attempts + :inc",
      ExpressionAttributeValues: {
        ":inc": 1
      }
    })
  );
};

module.exports = {
  createOtp,
  getOtpsByUser,
  deleteOtp,
  increaseAttempts
};