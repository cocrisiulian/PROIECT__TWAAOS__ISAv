from typing import Dict, List, Optional, Any
from pydantic import BaseModel, HttpUrl, Field


class GitHubAnalysisRequest(BaseModel):
    """Request model for GitHub repository analysis."""
    
    github_url: str = Field(
        ...,
        description="GitHub repository URL (e.g., https://github.com/user/repo)",
        example="https://github.com/tiangolo/fastapi"
    )


class GitHubRepoInfo(BaseModel):
    """Basic GitHub repository information."""
    
    name: str
    url: str
    description: Optional[str] = None
    stars: int
    forks: int
    language: Optional[str] = None
    topics: List[str]
    is_private: bool
    is_fork: bool
    last_updated: str
    created_at: str
    size_kb: int


class GitHubAnalysisSummary(BaseModel):
    """Code structure analysis summary."""
    
    languages: Dict[str, int] = Field(description="Language distribution by byte count")
    file_count: int = 0
    directory_count: int = 0
    has_tests: bool
    has_ci: bool
    has_docs: bool
    has_dockerfile: bool
    readme_exists: bool
    license: Optional[str] = None


class GitHubAnalysisResponse(BaseModel):
    """Complete GitHub repository analysis response."""
    
    repository: str
    owner: str
    url: str
    info: GitHubRepoInfo
    analysis: GitHubAnalysisSummary
    status: str = "success"
    message: Optional[str] = None
