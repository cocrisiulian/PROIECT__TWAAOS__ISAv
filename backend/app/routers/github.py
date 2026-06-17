from fastapi import APIRouter, HTTPException, status
from app.schemas.github_schemas import GitHubAnalysisRequest, GitHubAnalysisResponse
from app.services.github_analyzer import GitHubAnalyzer

router = APIRouter(prefix="/github", tags=["GitHub Analysis"])


@router.post("/analyze", response_model=GitHubAnalysisResponse)
async def analyze_github_repo(request: GitHubAnalysisRequest) -> GitHubAnalysisResponse:
    """
    Analyze a GitHub repository for code metrics and statistics.
    
    Accepts a GitHub repository URL and returns:
    - Repository metadata (stars, forks, language, etc.)
    - Code structure analysis (languages, presence of tests, CI, docs, etc.)
    
    Example URL: https://github.com/tiangolo/fastapi
    """
    try:
        # Validate URL format
        parsed = GitHubAnalyzer.parse_github_url(request.github_url)
        if not parsed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid GitHub URL format. Use: https://github.com/owner/repo"
            )
        
        # Perform analysis
        result = await GitHubAnalyzer.full_analysis(request.github_url)
        return GitHubAnalysisResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
