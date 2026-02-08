import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'delete',
        path: '/schedules/{scheduleId}',
        private: true,
        cors,
        // authorizer, // API Key auth (original)
      },
    },
    {
      http: {
        method: 'delete',
        path: '/api/schedules/{scheduleId}',
        cors,
        authorizer: cognitoAuthorizer, // Cognito auth (for frontend)
      },
    },
  ],
};
