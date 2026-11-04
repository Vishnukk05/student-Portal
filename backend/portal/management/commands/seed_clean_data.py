import os
import bcrypt
from datetime import datetime, date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from portal.models import (
    Admin,
    Student,
    Ticket,
    Message,
    Content,
    CalendarEvent,
    Announcement,
    AnnouncementRead,
    PortalMail,
    EmailLog,
    Timetable,
    Assignment,
)


def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_minimal_pdf(filepath: str, title: str):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    # Minimal valid PDF file
    content = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 73 >> stream
BT
/F1 18 Tf
50 720 Td
({title}) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000368 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
447
%%EOF
"""
    with open(filepath, "w", encoding="latin-1") as f:
        f.write(content)


class Command(BaseCommand):
    help = "Seed clean, professional academic data into the portal while keeping Super Admin pristine."

    def handle(self, *args, **options):
        self.stdout.write("--- Starting Clean Academic Seeding ---")

        # 1. Super Admin Account
        admin_pw = hash_pw("admin123")
        admin, _ = Admin.objects.update_or_create(
            email="admin@eduportal.edu",
            defaults={
                "name": "Super Admin",
                "role": "admin",
                "password_hash": admin_pw,
                "subject": "Office of Academic Affairs & Systems Administration",
                "totp_enabled": False,
            },
        )
        self.stdout.write(self.style.SUCCESS(f"[OK] Pristine Super Admin verified: {admin.email} (Password: admin123)"))

        # Faculty Admin
        faculty_pw = hash_pw("Faculty@123")
        prof_sarah, _ = Admin.objects.update_or_create(
            email="sarah.johnson@eduportal.edu",
            defaults={
                "name": "Dr. Sarah Johnson",
                "role": "staff",
                "password_hash": faculty_pw,
                "subject": "Computer Science & Engineering",
                "totp_enabled": False,
            },
        )

        # 2. Clean Students
        student_pw = hash_pw("Student@123")
        students_data = [
            {
                "student_id": "STUD2026001",
                "name": "Vishnu Nair",
                "personal_email": "vishnu.nair@gmail.com",
                "portal_email": "vishnu@eduportal.edu",
                "username": "vishnu_nair",
                "course": "B.Tech Electronics & Communication",
                "batch": "2024-2028",
                "phone": "+91 98765 43210",
                "joining_date": date(2024, 8, 1),
                "status": "Approved",
                "must_change_password": False,
            },
            {
                "student_id": "STUD2026002",
                "name": "Ananya Sharma",
                "personal_email": "ananya.sharma@gmail.com",
                "portal_email": "ananya@eduportal.edu",
                "username": "ananya_sharma",
                "course": "B.Tech Computer Science & Engineering",
                "batch": "2023-2027",
                "phone": "+91 98765 43211",
                "joining_date": date(2023, 8, 1),
                "status": "Approved",
                "must_change_password": False,
            },
            {
                "student_id": "STUD2026003",
                "name": "Rohan Patel",
                "personal_email": "rohan.patel@gmail.com",
                "portal_email": "rohan@eduportal.edu",
                "username": "rohan_patel",
                "course": "B.Tech Information Technology",
                "batch": "2023-2027",
                "phone": "+91 98765 43212",
                "joining_date": date(2023, 8, 1),
                "status": "Approved",
                "must_change_password": False,
            },
            {
                "student_id": "STUD2026004",
                "name": "Sneha Reddy",
                "personal_email": "sneha.reddy@gmail.com",
                "portal_email": "sneha@eduportal.edu",
                "username": "sneha_reddy",
                "course": "M.Tech Data Science & AI",
                "batch": "2025-2027",
                "phone": "+91 98765 43213",
                "joining_date": date(2025, 8, 1),
                "status": "Approved",
                "must_change_password": False,
            },
            {
                "student_id": "STUD2026005",
                "name": "Arjun Mehta",
                "personal_email": "arjun.mehta@gmail.com",
                "portal_email": "arjun@eduportal.edu",
                "username": "arjun_mehta",
                "course": "B.Tech Mechanical Engineering",
                "batch": "2024-2028",
                "phone": "+91 98765 43214",
                "joining_date": date(2024, 8, 1),
                "status": "Approved",
                "must_change_password": False,
            },
            {
                "student_id": "STUD2026006",
                "name": "Meera Joshi",
                "personal_email": "meera.joshi@gmail.com",
                "portal_email": "meera@eduportal.edu",
                "username": "meera_joshi",
                "course": "B.Tech Cyber Security",
                "batch": "2024-2028",
                "phone": "+91 98765 43215",
                "joining_date": date(2024, 8, 1),
                "status": "Approved",
                "must_change_password": False,
            },
        ]

        created_students = {}
        for s in students_data:
            stud_obj, _ = Student.objects.update_or_create(
                student_id=s["student_id"],
                defaults={
                    "name": s["name"],
                    "personal_email": s["personal_email"],
                    "portal_email": s["portal_email"],
                    "username": s["username"],
                    "password_hash": student_pw,
                    "course": s["course"],
                    "batch": s["batch"],
                    "phone": s["phone"],
                    "joining_date": s["joining_date"],
                    "status": s["status"],
                    "must_change_password": s["must_change_password"],
                },
            )
            created_students[s["student_id"]] = stud_obj

        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(created_students)} clean student profiles (Password: Student@123)"))

        # 3. Clean Student Messages (Direct Academic Chats)
        Message.objects.all().delete()

        conversations = [
            (
                created_students["STUD2026001"],
                [
                    ("student", "Good morning Sir, could you clarify whether the Digital Signal Processing lab submission deadline is this Friday or next Monday?"),
                    ("admin", "Hello Vishnu. The deadline is confirmed for Monday, 9th Nov at 5:00 PM. Please ensure your MATLAB scripts and analysis report are bundled."),
                    ("student", "Thank you so much Sir, I will upload the bundle accordingly."),
                ],
            ),
            (
                created_students["STUD2026002"],
                [
                    ("student", "Hello Admin team, I wanted to inquire if the campus WiFi credentials for the CS research lab have been updated for this semester?"),
                    ("admin", "Hi Ananya! Yes, connect to 'EduPortal-5G-Research' using your portal email and portal password. Let us know if you face any handshake issues."),
                    ("student", "Worked seamlessly! Thanks for the quick response."),
                ],
            ),
            (
                created_students["STUD2026003"],
                [
                    ("student", "Respected Admin, my fee payment receipt for the 5th semester is showing pending verification on the portal."),
                    ("admin", "We checked the finance records. Your transaction has been reconciled and the receipt is now marked verified in your portal documents."),
                    ("student", "Confirmed, I can see the receipt now. Thank you!"),
                ],
            ),
            (
                created_students["STUD2026004"],
                [
                    ("student", "Dear Academic Office, is the Cloud Computing workshop on Saturday open to M.Tech Data Science students as well?"),
                    ("admin", "Yes Sneha, all postgraduate students in CS & AI are welcome. Registration link is on your dashboard."),
                ],
            ),
            (
                created_students["STUD2026005"],
                [
                    ("student", "Hello Sir, our team requires extended hours access to the CAD lab for the SAE competition chassis modeling."),
                    ("admin", "Permission granted until 9:00 PM throughout this week. The security desk at Block C has been notified."),
                ],
            ),
        ]

        now = timezone.now()
        msg_count = 0
        for stud, thread in conversations:
            t = now - timedelta(hours=len(thread) * 4)
            for role, text in thread:
                if role == "student":
                    Message.objects.create(
                        sender_role="student",
                        sender_id=stud.id,
                        receiver_role="admin",
                        receiver_id=admin.id,
                        student_ref=stud,
                        message=text,
                        sent_at=t,
                        is_read=True,
                    )
                else:
                    Message.objects.create(
                        sender_role="admin",
                        sender_id=admin.id,
                        receiver_role="student",
                        receiver_id=stud.id,
                        student_ref=stud,
                        message=text,
                        sent_at=t,
                        is_read=True,
                    )
                t += timedelta(hours=2)
                msg_count += 1

        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {msg_count} realistic student-admin chat messages"))

        # 4. Clean Support Tickets
        Ticket.objects.all().delete()

        tickets_data = [
            {
                "ticket_id": "TCK-2026-101",
                "student": created_students["STUD2026001"],
                "category": "Academic",
                "priority": "Medium",
                "subject": "DSP Lab Manual Page 45 Formula Clarification",
                "description": "In Section 3.2 of the DSP Lab Manual, equation (4) has a missing conjugate term. Please confirm if that was intentional or a typo.",
                "status": "Resolved",
                "response": "Good catch, Vishnu. An updated errata sheet has been published to the E-Content Vault under DSP Resources.",
            },
            {
                "ticket_id": "TCK-2026-102",
                "student": created_students["STUD2026002"],
                "category": "Technical",
                "priority": "High",
                "subject": "Portal Two-Factor Authentication (2FA) SMS Gateway Delay",
                "description": "During peak morning logins (8:45 AM), the TOTP/SMS code takes ~2 minutes to arrive. Could we enable authenticator app support?",
                "status": "In Progress",
                "response": "Our IT infrastructure team is enabling Google Authenticator TOTP support directly on the profile security tab. Rollout scheduled for this Thursday.",
            },
            {
                "ticket_id": "TCK-2026-103",
                "student": created_students["STUD2026003"],
                "category": "Finance",
                "priority": "Medium",
                "subject": "Semester V Tuition Fee Duplicate Bank Debit",
                "description": "Transaction failed once on payment gateway but amount debited twice from HDFC Bank account. Reference #HDFC9982341.",
                "status": "Resolved",
                "response": "Accounts department confirmed the reversal. Refund reference REF-2026-8812 will credit your account within 3 working days.",
            },
            {
                "ticket_id": "TCK-2026-104",
                "student": created_students["STUD2026004"],
                "category": "Library",
                "priority": "Low",
                "subject": "Access Request for IEEE Xplore Digital Library",
                "description": "Need institutional proxy access to IEEE Xplore for literature review on Transformers in Computer Vision.",
                "status": "Resolved",
                "response": "Your institutional credentials have been provisioned on the IEEE gateway. Login via the library portal link.",
            },
            {
                "ticket_id": "TCK-2026-105",
                "student": created_students["STUD2026005"],
                "category": "Hostel",
                "priority": "High",
                "subject": "Room 304 Block B Air Conditioning Maintenance",
                "description": "AC unit in Room 304 is leaking water onto study desks since yesterday evening.",
                "status": "Resolved",
                "response": "Maintenance technician attended today at 11:30 AM and cleared the drainage blockage. Working normally.",
            },
            {
                "ticket_id": "TCK-2026-106",
                "student": created_students["STUD2026006"],
                "category": "Examination",
                "priority": "High",
                "subject": "Mid-Term Examination Clash with Ethical Hacking Certification",
                "description": "Network Security internal exam overlaps with EC-Council exam slot on 18th November.",
                "status": "Open",
                "response": "Ticket under review by the Controller of Examinations. Alternative slot will be assigned.",
            },
        ]

        for t in tickets_data:
            Ticket.objects.create(**t)

        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(tickets_data)} clean support tickets across Academic, Tech, Finance, Library, Hostel, Exam"))

        # 5. Clean Vault E-Content Files
        Content.objects.all().delete()

        upload_dir = settings.MEDIA_ROOT / "content"
        os.makedirs(upload_dir, exist_ok=True)

        content_items = [
            (
                "Digital Signal Processing - Complete Lecture Notes & MATLAB Guide",
                "Comprehensive notes covering FFT, IIR/FIR filter design, and spectral estimation with complete MATLAB exercises.",
                "Lecture Notes",
                "DSP_Lecture_Notes_Unit1_4.pdf",
                42,
            ),
            (
                "Compiler Design & Syntax Analysis Comprehensive Guide",
                "Detailed syllabus notes covering Lexical Analysis, LL(1) Parsing, LR Parsers, and Intermediate Code Generation.",
                "Reference Material",
                "Compiler_Design_Parser_Grammar.pdf",
                87,
            ),
            (
                "Data Structures & Algorithms Laboratory Workbook - 2026 Edition",
                "Complete C++ and Python problem statements for Trees, Graphs, Dynamic Programming, and Minimum Spanning Trees.",
                "Lab Manual",
                "Data_Structures_Lab_Manual_2026.pdf",
                154,
            ),
            (
                "Artificial Intelligence & Neural Networks Quick Revision Handbook",
                "Formula compendium, backpropagation derivations, attention mechanisms, and CNN architecture breakdowns.",
                "Study Guide",
                "Deep_Learning_Revision_Guide.pdf",
                96,
            ),
            (
                "Cyber Security & Cryptography Protocol Cheat Sheet",
                "Quick reference guide for RSA, Diffie-Hellman, AES-GCM, TLS 1.3 handshake, and Kerberos authentication.",
                "Reference Material",
                "Cryptography_Network_Security_Handbook.pdf",
                63,
            ),
            (
                "Engineering Thermodynamics & Heat Transfer Formula Compendium",
                "Carnot cycles, entropy balances, heat exchangers (LMTD & NTU methods), and convection correlation tables.",
                "Formula Sheet",
                "Fluid_Mechanics_Formulas.pdf",
                51,
            ),
        ]

        for title, desc, cat, fname, downloads in content_items:
            fpath = str(upload_dir / fname)
            create_minimal_pdf(fpath, title)
            Content.objects.create(
                title=title,
                description=desc,
                category=cat,
                file=f"content/{fname}",
                file_type="document",
                uploaded_by=admin,
                status="Approved",
                download_count=downloads,
            )

        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(content_items)} academic e-content vault files & PDFs"))

        # 6. Clean Calendar Events
        CalendarEvent.objects.all().delete()
        now_dt = timezone.now()
        base_date = now_dt.replace(day=3, hour=10, minute=0, second=0, microsecond=0)

        events_data = [
            {
                "title": "Scalable Cloud Architecture with Kubernetes",
                "description": "Interactive technical workshop on container orchestration, service mesh, and auto-scaling microservices.",
                "event_type": "Lecture",
                "start_time": base_date.replace(day=9, hour=14, minute=0),
                "end_time": base_date.replace(day=9, hour=16, minute=30),
                "meeting_link": "https://meet.google.com/edu-cloud-2026",
            },
            {
                "title": "Mid-Term Practical Laboratory Examinations - CS & IT",
                "description": "Hands-on lab exams for Algorithms and Database Management Systems in Labs 201 & 202.",
                "event_type": "Exam",
                "start_time": base_date.replace(day=14, hour=9, minute=0),
                "end_time": base_date.replace(day=14, hour=13, minute=0),
                "meeting_link": "",
            },
            {
                "title": "Annual University Hackathon 2026 - Problem Statements Release",
                "description": "Official broadcast revealing track themes: Healthcare AI, Green Mobility, and FinTech Security.",
                "event_type": "Meeting",
                "start_time": base_date.replace(day=18, hour=11, minute=0),
                "end_time": base_date.replace(day=18, hour=12, minute=30),
                "meeting_link": "https://meet.google.com/edu-hack-2026",
            },
            {
                "title": "Guest Webinar: Machine Learning in Healthcare by Stanford AI Lab",
                "description": "Keynote lecture on computer vision in radiology and multimodal patient diagnostics.",
                "event_type": "Webinar",
                "start_time": base_date.replace(day=25, hour=17, minute=0),
                "end_time": base_date.replace(day=25, hour=18, minute=30),
                "meeting_link": "https://meet.google.com/edu-stanford-ai",
            },
        ]

        for ev in events_data:
            CalendarEvent.objects.create(created_by=admin, **ev)

        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(events_data)} academic calendar events"))

        # 7. Clean Campus Announcements
        Announcement.objects.all().delete()
        announcements_data = [
            {
                "title": "Fall 2026 Semester Schedule & Examination Guidelines Released",
                "content": "The Controller of Examinations has published the final datesheet for all undergraduate and postgraduate programs. Hall tickets will be issued via the student portal from Nov 15th.",
                "status": "Published",
            },
            {
                "title": "Central Library Extended Working Hours (8:00 AM - 11:00 PM)",
                "content": "In view of upcoming mid-term examinations, the Central Library reading halls and digital computing center will remain accessible until 11:00 PM daily, including weekends.",
                "status": "Published",
            },
            {
                "title": "Campus Placement Drive: Registration Open for 2027 Graduating Batch",
                "content": "Leading technology firms including Google, Microsoft, and NVIDIA will commence virtual campus placement screenings from next month. Update your resume on the placement cell tab.",
                "status": "Published",
            },
        ]

        for a in announcements_data:
            ann_obj = Announcement.objects.create(created_by=admin, **a)
            for stud in created_students.values():
                AnnouncementRead.objects.get_or_create(announcement=ann_obj, student=stud)

        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(announcements_data)} university announcements"))

        # 8. Clean Email Logs and Portal Mails
        EmailLog.objects.all().delete()
        PortalMail.objects.all().delete()

        for stud in created_students.values():
            PortalMail.objects.create(
                student=stud,
                sender_admin=admin,
                subject=f"Welcome to EduPortal Academic Systems - {stud.name}",
                body=f"Dear {stud.name},\n\nYour institutional student profile has been verified and approved for {stud.course} ({stud.batch}).\n\nStudent ID: {stud.student_id}\nPortal Email: {stud.portal_email}\n\nAccess your academic materials, submit assignments, and track attendance directly from your dashboard.\n\nBest regards,\nOffice of Academic Affairs",
                is_read=True,
            )
            EmailLog.objects.create(
                recipient_email=stud.portal_email,
                recipient_name=stud.name,
                subject=f"[EduPortal] Account Activated - {stud.student_id}",
                body=f"Your account for {stud.course} is now active. Access the student portal with your credentials.",
                status="sent",
            )
            EmailLog.objects.create(
                recipient_email=stud.personal_email,
                recipient_name=stud.name,
                subject=f"[EduPortal Notification] Student Portal Credentials Verified",
                body=f"Hello {stud.name}, this is a confirmation that your personal email is registered as recovery contact for {stud.student_id}.",
                status="sent",
            )

        self.stdout.write(self.style.SUCCESS("[OK] Seeded clean Portal Mail inbox messages and Email Dispatch logs"))
        self.stdout.write(self.style.SUCCESS("--- Database Seeding Completed Successfully! ---"))

