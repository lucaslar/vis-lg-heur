import { TestBed, async, inject } from '@angular/core/testing';

import { BetaEnoughJobsGuard } from './beta-enough-jobs.guard';

describe('BetaEnoughJobsGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BetaEnoughJobsGuard]
    });
  });

  it('should ...', inject([BetaEnoughJobsGuard], (guard: BetaEnoughJobsGuard) => {
    expect(guard).toBeTruthy();
  }));
});
