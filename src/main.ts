import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { registerLocaleData } from '@angular/common';
import esCL from '@angular/common/locales/es-CL';
registerLocaleData(esCL);

bootstrapApplication(AppComponent, appConfig).catch(console.error);