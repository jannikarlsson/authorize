import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from './entities/auth.entity';
import { Repository } from 'typeorm';
import { UserDto } from './dto/user.dto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

const mockUser: UserDto = {
  username: 'testUser',
  password: '1234',
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            create: jest.fn(),
            authorize: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Users),
          useClass: Repository,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should call authService.create with the provided user', async () => {
    const createSpy = jest.spyOn(authService, 'create');

    await controller.create(mockUser);

    expect(createSpy).toHaveBeenCalledWith(mockUser);
  });

  it('should return the result of authService.create', async () => {
    const mockNewUser = 'username';

    jest.spyOn(authService, 'create').mockResolvedValue(mockNewUser);

    const result = await controller.create(mockUser);

    expect(result).toBe(mockNewUser);
  });

  it('should throw BadRequestException and return a corresponding HTTP response', async () => {
    const message = 'Missing username or password.';
    jest
      .spyOn(authService, 'create')
      .mockRejectedValue(new BadRequestException(message));

    try {
      await controller.create(mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(400);
      expect(error.getResponse()).toEqual({
        status: 400,
        error: message,
      });
    }
  });

  it('should throw InternalServerErrorException and return a corresponding HTTP response', async () => {
    const message = 'Internal server error';
    jest
      .spyOn(authService, 'create')
      .mockRejectedValue(new InternalServerErrorException(message));

    try {
      await controller.create(mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(500);
      expect(error.getResponse()).toEqual({
        status: 500,
        error: message,
      });
    }
  });

  it('should throw ConflictException and return a corresponding HTTP response', async () => {
    const message = 'There was a conflict';
    jest
      .spyOn(authService, 'create')
      .mockRejectedValue(new ConflictException(message));

    try {
      await controller.create(mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(409);
      expect(error.getResponse()).toEqual({
        status: 409,
        error: message,
      });
    }
  });

  it('should call authService.authorize with the provided user', async () => {
    const authorizeSpy = jest.spyOn(authService, 'authorize');

    await controller.authorize(mockUser);

    expect(authorizeSpy).toHaveBeenCalledWith(mockUser);
  });

  it('should return the result of authService.authorize', async () => {
    const mockAccessToken = { access_token: 'mockAccessToken' };

    jest.spyOn(authService, 'authorize').mockResolvedValue(mockAccessToken);

    const result = await controller.authorize(mockUser);

    expect(result).toBe(mockAccessToken);
  });

  it('should throw NotFoundException and return a corresponding HTTP response', async () => {
    const message = 'User does not exist';
    jest
      .spyOn(authService, 'authorize')
      .mockRejectedValue(new NotFoundException(message));

    try {
      await controller.authorize(mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(404);
      expect(error.getResponse()).toEqual({
        status: 404,
        error: message,
      });
    }
  });

  it('should throw UnauthorizedException and return a corresponding HTTP response', async () => {
    const message = 'User does not exist';
    jest
      .spyOn(authService, 'authorize')
      .mockRejectedValue(new UnauthorizedException(message));

    try {
      await controller.authorize(mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(401);
      expect(error.getResponse()).toEqual({
        status: 401,
        error: message,
      });
    }
  });

  it('should throw InternalServerErrorException and return a corresponding HTTP response', async () => {
    const message = 'Internal Server Error';
    jest
      .spyOn(authService, 'authorize')
      .mockRejectedValue(new InternalServerErrorException(message));

    try {
      await controller.authorize(mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(500);
      expect(error.getResponse()).toEqual({
        status: 500,
        error: message,
      });
    }
  });
});
