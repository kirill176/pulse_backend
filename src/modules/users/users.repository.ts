import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './users.model';
import { InjectModel } from '@nestjs/sequelize';
import { UpdateUserDto } from './dto/update-user.dto';

export abstract class UsersRepository {
  abstract createUser(dto: CreateUserDto): Promise<User>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(userId: string): Promise<User | null>;
  abstract updateUser(userDto: UpdateUserDto, id: string): Promise<User | null>;
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

  async findById(userId: string): Promise<User | null> {
    return await this.userModel.findByPk(userId);
  }

  async updateUser(userDto: UpdateUserDto, id: string): Promise<User | null> {
    const [affectedCount, affectedRows] = await this.userModel.update(userDto, {
      where: { id },
      returning: true,
    });

    console.log('d', { affectedCount, affectedRows });

    if (affectedCount === 0) return null;

    return affectedRows[0];
  }
}
