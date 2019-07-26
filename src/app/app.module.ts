import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './modules/app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from './modules/material.module';
import {ChartsModule, MDBBootstrapModule} from 'angular-bootstrap-md';
import {NavListContentComponent} from './components/layout/nav-list-content/nav-list-content.component';
import {WelcomeComponent} from './components/pages/welcome/welcome.component';
import {JobsAndMachinesComponent} from './components/pages/alpha/jobs-and-machines/jobs-and-machines.component';
import {MachineNrPopupComponent} from './components/dialogs/machine-nr-popup/machine-nr-popup.component';
import {AboutThisAppComponent} from './components/dialogs/about-this-app/about-this-app.component';
import {IconNumberInputComponent} from './components/shared/icon-number-input/icon-number-input.component';
import {JobsTerminationComponent} from './components/pages/beta/jobs-termination/jobs-termination.component';
import {PopUpComponent} from './components/dialogs/pop-up/pop-up.component';
import {PriorityRulesDefinitionComponent} from './components/pages/priority-rules-definition/priority-rules-definition.component';
import {VisualizerComponent} from './components/pages/visualization/visualizer/visualizer.component';
import {HeuristicsSelectionComponent} from './components/dialogs/heuristics-selection/heuristics-selection.component';
import {
  SolutionQualityVisualizerComponent
} from './components/pages/visualization/solution-quality-visualizer/solution-quality-visualizer.component';
import {
  JobsMachinesVisualizerComponent
} from './components/pages/visualization/jobs-machines-visualizer/jobs-machines-visualizer.component';
import {SolutionQualityDataComponent} from './components/pages/visualization/solution-quality-data/solution-quality-data.component';
import {SchedulingChartComponent} from './components/pages/visualization/charts/scheduling-chart/scheduling-chart.component';
import {GoogleChartsModule} from 'angular-google-charts';
import { SchedulingGanttComponent } from './components/pages/visualization/charts/scheduling-gantt/scheduling-gantt.component';

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
    PopUpComponent,
    PriorityRulesDefinitionComponent,
    VisualizerComponent,
    HeuristicsSelectionComponent,
    SolutionQualityVisualizerComponent,
    JobsMachinesVisualizerComponent,
    SolutionQualityDataComponent,
    SchedulingChartComponent,
    SchedulingGanttComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ChartsModule,
    FormsModule,
    GoogleChartsModule,
    MaterialModule,
    MDBBootstrapModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [
    AboutThisAppComponent,
    HeuristicsSelectionComponent,
    MachineNrPopupComponent,
    PopUpComponent
  ]
})
export class AppModule {
}
