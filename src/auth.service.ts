import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/auth.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(Users)
    private readonly authRepository: Repository<Users>,
    private readonly jwtService: JwtService,
  ) {}

  async get(): Promise<Users[]> {
    return await this.authRepository.find();
  }

  async create(createUser: CreateUserDto): Promise<string> {
    this.logger.log(`Received request to create user: ${createUser.username}`);

    if (!createUser.username || !createUser.password) {
      this.logger.error('Missing username or password.');
      throw new BadRequestException('Missing username or password.');
    }

    const user = this.authRepository.create(createUser);
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(user.password, salt);

    try {
      const newUser = await this.authRepository.save(user);
      this.logger.log(`User ${newUser.username} created successfully.`);
      return newUser.username;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);
      if (error.code === 11000) {
        throw new ConflictException('Username is already taken.');
      } else {
        throw new InternalServerErrorException('Failed to create user.');
      }
    }
  }

  async authorize(user: UserDto) {
    this.logger.log(
      `Received authorization request for user: ${user.username}`,
    );

    const { username, password } = user;
    const existing = await this.authRepository.findOneBy({ username });

    if (!existing) {
      this.logger.error('User could not be found.');
      throw new NotFoundException('User could not be found');
    }

    const isMatch = await bcrypt.compare(password, existing.password);

    if (!isMatch) {
      this.logger.warn('User not authorized.');
      throw new UnauthorizedException('User not authorized');
    }

    this.logger.log('User authorized successfully.');
    const payload = { sub: existing.id, username: existing.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
