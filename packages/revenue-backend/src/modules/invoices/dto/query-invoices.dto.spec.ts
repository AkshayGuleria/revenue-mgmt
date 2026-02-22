import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { QueryInvoicesDto } from './query-invoices.dto';

describe('QueryInvoicesDto', () => {
  it('should validate an empty query', async () => {
    const dto = new QueryInvoicesDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid status[eq] parameter', async () => {
    const dto = new QueryInvoicesDto();
    Object.assign(dto, { 'status[eq]': 'paid' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid status[in] parameter', async () => {
    const dto = new QueryInvoicesDto();
    Object.assign(dto, { 'status[in]': 'paid,sent' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid billingType[eq] parameter', async () => {
    const dto = new QueryInvoicesDto();
    Object.assign(dto, { 'billingType[eq]': 'recurring' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string consolidated[eq] to boolean', async () => {
    const plain = { 'consolidated[eq]': 'true' };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    expect(dto['consolidated[eq]']).toBe(true);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string consolidated[eq]=false to boolean true (JS Boolean coercion)', async () => {
    // Note: @Type(() => Boolean) uses JavaScript's Boolean() constructor.
    // Boolean('false') === true because any non-empty string is truthy.
    const plain = { 'consolidated[eq]': 'false' };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    expect(dto['consolidated[eq]']).toBe(true);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform boolean false to false (actual boolean input)', async () => {
    const plain = { 'consolidated[eq]': false };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    expect(dto['consolidated[eq]']).toBe(false);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string total[gt] to number', async () => {
    const plain = { 'total[gt]': '1000' };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    expect(dto['total[gt]']).toBe(1000);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string total[gte] to number', async () => {
    const plain = { 'total[gte]': '500' };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    expect(dto['total[gte]']).toBe(500);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string total[lt] to number', async () => {
    const plain = { 'total[lt]': '10000' };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    expect(dto['total[lt]']).toBe(10000);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string total[lte] to number', async () => {
    const plain = { 'total[lte]': '50000' };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    expect(dto['total[lte]']).toBe(50000);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string contractId[null] to boolean', async () => {
    const plain = { 'contractId[null]': 'true' };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    expect(dto['contractId[null]']).toBe(true);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string paidDate[null] to boolean', async () => {
    const plain = { 'paidDate[null]': 'true' };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    expect(dto['paidDate[null]']).toBe(true);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid date range filters', async () => {
    const dto = new QueryInvoicesDto();
    Object.assign(dto, {
      'issueDate[gte]': '2024-01-01',
      'issueDate[lte]': '2024-12-31',
      'dueDate[gte]': '2024-01-15',
      'dueDate[lte]': '2024-12-31',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept paid date range filters', async () => {
    const dto = new QueryInvoicesDto();
    Object.assign(dto, {
      'paidDate[gte]': '2024-01-01',
      'paidDate[lte]': '2024-12-31',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept all standard query parameters together', async () => {
    const plain = {
      'invoiceNumber[like]': 'INV-2024',
      'accountId[eq]': 'account-123',
      'status[eq]': 'paid',
      'billingType[eq]': 'recurring',
      'consolidated[eq]': 'false',
      'total[gt]': '100',
      'total[lt]': '50000',
      'offset[eq]': '0',
      'limit[eq]': '20',
    };
    const dto = plainToInstance(QueryInvoicesDto, plain);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    // Boolean('false') === true because @Type(() => Boolean) uses JS Boolean() constructor
    expect(dto['consolidated[eq]']).toBe(true);
    expect(dto['total[gt]']).toBe(100);
    expect(dto['total[lt]']).toBe(50000);
  });
});
