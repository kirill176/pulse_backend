import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

export abstract class UserRepository {}

@Injectable()
export class DbUserRepository implements UserRepository {
  constructor() {}
}
