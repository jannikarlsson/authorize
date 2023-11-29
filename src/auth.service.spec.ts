import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Users } from './entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserDto } from './dto/user.dto';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mockSalt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mockAccessToken'),
};

class MockRepository {
  findOneBy = jest.fn();
  create = jest.fn();
  save = jest.fn();
}

const mockUser: UserDto = {
  username: 'testUser',
  password: '1234',
};

const mockReturnUser: Users = {
  id: 1234,
  username: mockUser.username,
  password: mockUser.password,
};

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: Repository<Users>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(Users),
          useClass: MockRepository,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authRepository = module.get<Repository<Users>>(getRepositoryToken(Users));
  });

  describe('create', () => {
    it('should create a new user and return the username', async () => {
      jest.spyOn(authRepository, 'create').mockReturnValue(mockReturnUser);
      jest.spyOn(authRepository, 'save').mockResolvedValue(mockReturnUser);

      const result = await authService.create(mockUser);

      expect(result).toBe(mockReturnUser.username);
    });

    it('should throw BadRequestException for missing username or password', async () => {
      await expect(authService.create({} as CreateUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException for duplicate username', async () => {
      jest.spyOn(authRepository, 'create').mockReturnValue(mockReturnUser);
      jest
        .spyOn(authRepository, 'save')
        .mockRejectedValue({ code: 'SQLITE_CONSTRAINT' });

      await expect(authService.create(mockUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      jest.spyOn(authRepository, 'create').mockReturnValue(mockReturnUser);
      jest
        .spyOn(authRepository, 'save')
        .mockRejectedValue(new Error('Some unexpected error'));

      await expect(authService.create(mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('authorize', () => {
    it('should authorize the user and return an access token', async () => {
      jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(mockReturnUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await authService.authorize(mockUser);

      expect(result).toEqual({ access_token: 'mockAccessToken' });
    });

    it('should throw NotFoundException for user not found', async () => {
      jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(null);

      await expect(authService.authorize(mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(mockReturnUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(authService.authorize(mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
