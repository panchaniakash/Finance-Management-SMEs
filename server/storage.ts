import {
  users,
  loanApplications,
  invoices,
  upiPayments,
  gstFilings,
  kycDocuments,
  type User,
  type UpsertUser,
  type InsertLoanApplication,
  type LoanApplication,
  type InsertInvoice,
  type Invoice,
  type InsertUpiPayment,
  type UpiPayment,
  type InsertGstFiling,
  type GstFiling,
  type InsertKycDocument,
  type KycDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Loan application operations
  createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication>;
  getLoanApplicationsByUser(userId: string): Promise<LoanApplication[]>;
  updateLoanApplication(id: number, application: Partial<InsertLoanApplication>): Promise<LoanApplication>;
  getLoanApplication(id: number): Promise<LoanApplication | undefined>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByUser(userId: string, filters?: { status?: string; search?: string }): Promise<Invoice[]>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<void>;
  
  // UPI Payment operations
  createUpiPayment(payment: InsertUpiPayment): Promise<UpiPayment>;
  getUpiPaymentsByUser(userId: string): Promise<UpiPayment[]>;
  updateUpiPayment(id: number, payment: Partial<InsertUpiPayment>): Promise<UpiPayment>;
  
  // GST Filing operations
  createGstFiling(filing: InsertGstFiling): Promise<GstFiling>;
  getGstFilingsByUser(userId: string): Promise<GstFiling[]>;
  updateGstFiling(id: number, filing: Partial<InsertGstFiling>): Promise<GstFiling>;
  
  // KYC Document operations
  createKycDocument(document: InsertKycDocument): Promise<KycDocument>;
  getKycDocumentsByUser(userId: string): Promise<KycDocument[]>;
  updateKycDocument(id: number, document: Partial<InsertKycDocument>): Promise<KycDocument>;
  
  // Dashboard metrics
  getDashboardMetrics(userId: string): Promise<{
    totalRevenue: number;
    activeLoans: number;
    pendingInvoices: number;
    overdueInvoices: number;
    upcomingGstFilings: GstFiling[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Loan application operations
  async createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication> {
    const [loanApp] = await db
      .insert(loanApplications)
      .values(application)
      .returning();
    return loanApp;
  }

  async getLoanApplicationsByUser(userId: string): Promise<LoanApplication[]> {
    return await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.userId, userId))
      .orderBy(desc(loanApplications.createdAt));
  }

  async updateLoanApplication(id: number, application: Partial<InsertLoanApplication>): Promise<LoanApplication> {
    const [updated] = await db
      .update(loanApplications)
      .set({ ...application, updatedAt: new Date() })
      .where(eq(loanApplications.id, id))
      .returning();
    return updated;
  }

  async getLoanApplication(id: number): Promise<LoanApplication | undefined> {
    const [application] = await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.id, id));
    return application;
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getInvoicesByUser(userId: string, filters?: { status?: string; search?: string }): Promise<Invoice[]> {
    let whereConditions = [eq(invoices.userId, userId)];

    if (filters?.status && filters.status !== "all") {
      whereConditions.push(eq(invoices.status, filters.status));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          ilike(invoices.invoiceNumber, `%${filters.search}%`),
          ilike(invoices.clientName, `%${filters.search}%`)
        )!
      );
    }

    return await db
      .select()
      .from(invoices)
      .where(and(...whereConditions))
      .orderBy(desc(invoices.createdAt));
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  // UPI Payment operations
  async createUpiPayment(payment: InsertUpiPayment): Promise<UpiPayment> {
    const [newPayment] = await db
      .insert(upiPayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getUpiPaymentsByUser(userId: string): Promise<UpiPayment[]> {
    return await db
      .select()
      .from(upiPayments)
      .where(eq(upiPayments.userId, userId))
      .orderBy(desc(upiPayments.createdAt));
  }

  async updateUpiPayment(id: number, payment: Partial<InsertUpiPayment>): Promise<UpiPayment> {
    const [updated] = await db
      .update(upiPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(upiPayments.id, id))
      .returning();
    return updated;
  }

  // GST Filing operations
  async createGstFiling(filing: InsertGstFiling): Promise<GstFiling> {
    const [newFiling] = await db
      .insert(gstFilings)
      .values(filing)
      .returning();
    return newFiling;
  }

  async getGstFilingsByUser(userId: string): Promise<GstFiling[]> {
    return await db
      .select()
      .from(gstFilings)
      .where(eq(gstFilings.userId, userId))
      .orderBy(desc(gstFilings.dueDate));
  }

  async updateGstFiling(id: number, filing: Partial<InsertGstFiling>): Promise<GstFiling> {
    const [updated] = await db
      .update(gstFilings)
      .set(filing)
      .where(eq(gstFilings.id, id))
      .returning();
    return updated;
  }

  // KYC Document operations
  async createKycDocument(document: InsertKycDocument): Promise<KycDocument> {
    const [newDocument] = await db
      .insert(kycDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async getKycDocumentsByUser(userId: string): Promise<KycDocument[]> {
    return await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.userId, userId))
      .orderBy(desc(kycDocuments.createdAt));
  }

  async updateKycDocument(id: number, document: Partial<InsertKycDocument>): Promise<KycDocument> {
    const [updated] = await db
      .update(kycDocuments)
      .set(document)
      .where(eq(kycDocuments.id, id))
      .returning();
    return updated;
  }

  // Dashboard metrics
  async getDashboardMetrics(userId: string): Promise<{
    totalRevenue: number;
    activeLoans: number;
    pendingInvoices: number;
    overdueInvoices: number;
    upcomingGstFilings: GstFiling[];
  }> {
    // Get total revenue from paid invoices
    const paidInvoices = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "paid")));

    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);

    // Get active loans count
    const activeLoansResult = await db
      .select()
      .from(loanApplications)
      .where(and(eq(loanApplications.userId, userId), eq(loanApplications.status, "disbursed")));
    const activeLoans = activeLoansResult.length;

    // Get pending invoices count
    const pendingInvoicesResult = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "pending")));
    const pendingInvoices = pendingInvoicesResult.length;

    // Get overdue invoices count
    const overdueInvoicesResult = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "overdue")));
    const overdueInvoices = overdueInvoicesResult.length;

    // Get upcoming GST filings
    const upcomingGstFilings = await db
      .select()
      .from(gstFilings)
      .where(and(eq(gstFilings.userId, userId), eq(gstFilings.status, "pending")))
      .orderBy(gstFilings.dueDate)
      .limit(5);

    return {
      totalRevenue,
      activeLoans,
      pendingInvoices,
      overdueInvoices,
      upcomingGstFilings,
    };
  }
}

export const storage = new DatabaseStorage();
