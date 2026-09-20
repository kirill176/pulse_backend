import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DbUsersRepository, UsersRepository } from './users.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users.model';

@Module({
  providers: [
    UsersService,
    {
      provide: UsersRepository,
      useClass: DbUsersRepository,
    },
  ],
  controllers: [UsersController],
  exports: [UsersService],
  imports: [SequelizeModule.forFeature([User])],
})
export class UsersModule {}
