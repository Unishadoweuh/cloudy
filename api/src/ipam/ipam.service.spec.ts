import { Test, TestingModule } from '@nestjs/testing';
import { IpamService } from './ipam.service';

describe('IpamService', () => {
  let service: IpamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IpamService],
    }).compile();

    service = module.get<IpamService>(IpamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
