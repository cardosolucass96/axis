import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { KpiEntry } from "./KpiEntry";

@Entity("action_plans")
export class ActionPlan {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    entryId!: string;

    @Column({ type: "text" })
    what!: string; // O quê fazer

    @Column({ type: "text" })
    why!: string; // Por quê

    @Column({ type: "text" })
    where!: string; // Onde

    @Column({ type: "varchar", length: 255 })
    who!: string; // Quem

    @Column({ type: "varchar", length: 100 })
    when!: string; // Quando

    @Column({ type: "text" })
    how!: string; // Como

    @Column({ type: "varchar", length: 100, default: "R$ 0,00" })
    howMuch!: string; // Quanto custa

    @Column({ type: "varchar", length: 50, default: "a_fazer" })
    status!: "a_fazer" | "fazendo" | "feito" | "stand_by";

    @OneToOne(() => KpiEntry, (entry) => entry.actionPlan, { onDelete: "CASCADE" })
    @JoinColumn({ name: "entryId" })
    entry!: KpiEntry;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}
