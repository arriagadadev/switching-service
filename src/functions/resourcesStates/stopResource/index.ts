import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: '/resources-states/{resourceStateId}/stop',
        private: true,
        cors,
        // authorizer, // API Key auth (original)
      },
    },
    {
      http: {
        method: 'post',
        path: '/api/resources-states/{resourceStateId}/stop',
        cors,
        authorizer: cognitoAuthorizer, // Cognito auth (for frontend)
      },
    },
  ],
};
