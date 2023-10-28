import type { AWS } from '@serverless/typescript';

import { region, runtime, stage } from 'serverless/parameters';

import functions from './src/functions';

const serviceName = 'switching-service';
const resourcesStatesTableName = `${serviceName}-resources-states-${stage}`;
const schedulesTableName = `${serviceName}-schedules-${stage}`;

const serverlessConfiguration: AWS = {
  service: serviceName,
  frameworkVersion: '3',
  plugins: [
    'serverless-dotenv-plugin',
    'serverless-esbuild',
    'serverless-offline'
  ],
  useDotenv: true,
  provider: {
    name: 'aws',
    region,
    stage,
    runtime,
    deploymentMethod: 'direct',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeys: [
        `${serviceName}-api-key-${stage}`,
      ],
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        Resource: [
          `arn:aws:dynamodb:${region}:*:table/${resourcesStatesTableName}`,
          `arn:aws:dynamodb:${region}:*:table/${resourcesStatesTableName}/index/*`,
          `arn:aws:dynamodb:${region}:*:table/${schedulesTableName}`,
          `arn:aws:dynamodb:${region}:*:table/${schedulesTableName}/index/*`,
        ],
      },
      // Allow rds describe db instances
      {
        Effect: 'Allow',
        Action: [
          'rds:DescribeDBInstances',
        ],
        Resource: '*',
      },
      // Allow ec2 describe instances
      {
        Effect: 'Allow',
        Action: [
          'ec2:DescribeInstances',
        ],
        Resource: '*',
      },
      // add events put rule and put targets
      {
        Effect: 'Allow',
        Action: [
          'events:PutRule',
          'events:PutTargets',
          'events:RemoveTargets',
          'events:DeleteRule'
        ],
        Resource: '*',
      },
    ],
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      STAGE: stage,
      RESOURCES_STATES_TABLE: resourcesStatesTableName,
      SCHEDULES_TABLE: schedulesTableName,
      AWS_ACCOUNT: '${env:AWS_ACCOUNT}',
    },
  },
  resources: {
    Resources: {
      ResourcesStatesTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: resourcesStatesTableName,
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'type', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: 'resources-by-type-index',
              KeySchema: [
                {
                  AttributeName: 'type',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'id',
                  KeyType: 'RANGE',
                }
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
            }
          ],
          StreamSpecification: {
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          },
          /*
            Activar esto y quitar el modo pay per request si ya conocemos el flujo esperado de esto 
            ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          }, */
          BillingMode: "PAY_PER_REQUEST"
        },
      },
      SchedulesTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: schedulesTableName,
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'revision', AttributeType: 'N' },
            { AttributeName: 'isActive', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
            { AttributeName: 'revision', KeyType: 'RANGE' },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: 'isActive-S-index',
              KeySchema: [
                {
                  AttributeName: 'isActive',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
            }
          ],
          /*
            Activar esto y quitar el modo pay per request si ya conocemos el flujo esperado de esto 
            ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          }, */
          BillingMode: "PAY_PER_REQUEST"
        },
      },
    }
  },
  functions,
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    'serverless-offline': {
      httpPort: 4000,
      websocketPort: 4001,
      lambdaPort: 4002,
    },
  },
};

module.exports = serverlessConfiguration;
