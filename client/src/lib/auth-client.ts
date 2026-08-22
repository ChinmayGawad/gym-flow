import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { getApiBaseUrl } from './api-config';

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
  plugins: [adminClient()],
});

export const { useSession, signIn, signOut, signUp } = authClient;
