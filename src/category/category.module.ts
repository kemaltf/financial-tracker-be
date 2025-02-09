import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Store } from '@app/store/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Store])],
  providers: [CategoryService],
  controllers: [CategoryController],
})
export class CategoryModule {}
