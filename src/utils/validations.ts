import { parse as cronExpressionParse } from '@datasert/cronjs-parser'

export const isEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

export const isCron = (cronExpression: string) => {
    try {
        cronExpressionParse(cronExpression);
        return true;
    } catch (e) {
        return false;
    }
}

export const isValidPdfReportPath = (str: string) => {
    const regex = /^[^\/]+\/[^\/]+\.pdf$/;
    return regex.test(str);
}

export const isValidEventBridgeRuleName = (str: string) => {
    const regex = /^[a-zA-Z0-9-_]+(?:\s[a-zA-Z0-9-_]+)*$/;
    return regex.test(str);
}