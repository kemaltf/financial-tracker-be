import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule, // Daftarkan DatabaseModule di sini
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
