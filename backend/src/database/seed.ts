import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Sector } from "../entities/Sector";
import { KPI } from "../entities/KPI";
import { KpiEntry } from "../entities/KpiEntry";
import { ActionPlan } from "../entities/ActionPlan";
import { RootCause } from "../entities/RootCause";
import { MonthlyTarget } from "../entities/MonthlyTarget";
import { authDb } from "../auth/lucia";
import bcryptjs from "bcryptjs";
import { getWeeksForMonth, distributeMonthlyTarget, getNextMonths, getDaysArrayForWeek } from "../utils/weekCalculator";

async function seed() {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log("🌱 Iniciando seed do banco de dados...");

        await AppDataSource.dropDatabase();
        await AppDataSource.synchronize();

        // Recriar tabelas de autenticação
        authDb.exec(`
            CREATE TABLE IF NOT EXISTS user (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'leader',
                avatar_url TEXT,
                google_id TEXT UNIQUE,
                password_hash TEXT,
                email_verified INTEGER DEFAULT 0,
                sector_id TEXT,
                created_at INTEGER DEFAULT (unixepoch()),
                updated_at INTEGER DEFAULT (unixepoch())
            );
            CREATE TABLE IF NOT EXISTS session (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
        `);

        const userRepository = AppDataSource.getRepository(User);
        const sectorRepository = AppDataSource.getRepository(Sector);
        const kpiRepository = AppDataSource.getRepository(KPI);
        const entryRepository = AppDataSource.getRepository(KpiEntry);
        const actionPlanRepository = AppDataSource.getRepository(ActionPlan);
        const rootCauseRepository = AppDataSource.getRepository(RootCause);
        const monthlyTargetRepository = AppDataSource.getRepository(MonthlyTarget);

        // ==========================================
        // 1. CRIAR USUÁRIOS (admins primeiro, sem setor)
        // ==========================================
        const admins = await userRepository.save([
            { name: "Augusto Morais", email: "augusto@grupovorp.com", role: "admin", avatarInitials: "AM" },
            { name: "Pedro Castro", email: "pedro.castro@grupovorp.com", role: "admin", avatarInitials: "PC" },
            { name: "Ricássio Brandão", email: "ricassio.brandao@grupovorp.com", role: "admin", avatarInitials: "RB" },
            { name: "Lucas Cardoso", email: "lucas.cardoso@grupovorp.com", role: "admin", avatarInitials: "LC" },
        ]);

        console.log("✅ Admins criados:", admins.length);

        // ==========================================
        // 2. CRIAR SETORES (oficiais)
        // ==========================================
        const sectors = await sectorRepository.save([
            { name: "Comercial - Squad Allef", kpis: [] },
            { name: "Comercial - Squad Lais", kpis: [] },
            { name: "Marketing", kpis: [] },
            { name: "CS", kpis: [] },
        ]);

        console.log("✅ Setores criados:", sectors.length);

        // ==========================================
        // 3. CRIAR LÍDERES (vinculados aos setores)
        // ==========================================
        const leaders = await userRepository.save([
            { name: "Allef Medina", email: "allef@grupovorp.com", role: "leader", avatarInitials: "AM", sectorId: sectors[0].id },
            { name: "Laís Santiago", email: "lais.ferreira@grupovorp.com", role: "leader", avatarInitials: "LS", sectorId: sectors[1].id },
            { name: "Analu Teixeira", email: "analu@grupovorp.com", role: "leader", avatarInitials: "AT", sectorId: sectors[2].id },
            { name: "Marcos Nunes", email: "marcos.nunes@grupovorp.com", role: "leader", avatarInitials: "MN", sectorId: sectors[3].id },
        ]);

        console.log("✅ Líderes criados:", leaders.length);

        // Criar senhas para todos os usuários
        const users = [...admins, ...leaders];
        const defaultPassword = "Vorp@123";
        const passwordHash = await bcryptjs.hash(defaultPassword, 10);

        for (const user of users) {
            authDb.prepare(`
                INSERT OR REPLACE INTO user (id, email, name, role, avatar_url, password_hash, sector_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(user.id, user.email, user.name, user.role, null, passwordHash, user.sectorId || null, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000));
        }

        console.log("🔐 Senhas padrão criadas (Vorp@123)");

        // ==========================================
        // 4. CRIAR KPIs (oficiais)
        // ==========================================
        const kpiConfigs = [
            // Comercial - Squad Allef
            { sectorId: sectors[0].id, name: "MRR Vendido", unit: "currency" as const, format: "R$ ", isInverse: false },
            { sectorId: sectors[0].id, name: "Valor de Vendas Recebido", unit: "currency" as const, format: "R$ ", isInverse: false },
            { sectorId: sectors[0].id, name: "Reuniões Agendadas", unit: "number" as const, format: "", isInverse: false },
            { sectorId: sectors[0].id, name: "Reuniões Realizadas", unit: "number" as const, format: "", isInverse: false },
            
            // Comercial - Squad Lais
            { sectorId: sectors[1].id, name: "MRR Vendido", unit: "currency" as const, format: "R$ ", isInverse: false },
            { sectorId: sectors[1].id, name: "Valor de Vendas Recebido", unit: "currency" as const, format: "R$ ", isInverse: false },
            { sectorId: sectors[1].id, name: "Reuniões Agendadas", unit: "number" as const, format: "", isInverse: false },
            { sectorId: sectors[1].id, name: "Reuniões Realizadas", unit: "number" as const, format: "", isInverse: false },
            
            // Marketing
            { sectorId: sectors[2].id, name: "Número de Leads", unit: "number" as const, format: "", isInverse: false },
            { sectorId: sectors[2].id, name: "Número de MQL", unit: "number" as const, format: "", isInverse: false },
            { sectorId: sectors[2].id, name: "Valor Recebido (S. Selling)", unit: "currency" as const, format: "R$ ", isInverse: false },
            { sectorId: sectors[2].id, name: "Reuniões Agendadas (S. Selling)", unit: "number" as const, format: "", isInverse: false },
            { sectorId: sectors[2].id, name: "Reuniões Realizadas (S. Selling)", unit: "number" as const, format: "", isInverse: false },
            
            // CS
            { sectorId: sectors[3].id, name: "Revenue Churn", unit: "currency" as const, format: "R$ ", isInverse: true },
        ];

        const kpis: KPI[] = [];
        for (const kpiData of kpiConfigs) {
            const kpi = await kpiRepository.save(kpiData);
            kpis.push(kpi);
        }

        console.log("✅ KPIs criados:", kpis.length);

        // ==========================================
        // 5. METAS E ENTRIES PARA 6 MESES (3 passados + atual + 2 futuros)
        // ==========================================

        // Gera meses: 3 anteriores ao atual + 3 a partir do atual (inclui o atual)
        function getMonthsWindow(pastCount: number, futureCount: number): { month: string; year: number; isPast: boolean; isCurrent: boolean }[] {
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const today = new Date();
            const result = [];
            for (let i = -pastCount; i <= futureCount; i++) {
                const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
                result.push({
                    month: monthNames[d.getMonth()],
                    year: d.getFullYear(),
                    isPast: i < 0,
                    isCurrent: i === 0,
                });
            }
            return result;
        }

        const allMonths = getMonthsWindow(3, 2); // 3 passados + atual + 2 futuros = 6 total
        console.log("📅 Meses a serem populados:", allMonths.map(m => `${m.month}/${m.year}${m.isPast ? ' (passado)' : m.isCurrent ? ' (atual)' : ' (futuro)'}`).join(", "));

        const monthlyTargetConfigs: Record<string, number> = {
            // Comercial (ambos squads)
            "MRR Vendido": 200000,
            "Valor de Vendas Recebido": 180000,
            "Reuniões Agendadas": 80,
            "Reuniões Realizadas": 60,
            
            // Marketing
            "Número de Leads": 500,
            "Número de MQL": 200,
            "Valor Recebido (S. Selling)": 50000,
            "Reuniões Agendadas (S. Selling)": 40,
            "Reuniões Realizadas (S. Selling)": 30,
            
            // CS
            "Revenue Churn": 10000,
        };

        // Responsáveis por setor (usa os líderes criados)
        const sectorLeaders: Record<string, string> = {};
        for (const leader of leaders) {
            if (leader.sectorId) {
                sectorLeaders[leader.sectorId] = leader.name;
            }
        }

        let entriesCreated = 0;
        let dailyEntriesCreated = 0;
        let monthlyTargetsCreated = 0;
        let actionPlansCreated = 0;

        const now = new Date();

        for (const kpi of kpis) {
            const baseTarget = monthlyTargetConfigs[kpi.name] || 100;

            for (const monthMeta of allMonths) {
                const { month, year, isPast, isCurrent } = monthMeta;
                const monthVariation = 1 + (Math.random() * 0.2 - 0.1);
                const monthlyTarget = Math.round(baseTarget * monthVariation * 100) / 100;

                await monthlyTargetRepository.save({
                    sectorId: kpi.sectorId,
                    kpiId: kpi.id,
                    month,
                    target: monthlyTarget,
                });
                monthlyTargetsCreated++;

                const weeks = getWeeksForMonth(month, year);
                const weeklyTargets = distributeMonthlyTarget(monthlyTarget, month, year, kpi.unit);

                // Determinar semanas já concluídas
                let completedWeeks = 0;
                if (isPast) {
                    // Mês passado: todas as semanas concluídas
                    completedWeeks = weeks.length;
                } else if (isCurrent) {
                    // Mês atual: semanas cujo último dia já passou
                    const currentDay = now.getDate();
                    for (let i = 0; i < weeks.length; i++) {
                        const match = weeks[i].match(/\((\d+)-(\d+)\)/);
                        if (match) {
                            const endDay = parseInt(match[2]);
                            if (currentDay > endDay) completedWeeks++;
                        }
                    }
                }
                // mês futuro: completedWeeks = 0 (nada preenchido)

                for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
                    const week = weeks[weekIdx];
                    const weekTarget = weeklyTargets[week] || monthlyTarget / weeks.length;
                    
                    let realized: number | null = null; // null = não preenchido
                    let isCompleted = false;

                    if (weekIdx < completedWeeks) {
                        isCompleted = true;
                        const performanceVariation = 0.7 + Math.random() * 0.6;
                        realized = Math.round(weekTarget * performanceVariation * 100) / 100;
                        
                        if (kpi.isInverse) {
                            realized = Math.round(weekTarget * (0.5 + Math.random() * 0.7) * 100) / 100;
                        }
                    }

                    // Para cálculo de GAP, usar 0 se realized for null
                    const realizedForGap = realized ?? 0;
                    let gap: number;
                    let gapPercentage: number;

                    if (kpi.isInverse) {
                        gap = Math.round((weekTarget - realizedForGap) * 100) / 100;
                        gapPercentage = weekTarget !== 0 ? Math.round(((weekTarget - realizedForGap) / weekTarget + 1) * 10000) / 100 : 0;
                    } else {
                        gap = Math.round((realizedForGap - weekTarget) * 100) / 100;
                        gapPercentage = weekTarget !== 0 ? Math.round((realizedForGap / weekTarget) * 10000) / 100 : 0;
                    }

                    const entry = await entryRepository.save({
                        sectorId: kpi.sectorId,
                        kpiId: kpi.id,
                        month,
                        week,
                        target: weekTarget,
                        realized,
                        gap,
                        gapPercentage,
                        isCompleted,
                    });
                    entriesCreated++;

                    // Criar entradas diárias para semanas concluídas
                    if (isCompleted && realized !== null) {
                        const days = getDaysArrayForWeek(week);
                        const daysCount = days.length;
                        let remainingRealized = realized;

                        for (let di = 0; di < days.length; di++) {
                            const day = days[di];
                            const isLastDay = di === days.length - 1;

                            let dayRealized: number;
                            if (isLastDay) {
                                // último dia absorve o restante (garante soma correta)
                                dayRealized = Math.max(0, Math.round(remainingRealized * 100) / 100);
                            } else {
                                // variação por dia: 40% a 160% da cota diária igual
                                const variation = 0.4 + Math.random() * 1.2;
                                dayRealized = Math.round((realized / daysCount) * variation * 100) / 100;
                                remainingRealized -= dayRealized;
                            }

                            const dayTarget = Math.round((weekTarget / daysCount) * 100) / 100;

                            let dayGap: number;
                            let dayGapPercentage: number;
                            if (kpi.isInverse) {
                                dayGap = Math.round((dayTarget - dayRealized) * 100) / 100;
                                dayGapPercentage = dayTarget !== 0 ? Math.round(((dayTarget - dayRealized) / dayTarget + 1) * 10000) / 100 : 0;
                            } else {
                                dayGap = Math.round((dayRealized - dayTarget) * 100) / 100;
                                dayGapPercentage = dayTarget !== 0 ? Math.round((dayRealized / dayTarget) * 10000) / 100 : 0;
                            }

                            await entryRepository.save({
                                sectorId: kpi.sectorId,
                                kpiId: kpi.id,
                                month,
                                week,
                                day,
                                target: dayTarget,
                                realized: dayRealized,
                                gap: dayGap,
                                gapPercentage: dayGapPercentage,
                                isCompleted: true,
                            });
                            dailyEntriesCreated++;
                        }
                    }

                    // Criar plano de ação para entries com GAP negativo
                    const needsActionPlan = kpi.isInverse 
                        ? gap < 0 && Math.abs(gap) > weekTarget * 0.1
                        : gap < 0 && Math.abs(gap) > weekTarget * 0.15;

                    if (isCompleted && needsActionPlan) {
                        const rootCauses = [
                            "Volume insuficiente de leads qualificados",
                            "Taxa de conversão abaixo do esperado",
                            "Processo de vendas não otimizado",
                            "Capacitação da equipe insuficiente",
                            "Ferramentas de trabalho inadequadas"
                        ];
                        
                        for (let i = 0; i < rootCauses.length; i++) {
                            await rootCauseRepository.save({
                                entryId: entry.id,
                                cause: rootCauses[i],
                                order: i,
                            });
                        }

                        const leader = sectorLeaders[kpi.sectorId] || "Gestor";
                        await actionPlanRepository.save({
                            entryId: entry.id,
                            what: "Implementar melhorias no processo",
                            why: "Atingir meta estabelecida",
                            where: "Setor responsável",
                            who: leader,
                            when: "Próximas 2 semanas",
                            how: "Análise de métricas e ajustes",
                            howMuch: "R$ 2.000,00",
                            status: ["a_fazer", "fazendo", "feito", "stand_by"][Math.floor(Math.random() * 4)] as any,
                        });
                        actionPlansCreated++;
                    }
                }
            }
        }

        console.log("✅ Metas mensais criadas:", monthlyTargetsCreated);
        console.log("✅ Entries semanais criadas:", entriesCreated);
        console.log("✅ Entries diárias criadas:", dailyEntriesCreated);
        console.log("✅ Planos de ação criados:", actionPlansCreated);

        console.log("\n" + "=".repeat(50));
        console.log("📊 RESUMO DO SEED");
        console.log("=".repeat(50));
        console.log(`👤 Usuários: ${users.length}`);
        console.log(`🏢 Setores: ${sectors.length}`);
        console.log(`📈 KPIs: ${kpis.length} (${kpis.filter(k => k.isInverse).length} de teto)`);
        console.log(`🎯 Metas Mensais: ${monthlyTargetsCreated}`);
        console.log(`📝 Entries Semanais: ${entriesCreated}`);
        console.log(`📅 Entries Diárias: ${dailyEntriesCreated}`);
        console.log(`📋 Planos de Ação: ${actionPlansCreated}`);
        console.log("=".repeat(50));
        console.log("\n🔐 Login: qualquer email @grupovorp.com");
        console.log("🔐 Senha: Vorp@123");
        console.log("\n✅ Seed concluído com sucesso!\n");

    } catch (error) {
        console.error("❌ Erro durante o seed:", error);
        throw error;
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        process.exit(0);
    }
}

seed();
