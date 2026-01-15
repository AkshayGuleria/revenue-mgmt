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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto, QueryContractsDto } from './dto';

@ApiTags('Contracts')
@Controller('api/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new contract',
    description:
      'Create a new contract for an account. Validates account exists and date ranges. ' +
      'Returns contract wrapped in standard API response structure with empty paging object.',
  })
  @ApiResponse({
    status: 201,
    description: 'Contract successfully created',
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
    description: 'Invalid input data or end date before start date',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Contract number already exists',
  })
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List contracts with operator-based filtering and pagination',
    description:
      'Retrieve contracts using operator-based query parameters (ADR-003). ' +
      'Supports filtering by status, account, dates, value, and more. ' +
      'Returns paginated list with account details and invoice counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of contracts',
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
            total: { type: 'number', example: 45 },
            totalPages: { type: 'number', example: 3 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
      },
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            contractNumber: 'CNT-2024-0001',
            status: 'active',
            contractValue: '120000.00',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            account: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              accountName: 'Acme Corporation',
              status: 'active',
            },
            _count: {
              invoices: 12,
            },
          },
        ],
        paging: {
          offset: 0,
          limit: 20,
          total: 45,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      },
    },
  })
  findAll(@Query() query: QueryContractsDto) {
    return this.contractsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get contract by ID',
    description:
      'Retrieve detailed contract information including account details and invoices. ' +
      'Returns single resource with empty paging object.',
  })
  @ApiParam({
    name: 'id',
    description: 'Contract UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Contract details retrieved successfully',
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
    description: 'Contract not found',
  })
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update contract',
    description:
      'Update contract information. Validates account and date ranges if changed. ' +
      'Returns updated contract with empty paging object.',
  })
  @ApiParam({
    name: 'id',
    description: 'Contract UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Contract successfully updated',
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
    description: 'Invalid data or end date before start date',
  })
  @ApiResponse({
    status: 404,
    description: 'Contract or account not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Contract number conflict',
  })
  update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto) {
    return this.contractsService.update(id, updateContractDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete contract',
    description:
      'Hard delete a contract from the system. Returns 204 No Content on success.',
  })
  @ApiParam({
    name: 'id',
    description: 'Contract UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Contract successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Contract not found',
  })
  async remove(@Param('id') id: string) {
    await this.contractsService.remove(id);
  }
}
