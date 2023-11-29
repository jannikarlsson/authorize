import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'username', length: 40, nullable: false, unique: true })
  username: string;

  @Column({ name: 'password', length: 30, nullable: false })
  password: string;
}
