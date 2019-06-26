import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './modules/app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {OneArmedBanditComponent} from './components/one-armed-bandit/one-armed-bandit.component';
import {FormsModule} from '@angular/forms';
import {ConfigContainerComponent} from './components/configuration/config-container/config-container.component';
import {OrderComponent} from './components/configuration/order/order.component';
import {MaterialModule} from './modules/material.module';

@NgModule({
  declarations: [
    AppComponent,
    OneArmedBanditComponent,
    ConfigContainerComponent,
    OrderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
