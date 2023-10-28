import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getAllSchedules } from '@libs/schedules';
import { Schedule, ScheduleResource } from 'src/types';

const getSchedules = async () => {
  try {
    const schedules = await getAllSchedules();
    const scheduleResources: ScheduleResource[] = schedules.map((schedule: Schedule) => ( { ...schedule, isActive: schedule.isActive === 'true' } ) );
    return formatJSONResponse(scheduleResources);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(getSchedules);