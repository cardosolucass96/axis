import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("session")
export class Session {
    @PrimaryColumn({ type: "varchar", length: 255 })
    id!: string;

    @Column({ type: "varchar", length: 255, name: "user_id" })
    user_id!: string;

    @Column({ type: "integer", name: "expires_at" })
    expires_at!: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;
}
