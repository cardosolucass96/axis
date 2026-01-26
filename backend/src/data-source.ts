import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User.js";
import { Session } from "./entities/Session.js";
import { Sector } from "./entities/Sector.js";
import { KPI } from "./entities/KPI.js";
import { KpiEntry } from "./entities/KpiEntry.js";
import { ActionPlan } from "./entities/ActionPlan.js";
import { RootCause } from "./entities/RootCause.js";
import { MonthlyTarget } from "./entities/MonthlyTarget.js";

// Database path - use /app/data in production for Docker volume
const databasePath = process.env.NODE_ENV === "production" 
    ? "/app/data/axis.db" 
    : "axis.db";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: databasePath,
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV === "development",
    entities: [User, Session, Sector, KPI, KpiEntry, ActionPlan, RootCause, MonthlyTarget],
    migrations: ["src/database/migrations/*.ts"],
    subscribers: [],
});