export type ResourceType = 'RDS' | 'EC2' | 'ECS';
export type State = 0 | 1;

export type ResourceState = {
    id: string; // uuid
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    state: State;
    name: string;
    timestamp: number;
    serviceURL?: string; // optional URL if the service is exposed to the internet
}

export type ResourceStateResource = {
    id: string; // uuid
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    state: State;
    name: string;
    timestamp: number;
    serviceURL?: string;
}

export type StoreResourceStateBody = {
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    name: string;
    serviceURL?: string;
}

export type UpdateResourceStateBody = {
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    name: string;
    serviceURL?: string;
}

export type ResourceStateInput = {
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    name: string;
    timestamp: number;
    serviceURL?: string;
}

export type UpdateResourceStateInput = {
    id: string; // uuid
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    name: string;
    timestamp: number;
    serviceURL?: string;
}

export type Resource = {
    type: ResourceType;
    id: string;
    resourceIdentifier: string;
}

export type Schedule = {
    id: string;
    revision: number;
    isActive: string;
    ruleArn: string;
    name: string;
    cron: string;
    isEnabled: boolean;
    desiredState: State;
    resources: Resource[];
    timestamp: number;
}

export type ScheduleInput = {
    id: string;
    ruleArn: string;
    name: string;
    cron: string;
    isEnabled: boolean;
    desiredState: State;
    resources: Resource[];
    timestamp: number;
}

export type UpdateScheduleInput = {
    id: string;
    name: string;
    cron: string;
    isEnabled: boolean;
    desiredState: State;
    resources: Resource[];
}

export type UpdateScheduleBody = {
    name: string;
    cron: string;
    isEnabled: boolean;
    desiredState: State;
    resources: Resource[];
}

export type StoreScheduleBody = {
    name: string;
    cron: string;
    isEnabled: boolean;
    desiredState: State;
    resources: Resource[];
}

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
}

// SSM Commands feature for EC2
export type Command = {
    id: string;
    name: string;
    command: string;
    description?: string;
    linkedResourceIds: string[]; // resource state IDs for quick execution
    timestamp: number;
}

export type CommandInput = {
    name: string;
    command: string;
    description?: string;
    linkedResourceIds?: string[];
}

export type StoreCommandBody = CommandInput;

export type UpdateCommandBody = CommandInput;

export type CommandExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'partial';

export type CommandExecutionInvocation = {
    resourceId: string;
    instanceId: string;
    resourceName: string;
    status: 'Pending' | 'InProgress' | 'Success' | 'Failed' | 'Cancelled' | 'TimedOut';
    output?: string;
    error?: string;
}

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
}

export type ExecuteCommandBody = {
    resourceIds: string[];
}