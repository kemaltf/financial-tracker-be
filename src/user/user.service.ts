import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { HandleErrors } from 'src/common/decorators';
import { SubAccount } from '@app/account/sub-account.entity';
import { Account, AccountType } from '@app/account/account.entity';
import { SubAccountService } from '@app/account/sub-account.service';

@Injectable()
export class UserService {
  constructor(
    private subAccountService: SubAccountService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SubAccount)
    private readonly subAccountRepository: Repository<SubAccount>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly dataSource: DataSource,
  ) {}

  @HandleErrors()
  async create(userData: CreateUserDto): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Gunakan queryRunner.manager untuk transaksi
      const user = queryRunner.manager.create(User, userData);
      const savedUser = await queryRunner.manager.save(user);

      // Buat akun-akun dengan transaksi yang sama
      await this.subAccountService.createManyAccounts(
        [
          {
            name: 'Kas',
            type: AccountType.ASSET,
            description: 'Uang tunai di tangan',
          },
          {
            name: 'Persediaan Barang',
            type: AccountType.ASSET,
            description: 'Barang siap dijual',
          },
          {
            name: 'Advertising Revenue',
            type: AccountType.REVENUE,
            description: 'Pendapatan dari iklan',
          },
          {
            name: 'Accounts Payable',
            type: AccountType.LIABILITY,
            description: 'Hutang usaha',
          },
          {
            name: 'Biaya Agen Sosial Media',
            type: AccountType.EXPENSE,
            description: 'Pembayaran kepada agen sosial media',
          },
        ],
        savedUser,
        queryRunner.manager, // Kirim queryRunner.manager ke createManyAccounts
      );

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findUniqueExcPass(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email'],
    });
  }
}
