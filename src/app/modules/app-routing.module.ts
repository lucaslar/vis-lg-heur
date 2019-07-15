import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ConfigContainerComponent} from '../components/configuration/config-container/config-container.component';
import {WelcomeComponent} from '../components/pages/welcome/welcome.component';

const routes: Routes = [
  {path: 'welcome', component: WelcomeComponent},
  {path: 'configuration', component: ConfigContainerComponent},
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full'
  },
  {path: '**', redirectTo: '/welcome'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
