import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const loanApplicationSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  tenure: z.string().min(1, "Tenure is required"),
  purpose: z.string().min(1, "Purpose is required"),
});

type LoanApplicationForm = z.infer<typeof loanApplicationSchema>;

export default function LoanApplicationForm() {
  const [currentStep, setCurrentStep] = useState(2);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoanApplicationForm>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      amount: "50000",
      tenure: "18",
      purpose: "equipment_purchase",
    },
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
      setCurrentStep(3);
    },
    onError: (error) => {
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
      currentStep: currentStep + 1,
      documents: uploadedFiles.map(file => ({ name: file.name, size: file.size })),
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
      amount: parseFloat(formData.amount),
      tenure: parseInt(formData.tenure),
      status: "draft",
      currentStep,
    });
  };

  const progressPercentage = (currentStep / 3) * 100;

  return (
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
      </div>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Loan Amount */}
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

          {/* Loan Tenure */}
          <div>
            <Label htmlFor="tenure">Loan Tenure</Label>
            <Select onValueChange={(value) => setValue("tenure", value)} defaultValue="18">
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select tenure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
              </SelectContent>
            </Select>
            {errors.tenure && (
              <p className="text-sm text-red-600 mt-1">{errors.tenure.message}</p>
            )}
          </div>

          {/* Loan Purpose */}
          <div>
            <Label htmlFor="purpose">Purpose of Loan</Label>
            <Select onValueChange={(value) => setValue("purpose", value)} defaultValue="equipment_purchase">
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="working_capital">Working Capital</SelectItem>
                <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                <SelectItem value="business_expansion">Business Expansion</SelectItem>
                <SelectItem value="inventory_purchase">Inventory Purchase</SelectItem>
              </SelectContent>
            </Select>
            {errors.purpose && (
              <p className="text-sm text-red-600 mt-1">{errors.purpose.message}</p>
            )}
          </div>

          {/* Document Upload */}
          <div>
            <Label>Upload Documents</Label>
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

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={saveDraft}
              disabled={createLoanApplication.isPending}
            >
              Save & Continue Later
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createLoanApplication.isPending}
            >
              {createLoanApplication.isPending ? "Submitting..." : "Continue to Step 3"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
