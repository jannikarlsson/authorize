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

  async create(createUser: CreateUserDto): Promise<string> {
    if (!createUser.username || !createUser.password) {
      throw new BadRequestException('Missing username or password.');
    }

    const user = await this.authRepository.create(createUser);
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(user.password, salt);

    try {
      const newUser = await this.authRepository.save(user);
      return newUser.username;
    } catch (error) {
      if (error.code == 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Username is already taken.');
      } else {
        throw new InternalServerErrorException('Failed to create user.');
      }
    }
  }

  async authorize(user: UserDto) {
    const { username, password } = user;
    const existing = await this.authRepository.findOneBy({ username });

    if (!existing) {
      throw new NotFoundException('User could not be found');
    }

    const isMatch = await bcrypt.compare(password, existing.password);

    if (!isMatch) {
      throw new UnauthorizedException('User not authorized');
    }

    const payload = { sub: existing.id, username: existing.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
