import {Component} from '@angular/core';

@Component({
  selector: 'app-about-this-app',
  templateUrl: './about-this-app.component.html',
  styleUrls: ['./about-this-app.component.css', '../shared-dialog-styles.css']
})
export class AboutThisAppComponent {

  onAngularClicked(): void {
    window.open('https://angular.io/');
  }

  onAngularMaterialClicked(): void {
    window.open('https://material.angular.io/');
  }

  onBootstrapClicked(): void {
    window.open('https://getbootstrap.com/');
  }

  onChartJsClicked(): void {
    window.open('https://www.chartjs.org/');
  }

  onFontAwesomeClicked(): void {
    window.open('https://fontawesome.com/');
  }

  onGitHubClicked(): void {
    window.open('https://github.com');
  }

  onGoogleChartsClicked(): void {
    window.open('https://developers.google.com/chart/');
  }

  onMaterialDesignClicked(): void {
    window.open('https://material.io/');
  }

  onMdBootstrapClicked(): void {
    window.open('https://mdbootstrap.com/');
  }

  onMockUPhoneClicked(): void {
    window.open('https://mockuphone.com/#ios');
  }

  onGithubProjectClicked(): void {
    window.open('https://github.com/lucaslar/vis-lg-heur');
  }
}
