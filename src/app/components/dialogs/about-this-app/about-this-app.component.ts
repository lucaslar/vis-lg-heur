import {Component} from '@angular/core';

@Component({
  selector: 'app-about-this-app',
  templateUrl: './about-this-app.component.html',
  styleUrls: ['./about-this-app.component.css', '../shared-dialog-styles.css']
})
export class AboutThisAppComponent {

  /**
   * Opens page in new window: Angular.
   */
  onAngularClicked(): void {
    window.open('https://angular.io/');
  }

  /**
   * Opens page in new window: Angular Material.
   */
  onAngularMaterialClicked(): void {
    window.open('https://material.angular.io/');
  }

  /**
   * Opens page in new window: Bootstrap.
   */
  onBootstrapClicked(): void {
    window.open('https://getbootstrap.com/');
  }

  /**
   * Opens page in new window: Chart.js.
   */
  onChartJsClicked(): void {
    window.open('https://www.chartjs.org/');
  }

  /**
   * Opens page in new window: Font Awesome.
   */
  onFontAwesomeClicked(): void {
    window.open('https://fontawesome.com/');
  }

  /**
   * Opens page in new window: GitHub.
   */
  onGitHubClicked(): void {
    window.open('https://github.com');
  }

  /**
   * Opens page in new window: Google Charts.
   */
  onGoogleChartsClicked(): void {
    window.open('https://developers.google.com/chart/');
  }

  /**
   * Opens page in new window: Material Design.
   */
  onMaterialDesignClicked(): void {
    window.open('https://material.io/');
  }

  /**
   * Opens page in new window: MDBootstrap.
   */
  onMdBootstrapClicked(): void {
    window.open('https://mdbootstrap.com/');
  }

  /**
   * Opens page in new window: MockUPhone.
   */
  onMockUPhoneClicked(): void {
    window.open('https://mockuphone.com/#ios');
  }

  /**
   * Opens page in new window: GitHub (used repository).
   */
  onGithubProjectClicked(): void {
    window.open('https://github.com/lucaslar/vis-lg-heur');
  }
}
