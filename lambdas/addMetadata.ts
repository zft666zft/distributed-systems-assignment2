import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSEvent } from "aws-lambda";

const ddb = new DynamoDBClient({});

export const handler = async (event: SNSEvent): Promise<void> => {
  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);
    const metadataType = record.Sns.MessageAttributes.metadata_type?.Value;

    if (!["Caption", "Date", "Name"].includes(metadataType)) {
      console.warn(`Invalid metadata_type: ${metadataType}`);
      continue;
    }

    const imageId = message.id;
    const metadataValue = message.value;

    const command = new UpdateItemCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        id: { S: imageId },
      },
      UpdateExpression: `SET #attr = :val`,
      ExpressionAttributeNames: {
        "#attr": metadataType,
      },
      ExpressionAttributeValues: {
        ":val": { S: metadataValue },
      },
    });

    await ddb.send(command);
    console.log(`Updated ${metadataType} for image: ${imageId}`);
  }
};
