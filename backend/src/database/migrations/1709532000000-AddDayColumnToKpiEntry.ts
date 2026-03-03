import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDayColumnToKpiEntry1709532000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna 'day' à tabela kpi_entries
        // day: null = entrada semanal, 1-31 = entrada diária
        await queryRunner.addColumn(
            "kpi_entries",
            new TableColumn({
                name: "day",
                type: "integer",
                isNullable: true,
                default: null,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover coluna 'day' em caso de rollback
        await queryRunner.dropColumn("kpi_entries", "day");
    }
}
