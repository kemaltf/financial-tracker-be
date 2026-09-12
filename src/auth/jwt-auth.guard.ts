import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyService } from '@app/api-key/api-key.service';
import { API_KEY_ALLOWED_KEY } from '@app/common/decorators/api-key.decorator';
import { JWT_ONLY_KEY } from '@app/common/decorators/jwt-only.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector, private readonly apiKeyService: ApiKeyService) { super(); }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawApiKey = request.headers['x-api-key'];
    const jwtOnly = this.reflector.getAllAndOverride<boolean>(JWT_ONLY_KEY, [context.getHandler(), context.getClass()]);
    if (rawApiKey) {
      if (jwtOnly) throw new UnauthorizedException('This endpoint requires browser authentication');
      const apiKeyAllowed = this.reflector.getAllAndOverride<boolean>(API_KEY_ALLOWED_KEY, [context.getHandler(), context.getClass()]);
      if (!apiKeyAllowed) throw new UnauthorizedException('API key is not allowed for this endpoint');
      const key = await this.apiKeyService.authenticate(String(rawApiKey));
      request.user = key.user;
      request.apiKey = key;
      return true;
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);
    if (isPublic) return true;
    return (await super.canActivate(context)) as boolean;
  }
}
