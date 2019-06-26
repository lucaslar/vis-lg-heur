import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {StorageService} from '../../services/storage.service';
import {Alpha} from '../../model/params/Alpha';
import {Gamma} from '../../model/params/Gamma';
import {Beta} from '../../model/params/Beta';

@Component({
  selector: 'app-one-armed-bandit',
  templateUrl: './one-armed-bandit.component.html',
  styleUrls: ['./one-armed-bandit.component.css']
})
export class OneArmedBanditComponent implements AfterViewInit {

  @ViewChild('params', {static: false}) private paramsDiv;
  @ViewChild('statusicons', {static: false}) private statusIconsDiv;
  @ViewChild('submit', {static: false}) private submitDiv;
  isSubmitShown: boolean;

  constructor(private storage: StorageService) {
    // TODO: Delete these presettings
    localStorage.clear();
    this.storage.setAlpha(Alpha.FLOWSHOP);
    // this.storage.setBeta(Beta.NONE);
    this.storage.setGamma(Gamma.CYCLE_TIME);
  }

  ngAfterViewInit(): void {
    this.paramsVisualization();
  }

  private paramsVisualization() {
    const transitionTimeInMillis = 500;
    const statusIcons = (this.statusIconsDiv.nativeElement.querySelectorAll('i'));

    setTimeout(() =>
      (statusIcons.item(0)).classList.add(
        !!this.storage.getAlpha() ? 'status-ok' : 'status-warn'), transitionTimeInMillis
    );
    setTimeout(() =>
      (statusIcons.item(1)).classList.add(
        !!this.storage.getBeta() ? 'status-ok' : 'status-warn'), transitionTimeInMillis * 2
    );
    setTimeout(() =>
      (statusIcons.item(2)).classList.add(
        !!this.storage.getGamma() ? 'status-ok' : 'status-warn'), transitionTimeInMillis * 3
    );

    setTimeout(() => {
      const _isSubmitShown = this.storage.areAllParamsConfigured();
      if (_isSubmitShown) {
        statusIcons.forEach(i => i.classList.remove('status-warn', 'status-ok'));
        setTimeout(() => {
          this.isSubmitShown = _isSubmitShown;
        }, transitionTimeInMillis);
      }
    }, transitionTimeInMillis * 4);

    setTimeout(() =>
        this.submitDiv.nativeElement.classList.add('status-ok'),
      transitionTimeInMillis * 6);

  }

  onParamHover(nr: number): void {
    this.statusIconsDiv.nativeElement
      .querySelectorAll('i')
      .item(nr).classList.toggle('hover');


    let isSet: boolean;

    if (nr === 0) {
      isSet = !!this.storage.getAlpha();
    } else if (nr === 1) {
      isSet = !!this.storage.getBeta();
    } else {
      isSet = !!this.storage.getGamma();
    }

    this.paramsDiv.nativeElement
      .querySelectorAll('div.icon-holder')
      .item(nr).classList.toggle(
      isSet ? 'status-ok' : 'status-warn'
    );
  }

  onParamClicked(nr: number): void {
    console.log(nr);
  }

}
