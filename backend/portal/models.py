from django.db import models


class Admin(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=20, default="admin")  # "admin" or "staff"
    subject = models.CharField(max_length=100, blank=True, default="")
    totp_secret = models.CharField(max_length=255, blank=True, default="")
    totp_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Student(models.Model):
    student_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    personal_email = models.EmailField(unique=True)
    portal_email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=25, blank=True, default="")
    course = models.CharField(max_length=100, blank=True, default="")
    batch = models.CharField(max_length=50, blank=True, default="")
    joining_date = models.DateField(null=True, blank=True)
    username = models.CharField(max_length=100, unique=True)
    password_hash = models.CharField(max_length=255)
    profile_photo = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=20, default="Pending")
    totp_secret = models.CharField(max_length=255, blank=True, default="")
    totp_enabled = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    must_change_password = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Announcement(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_by = models.ForeignKey(Admin, on_delete=models.CASCADE)
    published_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="Published")


class Content(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=100)
    file = models.FileField(upload_to="content/", blank=True, null=True)
    file_type = models.CharField(max_length=50, default="document")
    uploaded_by = models.ForeignKey(Admin, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="Pending")
    download_count = models.PositiveIntegerField(default=0)


class Ticket(models.Model):
    subject = models.CharField(max_length=200)
    category = models.CharField(max_length=100, default="General")
    priority = models.CharField(max_length=20, default="Medium")
    description = models.TextField()
    status = models.CharField(max_length=30, default="Pending")
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    response = models.TextField(blank=True, default="")
    ticket_id = models.CharField(max_length=20, unique=True, blank=True, default="")
    attachment_url = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Message(models.Model):
    sender_role = models.CharField(max_length=20)
    sender_id = models.PositiveIntegerField()
    receiver_role = models.CharField(max_length=20)
    receiver_id = models.PositiveIntegerField()
    student_ref = models.ForeignKey(Student, on_delete=models.CASCADE)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)


class Activity(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=100)
    activity_reference = models.CharField(max_length=255, blank=True, default="")
    activity_time = models.DateTimeField(auto_now_add=True)


class AnnouncementRead(models.Model):
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("announcement", "student"), name="unique_announcement_student")]


class PortalMail(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    sender_admin = models.ForeignKey(Admin, on_delete=models.CASCADE)
    subject = models.CharField(max_length=200)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)


class EmailLog(models.Model):
    recipient_email = models.EmailField()
    recipient_name = models.CharField(max_length=100)
    subject = models.CharField(max_length=200)
    body = models.TextField()
    status = models.CharField(max_length=20, default="simulated")
    temp_password_hint = models.CharField(max_length=50, blank=True, default="")
    sent_at = models.DateTimeField(auto_now_add=True)



class ActivationToken(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class RevokedToken(models.Model):
    jti = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(auto_now_add=True)


class Timetable(models.Model):
    title = models.CharField(max_length=200)
    course = models.CharField(max_length=100, blank=True, default="")
    batch = models.CharField(max_length=50, blank=True, default="")
    file = models.FileField(upload_to="timetables/", blank=True, null=True)
    notes = models.TextField(blank=True, default="")
    uploaded_by = models.ForeignKey(Admin, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Assignment(models.Model):
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    course = models.CharField(max_length=100, blank=True, default="")
    description = models.TextField(blank=True, default="")
    question_file = models.FileField(upload_to="assignments/questions/", blank=True, null=True)
    due_date = models.DateTimeField(null=True, blank=True)
    total_marks = models.PositiveIntegerField(default=100)
    created_by = models.ForeignKey(Admin, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="submissions")
    submission_file = models.FileField(upload_to="assignments/submissions/", blank=True, null=True)
    submission_text = models.TextField(blank=True, default="")
    submitted_at = models.DateTimeField(auto_now_add=True)
    marks_obtained = models.FloatField(null=True, blank=True)
    grade = models.CharField(max_length=20, blank=True, default="")
    feedback = models.TextField(blank=True, default="")
    evaluated_by = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, default="Submitted")  # "Submitted", "Evaluated"

    class Meta:
        constraints = [models.UniqueConstraint(fields=("assignment", "student"), name="unique_assignment_submission")]


class CalendarEvent(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    event_type = models.CharField(max_length=50, default="Lecture")  # Lecture, Meeting, Exam, Webinar, Holiday
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    meeting_link = models.CharField(max_length=500, blank=True, default="")
    created_by = models.ForeignKey(Admin, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class LeaveRequest(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="leave_requests")
    leave_type = models.CharField(max_length=50, default="Casual Leave")  # Sick Leave, Casual Leave, Academic Leave, Emergency
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, default="Pending")  # Pending, Approved, Rejected
    reviewer_response = models.TextField(blank=True, default="")
    reviewed_by = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
