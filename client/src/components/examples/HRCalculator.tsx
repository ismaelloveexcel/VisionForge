import { HRCalculator } from "../HRCalculator";

export default function HRCalculatorExample() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      <HRCalculator type="gratuity" />
      <HRCalculator type="emiratisation" />
    </div>
  );
}
