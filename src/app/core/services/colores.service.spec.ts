import { TestBed } from '@angular/core/testing';

import { ColoresService } from './colores.service';

describe('ColoresService', () => {
  let service: ColoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
