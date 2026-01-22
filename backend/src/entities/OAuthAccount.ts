import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("oauth_accounts")
export class OAuthAccount {
    @PrimaryColumn({ type: "varchar", length: 50 })
    providerId!: string;

    @PrimaryColumn({ type: "varchar", length: 255 })
    providerUserId!: string;

    @Column({ type: "varchar", length: 255 })
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;
}
