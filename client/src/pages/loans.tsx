import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/back-button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, FileText, Calculator, TrendingUp, Clock, IndianRupee, DollarSign, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

const loanApplicationSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  tenure: z.string().min(1, "Tenure is required"),
  purpose: z.string().min(1, "Purpose is required"),
  businessRevenue: z.string().min(1, "Monthly revenue is required"),
  businessType: z.string().min(1, "Business type is required"),
  employeeCount: z.string().min(1, "Employee count is required"),
});

type LoanApplicationForm = z.infer<typeof loanApplicationSchema>;

export default function LoansPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState("apply");
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<LoanApplicationForm>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      amount: "",
      tenure: "",
      purpose: "",
      businessRevenue: "",
      businessType: "",
      employeeCount: "",
    },
  });

  const watchedAmount = watch("amount");
  const watchedTenure = watch("tenure");

  // Fetch existing loan applications
  const { data: loanApplications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/loan-applications"],
    enabled: isAuthenticated,
  });

  const createLoanApplication = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/loan-applications", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan application submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loan-applications"] });
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        setActiveTab("applications");
        reset();
        setCurrentStep(1);
        setUploadedFiles([]);
      }
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

  const onSubmit = (data: LoanApplicationForm) => {
    createLoanApplication.mutate({
      ...data,
      amount: parseFloat(data.amount),
      tenure: parseInt(data.tenure),
      businessRevenue: parseFloat(data.businessRevenue),
      employeeCount: parseInt(data.employeeCount),
      currentStep: currentStep,
      documents: uploadedFiles.map(file => ({ name: file.name, size: file.size })),
      status: currentStep === 3 ? "submitted" : "draft",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const saveDraft = () => {
    const formData = watch();
    createLoanApplication.mutate({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      tenure: parseInt(formData.tenure) || 0,
      businessRevenue: parseFloat(formData.businessRevenue) || 0,
      employeeCount: parseInt(formData.employeeCount) || 0,
      status: "draft",
      currentStep,
    });
  };

  // Loan calculator
  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return emi;
  };

  const getLoanDetails = () => {
    const amount = parseFloat(watchedAmount) || 0;
    const tenure = parseInt(watchedTenure) || 0;
    const interestRate = 12; // 12% annual rate
    
    if (amount && tenure) {
      const emi = calculateEMI(amount, interestRate, tenure);
      const totalAmount = emi * tenure;
      const totalInterest = totalAmount - amount;
      
      return {
        emi: Math.round(emi),
        totalAmount: Math.round(totalAmount),
        totalInterest: Math.round(totalInterest),
        interestRate,
      };
    }
    return null;
  };

  const loanDetails = getLoanDetails();
  const progressPercentage = (currentStep / 3) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'disbursed': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || applicationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const applicationsList = (loanApplications as any[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <BackButton to="/">Back to Dashboard</BackButton>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Business Loans</h1>
          <p className="text-slate-600 mt-2">
            Apply for business loans with competitive rates and quick approval
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="apply">Apply for Loan</TabsTrigger>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="calculator">Loan Calculator</TabsTrigger>
          </TabsList>

          {/* Apply for Loan Tab */}
          <TabsContent value="apply" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Application Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle>Apply for Business Loan</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">Complete your application in 3 simple steps</p>
                  </CardHeader>

                  {/* Progress Bar */}
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Step {currentStep} of 3</span>
                      <span className="text-sm text-slate-500">{Math.round(progressPercentage)}% Complete</span>
                    </div>
                    <Progress value={progressPercentage} className="w-full" />
                    
                    <div className="flex justify-between mt-4 text-xs text-slate-500">
                      <span className={currentStep >= 1 ? "text-primary font-medium" : ""}>Loan Details</span>
                      <span className={currentStep >= 2 ? "text-primary font-medium" : ""}>Business Info</span>
                      <span className={currentStep >= 3 ? "text-primary font-medium" : ""}>Documents</span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      {/* Step 1: Loan Details */}
                      {currentStep === 1 && (
                        <div className="space-y-6">
                          <div>
                            <Label htmlFor="amount">Loan Amount</Label>
                            <div className="relative mt-2">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
                              <Input
                                id="amount"
                                type="number"
                                className="pl-8"
                                placeholder="50,000"
                                {...register("amount")}
                              />
                            </div>
                            {errors.amount && (
                              <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">Minimum ₹50,000 - Maximum ₹50,00,000</p>
                          </div>

                          <div>
                            <Label htmlFor="tenure">Loan Tenure</Label>
                            <Select onValueChange={(value) => setValue("tenure", value)}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select tenure" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="6">6 months</SelectItem>
                                <SelectItem value="12">12 months</SelectItem>
                                <SelectItem value="18">18 months</SelectItem>
                                <SelectItem value="24">24 months</SelectItem>
                                <SelectItem value="36">36 months</SelectItem>
                                <SelectItem value="48">48 months</SelectItem>
                                <SelectItem value="60">60 months</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.tenure && (
                              <p className="text-sm text-red-600 mt-1">{errors.tenure.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="purpose">Purpose of Loan</Label>
                            <Select onValueChange={(value) => setValue("purpose", value)}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select purpose" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="working_capital">Working Capital</SelectItem>
                                <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                                <SelectItem value="business_expansion">Business Expansion</SelectItem>
                                <SelectItem value="inventory_purchase">Inventory Purchase</SelectItem>
                                <SelectItem value="office_renovation">Office Renovation</SelectItem>
                                <SelectItem value="marketing_expenses">Marketing & Advertising</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.purpose && (
                              <p className="text-sm text-red-600 mt-1">{errors.purpose.message}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 2: Business Information */}
                      {currentStep === 2 && (
                        <div className="space-y-6">
                          <div>
                            <Label htmlFor="businessType">Business Type</Label>
                            <Select onValueChange={(value) => setValue("businessType", value)}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="services">Services</SelectItem>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.businessType && (
                              <p className="text-sm text-red-600 mt-1">{errors.businessType.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="businessRevenue">Monthly Business Revenue</Label>
                            <div className="relative mt-2">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
                              <Input
                                id="businessRevenue"
                                type="number"
                                className="pl-8"
                                placeholder="1,00,000"
                                {...register("businessRevenue")}
                              />
                            </div>
                            {errors.businessRevenue && (
                              <p className="text-sm text-red-600 mt-1">{errors.businessRevenue.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="employeeCount">Number of Employees</Label>
                            <Select onValueChange={(value) => setValue("employeeCount", value)}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select employee count" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 (Solo)</SelectItem>
                                <SelectItem value="2">2-5</SelectItem>
                                <SelectItem value="6">6-10</SelectItem>
                                <SelectItem value="11">11-25</SelectItem>
                                <SelectItem value="26">26-50</SelectItem>
                                <SelectItem value="51">51-100</SelectItem>
                                <SelectItem value="101">100+</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.employeeCount && (
                              <p className="text-sm text-red-600 mt-1">{errors.employeeCount.message}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 3: Document Upload */}
                      {currentStep === 3 && (
                        <div className="space-y-6">
                          <div>
                            <Label>Upload Required Documents</Label>
                            <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                              <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                              <p className="text-sm text-slate-600 mb-2">
                                Drag and drop files here, or{" "}
                                <label className="text-primary font-medium cursor-pointer">
                                  browse
                                  <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                </label>
                              </p>
                              <p className="text-xs text-slate-500">Support: PDF, JPG, PNG (max 5MB each)</p>
                            </div>

                            <div className="mt-4 text-sm text-slate-600">
                              <p className="font-medium mb-2">Required Documents:</p>
                              <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>Business Registration Certificate</li>
                                <li>GST Registration Certificate</li>
                                <li>Bank Statements (Last 6 months)</li>
                                <li>IT Returns (Last 2 years)</li>
                                <li>Business PAN Card</li>
                                <li>Address Proof</li>
                              </ul>
                            </div>

                            {/* Uploaded Files Preview */}
                            {uploadedFiles.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {uploadedFiles.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <FileText className="h-5 w-5 text-red-500" />
                                      <span className="text-sm text-slate-700">{file.name}</span>
                                      <span className="text-xs text-slate-500">
                                        {(file.size / 1024 / 1024).toFixed(1)} MB
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(index)}
                                    >
                                      <X className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        {currentStep > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(currentStep - 1)}
                          >
                            Previous
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={saveDraft}
                          disabled={createLoanApplication.isPending}
                        >
                          Save as Draft
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={createLoanApplication.isPending}
                        >
                          {createLoanApplication.isPending 
                            ? "Processing..." 
                            : currentStep === 3 
                              ? "Submit Application" 
                              : "Continue"
                          }
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Loan Summary Card */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Loan Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loanDetails ? (
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Loan Amount:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(watchedAmount))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Tenure:</span>
                          <span className="font-medium">{watchedTenure} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Interest Rate:</span>
                          <span className="font-medium">{loanDetails.interestRate}% p.a.</span>
                        </div>
                        <hr />
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Monthly EMI:</span>
                          <span className="font-bold text-lg">{formatCurrency(loanDetails.emi)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Interest:</span>
                          <span className="font-medium">{formatCurrency(loanDetails.totalInterest)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Amount:</span>
                          <span className="font-medium">{formatCurrency(loanDetails.totalAmount)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Enter loan amount and tenure to see summary</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Key Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Quick approval in 24-48 hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Competitive interest rates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Flexible repayment options</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">No hidden charges</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>My Loan Applications</CardTitle>
                <p className="text-sm text-slate-600">Track the status of your loan applications</p>
              </CardHeader>
              <CardContent>
                {applicationsList.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Tenure</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applicationsList.map((application: any) => (
                        <TableRow key={application.id}>
                          <TableCell className="font-medium">#{application.id}</TableCell>
                          <TableCell>{formatCurrency(application.amount)}</TableCell>
                          <TableCell>{application.tenure} months</TableCell>
                          <TableCell className="capitalize">{application.purpose.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(application.status)}>
                              {application.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(application.createdAt), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600">No loan applications found</p>
                    <p className="text-sm text-slate-500 mt-2">Apply for your first business loan to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loan Calculator Tab */}
          <TabsContent value="calculator">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Loan Calculator
                </CardTitle>
                <p className="text-sm text-slate-600">Calculate your EMI and plan your finances</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="calc-amount">Loan Amount</Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
                        <Input
                          id="calc-amount"
                          type="number"
                          className="pl-8"
                          placeholder="5,00,000"
                          value={watchedAmount}
                          onChange={(e) => setValue("amount", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="calc-tenure">Loan Tenure (months)</Label>
                      <Input
                        id="calc-tenure"
                        type="number"
                        className="mt-2"
                        placeholder="24"
                        value={watchedTenure}
                        onChange={(e) => setValue("tenure", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-lg">
                    {loanDetails ? (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Calculation Results</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Principal Amount:</span>
                            <span className="font-medium">{formatCurrency(parseFloat(watchedAmount))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Interest Rate:</span>
                            <span className="font-medium">{loanDetails.interestRate}% p.a.</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Loan Tenure:</span>
                            <span className="font-medium">{watchedTenure} months</span>
                          </div>
                          <hr />
                          <div className="flex justify-between text-lg">
                            <span className="font-semibold">Monthly EMI:</span>
                            <span className="font-bold text-primary">{formatCurrency(loanDetails.emi)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Interest:</span>
                            <span className="text-red-600 font-medium">{formatCurrency(loanDetails.totalInterest)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Payable:</span>
                            <span className="font-semibold">{formatCurrency(loanDetails.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <p className="text-slate-600">Enter loan details to calculate EMI</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}