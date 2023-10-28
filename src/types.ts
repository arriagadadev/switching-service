export type ResourceType = 'RDS' | 'EC2';
export type State = 0 | 1;

export type ResourceState = {
    id: string; // uuid
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    state: State;
    name: string;
    timestamp: number;
}

export type ResourceStateResource = {
    id: string; // uuid
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    state: State;
    name: string;
    timestamp: number;
}

export type StoreResourceStateBody = {
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    name: string;
}

export type UpdateResourceStateBody = {
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    name: string;
}

export type ResourceStateInput = {
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    name: string;
    timestamp: number;
}

export type UpdateResourceStateInput = {
    id: string; // uuid
    resourceIdentifier: string; // arn or similar identifier of the resource
    type: ResourceType;
    name: string;
    timestamp: number;
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