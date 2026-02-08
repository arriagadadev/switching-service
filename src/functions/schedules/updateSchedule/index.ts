import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'put',
        path: '/schedules/{scheduleId}',
        private: true,
        cors,
        // authorizer, // API Key auth (original)
      },
    },
    {
      http: {
        method: 'put',
        path: '/api/schedules/{scheduleId}',
        cors,
        authorizer: cognitoAuthorizer, // Cognito auth (for frontend)
      },
    },
  ],
};
