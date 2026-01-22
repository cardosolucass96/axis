import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { KPI } from "./KPI";
import { KpiEntry } from "./KpiEntry";

@Entity("sectors")
export class Sector {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    name!: string;

    @OneToMany(() => KPI, (kpi) => kpi.sector, { cascade: true, eager: true })
    kpis!: KPI[];

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}
