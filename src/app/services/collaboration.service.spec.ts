import { TestBed } from '@angular/core/testing';

import { CollaborationService } from './collaboration.service';

describe('CollaborationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CollaborationService = TestBed.get(CollaborationService);
    expect(service).toBeTruthy();
  });
});
