import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';
import { JwtOnly } from '@app/common/decorators/jwt-only.decorator';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@JwtOnly()
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly service: ApiKeyService) {}

  @Post()
  create(@GetUser() user: User, @Body() dto: CreateApiKeyDto) { return this.service.create(user, dto); }

  @Get()
  list(@GetUser() user: User) { return this.service.list(user); }

  @Delete(':id')
  revoke(@Param('id') id: string, @GetUser() user: User) { return this.service.revoke(id, user); }
}
