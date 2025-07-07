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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindRequestQueryDto } from './dto/find-request.dto';
import { FindAllRequestsResponseDto } from './dto/find-all-requests-response.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Req() req: AuthRequest, @Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(req.user.sub, createRequestDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  @ApiOperation({ summary: 'Получение всех  запросов' })
  @ApiResponse({
    status: 200,
    description: 'Список всех запросов',
    type: FindAllRequestsResponseDto,
  })
  findAll(@Req() req: AuthRequest, @Query() query: FindRequestQueryDto) {
    return this.requestsService.findAll(req.user.sub, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  read(@Param('id') id: string, @Body() updateDto: UpdateRequestDto) {
    return this.requestsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestsService.remove(id);
  }
}
