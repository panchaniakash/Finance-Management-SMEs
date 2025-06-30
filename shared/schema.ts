import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  companyName: varchar("company_name"),
  kycStatus: varchar("kyc_status").default("pending"), // pending, verified, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loan applications
export const loanApplications = pgTable("loan_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  tenure: integer("tenure").notNull(), // in months
  purpose: varchar("purpose").notNull(),
  status: varchar("status").default("draft"), // draft, submitted, approved, rejected, disbursed
  currentStep: integer("current_step").default(1),
  documents: jsonb("documents").default([]), // array of document URLs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  clientName: varchar("client_name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status").default("pending"), // pending, paid, overdue
  dueDate: date("due_date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// UPI Payments
export const upiPayments = pgTable("upi_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  paymentLink: text("payment_link"),
  qrCode: text("qr_code"),
  status: varchar("status").default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// GST Filings
export const gstFilings = pgTable("gst_filings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  filingType: varchar("filing_type").notNull(), // GSTR-1, GSTR-3B, TDS, etc.
  period: varchar("period").notNull(), // 2024-03
  dueDate: date("due_date").notNull(),
  status: varchar("status").default("pending"), // pending, filed, overdue
  filedAt: timestamp("filed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// KYC Documents
export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentType: varchar("document_type").notNull(), // pan, address_proof, bank_statement
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  loanApplications: many(loanApplications),
  invoices: many(invoices),
  upiPayments: many(upiPayments),
  gstFilings: many(gstFilings),
  kycDocuments: many(kycDocuments),
}));

export const loanApplicationsRelations = relations(loanApplications, ({ one }) => ({
  user: one(users, {
    fields: [loanApplications.userId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  upiPayments: many(upiPayments),
}));

export const upiPaymentsRelations = relations(upiPayments, ({ one }) => ({
  user: one(users, {
    fields: [upiPayments.userId],
    references: [users.id],
  }),
  invoice: one(invoices, {
    fields: [upiPayments.invoiceId],
    references: [invoices.id],
  }),
}));

export const gstFilingsRelations = relations(gstFilings, ({ one }) => ({
  user: one(users, {
    fields: [gstFilings.userId],
    references: [users.id],
  }),
}));

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  user: one(users, {
    fields: [kycDocuments.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertLoanApplicationSchema = createInsertSchema(loanApplications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUpiPaymentSchema = createInsertSchema(upiPayments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGstFilingSchema = createInsertSchema(gstFilings).omit({ id: true, createdAt: true });
export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
export type LoanApplication = typeof loanApplications.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertUpiPayment = z.infer<typeof insertUpiPaymentSchema>;
export type UpiPayment = typeof upiPayments.$inferSelect;
export type InsertGstFiling = z.infer<typeof insertGstFilingSchema>;
export type GstFiling = typeof gstFilings.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;
