import { TestBed, async, inject } from '@angular/core/testing';

import { HeuristicsGuard } from './heuristics.guard';

describe('HeuristicsGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HeuristicsGuard]
    });
  });

  it('should ...', inject([HeuristicsGuard], (guard: HeuristicsGuard) => {
    expect(guard).toBeTruthy();
  }));
});
