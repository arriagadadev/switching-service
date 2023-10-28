import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { updateResourceState } from '@libs/resourcesStates';
import { UpdateResourceStateInput, UpdateResourceStateBody } from 'src/types';

const editResourceState = async (event) => {
  try {
    const body: UpdateResourceStateBody = event.body;
    const { resourceStateId } = event.pathParameters;
    // Validations
    if (!body.name) {
      return formatJSONResponse({
        message: 'Name is required',
      }, 400);
    }
    
    const updatedResourceState: UpdateResourceStateInput = {
      ...body,
      id: resourceStateId,
      timestamp: Date.now(),
    };
    const resourceState = await updateResourceState(updatedResourceState);
    return formatJSONResponse(resourceState);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(editResourceState);