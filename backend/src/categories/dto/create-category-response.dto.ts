import { ApiProperty, PickType } from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response-dto';

class ParentCategoryDto {
  @ApiProperty({
    example: '80316101-cc6a-4bbd-a412-7ebaef2da1e8',
    description: 'ID родительской категории',
    type: String,
  })
  id: string;
}
export class CreateCategoryResponseDto extends PickType(CategoryResponseDto, [
  'id',
  'name',
]) {
  @ApiProperty({
    nullable: true,
    type: ParentCategoryDto,
    description: 'Id родительской категории',
  })
  parent: ParentCategoryDto | null;
}
