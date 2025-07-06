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
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { AuthRequest } from 'src/auth/types';
import { UpdateRequestDto } from './dto/update-request.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Req() req: AuthRequest, @Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(req.user.sub, createRequestDto);
  }

  @Get()
  findAll() {
    return this.requestsService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.requestsService.findOne(req.user.sub, id, req.user.role);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  read(@Param('id') id: string, @Body() updateDto: UpdateRequestDto) {
    return this.requestsService.update(id, updateDto);
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
