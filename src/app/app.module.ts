import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './modules/app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule} from '@angular/forms';
import {ConfigContainerComponent} from './components/configuration/config-container/config-container.component';
import {OrderComponent} from './components/configuration/order/order.component';
import {MaterialModule} from './modules/material.module';
import { InfoPopUpComponent } from './components/layout/info-pop-up/info-pop-up.component';
import { NavListContentComponent } from './components/layout/nav-list-content/nav-list-content.component';
import { WelcomeComponent } from './components/pages/welcome/welcome.component';

@NgModule({
  declarations: [
    AppComponent,
    ConfigContainerComponent,
    OrderComponent,
    InfoPopUpComponent,
    NavListContentComponent,
    WelcomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [InfoPopUpComponent]
})
export class AppModule {
}
