import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
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

  it('should transform string autoRenew to boolean', async () => {
    const plain = { 'autoRenew[eq]': 'true' };
    const dto = plainToInstance(QueryContractsDto, plain);
    expect(dto['autoRenew[eq]']).toBe(true);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string contractValue[gt] to number', async () => {
    const plain = { 'contractValue[gt]': '10000' };
    const dto = plainToInstance(QueryContractsDto, plain);
    expect(dto['contractValue[gt]']).toBe(10000);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string contractValue[lt] to number', async () => {
    const plain = { 'contractValue[lt]': '100000' };
    const dto = plainToInstance(QueryContractsDto, plain);
    expect(dto['contractValue[lt]']).toBe(100000);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
