import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateUserDTO } from './dot/create-user.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import { UpdatePatchUserDTO } from './dot/update-patch-user.dto'
import { UpdatePutUserDTO } from './dot/update-put-user.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDTO) {
    data.password = await bcrypt.hash(data.password, await bcrypt.genSalt())

    if (data.birthAt) {
      data.birthAt = new Date(data.birthAt)
    }

    return await this.prisma.user.create({
      data,
    })
  }

  async list() {
    return await this.prisma.user.findMany()
  }

  async show(id: number) {
    await this.exists(id)

    return await this.prisma.user.findUnique({
      where: {
        id,
      },
    })
  }

  async update(
    { name, email, password, birthAt, role }: UpdatePutUserDTO,
    id: number,
  ) {
    await this.exists(id)

    password = await bcrypt.hash(password, await bcrypt.genSalt())

    return await this.prisma.user.update({
      data: {
        name,
        email,
        password,
        birthAt: birthAt ? new Date(birthAt) : null,
        role,
      },
      where: {
        id,
      },
    })
  }

  async updatePartial(data: UpdatePatchUserDTO, id: number) {
    await this.exists(id)

    if (data.birthAt) {
      data.birthAt = new Date(data.birthAt)
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, await bcrypt.genSalt())
    }

    return await this.prisma.user.update({
      data,
      where: {
        id,
      },
    })
  }

  async delete(id: number) {
    await this.exists(id)

    return await this.prisma.user.delete({
      where: {
        id,
      },
    })
  }

  async exists(id: number) {
    if (
      !(await this.prisma.user.count({
        where: {
          id,
        },
      }))
    ) {
      throw new NotFoundException(`O usuário ${id} não existe`)
    }
  }
}
