import { Controller, Post, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionDTO } from './dto/transaction.dto';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async createTransaction(
    @Body() transactionData: TransactionDTO,
    @GetUser() user: User,
  ) {
    return this.transactionService.createTransaction(user.id, transactionData);
  }
}
