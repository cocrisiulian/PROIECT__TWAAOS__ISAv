from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Backend is running"}


@router.get("/hello", tags=["Hello"])
def hello():
    return {
        "message": "Salut de la Sistemul de Management al Evenimentelor Universitare USV!"
    }
