import {NgModule} from '@angular/core';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {MatDialogModule, MatTooltipModule} from '@angular/material';

@NgModule({
  exports: [
    DragDropModule,
    MatDialogModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule
  ]
})
export class MaterialModule {

}
