import { useState } from "react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { ConversionOptions, ConversionSettings } from "@/components/ConversionOptions";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { ConversionLog, LogEntry } from "@/components/ConversionLog";
import { ResultsPanel, ConversionResults } from "@/components/ResultsPanel";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CONVERSION_STAGES = [
  "Reading XP file",
  "Parsing network data",
  "Converting nodes and junctions",
  "Converting conduits and links",
  "Converting subcatchments",
  "Processing time series",
  "Converting controls",
  "Writing SWMM5 INP file",
  "Validation",
];

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>({
    includeSubcatchments: true,
    includeTimeSeries: true,
    includeControls: true,
    coordinateSystem: "Keep Original",
    unitSystem: "US Customary",
    routingMethod: "Dynamic Wave",
  });
  const [isConverting, setIsConverting] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<ConversionResults | null>(null);

  const addLog = (level: LogEntry["level"], message: string) => {
    setLogs((prev) => [...prev, { timestamp: new Date(), level, message }]);
  };

  const simulateConversion = async () => {
    setIsConverting(true);
    setCurrentStage(0);
    setLogs([]);
    setResults(null);

    addLog("info", "Starting conversion process...");
    addLog("info", `File: ${selectedFile?.name}`);

    for (let i = 0; i < CONVERSION_STAGES.length; i++) {
      setCurrentStage(i);
      addLog("info", CONVERSION_STAGES[i]);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Add some mock logs
      if (i === 2) {
        addLog("success", "Converted 145 junctions successfully");
      }
      if (i === 3) {
        addLog("success", "Converted 182 conduits successfully");
      }
      if (i === 4 && settings.includeSubcatchments) {
        addLog("success", "Converted 89 subcatchments successfully");
      }
      if (i === 5 && settings.includeTimeSeries) {
        addLog("warning", "Some time series data had missing timestamps");
      }
      if (i === 6 && settings.includeControls) {
        addLog("success", "Converted 12 control rules successfully");
      }
    }

    // Generate mock results
    const mockResults: ConversionResults = {
      statistics: {
        totalNodes: 145,
        totalLinks: 182,
        totalSubcatchments: settings.includeSubcatchments ? 89 : 0,
        totalTimeSeries: settings.includeTimeSeries ? 8 : 0,
        totalControls: settings.includeControls ? 12 : 0,
      },
      warnings: [
        "Time series data interpolated for missing timestamps",
        "Some custom XPSWMM parameters not supported in SWMM5",
      ],
      mappings: [
        { xpswmmType: "Node", swmm5Type: "JUNCTION", count: 145 },
        { xpswmmType: "Outfall", swmm5Type: "OUTFALL", count: 8 },
        { xpswmmType: "Link", swmm5Type: "CONDUIT", count: 182 },
        { xpswmmType: "Pump", swmm5Type: "PUMP", count: 5, notes: "Converted pump curves" },
        { xpswmmType: "Catchment", swmm5Type: "SUBCATCHMENT", count: 89 },
      ],
    };

    setResults(mockResults);
    addLog("success", "Conversion completed successfully!");
    setIsConverting(false);

    toast({
      title: "Conversion Complete",
      description: "Your SWMM5 file is ready for download.",
    });
  };

  const handleConvert = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload an XPSWMM file first.",
        variant: "destructive",
      });
      return;
    }

    simulateConversion();
  };

  const handleDownload = () => {
    // Mock download
    const mockInpContent = `[TITLE]
;;Project Title/Notes
Converted from ${selectedFile?.name}

[OPTIONS]
;;Option             Value
FLOW_UNITS           CFS
INFILTRATION         HORTON
FLOW_ROUTING         ${settings.routingMethod.toUpperCase().replace(" ", "_")}
LINK_OFFSETS         DEPTH
MIN_SLOPE            0
ALLOW_PONDING        NO
SKIP_STEADY_STATE    NO

[JUNCTIONS]
;;Name           Elevation  MaxDepth   InitDepth  SurDepth   Aponded   
J1               100.0      10.0       0          0          0         
J2               95.0       12.0       0          0          0         

[CONDUITS]
;;Name           From Node        To Node          Length     Roughness  InOffset   OutOffset  InitFlow   MaxFlow   
C1               J1               J2               400.0      0.013      0          0          0          0         

`;

    const blob = new Blob([mockInpContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile?.name.replace(".xp", ".inp") || "converted.inp";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your SWMM5 .inp file is downloading.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <FileUpload
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            onClearFile={() => {
              setSelectedFile(null);
              setResults(null);
              setLogs([]);
              setCurrentStage(0);
            }}
          />

          <ConversionOptions settings={settings} onSettingsChange={setSettings} />

          <div className="flex justify-center">
            <Button
              onClick={handleConvert}
              disabled={!selectedFile || isConverting}
              size="lg"
              className="gap-2 px-8"
            >
              <RefreshCw className={`h-5 w-5 ${isConverting ? "animate-spin" : ""}`} />
              {isConverting ? "Converting..." : "Convert to SWMM5"}
            </Button>
          </div>

          <ProgressIndicator
            stages={CONVERSION_STAGES}
            currentStage={currentStage}
            isConverting={isConverting}
          />

          <ConversionLog logs={logs} />

          <ResultsPanel results={results} onDownload={handleDownload} />
        </div>
      </main>
    </div>
  );
};

export default Index;
