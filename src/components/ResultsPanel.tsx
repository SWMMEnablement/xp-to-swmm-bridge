import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConversionResults {
  statistics: {
    totalNodes: number;
    totalLinks: number;
    totalSubcatchments: number;
    totalTimeSeries: number;
    totalControls: number;
  };
  warnings: string[];
  mappings: Array<{
    xpswmmType: string;
    swmm5Type: string;
    count: number;
    notes?: string;
  }>;
}

interface ResultsPanelProps {
  results: ConversionResults | null;
  onDownload: () => void;
}

export const ResultsPanel = ({ results, onDownload }: ResultsPanelProps) => {
  if (!results) return null;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Conversion Results</h2>
            <p className="text-sm text-muted-foreground">Review the converted model details</p>
          </div>
          <Button onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download SWMM5 File
          </Button>
        </div>

        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="mappings">Element Mappings</TabsTrigger>
            <TabsTrigger value="warnings">
              Warnings {results.warnings.length > 0 && `(${results.warnings.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statistics" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(results.statistics).map(([key, value]) => (
                <div key={key} className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="text-2xl font-bold text-primary">{value}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, " $1").replace(/^total /, "")}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mappings" className="mt-4">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-foreground">
                      XPSWMM Element
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-foreground">
                      SWMM5 Element
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-foreground">Count</th>
                    <th className="text-left p-3 text-sm font-medium text-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {results.mappings.map((mapping, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="p-3 text-sm text-foreground">{mapping.xpswmmType}</td>
                      <td className="p-3 text-sm text-foreground font-mono bg-muted/20">
                        {mapping.swmm5Type}
                      </td>
                      <td className="p-3 text-sm text-foreground">{mapping.count}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {mapping.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="warnings" className="space-y-2 mt-4">
            {results.warnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No warnings to display. Conversion completed successfully!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="bg-warning/10 border border-warning/20 p-3 rounded-md"
                  >
                    <p className="text-sm text-foreground">{warning}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
