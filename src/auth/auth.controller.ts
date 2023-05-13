import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AuthLoginDTO } from './dto/auth-login.dto'
import { AuthRegisterDTO } from './dto/auth-register.dto'
import { AuthForgetDTO } from './dto/auth-forget.dto'
import { AuthResetDTO } from './dto/auth-reset.dto'
import { AuthService } from './auth.service'
import { AuthGuard } from 'src/guards/auth.guard'
import { User } from 'src/decorators/user.decorator'
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express'
import { join } from 'path'
import { FileService } from 'src/file/file.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private fileService: FileService,
  ) {}

  @Post('login')
  async login(@Body() { email, password }: AuthLoginDTO) {
    return this.authService.login(email, password)
  }

  @Post('register')
  async register(@Body() body: AuthRegisterDTO) {
    return this.authService.register(body)
  }

  @Post('forget')
  async forget(@Body() { email }: AuthForgetDTO) {
    return this.authService.forget(email)
  }

  @Post('reset')
  async reset(@Body() { password, token }: AuthResetDTO) {
    return this.authService.reset(password, token)
  }

  @UseGuards(AuthGuard)
  @Post('me')
  async me(@Req() req, @User() user) {
    return { data: req.tokenPayload, user }
  }

  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard)
  @Post('photo')
  async uploadPhoto(
    @User() user,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'image/jpeg' }),
          new MaxFileSizeValidator({ maxSize: 1024 * 150 }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ) {
    try {
      const path = join(
        __dirname,
        '..',
        '..',
        'storage',
        'photos',
        `photo-${user.id}.jpg`,
      )
      await this.fileService.uploadPhoto(path, photo)

      return { success: true }
    } catch (error) {
      throw new BadRequestException('Erro ao salvar arquivo.')
    }
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'photo',
        maxCount: 1,
      },
      {
        name: 'documents',
        maxCount: 10,
      },
    ]),
  )
  @UseGuards(AuthGuard)
  @Post('files-fields')
  async uploadFiles(
    @User() user,
    @UploadedFiles()
    files: { photo: Express.Multer.File; documents: Express.Multer.File[] },
  ) {
    return files
  }
}
