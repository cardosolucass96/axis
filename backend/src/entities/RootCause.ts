import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { KpiEntry } from "./KpiEntry";

@Entity("root_causes")
export class RootCause {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    entryId!: string;

    @Column({ type: "text" })
    cause!: string;

    @Column({ type: "int", default: 0 })
    order!: number; // Ordem na lista

    @ManyToOne(() => KpiEntry, (entry) => entry.rootCauses, { onDelete: "CASCADE" })
    @JoinColumn({ name: "entryId" })
    entry!: KpiEntry;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}
