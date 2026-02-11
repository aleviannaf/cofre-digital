import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create an encrypted secret' })
  @ApiCreatedResponse({ description: 'Secret created successfully', type: SecretResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateSecretDto) {
    return this.secrets.create({
      ownerId: user.sub,
      title: dto.title,
      description: dto.description,
      secret: dto.secret,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a secret by id (decrypted). Only the owner can access.' })
  @ApiParam({ name: 'id', description: 'Secret ID (uuid)' })
  @ApiOkResponse({ description: 'Secret returned successfully', type: SecretResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Not allowed (not the owner)' })
  @ApiNotFoundResponse({ description: 'Secret not found' })
  getById(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.secrets.getById({ ownerId: user.sub, secretId: id });
  }
}
