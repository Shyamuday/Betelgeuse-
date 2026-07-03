import { InjectionToken } from '@angular/core';

export const CLINIC_API_BASE_URL = new InjectionToken<string>('CLINIC_API_BASE_URL');

/** localStorage key for the bearer token used by clinic API clients. */
export const CLINIC_AUTH_TOKEN_KEY = new InjectionToken<string>('CLINIC_AUTH_TOKEN_KEY');
