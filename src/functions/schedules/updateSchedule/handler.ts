import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { updateSchedule, getScheduleById } from '@libs/schedules';
import { ScheduleResource, UpdateScheduleInput, UpdateScheduleBody } from 'src/types';
import scheduler from '@libs/scheduler';
import { isCron } from '@utils/validations';

const STAGE = process.env.STAGE;
const AWS_ACCOUNT = process.env.AWS_ACCOUNT;
const AWS_REGION = process.env.AWS_REGION;

const editSchedule = async (event) => {
  try {
    const body: UpdateScheduleBody = event.body;
    const { scheduleId } = event.pathParameters;
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

    const oldSchedule = await getScheduleById(scheduleId);
    if (!oldSchedule) {
      return formatJSONResponse({
        message: 'Entity does not exists',
      }, 404);
    }

    const scheduleName = oldSchedule.ruleArn.split('/').pop();
    const params = {
      Name: scheduleName,
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
          scheduleId,
        }),
      }
    };
    try {
      const result = await scheduler.updateSchedule(params).promise();
      if (!result.ScheduleArn) {
        throw new Error('Error creating rule');
      }
    } catch (error) {
      console.log(error);
      return formatJSONResponse({
      message: 'Error creating rule',
      }, 500);
    }

    const updatedSchedule: UpdateScheduleInput = {
      ...body,
      id: scheduleId,
    };
    const schedule = await updateSchedule(updatedSchedule);
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

export const main = middyfy(editSchedule);