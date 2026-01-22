import { AppDataSource } from "../data-source";
import { Sector } from "../entities/Sector";

export class SectorRepository {
    private repository = AppDataSource.getRepository(Sector);

    async findAll(): Promise<Sector[]> {
        return await this.repository.find({ relations: ["kpis"] });
    }

    async findById(id: string): Promise<Sector | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ["kpis"],
        });
    }

    async create(sector: Partial<Sector>): Promise<Sector> {
        const newSector = this.repository.create(sector);
        return await this.repository.save(newSector);
    }

    async update(id: string, sector: Partial<Sector>): Promise<Sector | null> {
        await this.repository.update(id, sector);
        return await this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
