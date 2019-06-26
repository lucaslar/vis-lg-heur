import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {OneArmedBanditComponent} from '../components/one-armed-bandit/one-armed-bandit.component';
import {ConfigContainerComponent} from '../components/configuration/config-container/config-container.component';

const routes: Routes = [
  {path: 'params', component: OneArmedBanditComponent},
  {path: 'configuration', component: ConfigContainerComponent},
  {
    path: '',
    redirectTo: '/params',
    pathMatch: 'full'
  },
  // TODO: add bypassed:
  // {path: '**', redirectTo: '/params'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
