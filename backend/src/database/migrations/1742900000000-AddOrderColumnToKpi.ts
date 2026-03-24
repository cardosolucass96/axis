import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddOrderColumnToKpi1742900000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "kpis",
            new TableColumn({
                name: "sort_order",
                type: "integer",
                isNullable: true,
                default: null,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("kpis", "sort_order");
    }
}
