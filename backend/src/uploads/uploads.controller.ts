import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { UploadedImageFileDTO } from './dto/upload.image.file.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Загрузка изображения на сервер' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ссылка на загруженный файл',
    type: UploadedImageFileDTO,
    isArray: false,
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImageFile(
    @UploadedFile() file: { path: string; originalname: string },
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('Файл не загружен', HttpStatus.BAD_REQUEST);
    }
    return res
      .status(HttpStatus.CREATED)
      .json(
        await this.uploadsService.prepareFile(file.path, file.originalname),
      );
  }
}
