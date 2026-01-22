import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Sector } from "./Sector";
import { KpiEntry } from "./KpiEntry";

@Entity("kpis")
export class KPI {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 50, default: "number" })
    unit!: "currency" | "number" | "percent";

    @Column({ type: "varchar", length: 50, default: "" })
    format!: string;

    @Column({ type: "uuid" })
    sectorId!: string;

    @ManyToOne(() => Sector, (sector) => sector.kpis, { onDelete: "CASCADE" })
    @JoinColumn({ name: "sectorId" })
    sector!: Sector;

    @OneToMany(() => KpiEntry, (entry) => entry.kpi, { cascade: true })
    entries!: KpiEntry[];

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}
