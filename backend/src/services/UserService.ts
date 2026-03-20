import { UserRepository } from "../repositories/UserRepository";
import { User } from "../entities/User";

export class UserService {
    private userRepository = new UserRepository();

    async getAllUsers(): Promise<User[]> {
        return await this.userRepository.findAll();
    }

    async getUserById(id: string): Promise<User | null> {
        return await this.userRepository.findById(id);
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findByEmail(email);
    }

    async createUser(data: {
        name: string;
        email: string;
        role: "admin" | "leader";
        sectorIds?: string[];
    }): Promise<User> {
        // Check if user already exists
        const existing = await this.userRepository.findByEmail(data.email);
        if (existing) {
            throw new Error("Usuário com este email já existe");
        }

        return await this.userRepository.create(data);
    }

    async updateUser(
        id: string,
        data: Partial<User>
    ): Promise<User | null> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        return await this.userRepository.update(id, data);
    }

    async deleteUser(id: string): Promise<boolean> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        return await this.userRepository.delete(id);
    }

    async linkUserToSectors(userId: string, sectorIds: string[]): Promise<User | null> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        return await this.userRepository.update(userId, { sectorIds });
    }

    async getUsersBySector(sectorId: string): Promise<User[]> {
        return await this.userRepository.findBySector(sectorId);
    }
}
