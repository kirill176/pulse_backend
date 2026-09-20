import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user-dto';

@Injectable()
export class UsersService {
  constructor(private userRepository: UsersRepository) {}

  async createUser(dto: CreateUserDto) {
    return await this.userRepository.createUser(dto);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }
}
