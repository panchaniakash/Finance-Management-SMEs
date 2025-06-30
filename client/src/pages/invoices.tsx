import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Download, Eye, Edit, Trash2, Send, Calendar, IndianRupee, FileText, Filter } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format, addDays } from "date-fns";
import { BackButton } from "@/components/ui/back-button";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be positive"),
  amount: z.number(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  clientAddress: z.string().min(1, "Client address is required"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  subtotal: z.number(),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number(),
  amount: z.number(),
  notes: z.string().optional(),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export default function InvoicesPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      taxRate: 18,
      subtotal: 0,
      taxAmount: 0,
      amount: 0,
      dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedTaxRate = watch("taxRate");

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices", { status: statusFilter !== "all" ? statusFilter : undefined, search: searchTerm }],
    enabled: isAuthenticated,
  });

  const invoiceList = (invoices as any[]) || [];

  const createInvoice = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsCreateModalOpen(false);
      reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/invoices/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setEditingInvoice(null);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/invoices/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  // Calculate totals when items or tax rate changes
  useEffect(() => {
    const subtotal = watchedItems.reduce((sum, item) => {
      const amount = (item.quantity || 0) * (item.rate || 0);
      return sum + amount;
    }, 0);
    
    const taxAmount = (subtotal * (watchedTaxRate || 0)) / 100;
    const total = subtotal + taxAmount;

    setValue("subtotal", subtotal);
    setValue("taxAmount", taxAmount);
    setValue("amount", total);

    // Update individual item amounts
    watchedItems.forEach((item, index) => {
      const amount = (item.quantity || 0) * (item.rate || 0);
      setValue(`items.${index}.amount`, amount);
    });
  }, [watchedItems, watchedTaxRate, setValue]);

  const onSubmit = (data: InvoiceForm) => {
    // Generate invoice number if not provided
    if (!data.invoiceNumber) {
      const invoiceNum = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      data.invoiceNumber = invoiceNum;
    }

    if (editingInvoice) {
      updateInvoice.mutate({ id: editingInvoice.id, data });
    } else {
      createInvoice.mutate(data);
    }
  };

  const handleEdit = (invoice: any) => {
    setEditingInvoice(invoice);
    setValue("invoiceNumber", invoice.invoiceNumber);
    setValue("clientName", invoice.clientName);
    setValue("clientEmail", invoice.clientEmail || "");
    setValue("clientAddress", invoice.clientAddress || "");
    setValue("dueDate", format(new Date(invoice.dueDate), "yyyy-MM-dd"));
    setValue("description", invoice.description || "");
    setValue("notes", invoice.notes || "");
    
    // Parse items if they exist
    const items = invoice.items || [{ description: invoice.description, quantity: 1, rate: parseFloat(invoice.amount), amount: parseFloat(invoice.amount) }];
    setValue("items", items);
    
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingInvoice(null);
    reset({
      items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      taxRate: 18,
      subtotal: 0,
      taxAmount: 0,
      amount: 0,
      dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    });
  };

  const generateInvoiceNumber = () => {
    const invoiceNum = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    setValue("invoiceNumber", invoiceNum);
  };

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

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const exportToCSV = () => {
    if (!invoiceList || invoiceList.length === 0) return;
    
    const headers = ["Invoice Number", "Client", "Amount", "Status", "Due Date", "Created"];
    const csvContent = [
      headers.join(","),
      ...invoiceList.map((invoice: any) => [
        invoice.invoiceNumber,
        invoice.clientName,
        invoice.amount,
        invoice.status,
        format(new Date(invoice.dueDate), "yyyy-MM-dd"),
        format(new Date(invoice.createdAt), "yyyy-MM-dd"),
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading || invoicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <BackButton to="/">Back to Dashboard</BackButton>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoice Management</h1>
            <p className="text-slate-600 mt-2">Create, manage, and track your business invoices</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceList.length > 0 ? (
                    invoiceList.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View"
                              onClick={() => {
                                // TODO: Implement invoice preview
                                toast({ title: "Coming Soon", description: "Invoice preview will be available soon" });
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit"
                              onClick={() => handleEdit(invoice)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this invoice?")) {
                                  deleteInvoice.mutate(invoice.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No invoices found. Create your first invoice to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Invoice Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <div className="flex mt-2">
                    <Input
                      id="invoiceNumber"
                      {...register("invoiceNumber")}
                      placeholder="INV-2024-001"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateInvoiceNumber}
                      className="ml-2"
                    >
                      Generate
                    </Button>
                  </div>
                  {errors.invoiceNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.invoiceNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...register("dueDate")}
                    className="mt-2"
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.dueDate.message}</p>
                  )}
                </div>
              </div>

              {/* Client Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      {...register("clientName")}
                      placeholder="Acme Corporation"
                      className="mt-2"
                    />
                    {errors.clientName && (
                      <p className="text-sm text-red-600 mt-1">{errors.clientName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">Client Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      {...register("clientEmail")}
                      placeholder="contact@acme.com"
                      className="mt-2"
                    />
                    {errors.clientEmail && (
                      <p className="text-sm text-red-600 mt-1">{errors.clientEmail.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Textarea
                    id="clientAddress"
                    {...register("clientAddress")}
                    placeholder="123 Business Street, City, State, ZIP"
                    className="mt-2"
                    rows={3}
                  />
                  {errors.clientAddress && (
                    <p className="text-sm text-red-600 mt-1">{errors.clientAddress.message}</p>
                  )}
                </div>
              </div>

              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Invoice Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ description: "", quantity: 1, rate: 0, amount: 0 })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end p-4 border rounded-lg">
                      <div className="md:col-span-2">
                        <Label htmlFor={`items.${index}.description`}>Description</Label>
                        <Input
                          {...register(`items.${index}.description`)}
                          placeholder="Service or product description"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`items.${index}.quantity`}>Qty</Label>
                        <Input
                          type="number"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          className="mt-1"
                          min="1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`items.${index}.rate`}>Rate</Label>
                        <Input
                          type="number"
                          {...register(`items.${index}.rate`, { valueAsNumber: true })}
                          placeholder="0.00"
                          className="mt-1"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <Label>Amount</Label>
                        <div className="mt-1 p-2 bg-slate-50 rounded text-sm font-medium">
                          {formatCurrency(watch(`items.${index}.amount`) || 0)}
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="mt-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax and Totals */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="description">Description/Notes</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Additional invoice description..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(watch("subtotal") || 0)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <Label htmlFor="taxRate">Tax Rate (%):</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="taxRate"
                          type="number"
                          {...register("taxRate", { valueAsNumber: true })}
                          className="w-20"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                        <span className="text-sm text-slate-500">%</span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span>Tax Amount:</span>
                      <span className="font-medium">{formatCurrency(watch("taxAmount") || 0)}</span>
                    </div>

                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(watch("amount") || 0)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Payment terms, thank you message, etc."
                    className="mt-2"
                    rows={2}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createInvoice.isPending || updateInvoice.isPending}
                >
                  {createInvoice.isPending || updateInvoice.isPending
                    ? "Saving..."
                    : editingInvoice
                    ? "Update Invoice"
                    : "Create Invoice"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}