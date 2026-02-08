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
    'serverless-esbuild'
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
      {
        Effect: 'Allow',
        Action: [
          'rds:StartDBInstance',
          'rds:StopDBInstance',
          'rds:DescribeDBInstances',
          'rds:ListTagsForResource',
        ],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: [
          'ec2:DescribeInstances',
          'ec2:DescribeInstanceStatus',
          'ec2:DescribeTags',
          'ec2:StartInstances',
          'ec2:StopInstances',
        ],
        Resource: '*',
      },
      {
        Effect: "Allow",
        Action: [
          "ecs:*",
        ],
        Resource: "*"
      },
      {
        Effect: 'Allow',
        Action: [
          'scheduler:*',
        ],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: 'iam:PassRole',
        Resource: 'arn:aws:iam::*:role/*',
        Condition: {
          StringLike: {
            'iam:PassedToService': 'scheduler.amazonaws.com'
          }
        }
      }
    ],
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      STAGE: stage,
      RESOURCES_STATES_TABLE: resourcesStatesTableName,
      SCHEDULES_TABLE: schedulesTableName,
      AWS_ACCOUNT: '${env:AWS_ACCOUNT}',
      COGNITO_USER_POOL_ID: {
        Ref: 'CognitoUserPool',
      },
      COGNITO_USER_POOL_CLIENT_ID: {
        Ref: 'CognitoUserPoolClient',
      },
      SCHEDULER_ROLE_ARN: {
        'Fn::GetAtt': ['SchedulerRole', 'Arn']
      },
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
          BillingMode: "PAY_PER_REQUEST"
        },
      },
      SchedulerRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `${serviceName}-scheduler-role-${stage}`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'scheduler.amazonaws.com' },
                Action: 'sts:AssumeRole',
              },
            ],
          },
          Policies: [
            {
              PolicyName: `${serviceName}-scheduler-policy-${stage}`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'lambda:InvokeFunction',
                      'lambda:InvokeAsync',
                      'sqs:SendMessage',
                    ],
                    Resource: '*',
                  },
                  {
                    Effect: "Allow",
                    Action: [
                      "ecs:UpdateService",
                      "ecs:DescribeServices"
                    ],
                    Resource: "*"
                  },
                ],
              },
            },
          ],
        },
      },
      CognitoUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          UserPoolName: `${serviceName}-user-pool-${stage}`,
          AutoVerifiedAttributes: ['email'],
          UsernameAttributes: ['email'],
          Policies: {
            PasswordPolicy: {
              MinimumLength: 8,
              RequireUppercase: true,
              RequireLowercase: true,
              RequireNumbers: true,
              RequireSymbols: false,
            },
          },
          Schema: [
            {
              Name: 'email',
              Required: true,
              Mutable: true,
            },
          ],
        },
      },
      CognitoUserPoolClient: {
        Type: 'AWS::Cognito::UserPoolClient',
        Properties: {
          ClientName: `${serviceName}-client-${stage}`,
          UserPoolId: {
            Ref: 'CognitoUserPool',
          },
          GenerateSecret: false,
          ExplicitAuthFlows: [
            'ALLOW_USER_PASSWORD_AUTH',
            'ALLOW_REFRESH_TOKEN_AUTH',
            'ALLOW_USER_SRP_AUTH',
          ],
        },
      },
      CognitoAuthorizer: {
        Type: 'AWS::ApiGateway::Authorizer',
        Properties: {
          Name: `${serviceName}-cognito-authorizer-${stage}`,
          RestApiId: {
            Ref: 'ApiGatewayRestApi',
          },
          Type: 'COGNITO_USER_POOLS',
          ProviderARNs: [
            {
              'Fn::GetAtt': ['CognitoUserPool', 'Arn'],
            },
          ],
          IdentitySource: 'method.request.header.Authorization',
        },
      },
    },
    Outputs: {
      CognitoUserPoolId: {
        Description: 'Cognito User Pool ID',
        Value: {
          Ref: 'CognitoUserPool',
        },
        Export: {
          Name: `${serviceName}-${stage}-cognito-user-pool-id`,
        },
      },
      CognitoUserPoolClientId: {
        Description: 'Cognito User Pool Client ID',
        Value: {
          Ref: 'CognitoUserPoolClient',
        },
        Export: {
          Name: `${serviceName}-${stage}-cognito-client-id`,
        },
      },
      ApiGatewayRestApiId: {
        Description: 'API Gateway REST API ID',
        Value: {
          Ref: 'ApiGatewayRestApi',
        },
        Export: {
          Name: `${serviceName}-${stage}-api-id`,
        },
      },
      ApiGatewayRestApiUrl: {
        Description: 'API Gateway REST API URL',
        Value: {
          'Fn::Join': [
            '',
            [
              'https://',
              { Ref: 'ApiGatewayRestApi' },
              '.execute-api.',
              region,
              '.amazonaws.com/',
              stage,
            ],
          ],
        },
        Export: {
          Name: `${serviceName}-${stage}-api-url`,
        },
      },
    },
  },
  functions,
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: [],
      target: 'node20',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
