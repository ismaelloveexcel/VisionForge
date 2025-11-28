import { ProgressCard } from "../ProgressCard";

export default function ProgressCardExample() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <ProgressCard
        action="analyzing"
        title="Analyzing Requirements"
        description="Extracting features from description"
        status="completed"
      />
      <ProgressCard
        action="coding"
        title="Generating Frontend"
        description="Creating React components"
        progress={65}
        status="in-progress"
      />
      <ProgressCard
        action="deploying"
        title="Deploy to GitHub"
        description="Push to repository"
        status="pending"
      />
    </div>
  );
}
