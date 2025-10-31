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
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mb-4">
                    <p className="text-sm text-foreground">
                      <strong>XPSWMM File Format:</strong> Proprietary binary format (.xp) that can be exported to EPA SWMM5 text-based format (.inp) via File → Import/Export Data → Export to EPASWMM 5
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Hydraulic Network Elements
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                      <li className="text-muted-foreground">• Junctions (Nodes)</li>
                      <li className="text-muted-foreground">• Outfalls (Boundary conditions)</li>
                      <li className="text-muted-foreground">• Storage Units</li>
                      <li className="text-muted-foreground">• Flow Dividers</li>
                      <li className="text-muted-foreground">• Conduits (Pipes/Channels)</li>
                      <li className="text-muted-foreground">• Pumps (with curves)</li>
                      <li className="text-muted-foreground">• Orifices</li>
                      <li className="text-muted-foreground">• Weirs</li>
                      <li className="text-muted-foreground">• Outlets</li>
                      <li className="text-muted-foreground">• Cross Sections (XSECTIONS)</li>
                      <li className="text-muted-foreground">• Transects (Irregular shapes)</li>
                      <li className="text-muted-foreground">• Link Losses (Entry/Exit/Avg)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Hydrology & Runoff
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                      <li className="text-muted-foreground">• Subcatchments (Drainage areas)</li>
                      <li className="text-muted-foreground">• Rain Gauges</li>
                      <li className="text-muted-foreground">• Subareas (Pervious/Impervious)</li>
                      <li className="text-muted-foreground">• Infiltration (Horton, Green-Ampt, Curve Number)</li>
                      <li className="text-muted-foreground">• Aquifers & Groundwater</li>
                      <li className="text-muted-foreground">• Time Series Data</li>
                      <li className="text-muted-foreground">• Evaporation</li>
                      <li className="text-muted-foreground">• Temperature</li>
                      <li className="text-muted-foreground">• Snow Packs</li>
                      <li className="text-muted-foreground">• RDII (Rainfall-Dependent Inflow/Infiltration)</li>
                      <li className="text-muted-foreground">• LID Controls (Low Impact Development)</li>
                      <li className="text-muted-foreground">• Dry Weather Flow (DWF)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Water Quality & Pollutants
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                      <li className="text-muted-foreground">• Pollutants</li>
                      <li className="text-muted-foreground">• Land Uses</li>
                      <li className="text-muted-foreground">• Coverages</li>
                      <li className="text-muted-foreground">• Loadings</li>
                      <li className="text-muted-foreground">• Buildup Functions</li>
                      <li className="text-muted-foreground">• Washoff Functions</li>
                      <li className="text-muted-foreground">• Treatment</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Control & Support Elements
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                      <li className="text-muted-foreground">• Control Rules (RTC)</li>
                      <li className="text-muted-foreground">• Curves (Pump, Storage, etc.)</li>
                      <li className="text-muted-foreground">• Patterns (Temporal)</li>
                      <li className="text-muted-foreground">• Inflows</li>
                      <li className="text-muted-foreground">• Hydrographs</li>
                      <li className="text-muted-foreground">• Coordinates & Vertices</li>
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
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <p className="text-sm text-foreground mb-2">
                      <strong>SWMM5 INP File Structure:</strong> Text-based format with bracketed sections
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The .inp file contains ~40+ sections, each prefixed with [SECTION_NAME]. Elements are defined as space or tab-delimited rows.
                    </p>
                  </div>

                  <div className="border border-border rounded-lg overflow-x-auto">
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
                            SWMM5 Section(s)
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-foreground">
                            Key Attributes Mapped
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Node/Junction</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[JUNCTIONS]<br/>[COORDINATES]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Elevation, MaxDepth, InitDepth, SurDepth, Aponded, X/Y coords
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Outfall</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[OUTFALLS]<br/>[COORDINATES]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Elevation, Type (FREE/NORMAL/FIXED/TIDAL/TIMESERIES), Stage Data
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Storage Node</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[STORAGE]<br/>[COORDINATES]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Elevation, MaxDepth, InitDepth, Shape/Curve, Aponded
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Link/Conduit</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[CONDUITS]<br/>[XSECTIONS]<br/>[VERTICES]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Node1, Node2, Length, Manning's N, InOffset1/2, InitFlow, MaxFlow; Shape, Geom1-4
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Pump</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[PUMPS]<br/>[CURVES]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Node1, Node2, Pump Curve ID, Status, Startup/Shutoff Depth
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Orifice</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[ORIFICES]<br/>[XSECTIONS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Node1, Node2, Type (SIDE/BOTTOM), Offset, Qcoeff, Gated, CloseTime
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Weir</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[WEIRS]<br/>[XSECTIONS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Node1, Node2, Type (TRANSVERSE/SIDEFLOW/V-NOTCH/TRAPEZOIDAL/ROADWAY), CrestHt, Qcoeff, Gated
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Outlet</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[OUTLETS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Node1, Node2, Offset, Type (TABULAR/DEPTH/HEAD), Qcoeff/Curve
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Catchment/Subcatchment</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[SUBCATCHMENTS]<br/>[SUBAREAS]<br/>[INFILTRATION]<br/>[POLYGONS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Raingage, Outlet, Area, %Imperv, Width, Slope, CurbLen; N-Imperv/Perv, S-Imperv/Perv, PctZero, RouteTo; Infiltration params
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Rain Gauge</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[RAINGAGES]<br/>[TIMESERIES]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Format (INTENSITY/VOLUME/CUMULATIVE), Interval, SCF, Source (TIMESERIES/FILE)
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Control Rules</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[CONTROLS]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            RULE-based or simple condition-action syntax (IF-THEN-ELSE logic)
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Time Series Data</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[TIMESERIES]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Date/Time value pairs or FILE reference with external data
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">LID Controls</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[LID_CONTROLS]<br/>[LID_USAGE]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            Type (BC/RG/IT/PP/RB/VS/RD), Layer parameters; Subcatchment, LIDProcess, Number, Area, Width, InitSat, FromImp, ToPerv
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm font-medium">Simulation Options</td>
                          <td></td>
                          <td className="p-3 text-sm font-mono bg-muted/20">[OPTIONS]<br/>[REPORT]</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            FLOW_UNITS, INFILTRATION, FLOW_ROUTING, START/END_DATE, TIMESTEP controls, etc.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Complete SWMM5 Section Reference</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="text-muted-foreground">[TITLE]</div>
                      <div className="text-muted-foreground">[OPTIONS]</div>
                      <div className="text-muted-foreground">[REPORT]</div>
                      <div className="text-muted-foreground">[FILES]</div>
                      <div className="text-muted-foreground">[RAINGAGES]</div>
                      <div className="text-muted-foreground">[EVAPORATION]</div>
                      <div className="text-muted-foreground">[TEMPERATURE]</div>
                      <div className="text-muted-foreground">[ADJUSTMENTS]</div>
                      <div className="text-muted-foreground">[SUBCATCHMENTS]</div>
                      <div className="text-muted-foreground">[SUBAREAS]</div>
                      <div className="text-muted-foreground">[INFILTRATION]</div>
                      <div className="text-muted-foreground">[LID_CONTROLS]</div>
                      <div className="text-muted-foreground">[LID_USAGE]</div>
                      <div className="text-muted-foreground">[AQUIFERS]</div>
                      <div className="text-muted-foreground">[GROUNDWATER]</div>
                      <div className="text-muted-foreground">[GWF]</div>
                      <div className="text-muted-foreground">[SNOWPACKS]</div>
                      <div className="text-muted-foreground">[JUNCTIONS]</div>
                      <div className="text-muted-foreground">[OUTFALLS]</div>
                      <div className="text-muted-foreground">[DIVIDERS]</div>
                      <div className="text-muted-foreground">[STORAGE]</div>
                      <div className="text-muted-foreground">[CONDUITS]</div>
                      <div className="text-muted-foreground">[PUMPS]</div>
                      <div className="text-muted-foreground">[ORIFICES]</div>
                      <div className="text-muted-foreground">[WEIRS]</div>
                      <div className="text-muted-foreground">[OUTLETS]</div>
                      <div className="text-muted-foreground">[XSECTIONS]</div>
                      <div className="text-muted-foreground">[TRANSECTS]</div>
                      <div className="text-muted-foreground">[LOSSES]</div>
                      <div className="text-muted-foreground">[CONTROLS]</div>
                      <div className="text-muted-foreground">[POLLUTANTS]</div>
                      <div className="text-muted-foreground">[LANDUSES]</div>
                      <div className="text-muted-foreground">[COVERAGES]</div>
                      <div className="text-muted-foreground">[LOADINGS]</div>
                      <div className="text-muted-foreground">[BUILDUP]</div>
                      <div className="text-muted-foreground">[WASHOFF]</div>
                      <div className="text-muted-foreground">[TREATMENT]</div>
                      <div className="text-muted-foreground">[INFLOWS]</div>
                      <div className="text-muted-foreground">[DWF]</div>
                      <div className="text-muted-foreground">[RDII]</div>
                      <div className="text-muted-foreground">[HYDROGRAPHS]</div>
                      <div className="text-muted-foreground">[CURVES]</div>
                      <div className="text-muted-foreground">[TIMESERIES]</div>
                      <div className="text-muted-foreground">[PATTERNS]</div>
                      <div className="text-muted-foreground">[MAP]</div>
                      <div className="text-muted-foreground">[COORDINATES]</div>
                      <div className="text-muted-foreground">[VERTICES]</div>
                      <div className="text-muted-foreground">[POLYGONS]</div>
                      <div className="text-muted-foreground">[SYMBOLS]</div>
                      <div className="text-muted-foreground">[LABELS]</div>
                      <div className="text-muted-foreground">[BACKDROP]</div>
                      <div className="text-muted-foreground">[TAGS]</div>
                      <div className="text-muted-foreground">[PROFILES]</div>
                    </div>
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
                  <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg mb-4">
                    <p className="text-sm text-foreground">
                      <strong>File Format Difference:</strong> XPSWMM uses proprietary binary format (.xp), while SWMM5 uses human-readable text format (.inp). This fundamental difference means some XPSWMM-specific features cannot be represented in SWMM5.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      Format-Specific Limitations
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li className="text-muted-foreground">
                        • <strong>Binary vs Text:</strong> XPSWMM's .xp binary format may contain proprietary data structures not translatable to text-based .inp
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Advanced 2D Modeling:</strong> XPSWMM's 2D surface flow modeling features have no SWMM5 equivalent
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Link Offsets:</strong> XPSWMM uses DEPTH or ELEVATION differently; conversion may require offset calculations
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Flow Routing:</strong> SWMM5 Dynamic Wave is the only routing method supported in some contexts
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Coordinate Systems:</strong> Geographic coordinate transformations may be needed during export
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      XPSWMM Features Not Supported in SWMM5
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li className="text-muted-foreground">
                        • XPSWMM-specific optimization and calibration tools
                      </li>
                      <li className="text-muted-foreground">
                        • Proprietary XPSWMM parameters and custom element types
                      </li>
                      <li className="text-muted-foreground">
                        • Advanced graphics and visualization data (labels, symbols stored differently)
                      </li>
                      <li className="text-muted-foreground">
                        • Some specialized hydraulic structures unique to XPSWMM
                      </li>
                      <li className="text-muted-foreground">
                        • XPSWMM's integrated GIS and real-time control interfaces
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      Data Transformation Issues
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li className="text-muted-foreground">
                        • <strong>Time Series:</strong> Data may be interpolated if timestamps don't align with SWMM5 requirements
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Control Rules:</strong> Complex XPSWMM RTC logic may need simplification for SWMM5 syntax
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Curves:</strong> Some curve data may be resampled or approximated for SWMM5 compatibility
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Infiltration Models:</strong> Method-specific parameters must match between systems (Horton, Green-Ampt, Curve Number, Modified variants)
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Unit Conversions:</strong> FLOW_UNITS setting affects all hydraulic calculations; verify unit consistency
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      Version Compatibility
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li className="text-muted-foreground">
                        • SWMM5 versions 5.0 to 5.1.015 are most commonly supported
                      </li>
                      <li className="text-muted-foreground">
                        • Newer SWMM5 features (v5.2+) like street cross-sections may not be available in older XPSWMM exports
                      </li>
                      <li className="text-muted-foreground">
                        • XPSWMM version differences can affect export completeness
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      Required Manual Validation
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li className="text-muted-foreground">
                        • <strong>Model Integrity:</strong> Run SWMM5 model checker to identify structural issues
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Control Rules:</strong> Verify all IF-THEN-ELSE logic and rule syntax
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Time Series:</strong> Check data completeness and temporal alignment
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Coordinates:</strong> Verify node/vertex positions match original XPSWMM layout
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Results Comparison:</strong> Run parallel simulations and compare outputs for consistency
                      </li>
                      <li className="text-muted-foreground">
                        • <strong>Conversion Log:</strong> Review all warnings and errors from export process
                      </li>
                    </ul>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                    <p className="text-sm text-foreground">
                      <strong>Critical Warning:</strong> Automated conversion does NOT guarantee perfect 1:1 model equivalence. Differences in hydraulic engines, numerical methods, and data representation can produce varying results. Always perform thorough validation before using converted models for engineering decisions or regulatory submittals.
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
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Standard XPSWMM Export Workflow</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>1. Open XPSWMM model (.xp file)</li>
                      <li>2. Select "Runoff Mode" from toolbar (if exporting hydrology)</li>
                      <li>3. File → Import/Export Data → Export to EPASWMM 5</li>
                      <li>4. Save exported .inp file (same name as .xp, same location)</li>
                      <li>5. Confirm save when prompted</li>
                      <li>6. Open .inp file in SWMM5 or compatible software</li>
                    </ol>
                  </div>

                  <p className="text-muted-foreground">
                    A complete XPSWMM to SWMM5 conversion follows a systematic approach to ensure data integrity:
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        step: 1,
                        title: "File Reading & Format Detection",
                        description:
                          "Read XPSWMM .xp binary file, validate file signature, and check version compatibility (SWMM methods must be enabled in XPSWMM model settings).",
                      },
                      {
                        step: 2,
                        title: "Header & Metadata Parsing",
                        description:
                          "Extract [TITLE], [OPTIONS] including FLOW_UNITS, INFILTRATION method, FLOW_ROUTING, coordinate system, and temporal settings (START_DATE, END_DATE, timesteps).",
                      },
                      {
                        step: 3,
                        title: "Hydraulic Network Extraction",
                        description:
                          "Parse nodes (Junctions, Outfalls, Storage, Dividers) with elevations, depths, and coordinates. Extract links (Conduits, Pumps, Orifices, Weirs, Outlets) with connectivity and properties.",
                      },
                      {
                        step: 4,
                        title: "Cross-Section & Geometry Conversion",
                        description:
                          "Map XPSWMM cross-section data to [XSECTIONS] format (CIRCULAR, RECT_CLOSED, TRAPEZOIDAL, etc.). Convert transects if present. Apply Manning's N and loss coefficients.",
                      },
                      {
                        step: 5,
                        title: "Hydrology Element Mapping",
                        description:
                          "Convert subcatchments/catchments to [SUBCATCHMENTS] with area, %imperviousness, width, slope. Generate [SUBAREAS] with N-values and depression storage. Map infiltration parameters to [INFILTRATION].",
                      },
                      {
                        step: 6,
                        title: "Rainfall & Time Series Processing",
                        description:
                          "Extract rain gauge data to [RAINGAGES]. Convert rainfall time series to [TIMESERIES] format (Date/Time Value pairs or FILE reference). Process patterns for DWF and other temporal data.",
                      },
                      {
                        step: 7,
                        title: "Control Rule Translation",
                        description:
                          "Convert XPSWMM RTC (Real-Time Control) logic to SWMM5 [CONTROLS] syntax. Translate IF-THEN-ELSE statements, condition thresholds, and action commands. Validate rule dependencies.",
                      },
                      {
                        step: 8,
                        title: "Curve & Pattern Generation",
                        description:
                          "Export pump curves, storage curves, rating curves to [CURVES]. Convert temporal patterns (dry weather flow, etc.) to [PATTERNS]. Ensure curve IDs are properly referenced.",
                      },
                      {
                        step: 9,
                        title: "Coordinate & Graphics Processing",
                        description:
                          "Transform node coordinates to [COORDINATES] section (apply coordinate system conversion if needed). Extract link vertices to [VERTICES]. Convert subcatchment polygons to [POLYGONS].",
                      },
                      {
                        step: 10,
                        title: "Water Quality Conversion (if applicable)",
                        description:
                          "Map pollutants to [POLLUTANTS]. Convert land uses to [LANDUSES]. Export buildup/washoff functions. Process treatment data if present.",
                      },
                      {
                        step: 11,
                        title: "Additional Features",
                        description:
                          "Process LID controls to [LID_CONTROLS] and [LID_USAGE]. Convert groundwater settings to [AQUIFERS] and [GROUNDWATER]. Export snow pack data if present. Handle RDII unit hydrographs.",
                      },
                      {
                        step: 12,
                        title: "INP File Assembly",
                        description:
                          "Write all sections to .inp file in correct order with proper formatting. Use space or tab delimiters. Add section headers [SECTION_NAME]. Include comments where helpful.",
                      },
                      {
                        step: 13,
                        title: "Validation & Quality Assurance",
                        description:
                          "Check for required sections (OPTIONS, JUNCTIONS/OUTFALLS, CONDUITS, etc.). Verify all link endpoints reference existing nodes. Ensure no duplicate IDs. Validate numeric ranges and units.",
                      },
                      {
                        step: 14,
                        title: "Conversion Report Generation",
                        description:
                          "Log conversion statistics (element counts, sections generated). Document warnings (unsupported features, approximations made). List any errors or manual review items. Provide comparison summary.",
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Key Technical Considerations</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• LINK_OFFSETS: DEPTH vs ELEVATION handling</li>
                        <li>• Unit system consistency (CFS, GPM, etc.)</li>
                        <li>• Infiltration model parameter mapping</li>
                        <li>• Coordinate system transformations</li>
                        <li>• Time zone and temporal alignment</li>
                      </ul>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Post-Conversion Checklist</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Open .inp in SWMM5 GUI - check for errors</li>
                        <li>• Verify network connectivity on map</li>
                        <li>• Review all warnings in conversion log</li>
                        <li>• Test run simulation (short duration)</li>
                        <li>• Compare results with original XPSWMM</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
                    <p className="text-sm text-foreground">
                      <strong>Implementation Note:</strong> This demonstration interface shows the conversion workflow. Full implementation requires XPSWMM binary file format specifications (proprietary) and parsing libraries capable of reading .xp files, or alternatively, working with XPSWMM's native export functionality.
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
