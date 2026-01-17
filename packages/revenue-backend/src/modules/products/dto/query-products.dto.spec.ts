import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { QueryProductsDto } from './query-products.dto';

describe('QueryProductsDto', () => {
  it('should validate empty query', async () => {
    const dto = new QueryProductsDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid query parameters', async () => {
    const dto = new QueryProductsDto();
    Object.assign(dto, {
      'name[like]': 'enterprise',
      'pricingModel[eq]': 'seat_based',
      'isActive[eq]': true,
      'offset[eq]': 0,
      'limit[eq]': 20,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string active to boolean', async () => {
    const plain = { 'active[eq]': 'true' };
    const dto = plainToInstance(QueryProductsDto, plain);
    expect(dto['active[eq]']).toBe(true);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string isAddon to boolean', async () => {
    const plain = { 'isAddon[eq]': 'true' };
    const dto = plainToInstance(QueryProductsDto, plain);
    expect(dto['isAddon[eq]']).toBe(true);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string basePrice[gt] to number', async () => {
    const plain = { 'basePrice[gt]': '50' };
    const dto = plainToInstance(QueryProductsDto, plain);
    expect(dto['basePrice[gt]']).toBe(50);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string basePrice[lt] to number', async () => {
    const plain = { 'basePrice[lt]': '200' };
    const dto = plainToInstance(QueryProductsDto, plain);
    expect(dto['basePrice[lt]']).toBe(200);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string basePrice[null] to boolean', async () => {
    const plain = { 'basePrice[null]': 'true' };
    const dto = plainToInstance(QueryProductsDto, plain);
    expect(dto['basePrice[null]']).toBe(true);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
