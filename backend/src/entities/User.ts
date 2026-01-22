import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Sector } from "./Sector";

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

    @Column({ type: "uuid", nullable: true })
    sectorId?: string;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}