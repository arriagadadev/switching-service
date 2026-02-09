import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    { http: { method: 'get', path: '/command-executions/{executionId}', private: true, cors } },
    { http: { method: 'get', path: '/api/command-executions/{executionId}', cors, authorizer: cognitoAuthorizer } },
  ],
};
