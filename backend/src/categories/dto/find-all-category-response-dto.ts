import { PickType } from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response-dto';

export class FindALLCategoryResponseDto extends PickType(CategoryResponseDto, [
  'id',
  'name',
  'children',
]) {}
