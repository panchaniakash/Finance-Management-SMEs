import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface UpiPaymentCardProps {
  onPaymentGenerated: (payment: any) => void;
}

export default function UpiPaymentCard({ onPaymentGenerated }: UpiPaymentCardProps) {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      description: "",
    },
  });

  const createPayment = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/upi-payments", data);
      return response.json();
    },
    onSuccess: (payment) => {
      toast({
        title: "Success",
        description: "Payment link generated successfully",
      });
      onPaymentGenerated(payment);
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

  const onSubmit = (data: PaymentForm) => {
    createPayment.mutate({
      amount: parseFloat(data.amount),
      description: data.description,
    });
  };

  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <CardTitle>Quick Payment</CardTitle>
        <p className="text-sm text-slate-600 mt-1">Generate payment links instantly</p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div>
            <Label htmlFor="payment-amount">Amount</Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
              <Input
                id="payment-amount"
                type="number"
                className="pl-8"
                placeholder="1,000"
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="payment-description">Description</Label>
            <Input
              id="payment-description"
              className="mt-2"
              placeholder="Invoice #INV-001"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createPayment.isPending}
          >
            <QrCode className="w-4 h-4 mr-2" />
            {createPayment.isPending ? "Generating..." : "Generate Payment Link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
