import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: '/resources-states/{resourceStateId}/start',
        private: true,
        cors,
        // authorizer, // API Key auth (original)
      },
    },
    {
      http: {
        method: 'post',
        path: '/api/resources-states/{resourceStateId}/start',
        cors,
        authorizer: cognitoAuthorizer, // Cognito auth (for frontend)
      },
    },
  ],
};
