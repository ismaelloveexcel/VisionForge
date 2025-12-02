import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  FileJson,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  size?: number;
  modifiedAt?: string;
}

interface CodePreviewProps {
  files?: FileNode[];
  selectedFile?: string;
  onSelectFile?: (path: string) => void;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return <FileCode className="h-3.5 w-3.5 shrink-0 text-yellow-500" />;
    case "json":
      return <FileJson className="h-3.5 w-3.5 shrink-0 text-yellow-600" />;
    case "html":
      return <FileCode className="h-3.5 w-3.5 shrink-0 text-orange-500" />;
    case "css":
    case "scss":
      return <FileCode className="h-3.5 w-3.5 shrink-0 text-blue-500" />;
    case "py":
      return <FileCode className="h-3.5 w-3.5 shrink-0 text-green-500" />;
    case "md":
      return <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />;
    default:
      return <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
  }
}

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    sh: "bash",
    bash: "bash",
    yml: "yaml",
    yaml: "yaml",
    sql: "sql",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
  };
  return langMap[ext || ""] || "text";
}

function FileTree({
  nodes,
  level = 0,
  selectedFile,
  onSelectFile,
}: {
  nodes: FileNode[];
  level?: number;
  selectedFile?: string;
  onSelectFile?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    nodes.forEach((node) => {
      if (node.type === "folder") {
        initial[node.path] = true;
      }
    });
    setExpanded((prev) => ({ ...initial, ...prev }));
  }, [nodes]);

  const sorted = [...nodes].sort((a, b) => {
    if (a.type === "folder" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="text-sm">
      {sorted.map((node) => {
        const isExpanded = expanded[node.path] ?? false;
        const isSelected = selectedFile === node.path;

        return (
          <div key={node.path}>
            <button
              onClick={() => {
                if (node.type === "folder") {
                  setExpanded((prev) => ({ ...prev, [node.path]: !isExpanded }));
                } else {
                  onSelectFile?.(node.path);
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
                  {isExpanded ? (
                    <FolderOpen className="h-3.5 w-3.5 shrink-0 text-chart-4" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 shrink-0 text-chart-4" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3.5" />
                  {getFileIcon(node.name)}
                </>
              )}
              <span className="truncate">{node.name}</span>
            </button>
            {node.type === "folder" && isExpanded && node.children && (
              <FileTree
                nodes={node.children}
                level={level + 1}
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

export function CodePreview({ selectedFile: propSelectedFile, onSelectFile }: CodePreviewProps) {
  const [selectedFile, setSelectedFile] = useState<string | undefined>(propSelectedFile);
  const [copied, setCopied] = useState(false);

  const { data: filesData, isLoading: filesLoading, refetch } = useQuery<{ files: FileNode[] }>({
    queryKey: ["/api/generated"],
    refetchInterval: 5000,
  });

  const { data: fileContent, isLoading: contentLoading } = useQuery<{ content: string; path: string; extension: string }>({
    queryKey: ["/api/generated/file", selectedFile],
    enabled: !!selectedFile,
  });

  const files = filesData?.files || [];

  const handleSelectFile = (path: string) => {
    setSelectedFile(path);
    onSelectFile?.(path);
  };

  const handleCopy = () => {
    if (fileContent?.content) {
      navigator.clipboard.writeText(fileContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (filesLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-border bg-card">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
        <Folder className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <h3 className="text-sm font-medium mb-1">No generated files yet</h3>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          Ask AI-DAN to build something and your files will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden rounded-lg border border-border bg-card">
      <div className="w-48 shrink-0 border-r border-border bg-sidebar">
        <div className="flex items-center justify-between p-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">GENERATED</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => refetch()}
            data-testid="button-refresh-files"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-41px)]">
          <div className="p-1">
            <FileTree
              nodes={files}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
            />
          </div>
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {selectedFile && fileContent?.content ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <span className="text-xs font-mono text-muted-foreground truncate">
                generated/{selectedFile}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleCopy}
                data-testid="button-copy-code"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {contentLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <SyntaxHighlighter
                  language={getLanguage(selectedFile)}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "0.75rem",
                    minHeight: "100%",
                  }}
                  showLineNumbers
                  wrapLongLines
                >
                  {fileContent.content}
                </SyntaxHighlighter>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-4">
            <FileCode className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Select a file to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
