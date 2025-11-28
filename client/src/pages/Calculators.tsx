import { HRCalculator } from "@/components/HRCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, FileText, Calendar, Banknote } from "lucide-react";

const quickFacts = [
  {
    icon: Banknote,
    title: "Gratuity Eligibility",
    value: "6 months",
    description: "Minimum service required",
  },
  {
    icon: Calendar,
    title: "Annual Leave",
    value: "30 days",
    description: "After 1 year of service",
  },
  {
    icon: FileText,
    title: "Contract Type",
    value: "Fixed-term",
    description: "Max 3 years, renewable",
  },
  {
    icon: Calculator,
    title: "Emiratisation",
    value: "8%",
    description: "2025 target for 50+ employees",
  },
];

export default function Calculators() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold">HR Calculators</h1>
          <Badge variant="secondary">UAE 2025</Badge>
        </div>
        <p className="text-muted-foreground">
          UAE labor law compliant calculators based on Federal Decree-Law No. 33/2021 and 2025 amendments
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickFacts.map(({ icon: Icon, title, value, description }) => (
          <Card key={title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{title}</p>
                  <p className="text-lg font-semibold">{value}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HRCalculator type="gratuity" />
        <HRCalculator type="emiratisation" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            These calculators provide estimates based on UAE Federal Decree-Law No. 33/2021 
            and its amendments. For official calculations, consult MOHRE or a qualified HR professional.
          </p>
          <p>
            Gratuity is calculated on basic salary only, excluding allowances and bonuses. 
            Maximum gratuity is capped at 1.5 years of salary.
          </p>
          <p>
            Emiratisation requirements apply to private sector companies registered with MOHRE. 
            Non-compliance penalties are AED 108,000 per missing Emirati hire.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
