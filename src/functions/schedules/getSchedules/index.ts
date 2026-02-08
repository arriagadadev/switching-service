import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: '/schedules',
        private: true,
        cors,
        // authorizer, // API Key auth (original)
      },
    },
    {
      http: {
        method: 'get',
        path: '/api/schedules',
        cors,
        authorizer: cognitoAuthorizer, // Cognito auth (for frontend)
      },
    },
  ],
};
