import { handlerPath } from '@libs/handler-resolver';
import { cors } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: '/resources-states/{resourceStateId}',
        private: true,
        cors,
        // authorizer,
      },
    },
  ],
};
