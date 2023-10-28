import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { storeResourceState } from '@libs/resourcesStates';
import { ResourceStateInput, StoreResourceStateBody } from 'src/types';

const createResourceState = async (event) => {
  try {
    const body: StoreResourceStateBody = event.body;
    // Validations
    if (!body.name) {
      return formatJSONResponse({
        message: 'Name is required',
      }, 400);
    }

    const newResourceState: ResourceStateInput = {
      ...body,
      timestamp: Date.now(),
    };
    const resourceState = await storeResourceState(newResourceState);
    return formatJSONResponse(resourceState);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(createResourceState);