import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Sector } from "../entities/Sector";
import { KPI } from "../entities/KPI";
import { KpiEntry } from "../entities/KpiEntry";
import { ActionPlan } from "../entities/ActionPlan";
import { RootCause } from "../entities/RootCause";

async function seed() {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log("🌱 Iniciando seed do banco de dados...");

        // Clear existing data
        await AppDataSource.dropDatabase();
        await AppDataSource.synchronize();

        const userRepository = AppDataSource.getRepository(User);
        const sectorRepository = AppDataSource.getRepository(Sector);
        const kpiRepository = AppDataSource.getRepository(KPI);
        const entryRepository = AppDataSource.getRepository(KpiEntry);
        const actionPlanRepository = AppDataSource.getRepository(ActionPlan);
        const rootCauseRepository = AppDataSource.getRepository(RootCause);

        // Create Users
        const users = await userRepository.save([
            {
                name: "Roberto (CEO)",
                email: "ceo@vorp.com",
                role: "admin",
                avatarInitials: "RO",
            },
            {
                name: "Fernanda (CoS)",
                email: "cos@vorp.com",
                role: "admin",
                avatarInitials: "FE",
            },
            {
                name: "Allef (Líder)",
                email: "allef@vorp.com",
                role: "leader",
                avatarInitials: "AL",
            },
            {
                name: "Lais (Líder)",
                email: "lais@vorp.com",
                role: "leader",
                avatarInitials: "LA",
            },
            {
                name: "Sena (Vendas)",
                email: "sena@vorp.com",
                role: "leader",
                avatarInitials: "SE",
            },
        ]);

        console.log("✅ Usuários criados:", users.length);

        // Create Sectors and KPIs
        const sectors = await sectorRepository.save([
            {
                name: "Comercial - Squad Allef",
                kpis: [],
            },
            {
                name: "Comercial - Squad Lais",
                kpis: [],
            },
            {
                name: "Marketing",
                kpis: [],
            },
            {
                name: "CS (Customer Success)",
                kpis: [],
            },
        ]);

        console.log("✅ Setores criados:", sectors.length);

        // Create KPIs
        const kpiData = [
            {
                sectorId: sectors[0].id,
                kpis: [
                    { name: "MRR Vendido", unit: "currency" as const, format: "R$ " },
                    { name: "Valor de Vendas Recebido", unit: "currency" as const, format: "R$ " },
                    { name: "Reuniões Agendadas", unit: "number" as const, format: "" },
                    { name: "Reuniões Realizadas", unit: "number" as const, format: "" },
                ],
            },
            {
                sectorId: sectors[1].id,
                kpis: [
                    { name: "MRR Vendido", unit: "currency" as const, format: "R$ " },
                    { name: "Reuniões Agendadas", unit: "number" as const, format: "" },
                ],
            },
            {
                sectorId: sectors[2].id,
                kpis: [
                    { name: "Número de Leads", unit: "number" as const, format: "" },
                    { name: "Número de MQL", unit: "number" as const, format: "" },
                    { name: "Valor Recebido (S. Selling)", unit: "currency" as const, format: "R$ " },
                    { name: "Nº Reuniões Agendadas (S. Selling)", unit: "number" as const, format: "" },
                    { name: "Nº Reuniões Realizadas (S. Selling)", unit: "number" as const, format: "" },
                ],
            },
            {
                sectorId: sectors[3].id,
                kpis: [{ name: "% de Revenue Churn", unit: "percent" as const, format: "%" }],
            },
        ];

        for (const sectorKpis of kpiData) {
            for (const kpiData of sectorKpis.kpis) {
                await kpiRepository.save({
                    ...kpiData,
                    sectorId: sectorKpis.sectorId,
                });
            }
        }

        const allKpis = await kpiRepository.find();
        console.log("✅ KPIs criados:", allKpis.length);

        // Create Sample KPI Entry with Action Plan
        if (allKpis.length > 0) {
            const firstKpi = allKpis.find((k) => k.name === "MRR Vendido");
            if (firstKpi) {
                const entry = await entryRepository.save({
                    sectorId: sectors[0].id,
                    kpiId: firstKpi.id,
                    month: "Setembro",
                    week: "Mês Geral",
                    target: 171004.83,
                    realized: 72708.66,
                    gap: -98296.17,
                    gapPercentage: 42.52,
                });

                // Create Root Causes
                const causes = [
                    "Falta de aderência ao processo de prospecção",
                    "Existência de no-shows elevados",
                    "Agendamentos para datas distantes",
                    "Roteiro de qualificação pouco eficiente",
                    "Inconsistência no follow anti-no-show",
                ];

                for (let i = 0; i < causes.length; i++) {
                    await rootCauseRepository.save({
                        entryId: entry.id,
                        cause: causes[i],
                        order: i,
                    });
                }

                // Create Action Plan
                await actionPlanRepository.save({
                    entryId: entry.id,
                    what: "Revisar roteiro e treinar equipe",
                    why: "Aumentar taxa de comparecimento",
                    where: "Time comercial",
                    who: "Sena",
                    when: "Imediato",
                    how: "Role plays e simulações",
                    howMuch: "R$ 0,00",
                    status: "fazendo",
                });

                console.log("✅ Entrada de KPI com plano de ação criada");
            }
        }

        console.log("🎉 Seed concluído com sucesso!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro ao executar seed:", error);
        process.exit(1);
    }
}

seed();
