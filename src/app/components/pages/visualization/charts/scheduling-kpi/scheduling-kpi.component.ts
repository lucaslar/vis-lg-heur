import {ChangeDetectorRef, Component, DoCheck, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import localeDe from '@angular/common/locales/de';
import {Kpi} from '../../../../../model/internal/visualization/SchedulingResult';

@Component({
  selector: 'app-scheduling-kpi',
  templateUrl: './scheduling-kpi.component.html',
  styleUrls: ['./scheduling-kpi.component.css', '../../../pages-styles.css']
})
export class SchedulingKpiComponent implements OnInit, DoCheck {

  @ViewChild('icon', {static: true}) icon: ElementRef;
  @ViewChild('card', {static: true}) card: ElementRef;

  @Input() kpi: Kpi;

  private _isRow: boolean;

  constructor(private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    registerLocaleData(localeDe, 'de');
    // Font Awesome icons
    if (this.kpi.iconClasses) {
      if (this.kpi.iconClasses.includes('fas' || 'far' || 'fa')) {
        this.kpi.iconClasses.forEach(
          className => (<HTMLElement>this.icon.nativeElement).classList.add(className)
        );
      } else {
        // Material icons
        (<HTMLElement>this.icon.nativeElement).classList.add('material-icons');
        (<HTMLElement>this.icon.nativeElement).innerHTML = this.kpi.iconClasses[0];
      }
    } // else: &oslash;
  }

  ngDoCheck(): void {
    this._isRow = this.card.nativeElement.offsetHeight / this.card.nativeElement.offsetWidth < 0.5;
    this.changeDetector.detectChanges();
  }

  get isRow(): boolean {
    return this._isRow;
  }
}
