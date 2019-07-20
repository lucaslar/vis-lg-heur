import { TestBed, async, inject } from '@angular/core/testing';

import { JobsExistGuard } from './jobs-exist.guard';

describe('JobsExistGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JobsExistGuard]
    });
  });

  it('should ...', inject([JobsExistGuard], (guard: JobsExistGuard) => {
    expect(guard).toBeTruthy();
  }));
});
