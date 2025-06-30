import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface BackButtonProps {
  to?: string;
  children?: React.ReactNode;
}

export function BackButton({ to = "/", children = "Back" }: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (to) {
      setLocation(to);
    } else {
      window.history.back();
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleBack}
      className="mb-4 flex items-center gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Button>
  );
}