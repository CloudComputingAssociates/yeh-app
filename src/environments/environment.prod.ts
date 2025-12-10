// src/environments/environment.prod.ts
// Production environment configuration
// Placeholders are replaced at build time by replace.js using Netlify env vars
export const environment = {
  production: true,
  apiUrl: 'https://yehapi.cloudcomputingassociates.net:443/api',
  auth0: {
    domain: '___AUTH0_DOMAIN___',
    clientId: '___AUTH0_CLIENT_ID___',
    audience: '___AUTH0_AUDIENCE___'
  }
};
