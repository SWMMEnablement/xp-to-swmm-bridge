import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export interface LogEntry {
  timestamp: Date;
  level: "info" | "warning" | "error" | "success";
  message: string;
}

interface ConversionLogProps {
  logs: LogEntry[];
}

export const ConversionLog = ({ logs }: ConversionLogProps) => {
  if (logs.length === 0) return null;

  const getIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getTextColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "error":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Conversion Log</h3>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                {getIcon(log.level)}
                <div className="flex-1 min-w-0">
                  <span className="text-muted-foreground text-xs">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <p className={`${getTextColor(log.level)} mt-1`}>{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
