import dynamodb from './dynamodb';
import { Schedule, ScheduleInput, UpdateScheduleInput } from '../types';
import HttpError from './error';

const TableName = process.env.SCHEDULES_TABLE;

export const getAllSchedules = async () => {
  try {
    const params = {
      TableName,
      IndexName: "isActive-S-index",
      KeyConditionExpression: "isActive = :isActive",
      ExpressionAttributeValues: {
        ":isActive": 'true',
      }
    };
    const result = await dynamodb.query(params).promise();
    return (result.Items || []) as Schedule[];
  } catch (e) {
    console.error('There was an error fetching the items: ', e);
    throw new HttpError('Unable to fetch items');
  }
};

export const getScheduleById = async (id: string) => {
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

  return (result.Items[0]?.isActive === 'true' ? result.Items[0] as Schedule : null);
};

export const storeSchedule = async (schedule: ScheduleInput) => {
  const newSchedule: Schedule = {
    ...schedule,
    revision: 1,
    isActive: 'true'
  };

  const params = {
    TableName,
    Item: newSchedule,
  };
  await dynamodb.put(params).promise();
  return params.Item;
};

export const updateSchedule = async (schedule: UpdateScheduleInput) => {
  const oldSchedule = await getScheduleById(schedule.id);
  if (!oldSchedule) {
    throw new HttpError('Entity does not exists', 404);
  }
  const updateOldRevisionParams = {
    TableName,
    Key: {
      id: oldSchedule.id,
      revision: oldSchedule.revision,
    },
    UpdateExpression: 'set #isActive = :isActive',
    ExpressionAttributeNames: {
      '#isActive': 'isActive',
    },
    ExpressionAttributeValues: {
      ':isActive': 'false',
    },
    ReturnValues: 'UPDATED_NEW',
  };
  await dynamodb.update(updateOldRevisionParams).promise();

  const newSchedule: Schedule = {
    ...schedule,
    revision: oldSchedule.revision + 1,
    id: oldSchedule.id,
    ruleArn: oldSchedule.ruleArn,
    isActive: 'true',
    timestamp: Date.now(),
  };
  const newRevisionParams = {
    TableName,
    Item: newSchedule,
  };
  await dynamodb.put(newRevisionParams).promise();
  return newRevisionParams.Item;
}

export const deleteScheduleById = async (id: string) => {
  const oldSchedule = await getScheduleById(id);
  if (!oldSchedule) {
    throw new HttpError('Entity does not exists', 404);
  }
  const params = {
    TableName,
    Key: {
      id,
      revision: oldSchedule.revision,
    },
    UpdateExpression: 'set #isActive = :isActive',
    ExpressionAttributeNames: {
      '#isActive': 'isActive'
    },
    ExpressionAttributeValues: {
      ':isActive': 'false'
    },
    ReturnValues: 'UPDATED_NEW',
  };
  const result = await dynamodb.update(params).promise();
  return {
    ...oldSchedule,
    ...result.Attributes,
  } as Schedule;
}