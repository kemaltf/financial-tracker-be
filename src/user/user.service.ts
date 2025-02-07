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
      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);

      // Ambil semua tipe akun yang tersimpan sebelumnya
      await this.subAccountService.createManyAccounts(
        [
          {
            code: '1-10001',
            name: 'Kas',
            type: AccountType.ASSET,
            description: 'Uang tunai di tangan',
          },
          {
            code: '1-102000',
            name: 'Persediaan Barang',
            type: AccountType.ASSET,
            description: 'Barang siap dijual',
          },
          {
            code: '4-30200',
            name: 'Advertising Revenue',
            type: AccountType.REVENUE,
            description: 'Pendapatan dari iklan',
          },
          {
            code: '1-10101',
            name: 'Piutang Lain-lain (Other Receivables)',
            type: AccountType.ASSET,
            description:
              'Piutang yang berasal dari aktivitas non-operasional, seperti pinjaman kepada karyawan atau pihak lain.',
          },
          {
            code: '2-20100',
            name: 'Accounts Payable',
            type: AccountType.LIABILITY,
            description: 'Hutang usaha',
          },
          {
            code: '5-60100',
            name: 'Biaya Agen Sosial Media',
            type: AccountType.EXPENSE,
            description: 'Pembayaran kepada agen sosial media',
          },
          {
            code: '5-60200',
            name: 'Biaya Iklan',
            type: AccountType.EXPENSE,
            description: 'Biaya iklan dan pemasaran',
          },
          {
            code: '5-60300',
            name: 'Barang Pelengkap',
            type: AccountType.EXPENSE,
            description: 'Pembelian barang pelengkap seperti stiker',
          },
          {
            code: '5-60400',
            name: 'Barang Kantor',
            type: AccountType.EXPENSE,
            description: 'Pembelian barang kantor seperti printer',
          },
          {
            code: '5-60500',
            name: 'Biaya Transportasi',
            type: AccountType.EXPENSE,
            description: 'Biaya transportasi untuk operasional usaha',
          },
          {
            code: '4-30300',
            name: 'Affiliate Revenue',
            type: AccountType.REVENUE,
            description: 'Pendapatan dari program afiliasi atau referensi.',
          },

          {
            code: '4-30700',
            name: 'Marketplace Commission',
            type: AccountType.REVENUE,
            description: 'Komisi dari penjualan produk di marketplace online.',
          },
          {
            code: '4-30800',
            name: 'Dropshipping Revenue',
            type: AccountType.REVENUE,
            description: 'Pendapatan dari model bisnis dropshipping.',
          },
          {
            code: '4-31000',
            name: 'Endorsement Content Revenue',
            type: AccountType.REVENUE,
            description:
              'Pendapatan dari konten endorsment seperti posting blog, video, atau ulasan.',
          },
        ],
        savedUser,
      );
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
