import { TestBed, inject } from '@angular/core/testing';

import { SgService } from './sg.service';

describe('SgService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SgService]
    });
  });

  it('should be created', inject([SgService], (service: SgService) => {
    expect(service).toBeTruthy();
  }));
});
