import { handlerPath } from '@libs/handler-resolver';
import { cors } from '../../../../serverless/parameters';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'delete',
        path: '/schedules/{scheduleId}',
        private: true,
        cors,
        // authorizer,
      },
    },
  ],
};
