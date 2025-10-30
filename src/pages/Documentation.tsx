import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowRight, CheckCircle2, FileCode } from "lucide-react";

const Documentation = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-3 mb-8">
            <h1 className="text-4xl font-bold text-foreground">Documentation</h1>
            <p className="text-lg text-muted-foreground">
              Understanding XPSWMM to SWMM5 conversion methodology
            </p>
          </div>

          <Tabs defaultValue="supported" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="supported">Supported Elements</TabsTrigger>
              <TabsTrigger value="mapping">Element Mapping</TabsTrigger>
              <TabsTrigger value="limitations">Limitations</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
            </TabsList>

            <TabsContent value="supported" className="space-y-4 mt-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Supported XPSWMM Elements
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Network Elements
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                      <li className="text-muted-foreground">• Nodes (Junctions)</li>
                      <li className="text-muted-foreground">• Outfalls</li>
                      <li className="text-muted-foreground">• Storage Units</li>
                      <li className="text-muted-foreground">• Conduits (Pipes)</li>
                      <li className="text-muted-foreground">• Pumps</li>
                      <li className="text-muted-foreground">• Orifices</li>
                      <li className="text-muted-foreground">• Weirs</li>
                      <li className="text-muted-foreground">• Outlets</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Hydrology Elements
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                      <li className="text-muted-foreground">• Subcatchments (Catchments)</li>
                      <li className="text-muted-foreground">• Rainfall Data</li>
                      <li className="text-muted-foreground">• Rain Gauges</li>
                      <li className="text-muted-foreground">• Infiltration Parameters</li>
                      <li className="text-muted-foreground">• Subareas</li>
                      <li className="text-muted-foreground">• Time Series Data</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Control & Operations
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                      <li className="text-muted-foreground">• RTC Controls</li>
                      <li className="text-muted-foreground">• Operational Rules</li>
                      <li className="text-muted-foreground">• Control Curves</li>
                      <li className="text-muted-foreground">• Pump Curves</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4 mt-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  XPSWMM to SWMM5 Element Mapping
                </h2>

                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    The following table shows how XPSWMM elements are mapped to their SWMM5
                    equivalents:
                  </p>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-foreground">
                            XPSWMM Element
                          </th>
                          <th className="text-center p-3">
                            <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground" />
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-foreground">
                            SWMM5 Section
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-foreground">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm">Node</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[JUNCTIONS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Direct mapping with elevation, depth
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm">Outfall</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[OUTFALLS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Preserves boundary conditions
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm">Link/Conduit</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[CONDUITS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Includes Manning's n, slope
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm">Catchment</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[SUBCATCHMENTS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Area, imperviousness, width
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm">Pump</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[PUMPS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Pump curves converted
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm">Cross Section</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[XSECTIONS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Shape, dimensions preserved
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm">Rainfall</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[TIMESERIES]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Time series format conversion
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm">Control Rules</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[CONTROLS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            RTC logic translated
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="limitations" className="space-y-4 mt-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-warning" />
                  Known Limitations
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      XPSWMM-Specific Features
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li className="text-muted-foreground">
                        • Custom XPSWMM parameters not supported in SWMM5 are omitted
                      </li>
                      <li className="text-muted-foreground">
                        • Advanced 2D modeling features cannot be converted
                      </li>
                      <li className="text-muted-foreground">
                        • Some specialized hydraulic structures may require manual adjustment
                      </li>
                      <li className="text-muted-foreground">
                        • XPSWMM's built-in optimization features are not carried over
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      Data Approximations
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li className="text-muted-foreground">
                        • Time series data may be interpolated if timestamps don't align
                      </li>
                      <li className="text-muted-foreground">
                        • Complex control rules may be simplified
                      </li>
                      <li className="text-muted-foreground">
                        • Some curve data may be resampled for SWMM5 compatibility
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      Manual Review Required
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li className="text-muted-foreground">
                        • Always validate the converted model in SWMM5
                      </li>
                      <li className="text-muted-foreground">
                        • Check control rules for proper syntax and logic
                      </li>
                      <li className="text-muted-foreground">
                        • Verify time series data completeness
                      </li>
                      <li className="text-muted-foreground">
                        • Review any warnings in the conversion log
                      </li>
                    </ul>
                  </div>

                  <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
                    <p className="text-sm text-foreground">
                      <strong>Important:</strong> This tool performs automated conversion but does
                      not guarantee perfect 1:1 model equivalence. Always validate results before
                      using in production analysis.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="process" className="space-y-4 mt-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileCode className="h-6 w-6 text-primary" />
                  Conversion Process
                </h2>

                <div className="space-y-6">
                  <p className="text-muted-foreground">
                    The conversion process follows a systematic approach to ensure data integrity:
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        step: 1,
                        title: "File Reading & Validation",
                        description:
                          "The XPSWMM .xp file is read and validated for proper format and version compatibility.",
                      },
                      {
                        step: 2,
                        title: "Header Parsing",
                        description:
                          "Project metadata, units, and coordinate system information are extracted.",
                      },
                      {
                        step: 3,
                        title: "Network Element Extraction",
                        description:
                          "Nodes, junctions, conduits, and other network elements are parsed from the binary structure.",
                      },
                      {
                        step: 4,
                        title: "Data Transformation",
                        description:
                          "XPSWMM data structures are mapped to SWMM5 equivalents using conversion tables.",
                      },
                      {
                        step: 5,
                        title: "Section Generation",
                        description:
                          "SWMM5 .inp file sections are generated with proper formatting and syntax.",
                      },
                      {
                        step: 6,
                        title: "Control Rule Translation",
                        description:
                          "RTC and operational controls are converted to SWMM5 control syntax.",
                      },
                      {
                        step: 7,
                        title: "Time Series Processing",
                        description:
                          "Rainfall and other time series data are converted to SWMM5 format.",
                      },
                      {
                        step: 8,
                        title: "Coordinate Transformation",
                        description:
                          "Node coordinates are converted according to selected coordinate system.",
                      },
                      {
                        step: 9,
                        title: "Validation & Quality Check",
                        description:
                          "The generated SWMM5 model is validated for completeness and consistency.",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {item.step}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <p className="text-sm text-foreground">
                      <strong>Note:</strong> This is a demonstration interface. Full implementation
                      requires access to XPSWMM binary file format specifications and appropriate
                      parsing libraries.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Documentation;
