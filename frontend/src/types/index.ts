export type ResourceType = 'RDS' | 'EC2' | 'ECS';
export type State = 0 | 1;

export type ResourceStateResource = {
  id: string;
  resourceIdentifier: string;
  type: ResourceType;
  state: State;
  name: string;
  timestamp: number;
  serviceURL?: string;
};

export type StoreResourceStateBody = {
  resourceIdentifier: string;
  type: ResourceType;
  name: string;
  serviceURL?: string;
};

export type UpdateResourceStateBody = {
  resourceIdentifier: string;
  type: ResourceType;
  name: string;
  serviceURL?: string;
};

export type Resource = {
  type: ResourceType;
  id: string;
  resourceIdentifier: string;
};

export type ScheduleResource = {
  id: string;
  revision: number;
  isActive: boolean;
  ruleArn: string;
  name: string;
  cron: string;
  isEnabled: boolean;
  desiredState: State;
  resources: Resource[];
  timestamp: number;
};

export type StoreScheduleBody = {
  name: string;
  cron: string;
  isEnabled: boolean;
  desiredState: State;
  resources: Resource[];
};

export type UpdateScheduleBody = {
  name: string;
  cron: string;
  isEnabled: boolean;
  desiredState: State;
  resources: Resource[];
};

export type Command = {
  id: string;
  name: string;
  command: string;
  description?: string;
  linkedResourceIds: string[];
  timestamp: number;
};

export type StoreCommandBody = {
  name: string;
  command: string;
  description?: string;
  linkedResourceIds?: string[];
};

export type UpdateCommandBody = StoreCommandBody;

export type CommandExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'partial';

export type CommandExecutionInvocation = {
  resourceId: string;
  instanceId: string;
  resourceName: string;
  status: string;
  output?: string;
  error?: string;
};

export type CommandExecution = {
  id: string;
  commandId: string;
  commandName: string;
  resourceIds: string[];
  status: CommandExecutionStatus;
  ssmCommandId?: string;
  invocations: CommandExecutionInvocation[];
  timestamp: number;
  completedAt?: number;
};
