import { handlerPath } from '@libs/handler-resolver';
import { cors } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: '/resources-states/{resourceStateId}/stop',
        private: true,
        cors,
        // authorizer,
      },
    },
  ],
};
