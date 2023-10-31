import rdsClient from './rds';
import ec2Client from './ec2';
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
    }
}