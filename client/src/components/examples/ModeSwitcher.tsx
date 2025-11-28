import { useState } from "react";
import { ModeSwitcher } from "../ModeSwitcher";

export default function ModeSwitcherExample() {
  const [mode, setMode] = useState<"development" | "hr">("development");
  return <ModeSwitcher mode={mode} onModeChange={setMode} />;
}
