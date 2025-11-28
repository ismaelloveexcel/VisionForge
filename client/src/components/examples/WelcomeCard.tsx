import { WelcomeCard } from "../WelcomeCard";

export default function WelcomeCardExample() {
  return (
    <div className="p-4 space-y-4">
      <WelcomeCard
        mode="development"
        onQuickAction={(action) => console.log("Action:", action)}
      />
    </div>
  );
}
