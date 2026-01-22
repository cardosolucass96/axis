import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Sector } from "./entities/Sector";
import { KPI } from "./entities/KPI";
import { KpiEntry } from "./entities/KpiEntry";
import { ActionPlan } from "./entities/ActionPlan";
import { RootCause } from "./entities/RootCause";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "axis.db",
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV === "development",
    entities: [User, Sector, KPI, KpiEntry, ActionPlan, RootCause],
    migrations: ["src/database/migrations/*.ts"],
    subscribers: [],
});