import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../../../services/storage.service';
import {SchedulingService} from '../../../../services/scheduling.service';
import {ActivatedRoute} from '@angular/router';
import {Heuristic} from '../../../../model/Heuristic';
import {HeuristicDefiner} from '../../../../model/enums/HeuristicDefiner';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.css', '../../pages-styles.css']
})
export class VisualizerComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
