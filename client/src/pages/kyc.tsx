import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/back-button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const kycDocumentSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().min(1, "File is required"),
});

type KycDocumentForm = z.infer<typeof kycDocumentSchema>;

const documentTypes = [
  { value: "pan", label: "PAN Card", required: true },
  { value: "aadhaar", label: "Aadhaar Card", required: true },
  { value: "address_proof", label: "Address Proof", required: true },
  { value: "bank_statement", label: "Bank Statement", required: true },
  { value: "gst_certificate", label: "GST Certificate", required: false },
  { value: "incorporation_certificate", label: "Incorporation Certificate", required: false },
];

export default function KycPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<KycDocumentForm>({
    resolver: zodResolver(kycDocumentSchema),
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/kyc-documents"],
    enabled: isAuthenticated,
  });

  const uploadDocument = useMutation({
    mutationFn: async (data: KycDocumentForm) => {
      const response = await apiRequest("POST", "/api/kyc-documents", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, JPG, or PNG files only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [documentType]: true }));

    try {
      // Simulate file upload - in real implementation, upload to cloud storage
      const mockUrl = `https://documents.finflow.app/${Date.now()}-${file.name}`;
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setValue("documentType", documentType);
      setValue("fileName", file.name);
      setValue("fileUrl", mockUrl);

      const formData = {
        documentType,
        fileName: file.name,
        fileUrl: mockUrl,
      };

      uploadDocument.mutate(formData);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const getDocumentStatus = (docType: string) => {
    const doc = (documents as any[])?.find((d: any) => d.documentType === docType);
    return doc?.status || "missing";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Not Uploaded
          </Badge>
        );
    }
  };

  const getOverallKycStatus = () => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const approvedRequiredDocs = requiredDocs.filter(doc => 
      getDocumentStatus(doc.value) === "approved"
    );
    
    if (approvedRequiredDocs.length === requiredDocs.length) {
      return { status: "verified", progress: 100 };
    } else if (approvedRequiredDocs.length === 0) {
      return { status: "pending", progress: 0 };
    } else {
      const progress = (approvedRequiredDocs.length / requiredDocs.length) * 100;
      return { status: "partial", progress };
    }
  };

  if (isLoading || documentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const kycStatus = getOverallKycStatus();

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        <BackButton to="/">Back to Dashboard</BackButton>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">KYC Verification</h1>
          <p className="text-slate-600 mt-2">
            Complete your KYC verification to unlock all financial services
          </p>
        </div>

        {/* KYC Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              KYC Status Overview
              {getStatusBadge((user as any)?.kycStatus || "pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Verification Progress</span>
                  <span>{Math.round(kycStatus.progress)}%</span>
                </div>
                <Progress value={kycStatus.progress} className="w-full" />
              </div>
              <div className="text-sm text-slate-600">
                {kycStatus.status === "verified" && (
                  <p className="text-green-600">✓ All required documents verified successfully</p>
                )}
                {kycStatus.status === "partial" && (
                  <p>Upload remaining required documents to complete verification</p>
                )}
                {kycStatus.status === "pending" && (
                  <p>Upload required documents to start verification process</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <p className="text-sm text-slate-600">
              Upload clear, high-quality images or PDFs of your documents
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documentTypes.map((docType) => {
                const status = getDocumentStatus(docType.value);
                const isUploading = uploadingFiles[docType.value];
                const existingDoc = (documents as any[])?.find((d: any) => d.documentType === docType.value);

                return (
                  <div key={docType.value} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">
                        {docType.label}
                        {docType.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {getStatusBadge(status)}
                    </div>

                    {existingDoc && (
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <span className="text-sm text-slate-700">{existingDoc.fileName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewFile({ url: existingDoc.fileUrl, name: existingDoc.fileName })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      {isUploading ? (
                        <div className="space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-slate-600">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600 mb-2">
                            {existingDoc ? "Replace document" : "Upload document"}
                          </p>
                          <label className="text-primary font-medium cursor-pointer">
                            Choose file
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(e, docType.value)}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-slate-500 mt-1">
                            PDF, JPG, PNG (max 5MB)
                          </p>
                        </>
                      )}
                    </div>

                    {status === "rejected" && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          Document rejected. Please upload a clear, valid document.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Document Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">✓ Do's</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Upload clear, high-quality images</li>
                  <li>• Ensure all text is readable</li>
                  <li>• Use original documents</li>
                  <li>• Check file size is under 5MB</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">✗ Don'ts</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Don't upload blurry or dark images</li>
                  <li>• Don't submit photocopies of photocopies</li>
                  <li>• Don't crop essential information</li>
                  <li>• Don't upload expired documents</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">{previewFile.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <div className="w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-16 w-16 text-slate-400" />
                  <p className="text-slate-600 ml-4">Document Preview</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}