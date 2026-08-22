import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

const rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const apiBase =
  rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `https://${rawUrl}`;

export const authClient = createAuthClient({
  baseURL: apiBase,
  plugins: [adminClient()],
});

export const { useSession, signIn, signOut, signUp } = authClient;

