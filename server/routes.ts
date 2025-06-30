import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLoanApplicationSchema, insertInvoiceSchema, insertUpiPaymentSchema, insertGstFilingSchema, insertKycDocumentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const metrics = await storage.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Loan application routes
  app.post('/api/loan-applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertLoanApplicationSchema.parse({ ...req.body, userId });
      const loanApplication = await storage.createLoanApplication(validatedData);
      res.json(loanApplication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error creating loan application:", error);
        res.status(500).json({ message: "Failed to create loan application" });
      }
    }
  });

  app.get('/api/loan-applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applications = await storage.getLoanApplicationsByUser(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching loan applications:", error);
      res.status(500).json({ message: "Failed to fetch loan applications" });
    }
  });

  app.put('/api/loan-applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.updateLoanApplication(id, req.body);
      res.json(application);
    } catch (error) {
      console.error("Error updating loan application:", error);
      res.status(500).json({ message: "Failed to update loan application" });
    }
  });

  // Invoice routes
  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertInvoiceSchema.parse({ ...req.body, userId });
      const invoice = await storage.createInvoice(validatedData);
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Failed to create invoice" });
      }
    }
  });

  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status, search } = req.query;
      const invoices = await storage.getInvoicesByUser(userId, { status, search });
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.put('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.updateInvoice(id, req.body);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInvoice(id);
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // UPI Payment routes
  app.post('/api/upi-payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Generate payment link and QR code (simplified for demo)
      const paymentId = `PAY_${Date.now()}`;
      const paymentLink = `https://finflow.app/pay/${paymentId}`;
      const qrCode = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">QR Code</text></svg>`).toString('base64')}`;
      
      const validatedData = insertUpiPaymentSchema.parse({ 
        ...req.body, 
        userId,
        paymentLink,
        qrCode
      });
      
      const payment = await storage.createUpiPayment(validatedData);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error creating UPI payment:", error);
        res.status(500).json({ message: "Failed to create UPI payment" });
      }
    }
  });

  app.get('/api/upi-payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payments = await storage.getUpiPaymentsByUser(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching UPI payments:", error);
      res.status(500).json({ message: "Failed to fetch UPI payments" });
    }
  });

  // GST Filing routes
  app.post('/api/gst-filings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertGstFilingSchema.parse({ ...req.body, userId });
      const filing = await storage.createGstFiling(validatedData);
      res.json(filing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error creating GST filing:", error);
        res.status(500).json({ message: "Failed to create GST filing" });
      }
    }
  });

  app.get('/api/gst-filings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filings = await storage.getGstFilingsByUser(userId);
      res.json(filings);
    } catch (error) {
      console.error("Error fetching GST filings:", error);
      res.status(500).json({ message: "Failed to fetch GST filings" });
    }
  });

  app.put('/api/gst-filings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const filing = await storage.updateGstFiling(id, req.body);
      res.json(filing);
    } catch (error) {
      console.error("Error updating GST filing:", error);
      res.status(500).json({ message: "Failed to update GST filing" });
    }
  });

  // KYC Document routes
  app.post('/api/kyc-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertKycDocumentSchema.parse({ ...req.body, userId });
      const document = await storage.createKycDocument(validatedData);
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error creating KYC document:", error);
        res.status(500).json({ message: "Failed to create KYC document" });
      }
    }
  });

  app.get('/api/kyc-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getKycDocumentsByUser(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching KYC documents:", error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
