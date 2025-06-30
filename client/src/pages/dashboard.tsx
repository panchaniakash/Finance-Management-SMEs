import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import OverviewCards from "@/components/dashboard/overview-cards";
import LoanApplicationForm from "@/components/loan/loan-application-form";
import UpiPaymentCard from "@/components/payment/upi-payment-card";
import GstAlertsCard from "@/components/gst/gst-alerts-card";
import InvoiceTable from "@/components/invoice/invoice-table";
import PaymentLinkModal from "@/components/modals/payment-link-modal";
import { useState } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [generatedPayment, setGeneratedPayment] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handlePaymentGenerated = (payment: any) => {
    setGeneratedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />

        {/* Dashboard Content */}
        <main className="p-4 lg:p-6">
          {/* Overview Cards */}
          <OverviewCards />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Loan Application Form */}
            <div className="lg:col-span-2">
              <LoanApplicationForm />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <UpiPaymentCard onPaymentGenerated={handlePaymentGenerated} />
              <GstAlertsCard />
            </div>
          </div>

          {/* Invoice Table */}
          <div className="mt-8">
            <InvoiceTable />
          </div>
        </main>
      </div>

      {/* Payment Link Modal */}
      <PaymentLinkModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        payment={generatedPayment}
      />
    </div>
  );
}
