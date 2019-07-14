import {Component} from '@angular/core';
import {MediaMatcher} from '@angular/cdk/layout';
import {MatDialog} from '@angular/material';
import {InfoPopUpComponent} from './components/layout/info-pop-up/info-pop-up.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  mobileQuery: MediaQueryList;

  constructor(media: MediaMatcher,
              private dialog: MatDialog) {
    // See Bootstrap resizing
    this.mobileQuery = media.matchMedia('(max-width: 576px)');
  }

  openInfoDialog(): void {
    this.dialog.open(InfoPopUpComponent);
  }

  // TODO: Extract to info pop up?
  openGithubPage(): void {
    window.open('https://github.com/lucaslar/vis-lg-heur');
  }
}
