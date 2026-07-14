export const TOOL_LABELS: Record<string, string> = {
  bash: "Running code",
  web_search: "Searching the web",
  web_fetch: "Fetching page",
  read: "Reading file",
  write: "Writing file",
  edit: "Editing file",
  glob: "Searching files",
  grep: "Searching content",
  code_execution: "Executing code",
  // MCP tools
  create_pull_request: "Creating pull request",
  create_issue: "Creating issue",
  search_repositories: "Searching repositories",
  get_file_contents: "Reading repository file",
  push_files: "Pushing to repository",
};

export function getToolLabel(name: string): string {
  return TOOL_LABELS[name] ?? `Using ${name.replace(/_/g, " ")}`;
}
