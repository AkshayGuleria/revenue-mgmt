import { validate } from 'class-validator';
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
});
