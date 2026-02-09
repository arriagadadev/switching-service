import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    { http: { method: 'delete', path: '/commands/{commandId}', private: true, cors } },
    { http: { method: 'delete', path: '/api/commands/{commandId}', cors, authorizer: cognitoAuthorizer } },
  ],
};
