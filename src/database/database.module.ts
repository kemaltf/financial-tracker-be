import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'user',
      password: 'password',
      database: 'test',
      autoLoadEntities: true,
      synchronize: true, // Jangan aktifkan di production!
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
