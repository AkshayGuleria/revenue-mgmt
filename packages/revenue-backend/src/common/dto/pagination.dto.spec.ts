import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BasePaginationDto } from './pagination.dto';

describe('BasePaginationDto', () => {
  it('should validate with default values', async () => {
    const dto = new BasePaginationDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid offset and limit', async () => {
    const dto = new BasePaginationDto();
    // Simulate query parameters
    Object.assign(dto, {
      'offset[eq]': 10,
      'limit[eq]': 50,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string offset to number', async () => {
    const plain = { 'offset[eq]': '10' };
    const dto = plainToInstance(BasePaginationDto, plain);
    expect(dto['offset[eq]']).toBe(10);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string limit to number', async () => {
    const plain = { 'limit[eq]': '50' };
    const dto = plainToInstance(BasePaginationDto, plain);
    expect(dto['limit[eq]']).toBe(50);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject negative offset', async () => {
    const dto = new BasePaginationDto();
    Object.assign(dto, { 'offset[eq]': -1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should reject limit below 1', async () => {
    const dto = new BasePaginationDto();
    Object.assign(dto, { 'limit[eq]': 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should reject limit above 100', async () => {
    const dto = new BasePaginationDto();
    Object.assign(dto, { 'limit[eq]': 101 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('max');
  });
});
