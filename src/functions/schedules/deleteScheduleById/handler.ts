import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { deleteScheduleById, getScheduleById } from '@libs/schedules';
import scheduler from '@libs/scheduler';

const removeSchedule = async (event) => {
  try {
    const { scheduleId } = event.pathParameters;
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return formatJSONResponse({
        message: 'Entity does not exists',
      }, 404);
    }
    const ruleName = schedule.ruleArn.split('/').pop();
    const deleteScheduleParams = {
      Name: ruleName
    };
    await scheduler.deleteSchedule(deleteScheduleParams).promise();
    const deletedSchedule = await deleteScheduleById(scheduleId);
    return formatJSONResponse(deletedSchedule);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(removeSchedule);