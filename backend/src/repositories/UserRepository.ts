import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

export class UserRepository {
    private repository = AppDataSource.getRepository(User);

    async findAll(): Promise<User[]> {
        return await this.repository.find();
    }

    async findById(id: string): Promise<User | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOne({ where: { email } });
    }

    async create(user: Partial<User>): Promise<User> {
        const initials = user.name?.substring(0, 2).toUpperCase() || "US";
        const newUser = this.repository.create({
            ...user,
            avatarInitials: initials,
        });
        return await this.repository.save(newUser);
    }

    async update(id: string, user: Partial<User>): Promise<User | null> {
        await this.repository.update(id, user);
        return await this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }

    async findBySector(sectorId: string): Promise<User[]> {
        // sectorIds é armazenado como JSON array no campo sectorId
        // Busca usuários que contêm o sectorId no array
        const allUsers = await this.repository.find();
        return allUsers.filter(u => u.sectorIds && u.sectorIds.includes(sectorId));
    }
}
