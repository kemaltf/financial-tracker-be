import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions =>
  ({
    autoLoadEntities: true,
    database: configService.get<string>('DB_NAME'),
    host: configService.get<string>('DB_HOST'),
    logging: true,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
    password: configService.get<string>('DB_PASSWORD'),
    port: configService.get<number>('DB_PORT'),
    synchronize: configService.get<boolean>('DB_SYNC', false), // Default ke false
    type: 'mysql', // Pastikan ini adalah literal, bukan string biasa
    username: configService.get<string>('DB_USERNAME'),
    timezone: 'Z',
    extra: {
      allowPublicKeyRetrieval: true,
    },
  }) as const;
