import { useState, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { XPParser } from "@/lib/xp-parser";
import { buildINP } from "@/lib/swmm5-builder";
import { Github, FileDown, Loader2, CheckCircle2, XCircle, FolderTree, AlertCircle, FolderOpen, Upload } from "lucide-react";

interface RepoFile {
  name: string;
  path: string;
  download_url: string;
  size: number;
}

interface LocalFile {
  name: string;
  path: string;
  file: File;
  size: number;
}

interface ConversionResult {
  file: string;
  status: "pending" | "converting" | "done" | "error";
  nodes?: number;
  links?: number;
  inp?: string;
  error?: string;
}

function parseGitHubUrl(url: string): { owner: string; repo: string; path: string; branch: string } | null {
  const m = url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/tree\/([^\/]+)\/?(.*))?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2], branch: m[3] || "main", path: m[4] || "" };
}

async function fetchRepoXPFiles(owner: string, repo: string, path: string, branch: string): Promise<RepoFile[]> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    if (res.status === 404 && branch === "main") {
      const res2 = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=master`);
      if (res2.ok) {
        const data = await res2.json();
        return collectXPFiles(data, owner, repo, "master");
      }
    }
    if (res.status === 404) throw new Error("Repository not found or inaccessible. Make sure it's a public repo.");
    throw new Error(`GitHub API error: ${res.status}`);
  }
  const data = await res.json();
  return collectXPFiles(data, owner, repo, branch);
}

async function collectXPFiles(items: any[], owner: string, repo: string, branch: string): Promise<RepoFile[]> {
  const xpFiles: RepoFile[] = [];
  const dirs: string[] = [];
  for (const item of items) {
    if (item.type === "file" && /\.xp$/i.test(item.name)) {
      xpFiles.push({ name: item.name, path: item.path, download_url: item.download_url, size: item.size });
    } else if (item.type === "dir") {
      dirs.push(item.path);
    }
  }
  for (const dir of dirs.slice(0, 10)) {
    try {
      const subRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dir}?ref=${branch}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        xpFiles.push(...(await collectXPFiles(subData, owner, repo, branch)));
      }
    } catch { /* skip */ }
  }
  return xpFiles;
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAll(results: ConversionResult[]) {
  results.filter(r => r.status === "done" && r.inp).forEach(r => {
    triggerDownload(r.inp!, r.file.replace(/\.xp$/i, ".inp"));
  });
}

type SourceMode = "github" | "folder";

const GitHubBatch = () => {
  const [mode, setMode] = useState<SourceMode>("github");

  // GitHub state
  const [repoUrl, setRepoUrl] = useState("");
  const [ghFiles, setGhFiles] = useState<RepoFile[]>([]);
  const [scanning, setScanning] = useState(false);

  // Local folder state
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Shared state
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

  const allFiles = mode === "github" ? ghFiles : localFiles;
  const fileCount = allFiles.length;

  const resetState = () => {
    setGhFiles([]);
    setLocalFiles([]);
    setSelected(new Set());
    setResults([]);
    setError("");
  };

  // GitHub scan
  const handleScan = useCallback(async () => {
    resetState();
    const parsed = parseGitHubUrl(repoUrl.trim());
    if (!parsed) {
      setError("Invalid GitHub URL. Use: https://github.com/owner/repo or .../tree/branch/path");
      return;
    }
    setScanning(true);
    try {
      const found = await fetchRepoXPFiles(parsed.owner, parsed.repo, parsed.path, parsed.branch);
      if (!found.length) {
        setError("No .xp files found in this repository/path.");
      } else {
        setGhFiles(found);
        setSelected(new Set(found.map((_, i) => i)));
        setResults(found.map(f => ({ file: f.name, status: "pending" })));
      }
    } catch (e: any) {
      setError(e.message || "Failed to scan repository");
    } finally {
      setScanning(false);
    }
  }, [repoUrl]);

  // Local folder selection
  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const fileList = e.target.files;
    if (!fileList) return;
    const xpFiles: LocalFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (/\.xp$/i.test(file.name)) {
        xpFiles.push({
          name: file.name,
          path: (file as any).webkitRelativePath || file.name,
          file,
          size: file.size,
        });
      }
    }
    if (!xpFiles.length) {
      setError("No .xp files found in the selected folder.");
    } else {
      setLocalFiles(xpFiles);
      setSelected(new Set(xpFiles.map((_, i) => i)));
      setResults(xpFiles.map(f => ({ file: f.name, status: "pending" })));
    }
    // Reset input so same folder can be re-selected
    e.target.value = "";
  }, []);

  // Toggle selection
  const toggleFile = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === fileCount) setSelected(new Set());
    else setSelected(new Set(allFiles.map((_, i) => i)));
  };

  // Convert selected files
  const handleConvert = useCallback(async () => {
    if (!selected.size) return;
    setConverting(true);

    // Reset results for selected only
    setResults(prev => prev.map((r, i) => selected.has(i) ? { ...r, status: "pending" } : r));

    const indices = [...selected].sort((a, b) => a - b);
    for (const i of indices) {
      setResults(prev => prev.map((r, j) => j === i ? { ...r, status: "converting" } : r));
      try {
        let text: string;
        if (mode === "github") {
          const res = await fetch(ghFiles[i].download_url);
          text = await res.text();
        } else {
          text = await localFiles[i].file.text();
        }
        const parser = new XPParser();
        const parsed = parser.parse(text);
        const inp = buildINP(parsed);
        setResults(prev => prev.map((r, j) =>
          j === i ? { ...r, status: "done", nodes: parsed.nodes.length, links: parsed.links.length, inp } : r
        ));
      } catch (e: any) {
        setResults(prev => prev.map((r, j) =>
          j === i ? { ...r, status: "error", error: e.message || "Conversion failed" } : r
        ));
      }
    }
    setConverting(false);
  }, [selected, mode, ghFiles, localFiles]);

  const doneCount = results.filter(r => r.status === "done").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const selectedCount = selected.size;
  const progress = selectedCount ? ((results.filter((r, i) => selected.has(i) && (r.status === "done" || r.status === "error")).length) / selectedCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-mono mb-4">
              <Github className="h-4 w-4" />
              Batch Converter
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Batch Convert .xp Files</h2>
            <p className="text-muted-foreground">From a GitHub repo or a local folder — pick files and convert to SWMM5 .inp</p>
          </div>

          {/* Source mode toggle */}
          <div className="flex gap-2 justify-center">
            <Button
              variant={mode === "github" ? "default" : "outline"}
              size="sm"
              onClick={() => { setMode("github"); resetState(); }}
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub Repo
            </Button>
            <Button
              variant={mode === "folder" ? "default" : "outline"}
              size="sm"
              onClick={() => { setMode("folder"); resetState(); }}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Local Folder
            </Button>
          </div>

          {/* Source input */}
          <Card>
            <CardContent className="py-4">
              {mode === "github" ? (
                <div className="flex gap-3">
                  <Input
                    placeholder="https://github.com/owner/repo or .../tree/branch/subfolder"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleScan()}
                    className="font-mono text-sm"
                    disabled={scanning || converting}
                  />
                  <Button onClick={handleScan} disabled={scanning || converting || !repoUrl.trim()}>
                    {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FolderTree className="h-4 w-4 mr-2" />}
                    {scanning ? "Scanning..." : "Scan Repo"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <input
                    ref={folderInputRef}
                    type="file"
                    /* @ts-ignore - webkitdirectory is non-standard but widely supported */
                    webkitdirectory=""
                    multiple
                    className="hidden"
                    onChange={handleFolderSelect}
                  />
                  <Button
                    onClick={() => folderInputRef.current?.click()}
                    disabled={converting}
                    className="w-full max-w-md"
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Folder
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    All <code className="bg-muted px-1 rounded font-mono">.xp</code> files in the folder (and subfolders) will be listed
                  </p>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* File list with selection */}
          {fileCount > 0 && (
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-mono flex items-center gap-2">
                    Found {fileCount} .xp file{fileCount !== 1 ? "s" : ""}
                    {selectedCount < fileCount && (
                      <Badge variant="secondary" className="font-mono text-xs">
                        {selectedCount} selected
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="ghost" onClick={toggleAll} disabled={converting}>
                      {selected.size === fileCount ? "Deselect All" : "Select All"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConvert}
                      disabled={converting || !selectedCount}
                    >
                      {converting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Github className="h-4 w-4 mr-2" />
                      )}
                      {converting ? "Converting..." : `Convert ${selectedCount} File${selectedCount !== 1 ? "s" : ""}`}
                    </Button>
                    {doneCount > 0 && (
                      <Button size="sm" variant="outline" onClick={() => downloadAll(results)}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Download {doneCount} .inp
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                {converting && <Progress value={progress} className="mb-4" />}

                {doneCount > 0 && (
                  <div className="flex gap-3 mb-4 text-sm font-mono">
                    <Badge className="bg-success/10 text-success border-success/20">
                      {doneCount} converted
                    </Badge>
                    {errorCount > 0 && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                        {errorCount} failed
                      </Badge>
                    )}
                  </div>
                )}

                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {allFiles.map((f, i) => {
                    const r = results[i];
                    const isSelected = selected.has(i);
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                          isSelected ? "bg-muted/50 hover:bg-muted/70" : "bg-muted/10 hover:bg-muted/30 opacity-60"
                        }`}
                        onClick={() => !converting && toggleFile(i)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => !converting && toggleFile(i)}
                          disabled={converting}
                          onClick={e => e.stopPropagation()}
                        />
                        <div className="flex-shrink-0">
                          {!r || r.status === "pending" ? (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                          ) : r.status === "converting" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : r.status === "done" ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-sm text-foreground truncate block">{f.name}</span>
                          {"path" in f && f.path !== f.name && (
                            <span className="font-mono text-xs text-muted-foreground truncate block">{f.path}</span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                        {r?.status === "done" && (
                          <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                            {r.nodes} nodes · {r.links} links
                          </span>
                        )}
                        {r?.status === "error" && (
                          <span className="font-mono text-xs text-destructive truncate max-w-[200px] flex-shrink-0">
                            {r.error}
                          </span>
                        )}
                        {r?.status === "done" && r.inp && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 flex-shrink-0"
                            onClick={e => {
                              e.stopPropagation();
                              triggerDownload(r.inp!, r.file.replace(/\.xp$/i, ".inp"));
                            }}
                          >
                            <FileDown className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardContent className="py-4">
              <h4 className="font-mono text-sm font-bold text-foreground mb-2">How it works</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Choose a source: paste a public GitHub repo URL or select a local folder</li>
                <li>All <code className="bg-muted px-1 rounded font-mono text-xs">.xp</code> files are listed — select all or pick specific ones</li>
                <li>Each selected file is parsed and converted to SWMM5 <code className="bg-muted px-1 rounded font-mono text-xs">.inp</code></li>
                <li>Download individual files or all at once</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>GitHub:</strong> Only public repos supported. API rate limit: 60 req/hr unauthenticated.
                <br />
                <strong>Local Folder:</strong> Uses your browser's folder picker. All processing happens client-side — no files are uploaded.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GitHubBatch;
