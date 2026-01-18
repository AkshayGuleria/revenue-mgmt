import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ShareContractDto {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
