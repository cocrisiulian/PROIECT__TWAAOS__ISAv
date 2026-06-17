import os
import re
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Optional, Dict, List, Any
from urllib.parse import urlparse, urljoin

import httpx
from app.config import settings


class GitHubAnalyzer:
    """Analyzes GitHub repositories for code metrics and statistics."""

    GITHUB_API_BASE = "https://api.github.com"
    REPO_REGEX = r"https?://(?:www\.)?github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$"

    @staticmethod
    def parse_github_url(url: str) -> Optional[tuple[str, str]]:
        """
        Parse GitHub URL and extract owner and repo name.
        
        Args:
            url: GitHub URL (e.g., https://github.com/user/repo)
            
        Returns:
            Tuple of (owner, repo_name) or None if invalid
        """
        url = url.strip()
        match = re.match(GitHubAnalyzer.REPO_REGEX, url)
        if not match:
            return None
        return match.group(1), match.group(2)

    @staticmethod
    async def get_repo_info(owner: str, repo: str) -> Dict[str, Any]:
        """
        Fetch repository info from GitHub API.
        
        Args:
            owner: Repository owner
            repo: Repository name
            
        Returns:
            Dictionary with repo metadata
        """
        url = f"{GitHubAnalyzer.GITHUB_API_BASE}/repos/{owner}/{repo}"
        headers = {}
        
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"
        
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=10.0)
            
            if resp.status_code == 404:
                raise ValueError("Repository not found")
            if resp.status_code != 200:
                raise RuntimeError(f"GitHub API error: {resp.status_code}")
            
            data = resp.json()
            return {
                "name": data.get("name"),
                "url": data.get("html_url"),
                "description": data.get("description"),
                "stars": data.get("stargazers_count", 0),
                "forks": data.get("forks_count", 0),
                "language": data.get("language"),
                "topics": data.get("topics", []),
                "is_private": data.get("private", False),
                "is_fork": data.get("fork", False),
                "last_updated": data.get("updated_at"),
                "created_at": data.get("created_at"),
                "size_kb": data.get("size", 0),
            }

    @staticmethod
    async def analyze_repo_structure(owner: str, repo: str) -> Dict[str, Any]:
        """
        Analyze repository code structure via GitHub API.
        
        Args:
            owner: Repository owner
            repo: Repository name
            
        Returns:
            Dictionary with code metrics
        """
        headers = {}
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

        metrics = {
            "languages": {},
            "file_count": 0,
            "directory_count": 0,
            "has_tests": False,
            "has_ci": False,
            "has_docs": False,
            "has_dockerfile": False,
            "readme_exists": False,
            "license": None,
        }

        async with httpx.AsyncClient() as client:
            # Get language distribution
            try:
                url = f"{GitHubAnalyzer.GITHUB_API_BASE}/repos/{owner}/{repo}/languages"
                resp = await client.get(url, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    metrics["languages"] = resp.json()
            except Exception:
                pass

            # Check for common files
            common_files = ["README.md", "Dockerfile", ".github/workflows", "LICENSE"]
            for file_path in common_files:
                try:
                    url = f"{GitHubAnalyzer.GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{file_path}"
                    resp = await client.get(url, headers=headers, timeout=10.0)
                    if resp.status_code == 200:
                        if "README" in file_path:
                            metrics["readme_exists"] = True
                        elif "Dockerfile" in file_path:
                            metrics["has_dockerfile"] = True
                        elif "workflows" in file_path:
                            metrics["has_ci"] = True
                except Exception:
                    pass

            # Check for tests and docs
            for pattern in ["test", "spec", "Test"]:
                try:
                    url = f"{GitHubAnalyzer.GITHUB_API_BASE}/search/code?q=repo:{owner}/{repo}+in:path+{pattern}"
                    resp = await client.get(url, headers=headers, timeout=10.0)
                    if resp.status_code == 200 and resp.json().get("total_count", 0) > 0:
                        metrics["has_tests"] = True
                        break
                except Exception:
                    pass

            # Get license
            try:
                url = f"{GitHubAnalyzer.GITHUB_API_BASE}/repos/{owner}/{repo}/license"
                resp = await client.get(url, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    license_data = resp.json()
                    metrics["license"] = license_data.get("license", {}).get("name")
            except Exception:
                pass

        return metrics

    @staticmethod
    async def full_analysis(github_url: str) -> Dict[str, Any]:
        """
        Perform complete analysis of a GitHub repository.
        
        Args:
            github_url: Full GitHub repository URL
            
        Returns:
            Complete analysis report
        """
        # Parse URL
        parsed = GitHubAnalyzer.parse_github_url(github_url)
        if not parsed:
            raise ValueError("Invalid GitHub URL format")

        owner, repo = parsed

        # Get basic repo info
        repo_info = await GitHubAnalyzer.get_repo_info(owner, repo)

        # Analyze structure
        structure = await GitHubAnalyzer.analyze_repo_structure(owner, repo)

        # Combine results
        return {
            "repository": repo,
            "owner": owner,
            "url": github_url,
            "info": repo_info,
            "analysis": structure,
            "status": "success",
        }
