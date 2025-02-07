import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SubAccount } from './sub-account.entity'; // Path ke file Account
import { CreateAccountDTO } from './dto/create-account.dto';
import { UpdateAccountDTO } from './dto/update-account.dto';
import { TransactionType } from '@app/transaction/transactionType/transaction-type.entity';
import { User } from '@app/user/user.entity';
import { Account } from './account.entity';
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

  // Function to get available accounts based on transaction type
  async getAvailableAccounts(transactionTypeId: number, user: User) {
    // Fetch the dynamic account type mapping
    const accountTypeMapping = await this.getAccountTypeMappingFromDb();

    const mapping = accountTypeMapping[transactionTypeId];
    if (!mapping) {
      throw new Error('Transaction type not found.');
    }

    const subAccounts = await this.getAllAccounts(user);

    // Filter accounts based on debit and credit mapping
    const debitAccounts = subAccounts
      .filter((subAccount) => {
        return mapping.debit.includes(subAccount.Account.type);
      })
      .map((subAccount) => ({
        value: subAccount.id,
        label: `${subAccount.name} (${subAccount.code})`,
      }));

    const creditAccounts = subAccounts
      .filter((subAccount) => mapping.credit.includes(subAccount.Account.type))
      .map((subAccount) => ({
        value: subAccount.id,
        label: `${subAccount.name} (${subAccount.code})`,
      }));

    return { debitAccounts, creditAccounts };
  }

  // Mendapatkan semua akun
  async getAllAccounts(user: User): Promise<SubAccount[]> {
    return await this.subAccountRepository.find({
      relations: ['Account'],
      where: { user: user },
    });
  }

  // Mendapatkan akun berdasarkan ID
  async getAccountById(id: number, user: User): Promise<SubAccount> {
    const account = await this.subAccountRepository.findOne({
      where: { id, user: user },
    });
    if (!account) {
      throw new Error(`Account with ID ${id} not found`);
    }
    return account;
  }

  // Membuat akun baru
  async createAccount(
    createAccountDTO: CreateAccountDTO,
    user: User,
  ): Promise<SubAccount> {
    const { code, name, description } = createAccountDTO;

    const account = await this.accountRepository.findOne({
      where: { type: createAccountDTO.type },
    });

    console.log(createAccountDTO.type, account);

    if (!account) {
      throw new BadRequestException('Account type not found');
    }

    const newAccount = this.subAccountRepository.create({
      code,
      name,
      description,
      Account: account,
      user: user,
      balance: 0,
    });
    return await this.subAccountRepository.save(newAccount);
  }

  async createManyAccounts(
    createAccountDTOs: CreateAccountDTO[],
    user: User,
  ): Promise<SubAccount[]> {
    const accountTypes = await this.accountRepository.find({
      where: {
        type: In(createAccountDTOs.map((dto) => dto.type)),
      },
    });

    const accountTypeMap = new Map(
      accountTypes.map((account) => [account.type, account]),
    );

    const newAccounts = createAccountDTOs.map((dto) => {
      const relatedAccount = accountTypeMap.get(dto.type);
      if (!relatedAccount) {
        throw new BadRequestException(`Account type ${dto.type} not found`);
      }

      return this.subAccountRepository.create({
        code: dto.code,
        name: dto.name,
        description: dto.description,
        Account: relatedAccount,
        user: user,
        balance: 0,
      });
    });

    return await this.subAccountRepository.save(newAccounts);
  }

  // Memperbarui akun berdasarkan ID
  async updateAccount(
    id: number,
    updateAccountDTO: UpdateAccountDTO,
    user: User,
  ): Promise<SubAccount> {
    const account = await this.getAccountById(id, user);
    Object.assign(account, updateAccountDTO);
    return await this.subAccountRepository.save(account);
  }

  // Menghapus akun berdasarkan ID
  async deleteAccount(id: number, user: User): Promise<void> {
    const account = await this.getAccountById(id, user);
    await this.subAccountRepository.remove(account);
  }
}
