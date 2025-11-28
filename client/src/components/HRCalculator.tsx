import { useState } from "react";
import { Calculator, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CalculatorType = "gratuity" | "emiratisation";

interface HRCalculatorProps {
  type: CalculatorType;
}

export function HRCalculator({ type }: HRCalculatorProps) {
  const [basicSalary, setBasicSalary] = useState("");
  const [yearsOfService, setYearsOfService] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [emiratiCount, setEmiratiCount] = useState("");
  const [terminationType, setTerminationType] = useState<string>("employer");
  const [result, setResult] = useState<string | null>(null);

  const calculateGratuity = () => {
    const salary = parseFloat(basicSalary);
    const years = parseFloat(yearsOfService);

    if (isNaN(salary) || isNaN(years) || years < 0.5) {
      setResult("Minimum 6 months of service required for gratuity.");
      return;
    }

    let gratuity = 0;

    if (years <= 5) {
      gratuity = (salary * 21 * years) / 30;
    } else {
      gratuity = (salary * 21 * 5) / 30 + (salary * 30 * (years - 5)) / 30;
    }

    const maxGratuity = salary * 18;
    gratuity = Math.min(gratuity, maxGratuity);

    if (terminationType === "employee" && years < 5) {
      if (years >= 3) {
        gratuity = gratuity * (2 / 3);
      } else if (years >= 1) {
        gratuity = gratuity * (1 / 3);
      } else {
        gratuity = 0;
      }
    }

    setResult(`Estimated Gratuity: AED ${gratuity.toFixed(2)}`);
  };

  const calculateEmiratisation = () => {
    const total = parseInt(employeeCount);
    const emiratis = parseInt(emiratiCount);

    if (isNaN(total) || total < 20) {
      setResult("Emiratisation applies to companies with 20+ employees.");
      return;
    }

    const targetPercentage = 0.08;
    const requiredEmirates = Math.ceil(total * targetPercentage);
    const currentPercentage = ((emiratis / total) * 100).toFixed(1);
    const shortfall = Math.max(0, requiredEmirates - emiratis);

    if (shortfall > 0) {
      const penalty = shortfall * 108000;
      setResult(
        `Current: ${currentPercentage}% (${emiratis}/${total})\nTarget: 8% (${requiredEmirates} required)\nShortfall: ${shortfall} Emiratis\nPotential Penalty: AED ${penalty.toLocaleString()}`
      );
    } else {
      setResult(
        `Current: ${currentPercentage}% (${emiratis}/${total})\nTarget: 8% - Compliant!`
      );
    }
  };

  if (type === "gratuity") {
    return (
      <Card data-testid="card-hr-gratuity">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            End of Service Gratuity Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary">Basic Salary (AED)</Label>
            <Input
              id="salary"
              type="number"
              placeholder="e.g., 10000"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              data-testid="input-salary"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="years">Years of Service</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Minimum 6 months required for gratuity eligibility</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="years"
              type="number"
              step="0.1"
              placeholder="e.g., 3.5"
              value={yearsOfService}
              onChange={(e) => setYearsOfService(e.target.value)}
              data-testid="input-years"
            />
          </div>
          <div className="space-y-2">
            <Label>Termination Type</Label>
            <Select value={terminationType} onValueChange={setTerminationType}>
              <SelectTrigger data-testid="select-termination">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employer">By Employer</SelectItem>
                <SelectItem value="employee">By Employee (Resignation)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={calculateGratuity} data-testid="button-calculate-gratuity">
            Calculate Gratuity
          </Button>
          {result && (
            <div className="rounded-md bg-accent p-3 text-sm whitespace-pre-wrap">
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-hr-emiratisation">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          Emiratisation Quota Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="total-employees">Total Employees</Label>
          <Input
            id="total-employees"
            type="number"
            placeholder="e.g., 100"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            data-testid="input-total-employees"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="emirati-count">Current Emirati Employees</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>2025 target: 8% Emirati workforce</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="emirati-count"
            type="number"
            placeholder="e.g., 5"
            value={emiratiCount}
            onChange={(e) => setEmiratiCount(e.target.value)}
            data-testid="input-emirati-count"
          />
        </div>
        <Button className="w-full" onClick={calculateEmiratisation} data-testid="button-calculate-emiratisation">
          Check Compliance
        </Button>
        {result && (
          <div className="rounded-md bg-accent p-3 text-sm whitespace-pre-wrap">
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
