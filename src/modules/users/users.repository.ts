import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './users.model';
import { InjectModel } from '@nestjs/sequelize';

export abstract class UsersRepository {
  abstract createUser(dto: CreateUserDto): Promise<User>;
  abstract findByEmail(email: string): Promise<User | null>;
}

@Injectable()
export class DbUsersRepository implements UsersRepository {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    return await this.userModel.create(dto);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ where: { email } });
  }
}
