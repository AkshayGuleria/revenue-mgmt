import { PartialType } from '@nestjs/swagger';
import { CreateContractDto, ContractStatus } from './create-contract.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @ApiPropertyOptional({
    description: 'Contract status',
    enum: ContractStatus,
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
