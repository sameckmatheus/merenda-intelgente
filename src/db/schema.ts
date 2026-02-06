
import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "school_responsible", "nutritionist"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
export const helpRequestStatusEnum = pgEnum("help_request_status", ["open", "in_progress", "resolved", "declined", "cancelled"]);
export const helpRequestPriorityEnum = pgEnum("help_request_priority", ["low", "medium", "high"]);
export const helpRequestResolutionTypeEnum = pgEnum("help_request_resolution_type", ["local", "central"]);
export const submissionStatusEnum = pgEnum("submission_status", ["pendente", "atendido", "atendido_parcialmente", "recusado"]);

export const users = pgTable("users", {
    id: text("id").primaryKey(), // We'll keep using string IDs (UUIDs)
    uid: text("uid").unique(), // Firebase Auth UID
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    role: userRoleEnum("role").notNull().default("school_responsible"),
    schoolId: text("school_id"), // Foreign key to schools.id (optional if admin)
    phone: text("phone"),
    createdAt: timestamp("created_at").defaultNow(),
    status: userStatusEnum("status").default("active"),
});

export const schools = pgTable("schools", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    totalStudents: jsonb("total_students").$type<{
        morning: number;
        afternoon: number;
        night: number;
    }>().notNull(),
    contacts: jsonb("contacts").$type<{
        email: string;
        whatsapp: string;
    }>().notNull(),
    responsibleIds: text("responsible_ids").array(),
    inventory: jsonb("inventory"), // added inventory
    categories: jsonb("categories"), // added categories override per school if needed, or if stored here
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const helpRequests = pgTable("help_requests", {
    id: text("id").primaryKey(),
    protocol: text("protocol").notNull(),
    schoolId: text("school_id").notNull(),
    schoolName: text("school_name").notNull(),
    description: text("description").notNull(),
    status: helpRequestStatusEnum("status").notNull().default("open"),
    resolutionType: helpRequestResolutionTypeEnum("resolution_type"),
    resolutionNotes: text("resolution_notes"),
    priority: helpRequestPriorityEnum("priority").default("low"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
});

export const submissions = pgTable("submissions", {
    id: text("id").primaryKey(),
    respondentName: text("respondent_name").notNull(),
    school: text("school").notNull(),
    date: timestamp("date").notNull(),
    shift: text("shift").notNull(),
    menuType: text("menu_type").notNull(),
    totalStudents: integer("total_students").notNull(),
    presentStudents: integer("present_students").notNull(),
    helpNeeded: boolean("help_needed").notNull(),
    description: text("description"),
    itemsPurchased: boolean("items_purchased"),
    status: submissionStatusEnum("status").default("pendente"),
    alternativeMenuDescription: text("alternative_menu_description"),
    missingItems: text("missing_items"),
    canBuyMissingItems: boolean("can_buy_missing_items"),
    suppliesReceived: boolean("supplies_received"),
    suppliesDescription: text("supplies_description"),
    observations: text("observations"),
    helpRequestId: text("help_request_id"),
    menuAdaptationReason: text("menu_adaptation_reason"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
    id: text("id").primaryKey(), // 'general'
    data: jsonb("data").notNull(), // Stores arbitrary settings
    updatedAt: timestamp("updated_at").defaultNow(),
    updatedBy: text("updated_by"),
});
