import asyncio
import random
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class MockVerificationService:
    """Mock verification service for development"""
    
    def __init__(self):
        self.sent_otps = {}  # Store sent OTPs for reference
    
    async def send_otp(self, recipient: str, method: str) -> bool:
        """
        Send OTP to recipient (mock implementation)
        In production, this would integrate with SMS/Email providers
        """
        # Simulate network delay
        await asyncio.sleep(random.uniform(0.5, 1.5))
        
        otp = settings.MOCK_OTP_CODE
        self.sent_otps[recipient] = {
            "code": otp,
            "sent_at": datetime.utcnow(),
            "method": method
        }
        
        # Log the OTP for development
        logger.info(f"""
        ========================================
        [MOCK VERIFICATION SERVICE - DEV MODE]
        Method: {method}
        Recipient: {recipient}
        OTP Code: {otp}
        Message: Your DOME Care verification code is: {otp}
        
        Note: In production, this would be sent via {'SMS' if method == 'phone' else 'Email'}
        ========================================
        """)
        
        return True
    
    async def verify_otp(self, recipient: str, otp: str) -> bool:
        """
        Verify OTP (mock implementation)
        In dev mode, accepts the mock OTP or any 6-digit number
        """
        # In mock mode, accept default OTP or any 6-digit number
        if otp == settings.MOCK_OTP_CODE:
            logger.info(f"[MOCK] OTP verified successfully for {recipient}")
            return True
        
        if len(otp) == 6 and otp.isdigit():
            logger.info(f"[MOCK] Accepting any 6-digit OTP in dev mode for {recipient}")
            return True
        
        logger.warning(f"[MOCK] Invalid OTP attempt for {recipient}: {otp}")
        return False
    
    async def send_sms(self, phone: str, message: str) -> bool:
        """Mock SMS sending"""
        await asyncio.sleep(0.5)
        
        logger.info(f"""
        ========================================
        [MOCK SMS SERVICE]
        To: {phone}
        Message: {message}
        Status: Successfully queued (would be sent in production)
        Provider: Syrian Telecom (mock)
        ========================================
        """)
        
        return True
    
    async def send_whatsapp(self, phone: str, message: str) -> bool:
        """Mock WhatsApp sending"""
        await asyncio.sleep(0.5)
        
        logger.info(f"""
        ========================================
        [MOCK WHATSAPP SERVICE]
        To: {phone}
        Message: {message}
        Status: Successfully queued (would be sent in production)
        Provider: WhatsApp Business API (mock)
        ========================================
        """)
        
        return True

class MockDocumentVerificationService:
    """Mock document verification service"""
    
    async def verify_medical_certificate(self, file_path: str, user_id: str) -> Dict[str, Any]:
        """
        Mock medical certificate verification
        In production, this would use OCR and verification APIs
        """
        await asyncio.sleep(2)  # Simulate processing time
        
        if settings.AUTO_APPROVE_DOCUMENTS:
            logger.info(f"""
            ========================================
            [MOCK DOCUMENT VERIFICATION - AUTO APPROVED]
            User ID: {user_id}
            File: {file_path}
            Status: APPROVED (Dev Mode - Auto Approval)
            
            Extracted Data (Mock):
            - Doctor Name: Dr. Test User
            - Specialty: General Medicine
            - License: SYR-2024-{random.randint(1000, 9999)}
            - Issue Date: 2024-01-01
            - Valid Until: 2029-01-01
            ========================================
            """)
            
            return {
                "status": "approved",
                "confidence": 0.95,
                "verified_at": datetime.utcnow(),
                "extracted_data": {
                    "doctor_name": "Dr. Test User",
                    "specialty": "General Medicine",
                    "license_number": f"SYR-2024-{random.randint(1000, 9999)}",
                    "issue_date": "2024-01-01",
                    "valid_until": "2029-01-01"
                },
                "message": "[DEV MODE] Document auto-approved for testing"
            }
        else:
            # Simulate manual review needed
            return {
                "status": "pending",
                "message": "Document submitted for manual review",
                "estimated_review_time": "24-48 hours"
            }
    
    async def verify_identity_document(self, file_path: str, user_id: str) -> Dict[str, Any]:
        """Mock identity document verification"""
        await asyncio.sleep(1)
        
        if settings.AUTO_APPROVE_DOCUMENTS:
            return {
                "status": "approved",
                "confidence": 0.98,
                "verified_at": datetime.utcnow(),
                "message": "[DEV MODE] Identity auto-verified for testing"
            }
        else:
            return {
                "status": "pending",
                "message": "Identity document submitted for review"
            }

class MockEmailService:
    """Mock email service for development"""
    
    async def send_email(self, to: str, subject: str, body: str, html: Optional[str] = None) -> bool:
        """Mock email sending"""
        await asyncio.sleep(0.3)
        
        logger.info(f"""
        ========================================
        [MOCK EMAIL SERVICE]
        To: {to}
        Subject: {subject}
        Body: {body[:200]}...
        Status: Successfully sent (mock)
        ========================================
        """)
        
        return True
    
    async def send_appointment_reminder(self, email: str, appointment_data: Dict[str, Any]) -> bool:
        """Send appointment reminder email"""
        subject = "Appointment Reminder - DOME Care"
        body = f"""
        Dear {appointment_data.get('patient_name')},
        
        This is a reminder for your appointment:
        Doctor: {appointment_data.get('doctor_name')}
        Date: {appointment_data.get('date')}
        Time: {appointment_data.get('time')}
        
        Please arrive 10 minutes early.
        
        Best regards,
        DOME Care Team
        """
        
        return await self.send_email(email, subject, body)