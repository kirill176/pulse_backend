import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';

@Injectable()
export class JWTAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();

    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException({
        message: 'User is unnauthorized.',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    try {
      const user = this.jwtService.verify(token);
      (req as Request & { user: any }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException({
        message: 'User is unnauthorized.',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
  }

  private extractToken(req: Request): string | undefined {
    if (req.cookies?.accessToken) {
      return req.cookies.accessToken;
    }

    const [bearer, token] = req.headers.authorization?.split(' ') ?? [];
    if (bearer === 'Bearer' && token) {
      return token;
    }
    return undefined;
  }
}
