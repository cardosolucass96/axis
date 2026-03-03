import { AppDataSource } from "../data-source.js";

async function runMigrations() {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("✅ Banco de dados conectado!");
        }

        console.log("⏳ Executando migrações...");
        await AppDataSource.runMigrations();
        console.log("✅ Migrações executadas com sucesso!");

        await AppDataSource.destroy();
        process.exit(0);
    } catch (err: any) {
        console.error("❌ Erro ao executar migrações:", err?.message || err);
        process.exit(1);
    }
}

runMigrations();
