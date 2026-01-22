import { AppDataSource } from "../data-source";
import { RootCause } from "../entities/RootCause";

export class RootCauseRepository {
    private repository = AppDataSource.getRepository(RootCause);

    async findAll(): Promise<RootCause[]> {
        return await this.repository.find({
            relations: ["entry"],
        });
    }

    async findById(id: string): Promise<RootCause | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ["entry"],
        });
    }

    async findByEntryId(entryId: string): Promise<RootCause[]> {
        return await this.repository.find({
            where: { entryId },
            order: { order: "ASC" },
        });
    }

    async create(cause: Partial<RootCause>): Promise<RootCause> {
        const newCause = this.repository.create(cause);
        return await this.repository.save(newCause);
    }

    async update(id: string, cause: Partial<RootCause>): Promise<RootCause | null> {
        await this.repository.update(id, cause);
        return await this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }

    async deleteByEntryId(entryId: string): Promise<boolean> {
        const result = await this.repository.delete({ entryId: entryId as any });
        return (result.affected ?? 0) > 0;
    }
}
