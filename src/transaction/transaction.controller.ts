import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Delete,
  Query,
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

  @Get('ledger')
  async getLedger(
    @Query('startMonth') startMonth?: string,
    @Query('endMonth') endMonth?: string,
    @Query('accountId') accountId?: number,
  ) {
    return this.transactionService.getLedger(startMonth, endMonth, accountId);
  }

  @Get('trial-balance')
  async getTrialBalance() {
    console.log('first');
    return this.transactionService.getTrialBalance();
  }
  @Get('income-statement')
  async getIncomeStatement() {
    return this.transactionService.getIncomeStatement();
  }
  @Get('balance-sheet')
  async getBalanceSheet() {
    return this.transactionService.getBalanceSheet();
  }

  @Get('cash-flow-statement')
  async getCashFlowStatement(): Promise<any> {
    return this.transactionService.getCashFlowStatement();
  }

  @Get('financial-summary')
  async getFinancialSummary(
    @GetUser() user: User,
    @Query('startMonth') startMonth?: string,
    @Query('endMonth') endMonth?: string,
  ) {
    console.log(user.id);
    return this.transactionService.getFinancialSummary({
      userId: user.id,
      startMonth: startMonth,
      endMonth: endMonth,
    });
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

  @Get()
  async getTransactionHistory(
    @GetUser() user: User,
    @Query('startMonth') startMonth?: string,
    @Query('endMonth') endMonth?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortDirection') sortDirection: 'ASC' | 'DESC' = 'ASC',
  ) {
    return this.transactionService.getTransactionHistory({
      userId: user.id,
      startMonth,
      endMonth,
      page,
      limit,
      sortBy,
      sortDirection,
    });
  }

  @Get(':transactionId')
  async getTransactionDetail(@Param('transactionId') transactionId: number) {
    return this.transactionService.getTransactionDetail(transactionId);
  }
}
