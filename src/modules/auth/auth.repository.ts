import { Injectable } from '@nestjs/common';

export abstract class UserRepository {}

@Injectable()
export class DbUserRepository implements UserRepository {
  constructor() {}
}
