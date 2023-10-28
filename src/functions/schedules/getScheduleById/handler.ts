import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getScheduleById } from '@libs/schedules';
import { ScheduleResource } from 'src/types';

const getSchedule = async (event) => {
  try {
    const { scheduleId } = event.pathParameters;
    const schedules = await getScheduleById(scheduleId);
    if (schedules) {
      return formatJSONResponse({ ...schedules, isActive: schedules.isActive === 'true' } as ScheduleResource);
    }
    return formatJSONResponse({
      message: 'Entity does not exists',
    }, 404);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(getSchedule);