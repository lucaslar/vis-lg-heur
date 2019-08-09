import {ChangeDetectorRef, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {MediaMatcher} from '@angular/cdk/layout';
import {MatDialog} from '@angular/material/dialog';
import {MatSidenav} from '@angular/material/sidenav';
import {AboutThisAppComponent} from './components/dialogs/about-this-app/about-this-app.component';
import {HeuristicsSelectionComponent} from './components/dialogs/heuristics-selection/heuristics-selection.component';
import {PopUpComponent} from './components/dialogs/pop-up/pop-up.component';
import {StorageService} from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  // TODO internal: Extract larger text content sources such as dialogs?

  @ViewChild('snav', {static: false}) private snav: MatSidenav;
  mobileQuery: MediaQueryList;

  private _isLargeHeader: boolean;

  constructor(media: MediaMatcher,
              private changeDetector: ChangeDetectorRef,
              private dialog: MatDialog,
              public storage: StorageService) {
    // See Bootstrap resizing
    this.mobileQuery = media.matchMedia('(max-width: 576px)');
  }

  ngOnInit(): void {
    this.onResize();
    this.changeDetector.detectChanges();
  }

  @HostListener('window:resize')
  onResize() {
    this._isLargeHeader = window.innerWidth > 350;
  }

  openHeuristicsList(): void {
    this.onItemTapped();
    const possiblyExactSolvableMessage = this.storage.getMessageIfExactlySolvableProblem();
    if (possiblyExactSolvableMessage) {
      this.dialog.open(PopUpComponent, {data: possiblyExactSolvableMessage});
    } else {
      this.dialog.open(HeuristicsSelectionComponent);
    }
  }

  openInfoDialog(): void {
    this.onItemTapped();
    this.dialog.open(AboutThisAppComponent);
  }

  openGithubPage(): void {
    window.open('https://github.com/lucaslar/vis-lg-heur');
  }

  onItemTapped(): void {
    if (this.snav.mode === 'over') {
      this.snav.close().then();
    }
  }

  get isLargeHeader(): boolean {
    return this._isLargeHeader;
  }
}
