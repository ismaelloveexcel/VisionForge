import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

interface CodePreviewProps {
  files: FileNode[];
  selectedFile?: string;
  onSelectFile?: (path: string) => void;
}

function FileTree({
  nodes,
  level = 0,
  path = "",
  selectedFile,
  onSelectFile,
}: {
  nodes: FileNode[];
  level?: number;
  path?: string;
  selectedFile?: string;
  onSelectFile?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="text-sm">
      {nodes.map((node) => {
        const nodePath = path ? `${path}/${node.name}` : node.name;
        const isExpanded = expanded[nodePath] ?? true;
        const isSelected = selectedFile === nodePath;

        return (
          <div key={nodePath}>
            <button
              onClick={() => {
                if (node.type === "folder") {
                  setExpanded((prev) => ({ ...prev, [nodePath]: !isExpanded }));
                } else {
                  onSelectFile?.(nodePath);
                }
              }}
              className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left hover-elevate ${
                isSelected ? "bg-accent text-accent-foreground" : ""
              }`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              data-testid={`file-tree-${node.name}`}
            >
              {node.type === "folder" ? (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <Folder className="h-3.5 w-3.5 shrink-0 text-chart-4" />
                </>
              ) : (
                <>
                  <span className="w-3.5" />
                  <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </>
              )}
              <span className="truncate">{node.name}</span>
            </button>
            {node.type === "folder" && isExpanded && node.children && (
              <FileTree
                nodes={node.children}
                level={level + 1}
                path={nodePath}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CodePreview({ files, selectedFile, onSelectFile }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const findFile = (
    nodes: FileNode[],
    path: string
  ): FileNode | undefined => {
    for (const node of nodes) {
      const nodePath = node.name;
      if (nodePath === path.split("/")[0]) {
        if (path.split("/").length === 1) return node;
        if (node.children) {
          const result = findFile(
            node.children,
            path.split("/").slice(1).join("/")
          );
          if (result) return result;
        }
      }
    }
    return undefined;
  };

  const currentFile = selectedFile ? findFile(files, selectedFile) : undefined;

  const handleCopy = () => {
    if (currentFile?.content) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full overflow-hidden rounded-lg border border-border bg-card">
      <div className="w-48 shrink-0 border-r border-border bg-sidebar p-2">
        <ScrollArea className="h-full">
          <FileTree
            nodes={files}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {currentFile?.content ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
              <span className="text-sm font-medium truncate">
                {selectedFile}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopy}
                data-testid="button-copy-code"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-status-online" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <pre className="p-4 text-sm font-mono">
                <code>{currentFile.content}</code>
              </pre>
            </ScrollArea>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a file to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
