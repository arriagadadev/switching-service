import { changeResourceState } from '@libs/resourcesStates';
import { getScheduleById } from '@libs/schedules';
import { getResourceState } from '@libs/resourceManager';
import { getResourceStateById } from '@libs/resourcesStates';

export const main = async (event) => {
  try {
    const { scheduleId } = event;
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule does not exists');
    }
    const { resources } = schedule;
    for (const resource of resources) {
      const dynamoResource = await getResourceStateById(resource.id);
      const currentState = await getResourceState(dynamoResource);
      if (currentState === schedule.desiredState) {
        console.log(`Resource ${resource.id} is already in desired state ${schedule.desiredState}`);
      }
      console.log(`Changing resource ${resource.id} state to ${schedule.desiredState}`);
      await changeResourceState(resource.id, schedule.desiredState);
    }
  } catch ({ message }) {
    console.log(message);
  }
  return null
};