import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { storeCommand } from '@libs/commands';
import type { StoreCommandBody } from 'src/types';

const storeCommandHandler = async (event) => {
  try {
    const body: StoreCommandBody = event.body;
    if (!body?.name?.trim()) {
      return formatJSONResponse({ message: 'El nombre es requerido' }, 400);
    }
    if (!body?.command?.trim()) {
      return formatJSONResponse({ message: 'El comando es requerido' }, 400);
    }
    const command = await storeCommand({
      name: body.name.trim(),
      command: body.command.trim(),
      description: body.description?.trim(),
      linkedResourceIds: body.linkedResourceIds || [],
    });
    return formatJSONResponse(command);
  } catch ({ message, statusCode = 500 }) {
    return formatJSONResponse({ message }, statusCode);
  }
};

export const main = middyfy(storeCommandHandler);
