import { SNSEvent } from "aws-lambda";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ddb = new DynamoDBClient({});
const ses = new SESClient({});

export const handler = async (event: SNSEvent): Promise<void> => {
  for (const record of event.Records) {
    const { id, email } = JSON.parse(record.Sns.Message);

    const result = await ddb.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { id: { S: id } },
    }));

    const item = result.Item;

    const status = item?.status?.S ?? "Unknown";
    const reason = item?.reason?.S ?? "No reason provided";
    const date = item?.date?.S ?? "Unknown";

    const body = `Your image '${id}' has been reviewed.\n\nStatus: ${status}\nReason: ${reason}\nDate: ${date}`;

    await ses.send(new SendEmailCommand({
      Source: process.env.SENDER_EMAIL!,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `Image Review Result for '${id}'` },
        Body: { Text: { Data: body } },
      },
    }));
  }
};
