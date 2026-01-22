import { AppDataSource } from "../data-source";
import { ActionPlan } from "../entities/ActionPlan";

export class ActionPlanRepository {
    private repository = AppDataSource.getRepository(ActionPlan);

    async findAll(): Promise<ActionPlan[]> {
        return await this.repository.find({
            relations: ["entry"],
        });
    }

    async findById(id: string): Promise<ActionPlan | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ["entry"],
        });
    }

    async findByEntryId(entryId: string): Promise<ActionPlan | null> {
        return await this.repository.findOne({
            where: { entryId },
            relations: ["entry"],
        });
    }

    async findByStatus(status: string): Promise<ActionPlan[]> {
        return await this.repository.find({
            where: { status: status as any },
            relations: ["entry"],
        });
    }

    async create(plan: Partial<ActionPlan>): Promise<ActionPlan> {
        const newPlan = this.repository.create(plan);
        return await this.repository.save(newPlan);
    }

    async update(id: string, plan: Partial<ActionPlan>): Promise<ActionPlan | null> {
        await this.repository.update(id, plan);
        return await this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
