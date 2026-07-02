import { OAuth2Client } from 'google-auth-library';
import { SERVER_CONFIG } from '../../constants/config.constants.js';
import { DEFAULT_JWT_SECRET } from '../../constants/auth.constants.js';

export const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
export const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
export const webOrigin = SERVER_CONFIG.ORIGINS.WEB;
