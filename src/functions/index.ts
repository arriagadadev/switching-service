
import getResourcesStates from './resourcesStates/getResourcesStates';
import getResourceStateById from './resourcesStates/getResourceStateById';
import storeResourceState from './resourcesStates/storeResourceState';
import updateResourceState from './resourcesStates/updateResourceState';
import deleteResourceStateById from './resourcesStates/deleteResourceStateById';
import processResourceStateChange from './resourcesStates/processResourceStateChange';
import checkResourcesStates from './resourcesStates/checkResourcesStates';
import turnState from './resourcesStates/turnState';
import startResource from './resourcesStates/startResource';
import stopResource from './resourcesStates/stopResource';

import getSchedules from './schedules/getSchedules';
import getScheduleById from './schedules/getScheduleById';
import storeSchedule from './schedules/storeSchedule';
import updateSchedule from './schedules/updateSchedule';
import deleteScheduleById from './schedules/deleteScheduleById';

import listEC2Instances from './awsResources/listEC2Instances';
import listRDSInstances from './awsResources/listRDSInstances';
import listECSInstances from './awsResources/listECSInstances';

import getCommands from './commands/getCommands';
import getCommandById from './commands/getCommandById';
import storeCommand from './commands/storeCommand';
import updateCommand from './commands/updateCommand';
import deleteCommandById from './commands/deleteCommandById';
import executeCommand from './commands/executeCommand';
import getCommandExecutions from './commands/getCommandExecutions';
import getCommandExecutionById from './commands/getCommandExecutionById';
import syncCommandExecution from './commands/syncCommandExecution';

export default {
    getResourcesStates,
    getResourceStateById,
    storeResourceState,
    updateResourceState,
    deleteResourceStateById,
    processResourceStateChange,
    checkResourcesStates,
    turnState,
    startResource,
    stopResource,
    getSchedules,
    getScheduleById,
    storeSchedule,
    updateSchedule,
    deleteScheduleById,
    listEC2Instances,
    listRDSInstances,
    listECSInstances,
    getCommands,
    getCommandById,
    storeCommand,
    updateCommand,
    deleteCommandById,
    executeCommand,
    getCommandExecutions,
    getCommandExecutionById,
    syncCommandExecution,
}
