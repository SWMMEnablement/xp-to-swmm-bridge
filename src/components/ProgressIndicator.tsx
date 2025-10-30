import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  stages: string[];
  currentStage: number;
  isConverting: boolean;
}

export const ProgressIndicator = ({ stages, currentStage, isConverting }: ProgressIndicatorProps) => {
  if (!isConverting && currentStage === 0) return null;

  const progress = ((currentStage + 1) / stages.length) * 100;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Conversion Progress</h3>
          <span className="text-sm text-muted-foreground">
            {currentStage + 1} / {stages.length}
          </span>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {stages.map((stage, index) => {
            const isComplete = index < currentStage;
            const isCurrent = index === currentStage;
            const isPending = index > currentStage;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                  isCurrent ? "bg-primary/5" : ""
                }`}
              >
                {isComplete && <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />}
                {isCurrent && <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />}
                {isPending && <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                <span
                  className={`text-sm ${
                    isComplete
                      ? "text-muted-foreground line-through"
                      : isCurrent
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
