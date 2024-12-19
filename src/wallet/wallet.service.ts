import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import { User } from 'src/user/user.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Create a new wallet
  async create(
    username: string,
    createWalletDto: CreateWalletDto,
  ): Promise<Wallet> {
    // verify the user exist
    const user = await this.userRepository.findOne({
      where: { username },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const wallet = this.walletRepository.create({
      user,
      wallet_type: createWalletDto.wallet_type,
      balance: createWalletDto.balance,
      account_number: createWalletDto.account_number,
      bank_name: createWalletDto.bank_name,
      wallet_name: createWalletDto.wallet_name,
    });
    return this.walletRepository.save(wallet);
  }

  // Get all wallets for a user
  async findAllByUser(username: string): Promise<Wallet[]> {
    return this.walletRepository.find({
      where: { user: { username: username } },
      relations: ['transactions'],
    });
  }

  // Get a specific wallet by ID
  async findOne(id: number): Promise<Wallet> {
    return this.walletRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });
  }

  // Update a wallet
  async update(
    username: string,
    id: number,
    updateWalletDto: UpdateWalletDto,
  ): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id, user: { username } },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Perbarui hanya properti yang diberikan
    const updatedWallet = this.walletRepository.merge(wallet, updateWalletDto);
    // Simpan perubahan ke database
    try {
      return await this.walletRepository.save(updatedWallet);
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to update wallet');
    }
  }

  // Delete a wallet
  async remove(id: number): Promise<void> {
    const wallet = await this.walletRepository.findOne({ where: { id } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    await this.walletRepository.remove(wallet);
  }
}
