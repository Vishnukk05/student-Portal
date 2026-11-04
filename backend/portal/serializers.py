from rest_framework import serializers
from .models import (
    Activity,
    Admin,
    Announcement,
    AnnouncementRead,
    Assignment,
    AssignmentSubmission,
    CalendarEvent,
    Content,
    EmailLog,
    LeaveRequest,
    Message,
    PortalMail,
    Student,
    Ticket,
    Timetable,
)


class StudentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(required=False, allow_blank=True)
    personal_email = serializers.CharField(required=False, allow_blank=True)
    portal_email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Student
        exclude = ("password_hash",)

    def validate_personal_email(self, value):
        if not value:
            return value
        val = value.strip().lower()
        if "@" not in val or "." not in val.split("@")[-1]:
            raise serializers.ValidationError("Please provide a valid personal email address.")
        return val

    def validate_portal_email(self, value):
        if not value:
            return value
        val = value.strip().lower()
        user_part = val.split("@")[0] if "@" in val else val
        return f"{user_part}@eduportal.edu" 

    def create(self, validated_data):
        import bcrypt
        password = validated_data.pop("password", "") or "Student123!"
        validated_data["password_hash"] = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        return Student.objects.create(**validated_data)

    def update(self, instance, validated_data):
        import bcrypt
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        instance.save()
        return instance


class AdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Admin
        fields = ("id", "name", "email", "role", "subject", "totp_enabled", "created_at", "password")

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        val = value.strip().lower()
        user_part = val.split("@")[0] if "@" in val else val
        return f"{user_part}@eduportal.edu"

    def create(self, validated_data):
        import bcrypt
        password = validated_data.pop("password", "StaffPass123!")
        validated_data["password_hash"] = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        return Admin.objects.create(**validated_data)

    def update(self, instance, validated_data):
        import bcrypt
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        instance.save()
        return instance


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="created_by.name", read_only=True)
    read_count = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = "__all__"
        read_only_fields = ("created_by",)

    def get_read_count(self, obj):
        return AnnouncementRead.objects.filter(announcement=obj).count()

    def get_is_read(self, obj):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user and getattr(request.user, "role", "") == "student":
            return AnnouncementRead.objects.filter(announcement=obj, student_id=request.user.id).exists()
        return False


class ContentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploader_name = serializers.CharField(source="uploaded_by.name", read_only=True)

    class Meta:
        model = Content
        fields = ("id", "title", "description", "category", "file_type", "uploaded_by", "uploader_name", "uploaded_at", "status", "download_count", "file_url", "file")
        read_only_fields = ("uploaded_by", "uploaded_at", "download_count", "file_url")

    def get_file_url(self, obj):
        if not obj.file:
            return ""
        return f"/api/content/{obj.pk}/download/"


class TicketSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_code = serializers.CharField(source="student.student_id", read_only=True)

    class Meta:
        model = Ticket
        fields = "__all__"
        read_only_fields = ("student", "ticket_id", "created_at", "updated_at")


class MessageSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student_ref.name", read_only=True)
    student_id_str = serializers.CharField(source="student_ref.student_id", read_only=True)

    class Meta:
        model = Message
        fields = "__all__"
        read_only_fields = ("sender_role", "sender_id", "receiver_role", "receiver_id", "student_ref", "sent_at", "is_read")


class ActivitySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_code = serializers.CharField(source="student.student_id", read_only=True)

    class Meta:
        model = Activity
        fields = "__all__"


class PortalMailSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender_admin.name", read_only=True)

    class Meta:
        model = PortalMail
        fields = "__all__"


class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = "__all__"


class TimetableSerializer(serializers.ModelSerializer):
    uploader_name = serializers.CharField(source="uploaded_by.name", read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Timetable
        fields = ("id", "title", "course", "batch", "file", "file_url", "notes", "uploaded_by", "uploader_name", "uploaded_at")
        read_only_fields = ("uploaded_by", "uploaded_at", "file_url")

    def get_file_url(self, obj):
        if not obj.file:
            return ""
        return obj.file.url if hasattr(obj.file, "url") else f"/uploads/{obj.file}"


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_code = serializers.CharField(source="student.student_id", read_only=True)
    student_course = serializers.CharField(source="student.course", read_only=True)
    file_url = serializers.SerializerMethodField()
    evaluator_name = serializers.CharField(source="evaluated_by.name", read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = "__all__"
        read_only_fields = ("student", "submitted_at", "evaluated_by", "evaluated_at", "file_url")

    def get_file_url(self, obj):
        if not obj.submission_file:
            return ""
        return obj.submission_file.url if hasattr(obj.submission_file, "url") else f"/uploads/{obj.submission_file}"


class AssignmentSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source="created_by.name", read_only=True)
    question_file_url = serializers.SerializerMethodField()
    submissions_count = serializers.SerializerMethodField()
    my_submission = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = (
            "id", "title", "subject", "course", "description",
            "question_file", "question_file_url", "due_date", "total_marks",
            "created_by", "creator_name", "created_at",
            "submissions_count", "my_submission"
        )
        read_only_fields = ("created_by", "created_at", "question_file_url", "submissions_count", "my_submission")

    def get_question_file_url(self, obj):
        if not obj.question_file:
            return ""
        return obj.question_file.url if hasattr(obj.question_file, "url") else f"/uploads/{obj.question_file}"

    def get_submissions_count(self, obj):
        return obj.submissions.count()

    def get_my_submission(self, obj):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user and getattr(request.user, "role", "") == "student":
            sub = obj.submissions.filter(student_id=request.user.id).first()
            if sub:
                return AssignmentSubmissionSerializer(sub, context=self.context).data
        return None


class CalendarEventSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = CalendarEvent
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "creator_name")


class LeaveRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_code = serializers.CharField(source="student.student_id", read_only=True)
    student_course = serializers.CharField(source="student.course", read_only=True)
    reviewer_name = serializers.CharField(source="reviewed_by.name", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = "__all__"
        read_only_fields = ("student", "reviewed_by", "created_at", "updated_at")
