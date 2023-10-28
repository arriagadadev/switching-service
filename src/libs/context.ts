export type Ctx = {
    userId: string;
    userEmail: string;
    stage: string;
    domain: string;
    protocol: string;
    apiId: string;
    url: string;
    requestId: string;
    timestamp: number;
};

export const getContext = (event): Ctx => {
    const userId = event.requestContext.authorizer.sub;
    const userEmail = event.requestContext.authorizer.email;
    const stage = event.requestContext.stage;
    const domain = event.requestContext.domainName;
    const protocol = event.headers['X-Forwarded-Proto'];
    const apiId = event.requestContext.apiId;
    const url = `${protocol}://${domain}/${stage}`;
    const requestId = event.requestContext.requestId;
    return {
        userId,
        userEmail,
        stage,
        domain,
        protocol,
        apiId,
        url,
        requestId,
        timestamp: Date.now(),
    };
};