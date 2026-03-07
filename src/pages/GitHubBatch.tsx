import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { XPParser, type XPParseResult } from "@/lib/xp-parser";
import { buildINP } from "@/lib/swmm5-builder";
import { Github, FileDown, Loader2, CheckCircle2, XCircle, FolderTree, AlertCircle } from "lucide-react";

interface RepoFile {
  name: string;
  path: string;
  download_url: string;
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
  // Supports: github.com/owner/repo, github.com/owner/repo/tree/branch/path
  const m = url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/tree\/([^\/]+)\/?(.*))?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2], branch: m[3] || "main", path: m[4] || "" };
}

async function fetchRepoXPFiles(owner: string, repo: string, path: string, branch: string): Promise<RepoFile[]> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    if (res.status === 404) {
      // Try with "master" branch if "main" fails
      if (branch === "main") {
        const res2 = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=master`);
        if (res2.ok) {
          const data = await res2.json();
          return collectXPFiles(data, owner, repo, "master");
        }
      }
      throw new Error(`Repository not found or inaccessible. Make sure it's a public repo.`);
    }
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
      xpFiles.push({
        name: item.name,
        path: item.path,
        download_url: item.download_url,
        size: item.size,
      });
    } else if (item.type === "dir") {
      dirs.push(item.path);
    }
  }

  // Recursively fetch subdirectories (limit depth to avoid rate limits)
  for (const dir of dirs.slice(0, 10)) {
    try {
      const subRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dir}?ref=${branch}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        const subFiles = await collectXPFiles(subData, owner, repo, branch);
        xpFiles.push(...subFiles);
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  return xpFiles;
}

function downloadAll(results: ConversionResult[]) {
  const done = results.filter(r => r.status === "done" && r.inp);
  done.forEach(r => {
    const blob = new Blob([r.inp!], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = r.file.replace(/\.xp$/i, ".inp");
    a.click();
    URL.revokeObjectURL(url);
  });
}

const GitHubBatch = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

  const handleScan = useCallback(async () => {
    setError("");
    setFiles([]);
    setResults([]);
    const parsed = parseGitHubUrl(repoUrl.trim());
    if (!parsed) {
      setError("Invalid GitHub URL. Use: https://github.com/owner/repo or https://github.com/owner/repo/tree/branch/path");
      return;
    }
    setScanning(true);
    try {
      const found = await fetchRepoXPFiles(parsed.owner, parsed.repo, parsed.path, parsed.branch);
      if (found.length === 0) {
        setError("No .xp files found in this repository/path.");
      } else {
        setFiles(found);
        setResults(found.map(f => ({ file: f.name, status: "pending" })));
      }
    } catch (e: any) {
      setError(e.message || "Failed to scan repository");
    } finally {
      setScanning(false);
    }
  }, [repoUrl]);

  const handleConvert = useCallback(async () => {
    if (!files.length) return;
    setConverting(true);

    for (let i = 0; i < files.length; i++) {
      setResults(prev => prev.map((r, j) => j === i ? { ...r, status: "converting" } : r));

      try {
        const res = await fetch(files[i].download_url);
        const text = await res.text();
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
  }, [files]);

  const doneCount = results.filter(r => r.status === "done").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const progress = results.length ? ((doneCount + errorCount) / results.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-mono mb-4">
              <Github className="h-4 w-4" />
              GitHub Batch Converter
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Batch Convert from GitHub</h2>
            <p className="text-muted-foreground">Paste a GitHub repo URL to find and convert all .xp files to SWMM5 .inp format</p>
          </div>

          {/* URL Input */}
          <Card>
            <CardContent className="py-4">
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
              {error && (
                <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files Found */}
          {files.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono">
                    Found {files.length} .xp file{files.length !== 1 ? "s" : ""}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleConvert}
                      disabled={converting || doneCount === files.length}
                    >
                      {converting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Github className="h-4 w-4 mr-2" />
                      )}
                      {converting ? "Converting..." : doneCount === files.length ? "All Done" : "Convert All"}
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
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {r.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
                        {r.status === "converting" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        {r.status === "done" && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {r.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                      <span className="font-mono text-sm text-foreground flex-1 truncate">{r.file}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {files[i] && `${(files[i].size / 1024).toFixed(0)} KB`}
                      </span>
                      {r.status === "done" && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.nodes} nodes · {r.links} links
                        </span>
                      )}
                      {r.status === "error" && (
                        <span className="font-mono text-xs text-destructive truncate max-w-[200px]">
                          {r.error}
                        </span>
                      )}
                      {r.status === "done" && r.inp && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            const blob = new Blob([r.inp!], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = r.file.replace(/\.xp$/i, ".inp");
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <FileDown className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardContent className="py-4">
              <h4 className="font-mono text-sm font-bold text-foreground mb-2">How it works</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Paste any public GitHub repo URL (optionally include a subfolder path)</li>
                <li>The scanner uses GitHub's API to recursively find all <code className="bg-muted px-1 rounded font-mono text-xs">.xp</code> files</li>
                <li>Each file is fetched, parsed with the XPParser, and converted to SWMM5 <code className="bg-muted px-1 rounded font-mono text-xs">.inp</code></li>
                <li>Download individual files or all at once</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Note:</strong> Only public repos are supported. GitHub API rate limit is 60 requests/hour for unauthenticated users.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GitHubBatch;
