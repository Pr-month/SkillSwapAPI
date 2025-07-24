import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { AuthRequest } from 'src/auth/types';
import { UpdateRequestDto } from './dto/update-request.dto';
import { FindRequestQueryDto } from './dto/find-request.dto';
import { FindAllRequestsResponseDto } from './dto/find-all-requests-response.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from './entities/request.entity';
import { RequestStatus, RequestType } from './enums';
import { FindOneRequestDto } from './dto/find-one-requst.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Создание заявки',
    description: 'Создать заявку может только авторизованный пользователь',
  })
  @ApiResponse({
    status: 201,
    description: 'Заявка успешно создана',
    type: Request,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Req() req: AuthRequest, @Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(req.user.sub, createRequestDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Get()
  @ApiOperation({ summary: 'Получение всех запросов' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: RequestType,
    example: 'incoming',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: RequestStatus,
    example: 'pending',
  })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'page', required: false, type: String, example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, example: '20' })
  @ApiResponse({
    status: 200,
    description: 'Список всех запросов',
    type: FindAllRequestsResponseDto,
  })
  findAll(@Req() req: AuthRequest, @Query() query: FindRequestQueryDto) {
    return this.requestsService.findAll(req.user.sub, query);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Получение заявки по id' })
  @ApiParam({
    name: 'id',
    description: 'id заявки, которую нужно получить',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Заявка успешно получена',
    type: FindOneRequestDto,
  })
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.requestsService.findOne(req.user.sub, id, req.user.role);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Обновление заявки',
    description:
      'Обновить можно только поле action. Обновить заявку межет только получатель или админ',
  })
  @ApiParam({
    name: 'id',
    description: 'id заявки, которую нужно обновить',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiBody({ type: UpdateRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Заявка успешно обновлена',
    type: Request,
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для обновления заявки',
    example: {
      statusCode: 403,
      message: {
        message:
          'Пользователь не может обновить заявку, если он не является её получателем',
        error: 'Forbidden',
        statusCode: 403,
      },
    },
  })
  read(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateRequestDto,
  ) {
    return this.requestsService.update(id, updateDto, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Удаление заявки',
    description:
      'Пользователь может удалить только свою исходящую заявку, в противном случае вернётся ошибка 403. Админ может удалить любую заявку.',
  })
  @ApiParam({
    name: 'id',
    description: 'id заявки, которую нужно удалить',
    example: '1234567890abcdef12345678',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешное удаление заявки',
    example: {
      message: 'Заявка с id: 1234567890abcdef12345678 успешно удалена',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для удаления заявки',
    example: {
      statusCode: 403,
      message: {
        message:
          'Пользователь не может удалить заявку, созданную другим пользователем',
        error: 'Forbidden',
        statusCode: 403,
      },
    },
  })
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.requestsService.remove(id, req.user);
  }
}
