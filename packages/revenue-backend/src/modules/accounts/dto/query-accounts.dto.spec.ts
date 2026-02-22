import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
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

  it('should transform string parentAccountId[null] to boolean', async () => {
    const plain = { 'parentAccountId[null]': 'true' };
    const dto = plainToInstance(QueryAccountsDto, plain);
    expect(dto['parentAccountId[null]']).toBe(true);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept status[in] with comma-separated values', async () => {
    const dto = new QueryAccountsDto();
    Object.assign(dto, { 'status[in]': 'active,suspended' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept accountType[in] with comma-separated values', async () => {
    const dto = new QueryAccountsDto();
    Object.assign(dto, { 'accountType[in]': 'enterprise,smb' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
