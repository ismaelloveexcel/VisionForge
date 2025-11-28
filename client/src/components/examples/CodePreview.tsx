import { useState } from "react";
import { CodePreview } from "../CodePreview";

const mockFiles = [
  {
    name: "src",
    type: "folder" as const,
    children: [
      {
        name: "App.tsx",
        type: "file" as const,
        content: `import { TaskList } from "./components/TaskList";
import { AddTask } from "./components/AddTask";

export default function App() {
  return (
    <div className="container mx-auto p-4">
      <h1>Task Manager</h1>
      <AddTask />
      <TaskList />
    </div>
  );
}`,
      },
      {
        name: "components",
        type: "folder" as const,
        children: [
          {
            name: "TaskList.tsx",
            type: "file" as const,
            content: `export function TaskList() {
  return <div>Tasks here</div>;
}`,
          },
        ],
      },
    ],
  },
  {
    name: "package.json",
    type: "file" as const,
    content: `{
  "name": "task-manager",
  "version": "1.0.0"
}`,
  },
];

export default function CodePreviewExample() {
  const [selected, setSelected] = useState("src/App.tsx");
  return (
    <div className="h-[400px] p-4">
      <CodePreview
        files={mockFiles}
        selectedFile={selected}
        onSelectFile={setSelected}
      />
    </div>
  );
}
