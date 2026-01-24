import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, QueryProductsDto } from './dto';

@ApiTags('Products')
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new product',
    description:
      'Create a new product with pricing configuration. Supports seat-based, flat-fee, volume-tiered, and custom pricing models. ' +
      'Returns product wrapped in standard API response structure with empty paging object.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product successfully created',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
        paging: {
          type: 'object',
          properties: {
            offset: { type: 'null' },
            limit: { type: 'null' },
            total: { type: 'null' },
            totalPages: { type: 'null' },
            hasNext: { type: 'null' },
            hasPrev: { type: 'null' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Product with this SKU already exists',
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List products with operator-based filtering and pagination',
    description:
      'Retrieve products using operator-based query parameters (ADR-003). ' +
      'Supports filtering by pricing model, active status, SKU, name, and more. ' +
      'Returns paginated list with full product details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of products',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        paging: {
          type: 'object',
          properties: {
            offset: { type: 'number', example: 0 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 2 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
      },
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Enterprise Plan',
            sku: 'ENT-PLAN-001',
            pricingModel: 'seat_based',
            basePrice: '99.99',
            currency: 'USD',
            minSeats: 1,
            maxSeats: 1000,
            active: true,
            isAddon: false,
          },
        ],
        paging: {
          offset: 0,
          limit: 20,
          total: 25,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
      },
    },
  })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Retrieve detailed product information including pricing configuration and volume tiers. ' +
      'Returns single resource with empty paging object.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
        paging: {
          type: 'object',
          properties: {
            offset: { type: 'null' },
            limit: { type: 'null' },
            total: { type: 'null' },
            totalPages: { type: 'null' },
            hasNext: { type: 'null' },
            hasPrev: { type: 'null' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product',
    description:
      'Update product information including pricing, seats, and configuration. ' +
      'Returns updated product with empty paging object.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product successfully updated',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
        paging: {
          type: 'object',
          properties: {
            offset: { type: 'null' },
            limit: { type: 'null' },
            total: { type: 'null' },
            totalPages: { type: 'null' },
            hasNext: { type: 'null' },
            hasPrev: { type: 'null' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 409,
    description: 'SKU conflict with existing product',
  })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete product',
    description:
      'Hard delete a product from the system. Returns 204 No Content on success.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Product successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
  }
}
