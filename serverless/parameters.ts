import type { AWS, AwsLambdaRuntime } from '@serverless/typescript';

import extractArg from './utils/argsExtractor';

export const region: AWS['provider']['region'] = extractArg(
  'region',
  'us-east-1'
) as AWS['provider']['region'];

type stageType = 'develop' | 'qa' | 'prod';

export const stage: stageType = extractArg('stage', 'develop') as stageType;

export const runtime: AwsLambdaRuntime = 'nodejs16.x';

export const logRetentions = {
  develop: 7,
  preprod: 7,
  prod: 60,
}

export const cors = {
  origin: '*',
  headers: [
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token',
    'X-Amz-User-Agent',
    'X-Forwarded-For',
    'X-Request-ID',
    'X-Selected-Company',
    'X-Referer',
  ],
}

export const authorizer = {
  name: 'customAuthorizer',
  arn: '${env:CUSTOM_AUTHORIZER_LAMBDA_ARN}',
  resultTtlInSeconds: 0,
  identitySource: 'method.request.header.Authorization',
  type: 'token',
}

export const cognitoAuthorizer = {
  type: 'COGNITO_USER_POOLS',
  authorizerId: {
    Ref: 'CognitoAuthorizer',
  },
}