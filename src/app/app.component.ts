import {Component, ViewChild} from '@angular/core';
import {MediaMatcher} from '@angular/cdk/layout';
import {MatDialog, MatSidenav} from '@angular/material';
import {AboutThisAppComponent} from './components/dialogs/about-this-app/about-this-app.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  @ViewChild('snav', {static: false}) private snav: MatSidenav;
  mobileQuery: MediaQueryList;

  constructor(media: MediaMatcher,
              private dialog: MatDialog) {
    // See Bootstrap resizing
    this.mobileQuery = media.matchMedia('(max-width: 576px)');
  }

  openInfoDialog(): void {
    this.dialog.open(AboutThisAppComponent);
  }

  // TODO: Extract to info pop up?
  openGithubPage(): void {
    window.open('https://github.com/lucaslar/vis-lg-heur');
  }

  onListItemTapped(): void {
    if (this.snav.mode === 'over') {
      this.snav.close().then();
    }
  }
}
