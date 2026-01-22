import { SectorRepository } from "../repositories/SectorRepository";
import { Sector } from "../entities/Sector";

export class SectorService {
    private sectorRepository = new SectorRepository();

    async getAllSectors(): Promise<Sector[]> {
        return await this.sectorRepository.findAll();
    }

    async getSectorById(id: string): Promise<Sector | null> {
        return await this.sectorRepository.findById(id);
    }

    async createSector(name: string): Promise<Sector> {
        // Check if sector already exists
        const allSectors = await this.sectorRepository.findAll();
        if (allSectors.some((s) => s.name === name)) {
            throw new Error("Setor com este nome já existe");
        }

        return await this.sectorRepository.create({
            name,
            kpis: [],
        });
    }

    async updateSector(id: string, name: string): Promise<Sector | null> {
        const sector = await this.sectorRepository.findById(id);
        if (!sector) {
            throw new Error("Setor não encontrado");
        }

        return await this.sectorRepository.update(id, { name });
    }

    async deleteSector(id: string): Promise<boolean> {
        const sector = await this.sectorRepository.findById(id);
        if (!sector) {
            throw new Error("Setor não encontrado");
        }

        return await this.sectorRepository.delete(id);
    }
}
