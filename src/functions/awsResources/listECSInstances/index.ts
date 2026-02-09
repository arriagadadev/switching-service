import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: '/aws-resources/ecs-instances',
        private: true,
        cors,
      },
    },
    {
      http: {
        method: 'get',
        path: '/api/aws-resources/ecs-instances',
        cors,
        authorizer: cognitoAuthorizer,
      },
    },
  ],
};
