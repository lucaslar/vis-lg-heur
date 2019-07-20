import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './modules/app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from './modules/material.module';
import { InfoPopUpComponent } from './components/dialogs/info-pop-up/info-pop-up.component';
import { NavListContentComponent } from './components/layout/nav-list-content/nav-list-content.component';
import { WelcomeComponent } from './components/pages/welcome/welcome.component';
import { JobsAndMachinesComponent } from './components/pages/alpha/jobs-and-machines/jobs-and-machines.component';
import { MachineNrPopupComponent } from './components/dialogs/machine-nr-popup/machine-nr-popup.component';
import { AboutThisAppComponent } from './components/dialogs/about-this-app/about-this-app.component';
import { YesNoPopUpComponent } from './components/dialogs/yes-no-pop-up/yes-no-pop-up.component';
import { IconNumberInputComponent } from './components/shared/icon-number-input/icon-number-input.component';
import { JobsTerminationComponent } from './components/pages/beta/jobs-termination/jobs-termination.component';

@NgModule({
  declarations: [
    AppComponent,
    InfoPopUpComponent,
    NavListContentComponent,
    WelcomeComponent,
    JobsAndMachinesComponent,
    MachineNrPopupComponent,
    AboutThisAppComponent,
    YesNoPopUpComponent,
    IconNumberInputComponent,
    JobsTerminationComponent
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
    InfoPopUpComponent,
    MachineNrPopupComponent,
    YesNoPopUpComponent
  ]
})
export class AppModule {
}
