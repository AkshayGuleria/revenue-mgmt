import { validate } from 'class-validator';
import { QueryContractsDto } from './query-contracts.dto';

describe('QueryContractsDto', () => {
  it('should validate empty query', async () => {
    const dto = new QueryContractsDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid query parameters', async () => {
    const dto = new QueryContractsDto();
    Object.assign(dto, {
      'contractNumber[eq]': 'CNT-001',
      'accountId[eq]': 'account-123',
      'status[eq]': 'active',
      'offset[eq]': 0,
      'limit[eq]': 20,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
