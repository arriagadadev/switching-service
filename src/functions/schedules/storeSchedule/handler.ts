import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { storeSchedule } from '@libs/schedules';
import { ScheduleResource, ScheduleInput, StoreScheduleBody } from 'src/types';
import scheduler from '@libs/scheduler';
import { v4 as uuidv4 } from 'uuid';
import { isCron } from '@utils/validations';

const STAGE = process.env.STAGE;
const AWS_ACCOUNT = process.env.AWS_ACCOUNT;
const AWS_REGION = process.env.AWS_REGION;
const createSchedule = async (event) => {
  try {
    const body: StoreScheduleBody = event.body;
    // Validations
    if (!body.name) {
      return formatJSONResponse({
        message: 'Name is required',
      }, 400);
    }
    if (!body.cron || !isCron(body.cron)) {
      return formatJSONResponse({
        message: 'cron is missing or invalid',
      }, 400);
    }
    if (body.isEnabled === undefined) {
      return formatJSONResponse({
        message: 'isEnabled is required',
      }, 400);
    }
    const uuid = uuidv4();
    const params = {
      Name: uuid,
      ScheduleExpression: `cron(${body.cron})`,
      ScheduleExpressionTimezone: 'America/Santiago',
      State: body.isEnabled ? 'ENABLED' : 'DISABLED',
      FlexibleTimeWindow: {
        Mode: 'OFF',
      },
      Target: {
        Arn: `arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT}:function:switching-service-${STAGE}-turnState`,
        RoleArn: process.env.SCHEDULER_ROLE_ARN,
        Input: JSON.stringify({
          scheduleId: uuid,
        }),
      }
    };
    let ruleArn: string;
    try {
      const result = await scheduler.createSchedule(params).promise();
      if (!result.ScheduleArn) {
        throw new Error('Error creating rule');
      }
      ruleArn = result.ScheduleArn;
    } catch (e) {
      console.log(e);
      return formatJSONResponse({
      message: 'Error creating rule',
      }, 500);
    }

    const newSchedule: ScheduleInput = {
      ...body,
      id: uuid,
      ruleArn,
      timestamp: Date.now(),
    };
    const schedule = await storeSchedule(newSchedule);
    const scheduleResource: ScheduleResource = {
      ...schedule,
      isActive: schedule.isActive === 'true',
    }
    return formatJSONResponse(scheduleResource);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(createSchedule);