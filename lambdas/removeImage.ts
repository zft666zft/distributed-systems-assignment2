import { SQSEvent } from 'aws-lambda';
import { S3 } from 'aws-sdk';

const s3 = new S3();

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const s3Record = body.Records?.[0]?.s3;
    const key = decodeURIComponent(s3Record.object.key.replace(/\+/g, ' '));

    await s3.deleteObject({
      Bucket: process.env.BUCKET_NAME!,
      Key: key,
    }).promise();

    console.log(`🗑 Deleted invalid file: ${key}`);
  }
};
