import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
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

  @Get('financial-summary')
  async getFinancialSummary(@GetUser() user: User) {
    console.log(user.id);
    return this.transactionService.getFinancialSummary();
  }

  @Get('monthly-trends')
  async getMonthlyTrends(@GetUser() user: User) {
    console.log(user.id);
    return this.transactionService.getMonthlyTrends();
  }

  @Get('anomalies')
  async getAnomalies(@GetUser() user: User) {
    console.log(user.id);
    return this.transactionService.checkForAnomalies();
  }

  @Patch(':id')
  async updateTransaction(
    @Param('id') transactionId: number,
    @Body() transactionDTO: TransactionDTO,
    @GetUser() user: User,
  ) {
    return this.transactionService.updateTransaction(
      transactionId,
      user.id,
      transactionDTO,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @GetUser() user: User) {
    console.log('kesini', user);
    return this.transactionService.deleteTransaction(id, user);
  }
}
