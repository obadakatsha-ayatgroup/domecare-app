from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_appointments():
    return {"message": "Appointments list endpoint"}