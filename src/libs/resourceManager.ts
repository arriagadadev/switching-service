import rdsClient from './rds';
import ec2Client from './ec2';
import { isServicePoweredOn, powerOnService, powerOffService } from './ecs';
import { ResourceState, ResourceStateInput, State } from '../types';

const getRawRDSStateById = async (id: string): Promise<string | null> => {
    const params = {
        DBInstanceIdentifier: id,
    };
    const result = await rdsClient.describeDBInstances(params).promise();
    if (result.DBInstances.length > 0) {
        return result.DBInstances[0].DBInstanceStatus;
    }
    return null;
}

const getRawECSStateById = async (id: string): Promise<string | null> => {
    const [cluster, service] = id.split('/');
    try {
        const isOn = await isServicePoweredOn(cluster, service);
        return isOn ? 'available' : 'stopped';
    } catch (error) {
        console.error(`Error getting ECS service state for ${id}:`, error);
        return null;
    }
}

const getRawEC2StateById = async (id: string): Promise<string | null> => {
    const params = {
        InstanceIds: [id],
    };
    const result = await ec2Client.describeInstances(params).promise();
    console.log(result)
    if (result.Reservations.length > 0) {
        return result.Reservations[0].Instances[0].State.Name;
    }
    return null;
}

const getECSStateById = async (id: string): Promise<State | null> => {
    const [cluster, service] = id.split('/');
    try {
        const isOn = await isServicePoweredOn(cluster, service);
        return isOn ? 1 : 0;
    } catch (error) {
        console.error(`Error getting ECS service state for ${id}:`, error);
        return null;
    } 
}

const getRDSStateById = async (id: string): Promise<State | null> => {
    const params = {
        DBInstanceIdentifier: id,
    };
    const result = await rdsClient.describeDBInstances(params).promise();
    if (result.DBInstances.length > 0) {
        return result.DBInstances[0].DBInstanceStatus === 'available' ? 1 : 0;
    }
    return null;
}

const getEC2StateById = async (id: string): Promise<State | null> => {
    const params = {
        InstanceIds: [id],
    };
    const result = await ec2Client.describeInstances(params).promise();
    if (result.Reservations.length > 0) {
        return result.Reservations[0].Instances[0].State.Name === 'running' ? 1 : 0;
    }
    return null;
}

export const getResourceState = async (resourceState: ResourceState | ResourceStateInput): Promise<State | null> => {
    const { type, resourceIdentifier } = resourceState;
    if (type === 'RDS') {
        return getRDSStateById(resourceIdentifier);
    } else if (type === 'EC2') {
        return getEC2StateById(resourceIdentifier);
    } else if (type === 'ECS') {
        return getECSStateById(resourceIdentifier);
    } else {
        return null;
    }
}

export const getRawResourceState = async (resourceState: ResourceState | ResourceStateInput): Promise<string | null> => {
    const { type, resourceIdentifier } = resourceState;
    if (type === 'RDS') {
        return await getRawRDSStateById(resourceIdentifier);
    } else if (type === 'EC2') {
        return await getRawEC2StateById(resourceIdentifier);
    } else if (type === 'ECS') {
        return await getRawECSStateById(resourceIdentifier);
    } else {
        return null;
    }
}

export const shutDownResource = async (resourceState: ResourceState) => {
    const { type, resourceIdentifier } = resourceState;
    if (type === 'RDS') {
        const params = {
            DBInstanceIdentifier: resourceIdentifier,
        };
        await rdsClient.stopDBInstance(params).promise();
    } else if (type === 'EC2') {
        const params = {
            InstanceIds: [resourceIdentifier],
        };
        await ec2Client.stopInstances(params).promise();
    } else if (type === 'ECS') {
        const [cluster, service] = resourceIdentifier.split('/');
        await powerOffService(cluster, service, false);
    }
}

export const startResource = async (resourceState: ResourceState) => {
    const { type, resourceIdentifier } = resourceState;
    if (type === 'RDS') {
        const params = {
            DBInstanceIdentifier: resourceIdentifier,
        };
        await rdsClient.startDBInstance(params).promise();
    } else if (type === 'EC2') {
        const params = {
            InstanceIds: [resourceIdentifier],
        };
        await ec2Client.startInstances(params).promise();
    } else if (type === 'ECS') {
        const [cluster, service] = resourceIdentifier.split('/');
        await powerOnService(cluster, service, false);
    }
}