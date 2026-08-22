import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db';

const rawAuthUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
const authBaseUrl =
  rawAuthUrl.startsWith('http://') || rawAuthUrl.startsWith('https://')
    ? rawAuthUrl
    : `https://${rawAuthUrl}`;

const clientUrl = process.env.CLIENT_URL || '';
const clientOrigins = clientUrl
  ? [
      clientUrl,
      clientUrl.startsWith('http') ? clientUrl : `https://${clientUrl}`,
      clientUrl.startsWith('http') ? clientUrl.replace(/^https?:\/\//, '') : clientUrl,
    ]
  : [];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  baseURL: authBaseUrl,
  secret: process.env.BETTER_AUTH_SECRET || 'gymflow-super-secret-key-min-32-chars-long-security',
  trustedOrigins: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...clientOrigins,
  ],

  user: {
    additionalFields: {
      plan: {
        type: 'string',
        defaultValue: 'basic',
        input: true,
      },
      planStatus: {
        type: 'string',
        defaultValue: 'active',
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRole: 'admin',
    }),
  ],
});

