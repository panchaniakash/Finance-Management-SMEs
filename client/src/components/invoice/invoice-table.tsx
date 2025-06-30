import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Plus, Eye, Edit, Share2, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function InvoiceTable() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices", { status: statusFilter !== "all" ? statusFilter : undefined, search: searchTerm }],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(parseFloat(amount));
  };

  // Default demo data when no invoices exist
  const defaultInvoices = [
    {
      id: 1,
      invoiceNumber: "INV-2024-001",
      clientName: "Acme Corp Ltd",
      amount: "45000",
      status: "overdue",
      createdAt: "2024-03-15T00:00:00Z",
      dueDate: "2024-03-20",
    },
    {
      id: 2,
      invoiceNumber: "INV-2024-002",
      clientName: "Global Tech Solutions",
      amount: "125500",
      status: "paid",
      createdAt: "2024-03-18T00:00:00Z",
      dueDate: "2024-04-18",
    },
    {
      id: 3,
      invoiceNumber: "INV-2024-003",
      clientName: "StartUp Inc",
      amount: "75000",
      status: "pending",
      createdAt: "2024-03-20T00:00:00Z",
      dueDate: "2024-04-20",
    },
  ];

  const displayInvoices = invoices?.length > 0 ? invoices : defaultInvoices;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-6 border-b border-slate-200">
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
            <p className="text-sm text-slate-600 mt-1">Manage your business invoices</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Table Filters */}
      <div className="p-6 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="30">
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-medium">
                Invoice ID
                <ArrowUpDown className="ml-1 h-3 w-3 inline text-slate-400" />
              </TableHead>
              <TableHead className="font-medium">Client</TableHead>
              <TableHead className="font-medium">
                Date
                <ArrowUpDown className="ml-1 h-3 w-3 inline text-slate-400" />
              </TableHead>
              <TableHead className="font-medium">
                Amount
                <ArrowUpDown className="ml-1 h-3 w-3 inline text-slate-400" />
              </TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayInvoices.map((invoice: any) => (
              <TableRow key={invoice.id} className="hover:bg-slate-50">
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>
                  {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Send Payment Link">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Showing 1 to {displayInvoices.length} of {displayInvoices.length} results
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
