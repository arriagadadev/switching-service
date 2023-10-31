import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getResourceStateById } from '@libs/resourcesStates';
import { getRawResourceState } from '@libs/resourceManager';

const getResourceState = async (event) => {
  try {
    const { resourceStateId } = event.pathParameters;
    const resourceState = await getResourceStateById(resourceStateId);
    if (!resourceState) {
      return formatJSONResponse({
        message: 'Entity does not exists',
      }, 404);
    }
    const rawResourceState = await getRawResourceState(resourceState);
    return formatJSONResponse({
      ...resourceState,
      rawResourceState,
    });
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(getResourceState);