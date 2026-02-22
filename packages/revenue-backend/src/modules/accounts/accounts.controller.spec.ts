import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, QueryAccountsDto } from './dto';

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: AccountsService;

  const mockAccountsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getHierarchy: jest.fn(),
    getChildren: jest.fn(),
    getAncestors: jest.fn(),
    getDescendants: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    service = module.get<AccountsService>(AccountsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateAccountDto = {
        accountName: 'Test Account',
        primaryContactEmail: 'test@example.com',
      };

      const result = { data: { id: '123' }, paging: {} };
      mockAccountsService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query: QueryAccountsDto = {};
      const result = { data: [], paging: {} };
      mockAccountsService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(query)).toBe(result);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const id = '123';
      const result = { data: { id: '123' }, paging: {} };
      mockAccountsService.findOne.mockResolvedValue(result);

      expect(await controller.findOne(id)).toBe(result);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const id = '123';
      const dto: UpdateAccountDto = { accountName: 'Updated Name' };
      const result = { data: { id: '123' }, paging: {} };
      mockAccountsService.update.mockResolvedValue(result);

      expect(await controller.update(id, dto)).toBe(result);
      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const id = '123';
      mockAccountsService.remove.mockResolvedValue(undefined);

      await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHierarchy', () => {
    it('should call service.getHierarchy with id', async () => {
      const id = 'root-123';
      const result = { data: { id: 'root-123', children: [] }, paging: {} };
      mockAccountsService.getHierarchy.mockResolvedValue(result);

      expect(await controller.getHierarchy(id)).toBe(result);
      expect(service.getHierarchy).toHaveBeenCalledWith(id);
      expect(service.getHierarchy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getChildren', () => {
    it('should call service.getChildren with id', async () => {
      const id = 'parent-123';
      const result = { data: [], paging: { total: 0 } };
      mockAccountsService.getChildren.mockResolvedValue(result);

      expect(await controller.getChildren(id)).toBe(result);
      expect(service.getChildren).toHaveBeenCalledWith(id);
      expect(service.getChildren).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAncestors', () => {
    it('should call service.getAncestors with id', async () => {
      const id = 'child-123';
      const result = { data: [], paging: { total: 0 } };
      mockAccountsService.getAncestors.mockResolvedValue(result);

      expect(await controller.getAncestors(id)).toBe(result);
      expect(service.getAncestors).toHaveBeenCalledWith(id);
      expect(service.getAncestors).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDescendants', () => {
    it('should call service.getDescendants with id', async () => {
      const id = 'root-123';
      const result = { data: [], paging: { total: 0 } };
      mockAccountsService.getDescendants.mockResolvedValue(result);

      expect(await controller.getDescendants(id)).toBe(result);
      expect(service.getDescendants).toHaveBeenCalledWith(id);
      expect(service.getDescendants).toHaveBeenCalledTimes(1);
    });
  });
});
