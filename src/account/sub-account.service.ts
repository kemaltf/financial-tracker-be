import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { SubAccount } from './sub-account.entity'; // Path ke file Account
import { CreateAccountDTO } from './dto/create-account.dto';
import { UpdateAccountDTO } from './dto/update-account.dto';
import { TransactionType } from '@app/transaction/transactionType/transaction-type.entity';
import { User } from '@app/user/user.entity';
import { Account, AccountType } from './account.entity';
import { HandleErrors } from '@app/common/decorators';
interface AccountTypeMapping {
  debit: string[];
  credit: string[];
}

@Injectable()
export class SubAccountService {
  constructor(
    @InjectRepository(SubAccount)
    private readonly subAccountRepository: Repository<SubAccount>,
    @InjectRepository(TransactionType)
    private readonly transactionTypeRepository: Repository<TransactionType>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  // Fetch transaction types from the database
  private async getAccountTypeMappingFromDb(): Promise<
    Record<number, AccountTypeMapping>
  > {
    const transactionTypes = await this.transactionTypeRepository.find();
    const accountTypeMapping: Record<number, AccountTypeMapping> = {};

    // Construct the mapping from the database data
    transactionTypes.forEach((transactionType) => {
      accountTypeMapping[transactionType.id] = {
        debit: transactionType.debit || [],
        credit: transactionType.credit || [],
      };
    });

    return accountTypeMapping;
  }

  private async generateAccountCode(
    type: AccountType,
    userId: string,
  ): Promise<string> {
    const prefix = this.getAccountPrefix(type);

    // Cari kode akun terakhir dari tipe yang sama
    const lastAccount = await this.subAccountRepository.findOne({
      where: { account: { type }, user: { id: userId } },
      order: { code: 'DESC' },
      relations: ['account'],
    });

    let nextCode = `${prefix}01`; // Default jika belum ada akun

    if (lastAccount?.code) {
      const lastNumber = parseInt(lastAccount.code.slice(-2), 10);
      nextCode = `${prefix}${(lastNumber + 1).toString().padStart(2, '0')}`;
    }

    return nextCode;
  }

  // Function to get available accounts based on transaction type
  @HandleErrors()
  async getAvailableAccounts(transactionTypeId: number, user: User) {
    // Fetch the dynamic account type mapping
    const accountTypeMapping = await this.getAccountTypeMappingFromDb();

    const mapping = accountTypeMapping[transactionTypeId];
    if (!mapping) {
      throw new BadRequestException('Transaction type not found.');
    }

    const subAccounts = await this.getAllAccounts(user);

    // Filter accounts based on debit and credit mapping
    const debitAccounts = subAccounts
      .filter((subAccount) => {
        return mapping.debit.includes(subAccount.account.type);
      })
      .map((subAccount) => ({
        value: subAccount.id,
        label: `${subAccount.name} (${subAccount.code})`,
      }));

    const creditAccounts = subAccounts
      .filter((subAccount) => mapping.credit.includes(subAccount.account.type))
      .map((subAccount) => ({
        value: subAccount.id,
        label: `${subAccount.name} (${subAccount.code})`,
      }));

    return { debitAccounts, creditAccounts };
  }

  // Mendapatkan semua akun
  @HandleErrors()
  async getAllAccounts(user: User): Promise<SubAccount[]> {
    return await this.subAccountRepository.find({
      relations: ['account'],
      where: { user: user },
    });
  }

  // Mendapatkan akun berdasarkan ID
  async getSubAccountById(id: number, user: User): Promise<SubAccount> {
    const account = await this.subAccountRepository.findOne({
      where: { id, user: user },
      relations: ['account'],
    });
    if (!account) {
      throw new BadRequestException(`Account with ID ${id} not found`);
    }
    return account;
  }

  private getAccountPrefix(type: AccountType): string {
    const prefixMap: Record<AccountType, string> = {
      [AccountType.ASSET]: '1',
      [AccountType.LIABILITY]: '2',
      [AccountType.EQUITY]: '3',
      [AccountType.REVENUE]: '4',
      [AccountType.EXPENSE]: '5',
    };

    return prefixMap[type] || '9'; // Default jika tipe tidak dikenali
  }

  @HandleErrors()
  async createAccount(
    createAccountDTO: CreateAccountDTO,
    user: User,
  ): Promise<SubAccount> {
    const { name, description, type } = createAccountDTO;

    const account = await this.accountRepository.findOne({
      where: { type },
    });

    if (!account) {
      throw new BadRequestException('Account type not found');
    }

    // Generate kode akun baru
    const nextCode = await this.generateAccountCode(type, user.id);

    // Buat akun baru
    const newAccount = this.subAccountRepository.create({
      code: nextCode,
      name,
      description,
      account,
      user,
      balance: 0,
    });

    return await this.subAccountRepository.save(newAccount);
  }

  @HandleErrors()
  async createManyAccounts(
    createAccountDTOs: CreateAccountDTO[],
    user: User,
    manager: EntityManager,
  ): Promise<SubAccount[]> {
    const accountTypes = await manager.find(Account, {
      where: {
        type: In(createAccountDTOs.map((dto) => dto.type)),
      },
    });

    const accountTypeMap = new Map(
      accountTypes.map((account) => [account.type, account]),
    );

    console.log('====', accountTypeMap);
    // Ambil semua last account codes untuk setiap type yang akan digunakan
    const lastAccounts = await manager.find(SubAccount, {
      where: {
        account: In(accountTypes.map((account) => account.id)),
        user: { id: user.id },
      },
      order: { code: 'DESC' },
      relations: ['account'],
    });

    // Buat map untuk melacak last code berdasarkan type
    const lastCodeMap = new Map<string, number>();

    lastAccounts.forEach((account) => {
      const type = account.account.type;
      const lastNumber = parseInt(account.code.slice(-2), 10);
      lastCodeMap.set(type, lastNumber);
    });

    const newAccounts = createAccountDTOs.map((dto) => {
      const relatedAccount = accountTypeMap.get(dto.type);
      if (!relatedAccount) {
        throw new Error(`Account type ${dto.type} not found`);
      }

      // Hitung kode baru dengan memastikan tidak ada duplikasi
      const prefix = this.getAccountPrefix(dto.type);
      const lastNumber = lastCodeMap.get(dto.type) ?? 0;
      const nextNumber = lastNumber + 1;
      lastCodeMap.set(dto.type, nextNumber); // Update lastCode agar tidak duplikat
      const code = `${prefix}${nextNumber.toString().padStart(2, '0')}`;

      return manager.create(SubAccount, {
        code,
        name: dto.name,
        description: dto.description,
        account: relatedAccount,
        user,
        balance: 0,
      });
    });

    return await manager.save(newAccounts);
  }

  // Memperbarui akun berdasarkan ID
  @HandleErrors()
  async updateAccount(
    id: number,
    updateAccountDTO: UpdateAccountDTO,
    user: User,
  ): Promise<SubAccount> {
    const account = await this.getSubAccountById(id, user);
    Object.assign(account, updateAccountDTO);
    return await this.subAccountRepository.save(account);
  }

  // Menghapus akun berdasarkan ID
  async deleteAccount(id: number, user: User): Promise<void> {
    const account = await this.getSubAccountById(id, user);
    await this.subAccountRepository.remove(account);
  }
}
