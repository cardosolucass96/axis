import { AppDataSource } from "../data-source";
import { Sector } from "../entities/Sector";

export class SectorRepository {
    private repository = AppDataSource.getRepository(Sector);

    async findAll(): Promise<Sector[]> {
        return await this.repository
            .createQueryBuilder("sector")
            .leftJoinAndSelect("sector.kpis", "kpi")
            .orderBy("sector.name", "ASC")
            .addOrderBy("COALESCE(kpi.sort_order, 0)", "ASC")
            .addOrderBy("kpi.createdAt", "ASC")
            .getMany();
    }

    async findById(id: string): Promise<Sector | null> {
        return await this.repository
            .createQueryBuilder("sector")
            .leftJoinAndSelect("sector.kpis", "kpi")
            .where("sector.id = :id", { id })
            .orderBy("COALESCE(kpi.sort_order, 0)", "ASC")
            .addOrderBy("kpi.createdAt", "ASC")
            .getOne();
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
