import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getResourceStateById, changeResourceState } from '@libs/resourcesStates';

const createResourceState = async (event) => {
  try {
    const { resourceStateId } = event.pathParameters;
    const resourceState = await getResourceStateById(resourceStateId);
    if (!resourceState) {
      return formatJSONResponse({
        message: 'Resource state not found',
      }, 404);
    }
    if (resourceState.state === 1) {
      return formatJSONResponse({
        message: 'Resource state already started',
      }, 400);
    } else {
      // Update resource
      await changeResourceState(resourceStateId, 1);
    }
    return formatJSONResponse(resourceState);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(createResourceState);