import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ConversionSettings {
  includeSubcatchments: boolean;
  includeTimeSeries: boolean;
  includeControls: boolean;
  coordinateSystem: string;
  unitSystem: string;
  routingMethod: string;
}

interface ConversionOptionsProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
}

export const ConversionOptions = ({ settings, onSettingsChange }: ConversionOptionsProps) => {
  const updateSetting = <K extends keyof ConversionSettings>(
    key: K,
    value: ConversionSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Conversion Settings</h2>
          <p className="text-sm text-muted-foreground">Configure conversion parameters</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="subcatchments"
              checked={settings.includeSubcatchments}
              onCheckedChange={(checked) =>
                updateSetting("includeSubcatchments", checked === true)
              }
            />
            <div className="grid gap-1">
              <Label htmlFor="subcatchments" className="font-medium text-foreground">
                Include Subcatchments
              </Label>
              <p className="text-sm text-muted-foreground">Convert subcatchment data</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="timeseries"
              checked={settings.includeTimeSeries}
              onCheckedChange={(checked) =>
                updateSetting("includeTimeSeries", checked === true)
              }
            />
            <div className="grid gap-1">
              <Label htmlFor="timeseries" className="font-medium text-foreground">
                Include Time Series
              </Label>
              <p className="text-sm text-muted-foreground">
                Convert rainfall and other time series data
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="controls"
              checked={settings.includeControls}
              onCheckedChange={(checked) =>
                updateSetting("includeControls", checked === true)
              }
            />
            <div className="grid gap-1">
              <Label htmlFor="controls" className="font-medium text-foreground">
                Include Controls
              </Label>
              <p className="text-sm text-muted-foreground">
                Convert RTC controls and operational rules
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-foreground">Coordinate System</Label>
            <Select
              value={settings.coordinateSystem}
              onValueChange={(value) => updateSetting("coordinateSystem", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Keep Original">Keep Original</SelectItem>
                <SelectItem value="Convert to State Plane">Convert to State Plane</SelectItem>
                <SelectItem value="Convert to UTM">Convert to UTM</SelectItem>
                <SelectItem value="Convert to Lat/Long">Convert to Lat/Long</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-foreground">Unit System</Label>
            <Select
              value={settings.unitSystem}
              onValueChange={(value) => updateSetting("unitSystem", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US Customary">US Customary</SelectItem>
                <SelectItem value="SI Metric">SI Metric</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-foreground">Flow Routing Method</Label>
            <Select
              value={settings.routingMethod}
              onValueChange={(value) => updateSetting("routingMethod", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kinematic Wave">Kinematic Wave</SelectItem>
                <SelectItem value="Dynamic Wave">Dynamic Wave</SelectItem>
                <SelectItem value="Steady Flow">Steady Flow</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Select SWMM5 routing method</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
