import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO для возврата результата загрузки файла с изображением
export class UploadedImageFileDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '/public/uploads/c29af17d-1ac7-41d9-a48b-0407c9a60cc4_lq.jpg',
    description: 'Публичная ссылка на загруженное обработанное изображение',
  })
  publicUrl: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'c29af17d-1ac7-41d9-a48b-0407c9a60cc4_lq.jpg',
    description: 'Имя результирующего обработанного файла',
  })
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Original.jpg',
    description: 'Имя исходного файла',
  })
  originalName: string;
}
