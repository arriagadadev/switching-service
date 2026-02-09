export type ResourceType = 'RDS' | 'EC2' | 'ECS';
export type State = 0 | 1;

export type ResourceStateResource = {
  id: string;
  resourceIdentifier: string;
  type: ResourceType;
  state: State;
  name: string;
  timestamp: number;
};

export type StoreResourceStateBody = {
  resourceIdentifier: string;
  type: ResourceType;
  name: string;
};

export type UpdateResourceStateBody = {
  resourceIdentifier: string;
  type: ResourceType;
  name: string;
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
