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

  /**
   * Side navigation bar
   */
  @ViewChild('snav', {static: false}) private snav: MatSidenav;

  /**
   * Query to be used in order to check the screen size/if elements have to be adjusted
   */
  mobileQuery: MediaQueryList;

  /**
   * Boolean value used in order to display/not display elements in the header based on the window size
   */
  private _isLargeHeader: boolean;

  constructor(media: MediaMatcher,
              private changeDetector: ChangeDetectorRef,
              private dialog: MatDialog,
              public storage: StorageService) {
    // See Bootstrap resizing
    this.mobileQuery = media.matchMedia('(max-width: 576px)');
  }

  /**
   * Initalization: Calls {onResize} and detects changes in order to initualie {_isLargeHeader}.
   */
  ngOnInit(): void {
    this.onResize();
    this.changeDetector.detectChanges();
  }

  /**
   * Method called whenever the window is resized in order to set {_isLargeHeader}.
   */
  @HostListener('window:resize')
  onResize() {
    this._isLargeHeader = window.innerWidth > 350;
  }

  /**
   * Checks whether the current problem is exactly solvable and if so, shows an informative dialog.
   * If not, the pop-up/list with possible heuristics in order to solve the current problem is opened.
   */
  openHeuristicsList(): void {
    this.onItemTapped();
    const possiblyExactSolvableMessage = this.storage.getMessageIfExactlySolvableProblem();
    if (possiblyExactSolvableMessage) {
      this.dialog.open(PopUpComponent, {data: possiblyExactSolvableMessage});
    } else {
      this.dialog.open(HeuristicsSelectionComponent);
    }
  }

  /**
   * Opens the dialog: "About this App".
   */
  openInfoDialog(): void {
    this.onItemTapped();
    this.dialog.open(AboutThisAppComponent);
  }

  /**
   * Opens GitHub page of the used repository in a new tab.
   */
  openGithubPage(): void {
    window.open('https://github.com/lucaslar/vis-lg-heur');
  }

  /**
   * Closes the side nav if it is displayed above the content and item has been tapped.
   */
  onItemTapped(): void {
    if (this.snav.mode === 'over') {
      this.snav.close().then();
    }
  }

  /**
   * Getter for: {_isLargeHeader}
   */
  get isLargeHeader(): boolean {
    return this._isLargeHeader;
  }
}
