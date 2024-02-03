import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/')
  async findAll() {
    return await this.authService.get();
  }

  @HttpCode(HttpStatus.OK)
  @Post('create')
  async create(@Body() user: CreateUserDto) {
    try {
      return await this.authService.create(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else if (error instanceof InternalServerErrorException) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
          {
            cause: error,
          },
        );
      } else if (error instanceof ConflictException) {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            error: error.message,
          },
          HttpStatus.CONFLICT,
          {
            cause: error,
          },
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('authorize')
  async authorize(@Body() user: UserDto) {
    try {
      const result = await this.authService.authorize(user);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      } else if (error instanceof UnauthorizedException) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            error: error.message,
          },
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
