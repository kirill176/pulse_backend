import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user-dto';
import { User } from '../users/users.model';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user-dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async login(dto: LoginUserDto) {}

  async registration(dto: CreateUserDto) {
    const { email, password } = dto;
    const user = await this.usersService.findByEmail(email);

    if (user) {
      throw new HttpException(
        'User with this email already exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashPassword = await bcrypt.hash(password, 5);

    const createdUser = await this.usersService.createUser({
      ...dto,
      password: hashPassword,
    });
    return await this.generateToken(createdUser);
  }

  private async generateToken(user: User) {
    const payload = { id: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_KEY,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_KEY,
      });

      return this.generateToken(payload);
    } catch {
      throw new UnauthorizedException({
        message: 'User unauthorized.',
        status: HttpStatus.UNAUTHORIZED,
      });
    }
  }
}
