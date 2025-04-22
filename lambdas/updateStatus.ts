import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { SNSEvent } from "aws-lambda";

const client = new DynamoDBClient({});
const snsClient = new SNSClient({});

export const handler = async (event: SNSEvent) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);
    const { id, date, update, email } = message;

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

    // Send a message to Mailer
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.MAILER_TOPIC_ARN,
      Message: JSON.stringify({ id, email }), 
    }));
  }
};
