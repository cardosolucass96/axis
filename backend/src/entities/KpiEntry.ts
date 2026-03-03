import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, OneToMany, JoinColumn } from "typeorm";
import { KPI } from "./KPI";
import { Sector } from "./Sector";
import { ActionPlan } from "./ActionPlan";
import { RootCause } from "./RootCause";

@Entity("kpi_entries")
export class KpiEntry {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    sectorId!: string;

    @Column({ type: "uuid" })
    kpiId!: string;

    @Column({ type: "varchar", length: 50 })
    month!: string; // e.g., "Setembro"

    @Column({ type: "varchar", length: 50 })
    week!: string; // e.g., "Semana 1"

    @Column({ type: "integer", nullable: true, default: null })
    day!: number | null; // null = entrada semanal, 1-31 = entrada diária

    @Column({ type: "decimal", precision: 12, scale: 2 })
    target!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, nullable: true, default: null })
    realized!: number | null; // null = não preenchido, 0 = valor zero preenchido

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    gap!: number;

    @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
    gapPercentage!: number;

    @Column({ type: "boolean", default: false })
    isCompleted!: boolean; // true quando o realizado foi preenchido e a meta da semana está "congelada"

    @ManyToOne(() => KPI, (kpi) => kpi.entries, { onDelete: "CASCADE" })
    @JoinColumn({ name: "kpiId" })
    kpi!: KPI;

    @ManyToOne(() => Sector, { onDelete: "CASCADE" })
    @JoinColumn({ name: "sectorId" })
    sector!: Sector;

    @OneToOne(() => ActionPlan, (plan) => plan.entry, { cascade: true, nullable: true })
    actionPlan?: ActionPlan;

    @OneToMany(() => RootCause, (cause) => cause.entry, { cascade: true })
    rootCauses!: RootCause[];

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    lastUpdated!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}
