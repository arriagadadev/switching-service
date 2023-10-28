import { getResourceStateById } from '@libs/resourcesStates';
import { shutDownResource, startResource } from '@libs/resourceManager';

// Dynamo stream event handler
// TODO: remove resources states from schedules
// This lambda needs to be idempotent
export const main = async (event) => {
  try {
    for (const record of event.Records) {
      const { eventName, dynamodb } = record;
      if (eventName === 'MODIFY') {
        const { NewImage, OldImage } = dynamodb;
        if (NewImage.state.N !== OldImage.state.N) {
          const resourceState = await getResourceStateById(dynamodb.Keys.id.S);
          if (resourceState) {
            if (resourceState.state === 0) {
              await shutDownResource(resourceState);
            } else if (resourceState.state === 1) {
              await startResource(resourceState);
            }
          }
        }
      }
    }
  } catch ({ message }) {
    console.log(message);
  }
  return null
};