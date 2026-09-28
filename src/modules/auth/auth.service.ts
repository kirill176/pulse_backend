import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from './dto/login-user.dto';
import { User } from '../users/users.model';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

const DUMMY_HASH =
  '$2b$10$7EqJtq98hPqEX7fNZaODi.m8L0bXf0.aD4dG9h1Sj6rK2k3y5W7uG';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async login(dto: LoginUserDto) {
    const { email, password } = dto;
    const user = await this.usersService.findByEmail(email);

    const passwordHash = user?.password ?? DUMMY_HASH;
    const isPasswordEqual = await bcrypt.compare(password, passwordHash);

    if (!isPasswordEqual || !user) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
      });
    }

    const tokens = await this.generateToken(user);

    return { ...tokens, user };
  }

  async registration(dto: RegisterUserDto) {
    const { email, password, userName: usName } = dto;
    const user = await this.usersService.findByEmail(email);

    if (user) {
      throw new HttpException(
        'User with this email already exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userName = usName ?? email.split('@')?.[0];

    const hashPassword = await bcrypt.hash(password, 10);

    const createdUser = await this.usersService.createUser({
      ...dto,
      userName,
      password: hashPassword,
    });

    const tokens = await this.generateToken(createdUser);

    return { ...tokens, createdUser };
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
      });
    }
  }
}
