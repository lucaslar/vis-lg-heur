import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {WelcomeComponent} from '../components/pages/welcome/welcome.component';
import {JobsAndMachinesComponent} from '../components/pages/alpha/jobs-and-machines/jobs-and-machines.component';
import {JobsTerminationComponent} from '../components/pages/beta/jobs-termination/jobs-termination.component';
import {PriorityRulesDefinitionComponent} from '../components/pages/priority-rules-definition/priority-rules-definition.component';
import {BetaEnoughJobsGuard} from '../guards/beta-enough-jobs.guard';
import {HeuristicsGuard} from '../guards/heuristics.guard';
import {VisualizerComponent} from '../components/pages/visualization/visualizer/visualizer.component';
import {ObjectiveFunctionDefinitionComponent} from '../components/pages/gamma/objective-function-definition/objective-function-definition.component';
import {SetUpTimesDefinitionComponent} from '../components/pages/beta/set-up-times-definition/set-up-times-definition.component';
import {JobsWeightingComponent} from '../components/pages/beta/jobs-weighting/jobs-weighting.component';

/**
 * All possible paths of the application.
 * Please note:
 * 1. beta-pages listed as children of beta and protected by {BetaEnoughJobsGuard} using the defined value minJobs
 * 2. visualization page requires the specification of a heuristic (stated in {HeuristicDefiner}) and protected by {HeuristicsGuard}
 * 3. No paths/unknown paths will lead to the start page
 */
const routes: Routes = [
  {path: 'alpha', component: JobsAndMachinesComponent},
  {path: 'priority-rules', component: PriorityRulesDefinitionComponent},
  {
    path: 'beta', canActivateChild: [BetaEnoughJobsGuard], children: [
      {path: 'jobs-termination', component: JobsTerminationComponent, data: {minJobs: 1}},
      {path: 'jobs-weighting', component: JobsWeightingComponent, data: {minJobs: 1}},
      {path: 'jobs-setup-times', component: SetUpTimesDefinitionComponent, data: {minJobs: 2}}
    ]
  },
  {path: 'gamma', component: ObjectiveFunctionDefinitionComponent},
  {path: 'visualize/:heuristic', component: VisualizerComponent, canActivate: [HeuristicsGuard]},
  {path: '', component: WelcomeComponent},
  {path: '**', redirectTo: ''}
];

/**
 * Module used for defining all possible paths in the application.
 */
@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
