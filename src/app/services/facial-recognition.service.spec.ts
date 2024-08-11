import { TestBed } from '@angular/core/testing';

import { FacialRecognitionService } from './facial-recognition.service';

describe('FacialRecognitionService', () => {
  let service: FacialRecognitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacialRecognitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
