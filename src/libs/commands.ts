import dynamodb from './dynamodb';
import { Command, CommandExecution, CommandInput } from '../types';
import HttpError from './error';
import { v4 as uuidv4 } from 'uuid';

const CommandsTableName = process.env.COMMANDS_TABLE!;
const CommandExecutionsTableName = process.env.COMMAND_EXECUTIONS_TABLE!;

export const getAllCommands = async (): Promise<Command[]> => {
  const result = await dynamodb.scan({ TableName: CommandsTableName }).promise();
  const items = (result.Items || []) as Command[];
  return items.sort((a, b) => b.timestamp - a.timestamp);
};

export const getCommandById = async (id: string): Promise<Command | null> => {
  const result = await dynamodb
    .get({
      TableName: CommandsTableName,
      Key: { id },
    })
    .promise();

  return (result.Item as Command) || null;
};

export const storeCommand = async (input: CommandInput): Promise<Command> => {
  const command: Command = {
    id: uuidv4(),
    name: input.name,
    command: input.command,
    description: input.description,
    linkedResourceIds: input.linkedResourceIds || [],
    timestamp: Date.now(),
  };

  await dynamodb.put({
    TableName: CommandsTableName,
    Item: command,
  }).promise();

  return command;
};

export const updateCommand = async (
  id: string,
  input: CommandInput
): Promise<Command> => {
  const existing = await getCommandById(id);
  if (!existing) {
    throw new HttpError('Comando no encontrado', 404);
  }

  const command: Command = {
    ...existing,
    name: input.name,
    command: input.command,
    description: input.description,
    linkedResourceIds: input.linkedResourceIds || [],
    timestamp: Date.now(),
  };

  await dynamodb.put({
    TableName: CommandsTableName,
    Item: command,
  }).promise();

  return command;
};

export const deleteCommandById = async (id: string): Promise<Command> => {
  const existing = await getCommandById(id);
  if (!existing) {
    throw new HttpError('Comando no encontrado', 404);
  }

  await dynamodb.delete({
    TableName: CommandsTableName,
    Key: { id },
  }).promise();

  return existing;
};

export const getCommandExecutions = async (
  limit: number = 50
): Promise<CommandExecution[]> => {
  const result = await dynamodb
    .scan({
      TableName: CommandExecutionsTableName,
      Limit: limit,
    })
    .promise();

  const items = (result.Items || []) as CommandExecution[];
  return items.sort((a, b) => b.timestamp - a.timestamp);
};

export const getCommandExecutionById = async (
  id: string
): Promise<CommandExecution | null> => {
  const result = await dynamodb
    .get({
      TableName: CommandExecutionsTableName,
      Key: { id },
    })
    .promise();

  return (result.Item as CommandExecution) || null;
};

export const storeCommandExecution = async (
  execution: Omit<CommandExecution, 'id'>
): Promise<CommandExecution> => {
  const full: CommandExecution = {
    ...execution,
    id: uuidv4(),
  };

  await dynamodb.put({
    TableName: CommandExecutionsTableName,
    Item: full,
  }).promise();

  return full;
};

export const updateCommandExecution = async (
  id: string,
  updates: Partial<Pick<CommandExecution, 'status' | 'invocations' | 'completedAt'>>
): Promise<CommandExecution> => {
  const existing = await getCommandExecutionById(id);
  if (!existing) {
    throw new HttpError('Ejecución no encontrada', 404);
  }

  const updated: CommandExecution = {
    ...existing,
    ...updates,
  };

  await dynamodb.put({
    TableName: CommandExecutionsTableName,
    Item: updated,
  }).promise();

  return updated;
};
