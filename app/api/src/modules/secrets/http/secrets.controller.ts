import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/http/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../auth/http/decorators/current-user.decorator';
import { CreateSecretDto } from '../application/dto/create-secret.dto';
import { SecretResponseDto } from '../application/dto/secret-response.dto';
import { SecretsService } from '../application/services/secrets.service';

@ApiTags('secrets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('secrets')
export class SecretsController {
  constructor(private readonly secrets: SecretsService) {}

  @Post()
  @ApiOkResponse({ type: SecretResponseDto })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateSecretDto) {
    return this.secrets.create({
      ownerId: user.sub,
      title: dto.title,
      description: dto.description,
      secret: dto.secret,
    });
  }

  @Get(':id')
  @ApiOkResponse({ type: SecretResponseDto })
  getById(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.secrets.getById({ ownerId: user.sub, secretId: id });
  }
}
