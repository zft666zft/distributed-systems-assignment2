import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as events from 'aws-cdk-lib/aws-lambda-event-sources';
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs';




export class PhotoGalleryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for photo uploads
    const bucket = new s3.Bucket(this, 'PhotoGalleryBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB Table for photo info
    const table = new dynamodb.Table(this, 'PhotoGalleryTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SQS Queues
    const dlq = new sqs.Queue(this, 'ImageDLQ');
    const logQueue = new sqs.Queue(this, 'ImageLogQueue', {
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: dlq,
      },
    });

    // Lambda - LogImage
    const logImageFn = new lambdanode.NodejsFunction(this, 'LogImageFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/logImage.ts`,
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    

    table.grantWriteData(logImageFn);
    logImageFn.addEventSource(new events.SqsEventSource(logQueue));



    // S3 -> Send upload events to queue
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(logQueue)
    );

    // Lambda - RemoveImage
    const removeImageFn = new lambdanode.NodejsFunction(this, 'RemoveImageFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/removeImage.ts`,
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    bucket.grantDelete(removeImageFn);
    removeImageFn.addEventSource(new events.SqsEventSource(dlq));

    

     
  }
}
