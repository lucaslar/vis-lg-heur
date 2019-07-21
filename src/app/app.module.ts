import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './modules/app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from './modules/material.module';
import { NavListContentComponent } from './components/layout/nav-list-content/nav-list-content.component';
import { WelcomeComponent } from './components/pages/welcome/welcome.component';
import { JobsAndMachinesComponent } from './components/pages/alpha/jobs-and-machines/jobs-and-machines.component';
import { MachineNrPopupComponent } from './components/dialogs/machine-nr-popup/machine-nr-popup.component';
import { AboutThisAppComponent } from './components/dialogs/about-this-app/about-this-app.component';
import { IconNumberInputComponent } from './components/shared/icon-number-input/icon-number-input.component';
import { JobsTerminationComponent } from './components/pages/beta/jobs-termination/jobs-termination.component';
import { PopUpComponent } from './components/dialogs/pop-up/pop-up.component';

@NgModule({
  declarations: [
    AppComponent,
    NavListContentComponent,
    WelcomeComponent,
    JobsAndMachinesComponent,
    MachineNrPopupComponent,
    AboutThisAppComponent,
    IconNumberInputComponent,
    JobsTerminationComponent,
    PopUpComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [
    AboutThisAppComponent,
    MachineNrPopupComponent,
    PopUpComponent
  ]
})
export class AppModule {
}
