import { SQSEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const s3Record = body.Records?.[0]?.s3;
    const key = decodeURIComponent(s3Record.object.key.replace(/\+/g, ' '));

    if (!key.endsWith('.jpeg') && !key.endsWith('.png')) {
      console.error(`Invalid file type: ${key}`);
      throw new Error('Invalid file type');
    }

    await dynamodb.put({
      TableName: process.env.TABLE_NAME!,
      Item: { id: key },
    }).promise();

    console.log(`✅ Logged image: ${key}`);
  }
};
