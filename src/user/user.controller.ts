import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common'
import { CreateUserDTO } from './dot/create-user.dto'
import { UpdatePatchUserDTO } from './dot/update-patch-user.dto'
import { UserService } from './user.service'
import { LogInterceptor } from 'src/interceotors/log.interceptor'
import { ParamId } from 'src/decorators/param-id.decorator'
import { Roles } from 'src/decorators/roles.decorator'
import { Role } from 'src/enums/role.enum'
import { RoleGuard } from 'src/guards/role.guard'
import { AuthGuard } from 'src/guards/auth.guard'

@Roles(Role.Admin)
@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(LogInterceptor)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() data: CreateUserDTO) {
    return this.userService.create(data)
  }

  @Get()
  async list() {
    return this.userService.list()
  }

  @Get(':id')
  async readOne(@ParamId() id) {
    return this.userService.show(id)
  }

  @Put(':id')
  async update(@Body() data: CreateUserDTO, @ParamId() id) {
    return this.userService.update(data, id)
  }

  @Patch(':id')
  async updatePartial(@Body() data: UpdatePatchUserDTO, @ParamId() id) {
    return this.userService.updatePartial(data, id)
  }

  @Delete(':id')
  async delete(@ParamId() id) {
    return this.userService.delete(id)
  }
}
