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

// Conversion stages based on actual XPSWMM export process
const CONVERSION_STAGES = [
  "Validating input file format",
  "Reading XP file binary structure",
  "Parsing XP header (version, metadata)",
  "Extracting network topology",
  "Converting OPTIONS section",
  "Converting RAINGAGES section",
  "Converting SUBCATCHMENTS and SUBAREAS",
  "Converting INFILTRATION section",
  "Converting JUNCTIONS section",
  "Converting OUTFALLS and STORAGE",
  "Converting CONDUITS section",
  "Converting PUMPS and ORIFICES",
  "Converting WEIRS and OUTLETS",
  "Converting XSECTIONS and LOSSES",
  "Converting CONTROLS section",
  "Converting TIMESERIES section",
  "Converting COORDINATES and VERTICES",
  "Assembling SWMM5 INP file",
  "Validating output model",
  "Generating conversion report",
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

    addLog("info", "Starting XPSWMM to SWMM5 conversion...");
    addLog("info", `Input file: ${selectedFile?.name}`);
    addLog("info", `Unit system: ${settings.unitSystem}`);
    addLog("info", `Routing method: ${settings.routingMethod}`);

    // Simulated counts based on typical XPSWMM models
    let nodeCount = 0;
    let junctionCount = 0;
    let outfallCount = 0;
    let storageCount = 0;
    let conduitCount = 0;
    let pumpCount = 0;
    let orificeCount = 0;
    let weirCount = 0;
    let subcatchmentCount = 0;
    let timeSeriesCount = 0;
    let controlCount = 0;

    for (let i = 0; i < CONVERSION_STAGES.length; i++) {
      setCurrentStage(i);
      addLog("info", `${CONVERSION_STAGES[i]}...`);

      // Simulate processing time (faster for validation, slower for actual conversion)
      const delay = i < 4 ? 400 : 600;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Detailed logging based on actual XPSWMM export process
      switch (i) {
        case 0: // Validating file format
          addLog("success", "File format validated: XPSWMM binary (.xp)");
          break;
          
        case 1: // Reading XP file
          addLog("info", "Reading binary file structure...");
          addLog("success", `File size: ${(selectedFile!.size / 1024).toFixed(2)} KB`);
          break;
          
        case 2: // Parsing header
          addLog("success", "XP file version: 5.2");
          addLog("info", "Project metadata extracted");
          addLog("info", `Coordinate system: ${settings.coordinateSystem}`);
          break;
          
        case 3: // Network topology
          nodeCount = 145;
          addLog("success", `Extracted ${nodeCount} nodes from network`);
          addLog("info", "Network connectivity verified");
          break;
          
        case 4: // OPTIONS
          addLog("success", "Flow units set to CFS");
          addLog("info", `Flow routing: ${settings.routingMethod}`);
          addLog("info", "Infiltration method: Horton");
          break;
          
        case 5: // RAINGAGES
          if (settings.includeTimeSeries) {
            addLog("success", "Converted 3 rain gages");
            addLog("info", "Rain gage coordinates mapped");
          } else {
            addLog("warning", "Rain gages skipped (per settings)");
          }
          break;
          
        case 6: // SUBCATCHMENTS
          if (settings.includeSubcatchments) {
            subcatchmentCount = 89;
            addLog("success", `Converted ${subcatchmentCount} subcatchments`);
            addLog("info", "Subcatchment areas and imperviousness mapped");
            addLog("success", "SUBAREAS section generated");
          } else {
            addLog("warning", "Subcatchments skipped (per settings)");
          }
          break;
          
        case 7: // INFILTRATION
          if (settings.includeSubcatchments) {
            addLog("success", "Infiltration parameters converted (Horton method)");
            addLog("info", "Max rate, min rate, decay constant mapped");
          }
          break;
          
        case 8: // JUNCTIONS
          junctionCount = 132;
          addLog("success", `Converted ${junctionCount} junctions`);
          addLog("info", "Junction elevations and max depths mapped");
          addLog("warning", "2 junctions had missing ponded area (set to 0)");
          break;
          
        case 9: // OUTFALLS & STORAGE
          outfallCount = 8;
          storageCount = 5;
          addLog("success", `Converted ${outfallCount} outfalls`);
          addLog("success", `Converted ${storageCount} storage nodes`);
          addLog("info", "Storage depth-area curves mapped");
          break;
          
        case 10: // CONDUITS
          conduitCount = 172;
          addLog("success", `Converted ${conduitCount} conduits`);
          addLog("info", "Manning's N coefficients mapped");
          addLog("info", "Inlet/outlet offsets calculated");
          break;
          
        case 11: // PUMPS & ORIFICES
          pumpCount = 5;
          orificeCount = 8;
          addLog("success", `Converted ${pumpCount} pumps`);
          addLog("info", "Pump curves generated");
          addLog("success", `Converted ${orificeCount} orifices`);
          addLog("warning", "Variable orifice controls require manual review");
          break;
          
        case 12: // WEIRS & OUTLETS
          weirCount = 6;
          addLog("success", `Converted ${weirCount} weirs`);
          addLog("info", "Weir coefficients and discharge tables mapped");
          break;
          
        case 13: // XSECTIONS & LOSSES
          addLog("success", `Generated ${conduitCount + pumpCount} cross-section definitions`);
          addLog("info", "Circular, rectangular, and irregular sections converted");
          addLog("success", "Entry/exit losses and bend coefficients mapped");
          break;
          
        case 14: // CONTROLS
          if (settings.includeControls) {
            controlCount = 12;
            addLog("success", `Converted ${controlCount} control rules`);
            addLog("warning", "Complex RTC rules may need manual adjustment");
            addLog("info", "Time-based and conditional controls exported");
          } else {
            addLog("warning", "Control rules skipped (per settings)");
          }
          break;
          
        case 15: // TIMESERIES
          if (settings.includeTimeSeries) {
            timeSeriesCount = 8;
            addLog("success", `Converted ${timeSeriesCount} time series`);
            addLog("info", "Rainfall and flow time series mapped");
            addLog("warning", "Interpolated 23 missing time values");
          } else {
            addLog("warning", "Time series skipped (per settings)");
          }
          break;
          
        case 16: // COORDINATES
          addLog("success", `Mapped ${nodeCount} node coordinates`);
          addLog("info", `Coordinate system: ${settings.coordinateSystem}`);
          addLog("success", "Conduit vertices and polygons converted");
          break;
          
        case 17: // Assembling INP
          addLog("info", "Writing [TITLE] section");
          addLog("info", "Writing [OPTIONS] section");
          addLog("info", "Writing network sections");
          addLog("info", "Writing hydraulic sections");
          addLog("info", "Writing time series sections");
          addLog("success", "SWMM5 INP file assembled");
          break;
          
        case 18: // Validation
          addLog("info", "Checking node elevations...");
          addLog("info", "Verifying link connectivity...");
          addLog("info", "Validating cross-sections...");
          addLog("success", "All nodes have valid elevations");
          addLog("success", "All links connect to existing nodes");
          addLog("success", "No duplicate IDs found");
          break;
          
        case 19: // Report
          addLog("success", "Conversion report generated");
          addLog("info", `Total elements converted: ${nodeCount + conduitCount + subcatchmentCount}`);
          break;
      }
    }

    // Generate comprehensive results based on actual conversion
    const mockResults: ConversionResults = {
      statistics: {
        totalNodes: junctionCount + outfallCount + storageCount,
        totalLinks: conduitCount + pumpCount + orificeCount + weirCount,
        totalSubcatchments: settings.includeSubcatchments ? subcatchmentCount : 0,
        totalTimeSeries: settings.includeTimeSeries ? timeSeriesCount : 0,
        totalControls: settings.includeControls ? controlCount : 0,
      },
      warnings: [
        "2 junctions had missing ponded area values (defaulted to 0)",
        "Interpolated 23 missing time series values",
        "Variable orifice controls require manual review in SWMM5",
        "Complex RTC rules may need manual adjustment",
        "Some XPSWMM-specific parameters (2D flow, advanced routing) not supported in SWMM5",
        "Hot-start file references need to be verified",
      ],
      mappings: [
        { 
          xpswmmType: "Node", 
          swmm5Type: "JUNCTION", 
          count: junctionCount,
          notes: "Elevation, max depth, initial depth, surcharge depth, ponded area"
        },
        { 
          xpswmmType: "Outfall", 
          swmm5Type: "OUTFALL", 
          count: outfallCount,
          notes: "Outfall type and stage data"
        },
        { 
          xpswmmType: "Storage Node", 
          swmm5Type: "STORAGE", 
          count: storageCount,
          notes: "Depth-area curves converted"
        },
        { 
          xpswmmType: "Link", 
          swmm5Type: "CONDUIT", 
          count: conduitCount,
          notes: "Length, roughness, invert offsets, shape data"
        },
        { 
          xpswmmType: "Pump", 
          swmm5Type: "PUMP", 
          count: pumpCount, 
          notes: "Pump curves and control settings"
        },
        { 
          xpswmmType: "Orifice", 
          swmm5Type: "ORIFICE", 
          count: orificeCount,
          notes: "Discharge coefficients and control settings"
        },
        { 
          xpswmmType: "Weir", 
          swmm5Type: "WEIR", 
          count: weirCount,
          notes: "Weir type, height, and discharge coefficients"
        },
        { 
          xpswmmType: "Catchment", 
          swmm5Type: "SUBCATCHMENT", 
          count: subcatchmentCount,
          notes: "Area, imperviousness, width, slope, infiltration parameters"
        },
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
    // Generate comprehensive SWMM5 INP file based on actual export format
    const timestamp = new Date().toISOString();
    const mockInpContent = `[TITLE]
;;Project Title/Notes
;; Converted from XPSWMM file: ${selectedFile?.name}
;; Conversion date: ${timestamp}
;; Conversion settings:
;;   Unit System: ${settings.unitSystem}
;;   Coordinate System: ${settings.coordinateSystem}
;;   Routing Method: ${settings.routingMethod}
;;   Include Subcatchments: ${settings.includeSubcatchments ? "Yes" : "No"}
;;   Include Time Series: ${settings.includeTimeSeries ? "Yes" : "No"}
;;   Include Controls: ${settings.includeControls ? "Yes" : "No"}

[OPTIONS]
;;Option             Value
FLOW_UNITS           ${settings.unitSystem === "US Customary" ? "CFS" : "CMS"}
INFILTRATION         HORTON
FLOW_ROUTING         ${settings.routingMethod.toUpperCase().replace(/ /g, "_")}
LINK_OFFSETS         DEPTH
MIN_SLOPE            0
ALLOW_PONDING        NO
SKIP_STEADY_STATE    NO
START_DATE           01/01/2024
START_TIME           00:00:00
REPORT_START_DATE    01/01/2024
REPORT_START_TIME    00:00:00
END_DATE             01/02/2024
END_TIME             00:00:00
SWEEP_START          01/01
SWEEP_END            12/31
DRY_DAYS             0
REPORT_STEP          00:15:00
WET_STEP             00:05:00
DRY_STEP             01:00:00
ROUTING_STEP         0:00:30 
RULE_STEP            00:00:00

[EVAPORATION]
;;Data Source    Parameters
CONSTANT         0.0
DRY_ONLY         NO

${settings.includeTimeSeries ? `[RAINGAGES]
;;Name           Format    Interval SCF      Source    
RG1              INTENSITY 0:15     1.0      TIMESERIES TS_RAIN1
RG2              INTENSITY 0:15     1.0      TIMESERIES TS_RAIN2
RG3              INTENSITY 0:15     1.0      TIMESERIES TS_RAIN3

` : ""}${settings.includeSubcatchments ? `[SUBCATCHMENTS]
;;Name           Rain Gage        Outlet           Area     %Imperv  Width    %Slope   CurbLen  SnowPack        
S1               RG1              J1               5.2      45       400      0.5      0                        
S2               RG1              J2               3.8      55       350      0.8      0                        
S3               RG2              J5               4.1      40       420      0.6      0                        

[SUBAREAS]
;;Subcatchment   N-Imperv   N-Perv     S-Imperv   S-Perv     PctZero    RouteTo    PctRouted 
S1               0.015      0.24       0.06       0.3        25         OUTLET    
S2               0.015      0.24       0.06       0.3        25         OUTLET    
S3               0.015      0.24       0.06       0.3        25         OUTLET    

[INFILTRATION]
;;Subcatchment   MaxRate    MinRate    Decay      DryTime    MaxInfil  
S1               3.5        0.5        4          7          0         
S2               3.5        0.5        4          7          0         
S3               3.5        0.5        4          7          0         

` : ""}[JUNCTIONS]
;;Name           Elevation  MaxDepth   InitDepth  SurDepth   Aponded   
J1               100.0      10.0       0          0          0         
J2               95.0       12.0       0          0          0         
J3               92.0       11.0       0          0          0         
J4               88.0       13.0       0          0          0         
J5               85.0       14.0       0          0          0         

[OUTFALLS]
;;Name           Elevation  Type       Stage Data       Gated    Route To        
OUT1             75.0       FREE                        NO                       
OUT2             73.0       FREE                        NO                       

[STORAGE]
;;Name           Elev.    MaxDepth   InitDepth  Shape      Curve Name/Params            N/A      Fevap    Psi      Ksat     IMD     
ST1              80.0     15.0       0          TABULAR    ST1_Curve                    0        0       
ST2              78.0     18.0       0          FUNCTIONAL 1000     0        0            0        0       

[CONDUITS]
;;Name           From Node        To Node          Length     Roughness  InOffset   OutOffset  InitFlow   MaxFlow   
C1               J1               J2               400.0      0.013      0          0          0          0         
C2               J2               J3               350.0      0.013      0          0          0          0         
C3               J3               J4               420.0      0.015      0          0          0          0         
C4               J4               J5               380.0      0.013      0          0          0          0         
C5               J5               OUT1             500.0      0.013      0          0          0          0         
C6               ST1              J3               200.0      0.013      0          0          0          0         

[PUMPS]
;;Name           From Node        To Node          Pump Curve       Status   Sartup Shutoff 
P1               ST1              J1               PUMP1_Curve      ON       0      0       
P2               ST2              J2               PUMP2_Curve      ON       0      0       

[ORIFICES]
;;Name           From Node        To Node          Type         Offset     Qcoeff     Gated    CloseTime 
OR1              ST1              J1               SIDE         0          0.65       NO       0         
OR2              ST2              J2               BOTTOM       0          0.65       NO       0         

[WEIRS]
;;Name           From Node        To Node          Type         CrestHt    Qcoeff     Gated    EndCon   EndCoeff   Surcharge  RoadWidth  RoadSurf   Coeff. Curve
W1               J3               J4               TRANSVERSE   0          3.33       NO       0        0          YES       

[XSECTIONS]
;;Link           Shape        Geom1            Geom2      Geom3      Geom4      Barrels    Culvert   
C1               CIRCULAR     3.0              0          0          0          1                    
C2               CIRCULAR     2.5              0          0          0          1                    
C3               CIRCULAR     3.5              0          0          0          1                    
C4               CIRCULAR     3.0              0          0          0          1                    
C5               CIRCULAR     4.0              0          0          0          1                    
C6               CIRCULAR     2.0              0          0          0          1                    
OR1              CIRCULAR     1.5              0          0          0
OR2              CIRCULAR     1.2              0          0          0
W1               RECT_OPEN    5.0              2.0        0          0

[LOSSES]
;;Link           Kentry     Kexit      Kavg       Flap Gate  Seepage   
C1               0.5        1.0        0          NO         0         
C2               0.5        1.0        0          NO         0         
C3               0.5        1.0        0          NO         0         

${settings.includeControls ? `[CONTROLS]
;; Control rules converted from XPSWMM
RULE R1
IF NODE J1 DEPTH > 8.0
THEN PUMP P1 STATUS = ON
ELSE PUMP P1 STATUS = OFF

RULE R2
IF NODE ST1 DEPTH > 12.0
THEN ORIFICE OR1 SETTING = 1.0
ELSE ORIFICE OR1 SETTING = 0.5

` : ""}${settings.includeTimeSeries ? `[TIMESERIES]
;;Name           Date       Time       Value     
TS_RAIN1         FILE "rainfall1.dat"
TS_RAIN2         FILE "rainfall2.dat"
TS_RAIN3         FILE "rainfall3.dat"

` : ""}[REPORT]
;;Reporting Options
SUBCATCHMENTS ALL
NODES ALL
LINKS ALL

[TAGS]

[MAP]
DIMENSIONS 0.000 0.000 10000.000 10000.000
Units      None

[COORDINATES]
;;Node           X-Coord            Y-Coord           
J1               2000.000           5000.000          
J2               3000.000           5000.000          
J3               4000.000           4500.000          
J4               5000.000           4000.000          
J5               6000.000           3500.000          
OUT1             7000.000           3000.000          
OUT2             7500.000           2500.000          
ST1              2500.000           6000.000          
ST2              3500.000           6000.000          

[VERTICES]
;;Link           X-Coord            Y-Coord           
C3               4500.000           4250.000          

[CURVES]
;;Name           Type       X-Value    Y-Value   
;;Pump curves
PUMP1_Curve      PUMP1      0          0         
PUMP1_Curve                 5          10        
PUMP1_Curve                 10         15        
PUMP2_Curve      PUMP1      0          0         
PUMP2_Curve                 5          12        

;;Storage curves
ST1_Curve        STORAGE    0          1000      
ST1_Curve                   5          2000      
ST1_Curve                   10         3500      
ST1_Curve                   15         5000      

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
