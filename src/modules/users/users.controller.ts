import { JwtService } from '@nestjs/jwt';
import { Body, Controller, Param, Put, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '@decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Put('/profile')
  async updateUser(
    @Body() userDto: UpdateUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.userService.updateUser(userDto, userId);
  }
}
