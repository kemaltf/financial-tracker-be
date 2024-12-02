import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY') // Menyuntikkan repository User secara otomatis
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData); // Membuat entitas User baru
    return await this.userRepository.save(user); // Menyimpan user ke database
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find(); // Mengambil semua data user
  }

  async findOne(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } }); // Mengambil user berdasarkan ID
  }
}
