import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Sector } from "./Sector";

// Transformer para converter string[] <-> JSON string no SQLite
// Também lida com migração de dados antigos (UUID simples -> array)
const sectorIdsTransformer = {
    to(value: string[] | undefined | null): string | null {
        if (!value || value.length === 0) return null;
        return JSON.stringify(value);
    },
    from(value: string | null | undefined): string[] {
        if (!value) return [];
        // Backward compat: se for um UUID simples (sem [), converte para array
        if (!value.startsWith("[")) return [value];
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return value ? [value] : [];
        }
    }
};

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    email!: string;

    @Column({ type: "varchar", length: 10, default: "leader" })
    role!: "admin" | "leader";

    @Column({ type: "varchar", length: 50, nullable: true })
    avatarInitials?: string;

    @Column({ name: "sectorId", type: "text", nullable: true, transformer: sectorIdsTransformer })
    sectorIds!: string[];

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}