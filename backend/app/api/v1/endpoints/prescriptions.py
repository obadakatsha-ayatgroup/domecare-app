from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_prescriptions():
    return {"message": "Prescriptions list endpoint"}