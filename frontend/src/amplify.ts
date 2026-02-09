import { Amplify } from 'aws-amplify';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

if (!userPoolId || !userPoolClientId) {
  console.error('Cognito configuration missing:', {
    userPoolId: userPoolId ? '✓' : '✗',
    userPoolClientId: userPoolClientId ? '✓' : '✗',
    region,
  });
}

const awsconfig = {
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      region,
    },
  },
};

export function configureAmplify() {
  if (userPoolId && userPoolClientId) {
    Amplify.configure(awsconfig);
  }
}
