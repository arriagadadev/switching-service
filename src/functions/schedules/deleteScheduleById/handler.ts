import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { deleteScheduleById, getScheduleById } from '@libs/schedules';
import eventBridge from '@libs/eventBridge';

const removeSchedule = async (event) => {
  try {
    const { scheduleId } = event.pathParameters;
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return formatJSONResponse({
        message: 'Entity does not exists',
      }, 404);
    }
    const ruleName = schedule.ruleArn.split('/').pop();
    const targets = await eventBridge.listTargetsByRule({ Rule: ruleName }).promise()
    console.log('targets', targets)
    const targetIds = targets.Targets.map(target => target.Id);
    if (targetIds.length > 0) {
      const removeTargetsParams = {
        Rule: ruleName,
        Ids: targetIds
      };

      await eventBridge.removeTargets(removeTargetsParams).promise();
    }
    const deleteRuleParams = {
      Name: ruleName
    };
    await eventBridge.deleteRule(deleteRuleParams).promise();
    const deletedSchedule = await deleteScheduleById(scheduleId);
    return formatJSONResponse(deletedSchedule);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(removeSchedule);