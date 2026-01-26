import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Session } from "./entities/Session";
import { Sector } from "./entities/Sector";
import { KPI } from "./entities/KPI";
import { KpiEntry } from "./entities/KpiEntry";
import { ActionPlan } from "./entities/ActionPlan";
import { RootCause } from "./entities/RootCause";
import { MonthlyTarget } from "./entities/MonthlyTarget";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "axis.db",
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV === "development",
    entities: [User, Session, Sector, KPI, KpiEntry, ActionPlan, RootCause, MonthlyTarget],
    migrations: ["src/database/migrations/*.ts"],
    subscribers: [],
});