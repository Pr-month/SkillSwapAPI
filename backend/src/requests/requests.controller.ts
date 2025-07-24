import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UseGuards,
  Query,
  UseInterceptors,
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
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { UserPasswordFilter } from '../common/userPassword.filter';

@Controller('requests')
@UseInterceptors(UserPasswordFilter)
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
  @ApiOperation({ summary: 'Отправление заявки' })
  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Req() req: AuthRequest, @Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(req.user.sub, createRequestDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Get('/incoming')
  @ApiOperation({ summary: 'Получение входящей заявки(только актуальные)' })
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
  @Get('/outgoing')
  @ApiOperation({ summary: 'Получение исходящие заявки(только актуальные)' })
  @ApiResponse({
    status: 200,
    description: 'Список всех запросов',
    type: FindAllRequestsResponseDto,
  })
  findAl(@Req() req: AuthRequest, @Query() query: FindRequestQueryDto) {
    return this.requestsService.findAll(req.user.sub, query);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Patch(':id/read')
  @ApiOperation({ summary: 'Возможность прочитать заявку' })
  read(@Param('id') id: string, @Body() updateDto: UpdateRequestDto) {
    return this.requestsService.update(id, updateDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Patch(':id/accept')
  @ApiOperation({ summary: 'Возможность принять заявку' })
  rad(@Param('id') id: string, @Body() updateDto: UpdateRequestDto) {
    return this.requestsService.update(id, updateDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Отклонение заявки',
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
    schema: {
      example: {
        message: 'Заявка с id: 1234567890abcdef12345678 успешно удалена',
      },
    },
  })
  @ApiResponse({
    status: 403,
    schema: {
      example: {
        message:
          'Пользователь не может удалить заявку, созданную другим пользователем',
      },
    },
  })
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.requestsService.remove(id, req.user);
  }
}
