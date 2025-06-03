import { TestBed } from '@angular/core/testing';

import { EnterpriseIntegrationService } from './enterprise-integration.service';

describe('EnterpriseIntegrationService', () => {
  let service: EnterpriseIntegrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnterpriseIntegrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
