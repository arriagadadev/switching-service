import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    { http: { method: 'post', path: '/commands/{commandId}/execute', private: true, cors } },
    { http: { method: 'post', path: '/api/commands/{commandId}/execute', cors, authorizer: cognitoAuthorizer } },
  ],
};
