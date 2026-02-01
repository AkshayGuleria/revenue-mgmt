import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, QueryProductsDto } from './dto';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { parseQuery } from '../../common/utils/query-parser';
import {
  buildSingleResponse,
  buildPaginatedListResponse,
} from '../../common/utils/response-builder';
import { ApiResponse } from '../../common/interfaces';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<ApiResponse<any>> {
    try {
      const product = await this.prisma.product.create({
        data: createProductDto,
      });

      return buildSingleResponse(product);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Product with this SKU already exists');
        }
      }
      throw error;
    }
  }

  async findAll(query: QueryProductsDto): Promise<ApiResponse<any>> {
    // Parse query parameters using utility
    const { pagination, where: parsedWhere } = parseQuery(query);

    const where: Prisma.ProductWhereInput = {
      ...parsedWhere,
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return buildPaginatedListResponse(
      products,
      pagination.offset,
      pagination.limit,
      total,
    );
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return buildSingleResponse(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ApiResponse<any>> {
    // Check if product exists
    await this.findOne(id);

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });

      return buildSingleResponse(product);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Product with this SKU already exists');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    // Check if product exists
    await this.findOne(id);

    // Hard delete (no soft delete for products in schema)
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
