import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 900,
  events: [
    {
      stream: {
        type: 'dynamodb',
        arn: {
          'Fn::GetAtt': ['ResourcesStatesTable', 'StreamArn']
        },
        batchSize: 1,
        startingPosition: 'LATEST',
        enabled: true,
      }
    },
  ],
};
