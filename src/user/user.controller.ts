import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
// import { User } from './user.entity';
// import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
