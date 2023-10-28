import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { updateSchedule, getScheduleById } from '@libs/schedules';
import { ScheduleResource, UpdateScheduleInput, UpdateScheduleBody } from 'src/types';
import eventBridge from '@libs/eventBridge';
import { isCron } from '@utils/validations';

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

    const ruleName = oldSchedule.ruleArn.split('/').pop();

    const params = {
      Name: ruleName,
      ScheduleExpression: `cron(${body.cron})`,
      State: body.isEnabled ? 'ENABLED' : 'DISABLED',
    };
    try {
      const result = await eventBridge.putRule(params).promise();
      if (!result.RuleArn) {
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