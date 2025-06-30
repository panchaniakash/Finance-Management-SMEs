import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, CreditCard, FileText, Receipt, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function OverviewCards() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Revenue */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(metrics?.totalRevenue || 0)}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Loans */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Loans</p>
              <p className="text-2xl font-bold text-slate-900">
                {metrics?.activeLoans || 0}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Outstanding amount
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invoices */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Invoices</p>
              <p className="text-2xl font-bold text-slate-900">
                {metrics?.pendingInvoices || 0}
              </p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1" />
                {metrics?.overdueInvoices || 0} overdue
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GST Filing */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">GST Filing</p>
              <p className="text-2xl font-bold text-slate-900">
                {metrics?.upcomingGstFilings?.length > 0 ? "Due Soon" : "Up to Date"}
              </p>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {metrics?.upcomingGstFilings?.length || 0} pending
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
