import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiKeys1750000000000 implements MigrationInterface {
  name = 'CreateApiKeys1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`api_keys\` (\`id\` varchar(36) NOT NULL, \`prefix\` varchar(16) NOT NULL, \`keyHash\` varchar(64) NOT NULL, \`name\` varchar(120) NOT NULL, \`scopes\` text NOT NULL, \`revokedAt\` timestamp NULL, \`lastUsedAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_api_keys_key_hash\` (\`keyHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`ALTER TABLE \`api_keys\` ADD CONSTRAINT \`FK_api_keys_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`api_keys\` DROP FOREIGN KEY \`FK_api_keys_user\``);
    await queryRunner.query(`DROP INDEX \`IDX_api_keys_key_hash\` ON \`api_keys\``);
    await queryRunner.query(`DROP TABLE \`api_keys\``);
  }
}
