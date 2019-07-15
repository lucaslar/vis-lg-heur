import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ConfigContainerComponent} from '../components/configuration/config-container/config-container.component';

const routes: Routes = [
  {path: 'configuration', component: ConfigContainerComponent},
  {
    path: '',
    redirectTo: '/configuration',
    pathMatch: 'full'
  },
  {path: '**', redirectTo: '/configuration'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
