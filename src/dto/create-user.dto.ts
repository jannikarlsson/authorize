import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Field username must be added' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Field password must be added' })
  @IsString()
  password: string;
}
