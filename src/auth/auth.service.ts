import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { AuthRegisterDTO } from './dto/auth-register.dto'
import { UserService } from 'src/user/user.service'
import * as bcrypt from 'bcrypt'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class AuthService {
  private issuer = 'api-sistema-conecsa'
  private audience = 'users'

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly mailer: MailerService,
  ) {}

  createToken(user: User) {
    return {
      accessToken: this.jwtService.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        {
          expiresIn: '7 days',
          subject: String(user.id),
          issuer: this.issuer,
          audience: this.audience,
        },
      ),
    }
  }

  checkToken(token: string) {
    try {
      const data = this.jwtService.verify(token, {
        issuer: this.issuer,
        audience: this.audience,
      })

      return data
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async isValidToken(token: string) {
    try {
      this.checkToken(token)
      return true
    } catch {
      return false
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    })

    const compareResult = await bcrypt.compare(password, user.password)

    if (!user) {
      throw new UnauthorizedException('Email e/ou senha incorretos.')
    }

    if (!compareResult) {
      throw new UnauthorizedException('A senha está incorreta.')
    }

    return this.createToken(user)
  }

  async register(data: AuthRegisterDTO) {
    const user = await this.userService.create(data)

    return this.createToken(user)
  }

  async forget(email: string) {
    const user = this.prisma.user.findFirst({
      where: {
        email,
      },
    })

    if (!user) {
      throw new UnauthorizedException('Email não cadastrado.')
    }

    const token = this.jwtService.sign(
      {
        id: (await user).id,
      },
      {
        expiresIn: '30 minutes',
        subject: String((await user).id),
        issuer: 'forget',
        audience: 'users',
      },
    )

    await this.mailer.sendMail({
      subject: 'Recuperação de senha',
      to: (await user).email,
      template: 'forget',
      context: {
        name: (await user).name,
        token,
      },
    })

    return true
  }

  async reset(password: string, token: string) {
    try {
      const data = this.jwtService.verify(token, {
        issuer: 'forget',
        audience: 'users',
      })

      if (isNaN(Number(data.id))) {
        throw new BadRequestException('Token é inválido')
      }

      const user = await this.prisma.user.update({
        where: {
          id: Number(data.id),
        },
        data: {
          password: await bcrypt.hash(password, await bcrypt.genSalt()),
        },
      })

      return this.createToken(user)
    } catch (error) {
      throw new BadRequestException(error)
    }
  }
}
