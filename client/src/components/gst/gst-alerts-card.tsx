import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";

export default function GstAlertsCard() {
  const { data: filings, isLoading } = useQuery({
    queryKey: ["/api/gst-filings"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-slate-200">
          <CardTitle>GST & Tax Alerts</CardTitle>
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

  const getAlertStyle = (status: string, dueDate: string) => {
    const daysLeft = differenceInDays(new Date(dueDate), new Date());
    
    if (status === "filed") {
      return {
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800",
        icon: CheckCircle,
        iconColor: "text-green-500",
      };
    }
    
    if (daysLeft <= 5) {
      return {
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
        icon: AlertTriangle,
        iconColor: "text-red-500",
      };
    }
    
    return {
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-800",
      icon: Clock,
      iconColor: "text-amber-500",
    };
  };

  const getDaysText = (dueDate: string, status: string) => {
    if (status === "filed") {
      return `Filed: ${format(new Date(dueDate), "MMM dd, yyyy")}`;
    }
    
    const daysLeft = differenceInDays(new Date(dueDate), new Date());
    if (daysLeft < 0) {
      return `Overdue by ${Math.abs(daysLeft)} days`;
    }
    return `Due: ${format(new Date(dueDate), "MMM dd, yyyy")} (${daysLeft} days left)`;
  };

  // Show some default GST filings if none exist
  const defaultFilings = [
    {
      id: 1,
      filingType: "GSTR-3B",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
    },
    {
      id: 2,
      filingType: "GSTR-1",
      dueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
    },
    {
      id: 3,
      filingType: "TDS Return",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "filed",
    },
  ];

  const displayFilings = filings?.length > 0 ? filings : defaultFilings;

  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <CardTitle>GST & Tax Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {displayFilings.map((filing: any) => {
            const alertStyle = getAlertStyle(filing.status, filing.dueDate);
            const Icon = alertStyle.icon;
            
            return (
              <div
                key={filing.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${alertStyle.bgColor} ${alertStyle.borderColor}`}
              >
                <Icon className={`${alertStyle.iconColor} mt-0.5 w-4 h-4`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${alertStyle.textColor}`}>
                    {filing.filingType} {filing.status === "filed" ? "Filed" : filing.status === "pending" ? "Due" : "Upcoming"}
                  </p>
                  <p className={`text-xs ${alertStyle.textColor.replace('800', '600')}`}>
                    {getDaysText(filing.dueDate, filing.status)}
                  </p>
                  {filing.status === "pending" && (
                    <Button
                      variant="link"
                      size="sm"
                      className={`p-0 h-auto text-xs ${alertStyle.textColor} hover:${alertStyle.textColor.replace('800', '900')} font-medium mt-1`}
                    >
                      File Now →
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
