import { handlerPath } from '@libs/handler-resolver';
import { cors, cognitoAuthorizer } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    { http: { method: 'post', path: '/command-executions/{executionId}/sync', private: true, cors } },
    { http: { method: 'post', path: '/api/command-executions/{executionId}/sync', cors, authorizer: cognitoAuthorizer } },
  ],
};
