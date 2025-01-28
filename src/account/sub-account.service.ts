import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubAccount } from './sub-account.entity'; // Path ke file Account
import { CreateAccountDTO } from './dto/create-account.dto';
import { UpdateAccountDTO } from './dto/update-account.dto';
import { TransactionType } from '@app/transaction/transactionType/transaction-type.entity';
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
  async getAvailableAccounts(transactionTypeId: number) {
    // Fetch the dynamic account type mapping
    const accountTypeMapping = await this.getAccountTypeMappingFromDb();

    const mapping = accountTypeMapping[transactionTypeId];
    if (!mapping) {
      throw new Error('Transaction type not found.');
    }

    const subAccounts = await this.getAllAccounts();

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
  async getAllAccounts(): Promise<SubAccount[]> {
    return await this.subAccountRepository.find({ relations: ['account'] });
  }

  // Mendapatkan akun berdasarkan ID
  async getAccountById(id: number): Promise<SubAccount> {
    const account = await this.subAccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new Error(`Account with ID ${id} not found`);
    }
    return account;
  }

  // Membuat akun baru
  async createAccount(createAccountDTO: CreateAccountDTO): Promise<SubAccount> {
    const { code, name, description } = createAccountDTO;

    const newAccount = this.subAccountRepository.create({
      code,
      name,
      description,
    });
    return await this.subAccountRepository.save(newAccount);
  }

  // Memperbarui akun berdasarkan ID
  async updateAccount(
    id: number,
    updateAccountDTO: UpdateAccountDTO,
  ): Promise<SubAccount> {
    const account = await this.getAccountById(id);
    Object.assign(account, updateAccountDTO);
    return await this.subAccountRepository.save(account);
  }

  // Menghapus akun berdasarkan ID
  async deleteAccount(id: number): Promise<void> {
    const account = await this.getAccountById(id);
    await this.subAccountRepository.remove(account);
  }
}
