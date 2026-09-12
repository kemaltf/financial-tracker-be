import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { User } from '@app/user/user.entity';
import { ApiKey, ApiKeyScope } from './api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeyService {
  constructor(@InjectRepository(ApiKey) private readonly repository: Repository<ApiKey>) {}

  async create(user: User, dto: CreateApiKeyDto) {
    const rawKey = `ft_live_${randomBytes(32).toString('base64url')}`;
    const entity = this.repository.create({
      prefix: rawKey.slice(0, 16),
      keyHash: this.hash(rawKey),
      name: dto.name.trim(),
      scopes: dto.scopes,
      user: { id: user.id },
      revokedAt: null,
      lastUsedAt: null,
    });
    const saved = await this.repository.save(entity);
    return { ...this.toPublic(saved), key: rawKey };
  }

  async list(user: User) {
    const keys = await this.repository.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
    return keys.map((key) => this.toPublic(key));
  }

  async revoke(id: string, user: User) {
    const key = await this.repository.findOne({ where: { id, user: { id: user.id } } });
    if (!key) throw new NotFoundException('API key not found');
    if (!key.revokedAt) {
      key.revokedAt = new Date();
      await this.repository.save(key);
    }
    return this.toPublic(key);
  }

  async authenticate(rawKey: string, requiredScope?: ApiKeyScope) {
    const key = await this.repository.findOne({ where: { keyHash: this.hash(rawKey) }, relations: ['user'] });
    if (!key || key.revokedAt || (requiredScope && !key.scopes.includes(requiredScope))) {
      throw new UnauthorizedException('Invalid or insufficient API key');
    }
    key.lastUsedAt = new Date();
    await this.repository.save(key);
    return key;
  }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }

  private toPublic(key: ApiKey) {
    return { id: key.id, prefix: key.prefix, name: key.name, scopes: key.scopes, revokedAt: key.revokedAt, lastUsedAt: key.lastUsedAt, createdAt: key.createdAt };
  }
}
