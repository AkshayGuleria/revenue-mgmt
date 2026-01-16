import { validate } from 'class-validator';
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
});
