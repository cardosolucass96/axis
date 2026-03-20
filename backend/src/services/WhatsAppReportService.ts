import { AppDataSource } from "../data-source.js";
import { Sector } from "../entities/Sector.js";
import { KPI } from "../entities/KPI.js";
import { KpiEntry } from "../entities/KpiEntry.js";
import { User } from "../entities/User.js";
import { getWeeksForMonth } from "../utils/weekCalculator.js";

// Configuração da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://evolution-api.grupovorp.com";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "vorpbot";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const WHATSAPP_REPORT_NUMBER = process.env.WHATSAPP_REPORT_NUMBER || "558596843129";

const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getCurrentMonth(): string {
    return monthNames[new Date().getMonth()];
}

function getCurrentWeek(month: string): string | null {
    const now = new Date();
    const currentDay = now.getDate();
    const weeks = getWeeksForMonth(month, now.getFullYear());

    for (const week of weeks) {
        const match = week.match(/\((\d+)-(\d+)\)/);
        if (match) {
            const start = parseInt(match[1]);
            const end = parseInt(match[2]);
            if (currentDay >= start && currentDay <= end) return week;
        }
    }
    return weeks.length > 0 ? weeks[weeks.length - 1] : null;
}

function formatNumber(value: number, format: string, unit: string): string {
    if (unit === "percent") return `${value.toFixed(1)}%`;
    if (unit === "currency") return `${format}${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${format}${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

export async function generateDailyReport(): Promise<string> {
    const month = getCurrentMonth();
    const week = getCurrentWeek(month);

    const sectorRepo = AppDataSource.getRepository(Sector);
    const entryRepo = AppDataSource.getRepository(KpiEntry);
    const userRepo = AppDataSource.getRepository(User);

    const sectors = await sectorRepo.find({ relations: ["kpis"] });
    const users = await userRepo.find();

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${String(yesterday.getDate()).padStart(2, "0")}/${String(yesterday.getMonth() + 1).padStart(2, "0")}/${yesterday.getFullYear()}`;
    const todayStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    let report = `📊 *RELATÓRIO DIÁRIO AXIS*\n`;
    report += `📅 Preenchimento referente a *${yesterdayStr}*\n`;
    report += `${month}${week ? ` • ${week}` : ""}\n`;
    report += `\nVerifique se os KPIs de ontem foram preenchidos.\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    let totalKpis = 0;
    let totalPreenchidos = 0;
    let totalNoAlvo = 0;
    let totalAbaixo = 0;

    for (const sector of sectors) {
        // Encontrar líderes do setor
        const sectorLeaders = users.filter(u => {
            if (!u.sectorIds || u.sectorIds.length === 0) return false;
            return u.sectorIds.includes(sector.id);
        });
        const leaderNames = sectorLeaders.map(u => u.name.split(" ")[0]).join(", ") || "Sem líder";

        // Buscar entries semanais (day=null) da semana atual
        let entries: KpiEntry[] = [];
        if (week) {
            entries = await entryRepo.find({
                where: { sectorId: sector.id, month, week, day: undefined }
            });
            // Filtrar apenas entries com day IS NULL (semanais)
            entries = entries.filter(e => e.day === null || e.day === undefined);
        }

        const kpis = sector.kpis || [];
        if (kpis.length === 0) continue;

        report += `🏢 *${sector.name}*\n`;
        report += `👤 ${leaderNames}\n`;

        let sectorPreenchidos = 0;
        let sectorTotal = kpis.length;

        for (const kpi of kpis) {
            totalKpis++;
            const entry = entries.find(e => e.kpiId === kpi.id);
            const hasRealized = entry && entry.realized !== null && entry.realized !== undefined;

            if (hasRealized) {
                sectorPreenchidos++;
                totalPreenchidos++;

                const target = Number(entry.target) || 0;
                const realized = Number(entry.realized) || 0;
                const gap = Number(entry.gap) || 0;
                const gapPct = Number(entry.gapPercentage) || 0;

                const isOk = gap >= 0;
                if (isOk) totalNoAlvo++;
                else totalAbaixo++;

                const icon = isOk ? "✅" : "🔴";
                report += `  ${icon} ${kpi.name}: ${formatNumber(realized, kpi.format, kpi.unit)}`;
                report += ` (meta: ${formatNumber(target, kpi.format, kpi.unit)})`;
                report += ` → ${gapPct.toFixed(0)}%\n`;
            } else {
                report += `  ⬜ ${kpi.name}: _não preenchido_\n`;
            }
        }

        const pct = sectorTotal > 0 ? Math.round((sectorPreenchidos / sectorTotal) * 100) : 0;
        report += `  📋 Preenchimento: ${sectorPreenchidos}/${sectorTotal} (${pct}%)\n\n`;
    }

    // Resumo geral
    report += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📈 *RESUMO GERAL*\n`;
    const totalPct = totalKpis > 0 ? Math.round((totalPreenchidos / totalKpis) * 100) : 0;
    report += `• KPIs preenchidos: ${totalPreenchidos}/${totalKpis} (${totalPct}%)\n`;
    report += `• No alvo: ${totalNoAlvo} ✅\n`;
    report += `• Abaixo: ${totalAbaixo} 🔴\n`;
    report += `• Pendentes: ${totalKpis - totalPreenchidos} ⬜\n`;

    return report;
}

export async function sendWhatsAppMessage(message: string, number?: string): Promise<boolean> {
    const phone = number || WHATSAPP_REPORT_NUMBER;

    if (!EVOLUTION_API_KEY) {
        console.error("❌ EVOLUTION_API_KEY não configurada. Relatório não enviado.");
        return false;
    }

    try {
        const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
                number: phone,
                text: message,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erro ao enviar WhatsApp (${response.status}):`, errorText);
            return false;
        }

        console.log(`✅ Relatório enviado via WhatsApp para ${phone}`);
        return true;
    } catch (error) {
        console.error("❌ Erro ao enviar mensagem WhatsApp:", error);
        return false;
    }
}

export async function sendDailyReport(): Promise<void> {
    try {
        console.log("📊 Gerando relatório diário...");
        const report = await generateDailyReport();
        console.log("📤 Enviando relatório via WhatsApp...");
        await sendWhatsAppMessage(report);
    } catch (error) {
        console.error("❌ Erro ao gerar/enviar relatório diário:", error);
    }
}
