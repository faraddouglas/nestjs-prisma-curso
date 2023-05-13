import { Injectable } from '@nestjs/common'
import { writeFile } from 'fs/promises'

@Injectable()
export class FileService {
  async uploadPhoto(path: string, photo: Express.Multer.File) {
    return await writeFile(path, photo.buffer)
  }
}
