import { boot } from 'quasar/wrappers';
import { Amplify } from 'aws-amplify';

const awsconfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    },
  },
};

export default boot(({ app }) => {
  Amplify.configure(awsconfig);
});
