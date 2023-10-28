import { getResourcesStates } from '@libs/resourcesStates';
import { shutDownResource, startResource, getResourceState } from '@libs/resourceManager';

// Check all resources states and start or shut down resources if needed
export const main = async () => {
  try {
    const resourcesStates = await getResourcesStates();
    for (const resourceState of resourcesStates) {
      if (resourceState.state !== await getResourceState(resourceState)) {
        if (resourceState.state === 1) {
          await startResource(resourceState);
        }
        else if (resourceState.state === 0) {
          await shutDownResource(resourceState);
        }
      }
    }
  } catch ({ message }) {
    console.log(message);
  }
  return null
};