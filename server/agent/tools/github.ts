import { Tool } from "@langchain/core/tools";
import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as path from "path";

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings?.expires_at && 
      new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('GitHub integration not available in this environment');
  }

  try {
    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);
  } catch (error) {
    throw new Error('Failed to fetch GitHub connection settings');
  }

  const accessToken = connectionSettings?.settings?.access_token || 
                      connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected - please connect GitHub in your Replit settings');
  }
  return accessToken;
}

const getOctokit = async () => {
  const token = await getAccessToken();
  return new Octokit({ auth: token });
};

export class GitHubCreateRepoTool extends Tool {
  name = "github_create_repo";
  description = `Create a new GitHub repository.
Input should be a JSON object with:
- name: repository name (required)
- description: repository description (optional)
- private: boolean, whether repo should be private (default: false)
Example: {"name": "my-awesome-app", "description": "A cool app built by AI-DAN", "private": false}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { name, description = "", private: isPrivate = false } = parsed;

      if (!name) {
        return JSON.stringify({ success: false, error: "Repository name is required" });
      }

      const octokit = await getOctokit();
      
      const response = await octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: true
      });

      return JSON.stringify({
        success: true,
        message: `Repository created successfully!`,
        repoUrl: response.data.html_url,
        cloneUrl: response.data.clone_url,
        name: response.data.name
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to create repository"
      });
    }
  }
}

export class GitHubPushFilesTool extends Tool {
  name = "github_push_files";
  description = `Push files to a GitHub repository.
Input should be a JSON object with:
- owner: repository owner (username or org)
- repo: repository name
- branch: branch name (default: "main")
- files: array of {path, content} objects
- commitMessage: commit message
Example: {"owner": "username", "repo": "my-app", "files": [{"path": "index.html", "content": "..."}], "commitMessage": "Initial commit"}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { owner, repo, branch = "main", files, commitMessage = "Update from AI-DAN" } = parsed;

      if (!owner || !repo || !files || !Array.isArray(files)) {
        return JSON.stringify({ 
          success: false, 
          error: "Missing owner, repo, or files array" 
        });
      }

      const octokit = await getOctokit();

      let sha: string | undefined;
      try {
        const { data: ref } = await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`
        });
        sha = ref.object.sha;
      } catch (e) {
        return JSON.stringify({ 
          success: false, 
          error: `Branch "${branch}" not found` 
        });
      }

      const { data: baseCommit } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: sha
      });

      const blobs = await Promise.all(
        files.map(async (file: { path: string; content: string }) => {
          const { data: blob } = await octokit.git.createBlob({
            owner,
            repo,
            content: Buffer.from(file.content).toString("base64"),
            encoding: "base64"
          });
          return { path: file.path, sha: blob.sha };
        })
      );

      const { data: tree } = await octokit.git.createTree({
        owner,
        repo,
        base_tree: baseCommit.tree.sha,
        tree: blobs.map(blob => ({
          path: blob.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha
        }))
      });

      const { data: newCommit } = await octokit.git.createCommit({
        owner,
        repo,
        message: commitMessage,
        tree: tree.sha,
        parents: [sha]
      });

      await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha
      });

      return JSON.stringify({
        success: true,
        message: `Pushed ${files.length} files to ${owner}/${repo}`,
        commitSha: newCommit.sha,
        filesUpdated: files.map((f: { path: string }) => f.path)
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to push files"
      });
    }
  }
}

export class GitHubListReposTool extends Tool {
  name = "github_list_repos";
  description = `List repositories for the authenticated user.
Input should be a JSON object with optional filters:
- type: "all", "owner", "member" (default: "owner")
- sort: "created", "updated", "pushed", "full_name" (default: "updated")
- limit: number of repos to return (default: 10)
Example: {"type": "owner", "limit": 5}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { type = "owner", sort = "updated", limit = 10 } = parsed;

      const octokit = await getOctokit();
      
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        type: type as "all" | "owner" | "member",
        sort: sort as "created" | "updated" | "pushed" | "full_name",
        per_page: limit
      });

      return JSON.stringify({
        success: true,
        repos: repos.map(r => ({
          name: r.name,
          fullName: r.full_name,
          url: r.html_url,
          description: r.description,
          private: r.private,
          updatedAt: r.updated_at
        }))
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to list repositories"
      });
    }
  }
}
