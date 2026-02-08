import { boot } from 'quasar/wrappers';
import { Amplify } from 'aws-amplify';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

if (!userPoolId || !userPoolClientId) {
  console.error('Cognito configuration missing:', {
    userPoolId: userPoolId ? '✓' : '✗',
    userPoolClientId: userPoolClientId ? '✓' : '✗',
    region,
    allEnv: import.meta.env,
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

export default boot(({ app }) => {
  if (!userPoolId || !userPoolClientId) {
    console.error('Cannot configure Amplify: missing Cognito credentials');
    return;
  }
  Amplify.configure(awsconfig);
});
