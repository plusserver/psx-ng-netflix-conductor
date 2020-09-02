import { InjectionToken } from '@angular/core';
import { ConductorSDKOptions } from './types';
export const APP_CONFIG = new InjectionToken<ConductorSDKOptions>('config');
