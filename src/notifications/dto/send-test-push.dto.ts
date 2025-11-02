import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class SendTestPushDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body!: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
