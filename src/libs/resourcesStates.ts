import dynamodb from './dynamodb';
import { ResourceState, ResourceStateInput, UpdateResourceStateInput } from '../types';
import HttpError from './error';
import { getResourceState } from './resourceManager';
import { v4 as uuidv4 } from 'uuid';

const TableName = process.env.RESOURCES_STATES_TABLE;

export const getResourcesStates = async () => {
  try {
    const params = {
      TableName,
    };
    const result = await dynamodb.scan(params).promise();
    return (result.Items || []) as ResourceState[];
  } catch (e) {
    console.error('There was an error fetching the items: ', e);
    throw new HttpError('Unable to fetch items');
  }
};

export const getResourceStateById = async (id: string) => {
  const params = {
    TableName,
    KeyConditionExpression: '#id = :id',
    ExpressionAttributeNames: {
      '#id': 'id'
    },
    ExpressionAttributeValues: {
      ':id': id
    },
    ScanIndexForward: false,
    Limit: 1,
  };

  const result = await dynamodb.query(params).promise();

  return result.Items[0] as ResourceState || null;
};

export const storeResourceState = async (resourceState: ResourceStateInput) => {
  const newResourceState: ResourceState = {
    ...resourceState,
    id: uuidv4(),
    state: await getResourceState(resourceState)
  };
  if (newResourceState.state === null) {
    throw new HttpError('Resource does not exists in this account', 404);
  }
  const params = {
    TableName,
    Item: newResourceState,
  };
  await dynamodb.put(params).promise();
  return params.Item;
};

export const updateResourceState = async (resourceState: UpdateResourceStateInput) => {
  const oldResourceState = await getResourceStateById(resourceState.id);
  if (!oldResourceState) {
    throw new HttpError('Entity does not exists', 404);
  }
  const setParts = ['#resourceIdentifier = :resourceIdentifier', '#type = :type', '#name = :name', '#updatedAt = :timestamp'];
  const ExpressionAttributeNames: Record<string, string> = {
    '#resourceIdentifier': 'resourceIdentifier',
    '#type': 'type',
    '#name': 'name',
    '#updatedAt': 'updatedAt',
  };
  const ExpressionAttributeValues: Record<string, unknown> = {
    ':resourceIdentifier': resourceState.resourceIdentifier,
    ':type': resourceState.type,
    ':name': resourceState.name,
    ':timestamp': resourceState.timestamp,
  };
  if (resourceState.serviceURL !== undefined) {
    setParts.push('#serviceURL = :serviceURL');
    ExpressionAttributeNames['#serviceURL'] = 'serviceURL';
    ExpressionAttributeValues[':serviceURL'] = resourceState.serviceURL;
  }
  const params = {
    TableName,
    Key: { id: resourceState.id },
    UpdateExpression: `SET ${setParts.join(', ')}`,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW' as const,
  };
  const result = await dynamodb.update(params).promise();
  return {
    ...oldResourceState,
    ...result.Attributes,
  } as ResourceState;
}

export const deleteResourceStateById = async (id: string) => {
  const oldResourceState = await getResourceStateById(id);
  if (!oldResourceState) {
    throw new HttpError('Entity does not exists', 404);
  }
  const params = {
    TableName,
    Key: {
      id,
    },
  };
  await dynamodb.delete(params).promise();
  return oldResourceState;
}

export const changeResourceState = async (resourceStateId: string, state: 0|1) => {
  const oldResourceState = await getResourceStateById(resourceStateId);
  if (!oldResourceState) {
    throw new HttpError('Entity does not exists', 404);
  }
  const params = {
    TableName,
    Key: {
      id: resourceStateId,
    },
    UpdateExpression: 'SET #state = :state',
    ExpressionAttributeNames: {
      '#state': 'state',
    },
    ExpressionAttributeValues: {
      ':state': state,
    },
    ReturnValues: 'ALL_NEW'
  };
  const result = await dynamodb.update(params).promise();
  return {
    ...oldResourceState,
    ...result.Attributes,
  } as ResourceState;
}