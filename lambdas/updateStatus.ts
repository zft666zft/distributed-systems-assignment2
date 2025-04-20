import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSEvent } from "aws-lambda";

const client = new DynamoDBClient({});

export const handler = async (event: SNSEvent) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);
    const { id, date, update } = message;

    if (!["Pass", "Reject"].includes(update.status)) {
      throw new Error(`Invalid status value: ${update.status}`);
    }

    await client.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { id: { S: id } },
      UpdateExpression: "SET #s = :s, #r = :r, #d = :d",
      ExpressionAttributeNames: {
        "#s": "status",
        "#r": "reason",
        "#d": "date"
      },
      ExpressionAttributeValues: {
        ":s": { S: update.status },
        ":r": { S: update.reason },
        ":d": { S: date }
      }
    }));
  }
};
