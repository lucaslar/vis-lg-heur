import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {WelcomeComponent} from '../components/pages/welcome/welcome.component';
import {JobsAndMachinesComponent} from '../components/pages/alpha/jobs-and-machines/jobs-and-machines.component';
import {JobsTerminationComponent} from '../components/pages/beta/jobs-termination/jobs-termination.component';
import {JobsExistGuard} from '../guards/jobs-exist.guard';
import {PriorityRulesDefinitionComponent} from '../components/pages/priority-rules-definition/priority-rules-definition.component';

const routes: Routes = [
  {path: 'alpha', component: JobsAndMachinesComponent},
  {path: 'priority-rules', component: PriorityRulesDefinitionComponent},
  {path: 'beta/jobs-termination', canActivate: [JobsExistGuard], component: JobsTerminationComponent},
  {path: '', component: WelcomeComponent},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
