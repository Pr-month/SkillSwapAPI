import { ApiProperty } from '@nestjs/swagger';
import { Request } from '../entities/request.entity'; // Убедитесь, что путь правильный

export class FindAllRequestsResponseDto {
  @ApiProperty({ type: [Request], description: 'Массив заявок' })
  data: Request[];

  @ApiProperty({ example: 1, description: 'Текущая страница' })
  page: number;

  @ApiProperty({ example: 20, description: 'Количество элементов на странице' })
  limit: number;

  @ApiProperty({ example: 5, description: 'Общее количество страниц' })
  totalPages: number;

  @ApiProperty({ example: 100, description: 'Общее количество заявок' })
  total: number;
}
