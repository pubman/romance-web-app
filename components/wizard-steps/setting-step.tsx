"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingStepProps {
  preferences: any;
  onUpdate: (data: any) => void;
}

const timePeriods = [
  { id: "present", name: "Present Day", description: "2020s - Modern world" },
  { id: "recent", name: "Recent Past", description: "1990s-2010s" },
  { id: "vintage", name: "Vintage", description: "1950s-1980s" },
  { id: "regency", name: "Regency", description: "1811-1820" },
  { id: "victorian", name: "Victorian", description: "1837-1901" },
  { id: "medieval", name: "Medieval", description: "5th-15th century" },
];

const locations = [
  "Small Town", "Big City", "Coastal Village", "Mountain Cabin", "University",
  "Workplace", "Country Estate", "Vineyard", "Beach Resort", "Paris",
  "New York", "London", "Scottish Highlands", "Tuscany", "Fictional Kingdom"
];

const atmospheres = [
  { id: "cozy", name: "Cozy & Intimate", description: "Warm, comfortable settings" },
  { id: "glamorous", name: "Glamorous", description: "Luxurious, sophisticated places" },
  { id: "rustic", name: "Rustic & Natural", description: "Countryside, nature settings" },
  { id: "urban", name: "Urban & Modern", description: "City life, contemporary spaces" },
  { id: "exotic", name: "Exotic & Adventurous", description: "Unique, far-off locations" },
  { id: "mysterious", name: "Mysterious", description: "Intriguing, secretive places" },
];

export function SettingStep({ preferences, onUpdate }: SettingStepProps) {
  const updateSetting = (field: string, value: string) => {
    onUpdate({
      setting: {
        ...preferences.setting,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-heading mb-4">Time Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {timePeriods.map((period) => (
            <Button
              key={period.id}
              variant={preferences.setting.time_period === period.id ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => updateSetting("time_period", period.id)}
            >
              <span className="font-medium">{period.name}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {period.description}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-heading mb-4">Location</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          {locations.map((location) => (
            <Button
              key={location}
              variant={preferences.setting.location === location ? "default" : "outline"}
              size="sm"
              onClick={() => updateSetting("location", location)}
            >
              {location}
            </Button>
          ))}
        </div>
        <div>
          <Label htmlFor="custom-location">Or enter a custom location</Label>
          <Input
            id="custom-location"
            value={preferences.setting.location || ""}
            onChange={(e) => updateSetting("location", e.target.value)}
            placeholder="Enter your own location idea"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-heading mb-4">Atmosphere</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {atmospheres.map((atmosphere) => (
            <Card
              key={atmosphere.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                preferences.setting.atmosphere === atmosphere.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:border-primary/20"
              }`}
              onClick={() => updateSetting("atmosphere", atmosphere.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{atmosphere.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{atmosphere.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}