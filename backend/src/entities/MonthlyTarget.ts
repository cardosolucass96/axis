import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Sector } from './Sector';
import { KPI } from './KPI';

@Entity('monthly_targets')
export class MonthlyTarget {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('varchar')
    sectorId!: string;

    @Column('varchar')
    kpiId!: string;

    @Column('varchar')
    month!: string; // e.g., "Janeiro", "Fevereiro"

    @Column('decimal', { precision: 15, scale: 2 })
    target!: number;

    @ManyToOne(() => Sector, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sectorId' })
    sector?: Sector;

    @ManyToOne(() => KPI, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'kpiId' })
    kpi?: KPI;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
