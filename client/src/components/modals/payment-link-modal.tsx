import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail, MessageCircle, X, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
}

export default function PaymentLinkModal({ isOpen, onClose, payment }: PaymentLinkModalProps) {
  const { toast } = useToast();

  if (!payment) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(payment.paymentLink);
      toast({
        title: "Success",
        description: "Payment link copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Payment Request: ${payment.description}\nAmount: ₹${payment.amount}\nPay now: ${payment.paymentLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Payment Request - ${payment.description}`;
    const body = `Hello,\n\nYou have received a payment request:\n\nDescription: ${payment.description}\nAmount: ₹${payment.amount}\n\nClick here to pay: ${payment.paymentLink}\n\nThank you!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Payment Link Generated</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Details */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900">{payment.description}</h3>
            <p className="text-2xl font-bold text-primary mt-2">
              {formatCurrency(payment.amount)}
            </p>
          </div>

          {/* QR Code Display */}
          <div className="text-center">
            <div className="w-48 h-48 mx-auto bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              {payment.qrCode ? (
                <img 
                  src={payment.qrCode} 
                  alt="Payment QR Code" 
                  className="w-40 h-40 rounded"
                />
              ) : (
                <div className="w-40 h-40 bg-white border-2 border-slate-300 rounded flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-slate-400" />
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600">Scan QR code to make payment</p>
          </div>

          {/* Payment Link */}
          <div>
            <Label htmlFor="payment-link">Payment Link</Label>
            <div className="flex mt-2">
              <Input
                id="payment-link"
                value={payment.paymentLink}
                readOnly
                className="flex-1 bg-slate-50 text-sm"
              />
              <Button
                onClick={handleCopyLink}
                className="ml-2"
                size="sm"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleShareWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              onClick={handleShareEmail}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
