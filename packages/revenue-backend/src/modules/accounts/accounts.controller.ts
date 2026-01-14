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
  ApiQuery,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, QueryAccountsDto } from './dto';

@ApiTags('Accounts')
@Controller('api/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new account',
    description: 'Create a new enterprise account with optional hierarchical parent',
  })
  @ApiResponse({
    status: 201,
    description: 'Account successfully created',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or circular hierarchy detected',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent account not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Account with this email already exists',
  })
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all accounts with filtering and pagination',
    description:
      'Retrieve accounts with optional search, filters (type, status, parent), and pagination',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in account name and email fields (case-insensitive)',
    example: 'acme',
  })
  @ApiQuery({
    name: 'accountType',
    required: false,
    enum: ['enterprise', 'smb', 'startup'],
    description: 'Filter by account type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'suspended'],
    description: 'Filter by account status',
  })
  @ApiQuery({
    name: 'parentAccountId',
    required: false,
    description: 'Filter by parent account (get all children of this parent)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts at 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (1-100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of accounts with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  findAll(@Query() query: QueryAccountsDto) {
    return this.accountsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get account by ID',
    description:
      'Retrieve detailed account information including parent, children, and active contracts',
  })
  @ApiParam({
    name: 'id',
    description: 'Account UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Account details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update account',
    description: 'Update account information. Validates hierarchy changes to prevent circular references.',
  })
  @ApiParam({
    name: 'id',
    description: 'Account UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Account successfully updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or circular hierarchy detected',
  })
  @ApiResponse({
    status: 404,
    description: 'Account or parent account not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email conflict with existing account',
  })
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete account',
    description: 'Soft delete an account (sets deletedAt and status to inactive)',
  })
  @ApiParam({
    name: 'id',
    description: 'Account UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Account successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async remove(@Param('id') id: string) {
    await this.accountsService.remove(id);
  }
}
