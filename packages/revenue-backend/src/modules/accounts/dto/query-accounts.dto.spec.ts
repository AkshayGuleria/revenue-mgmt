import { validate } from 'class-validator';
import { QueryAccountsDto } from './query-accounts.dto';

describe('QueryAccountsDto', () => {
  it('should validate empty query', async () => {
    const dto = new QueryAccountsDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid query parameters', async () => {
    const dto = new QueryAccountsDto();
    Object.assign(dto, {
      'accountName[like]': 'test',
      'status[eq]': 'active',
      'offset[eq]': 0,
      'limit[eq]': 20,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
