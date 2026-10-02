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
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

    return await this.generateToken(user);
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

    return await this.generateToken(createdUser);
  }

  async validateOAuthUser(googleUser: { email: string; userName: string }) {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      user = await this.usersService.createUser({
        email: googleUser.email,
        userName: googleUser.userName,
        password: uuidv4(),
        isVerified: true,
      });
    }

    return this.generateToken(user);
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
