from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from .views import (
    ActivityViewSet,
    AnnouncementViewSet,
    AssignmentSubmissionViewSet,
    AssignmentViewSet,
    CalendarEventViewSet,
    ContentViewSet,
    LeaveRequestViewSet,
    MessageViewSet,
    StaffViewSet,
    StudentViewSet,
    TicketViewSet,
    TimetableViewSet,
    activate_student,
    authenticator,
    change_password,
    dashboard_stats,
    inbox,
    login,
    logout,
    mark_all_inbox_read,
    mark_announcement_read,
    mark_inbox_read,
    me,
    request_password_reset,
    confirm_password_reset,
    student_email_logs_compat,
    database_status,
    database_sync,
    ticket_admin_list_compat,
    ticket_admin_update_compat,
    ticket_student_compat,
    update_profile,
)

class OptionalSlashRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = "/?"


router = OptionalSlashRouter()
router.register("students", StudentViewSet)
router.register("staff", StaffViewSet, basename="staff")
router.register("announcements", AnnouncementViewSet)
router.register("content", ContentViewSet)
router.register("tickets", TicketViewSet)
router.register("messages", MessageViewSet)
router.register("tracker", ActivityViewSet, basename="tracker")
router.register("timetables", TimetableViewSet, basename="timetables")
router.register("assignments", AssignmentViewSet, basename="assignments")
router.register("assignment-submissions", AssignmentSubmissionViewSet, basename="assignment-submissions")
router.register("calendar", CalendarEventViewSet, basename="calendar")
router.register("leaves", LeaveRequestViewSet, basename="leaves")

urlpatterns = [
    # Auth endpoints
    re_path(r"^auth/login/?$", login),
    re_path(r"^auth/admin/login/?$", login),
    re_path(r"^auth/student/login/?$", login),
    re_path(r"^auth/me/?$", me),
    re_path(r"^auth/logout/?$", logout),
    re_path(r"^auth/change-password/?$", change_password),
    re_path(r"^auth/update-profile/?$", update_profile),
    re_path(r"^auth/student/password-reset/request/?$", request_password_reset),
    re_path(r"^auth/student/password-reset/confirm/?$", confirm_password_reset),
    re_path(r"^auth/password-reset/confirm/?$", confirm_password_reset),
    re_path(r"^auth/password-reset/?$", request_password_reset),
    re_path(r"^auth/reset-password/?$", request_password_reset),
    re_path(r"^auth/student/activate/?$", activate_student),
    re_path(r"^auth/authenticator/(?P<action>[^/]+)/?$", authenticator),

    # Announcements
    re_path(r"^announcements/(?P<pk>\d+)/read/?$", mark_announcement_read),

    # Messages & Inbox
    re_path(r"^messages/inbox/all/read/?$", mark_all_inbox_read),
    re_path(r"^messages/inbox/(?P<pk>\d+)/read/?$", mark_inbox_read),
    re_path(r"^messages/inbox/?$", inbox),

    # Database & Neon Cloud Hub
    re_path(r"^database/status/?$", database_status),
    re_path(r"^database/sync/?$", database_sync),

    # Analytics & Tracker
    re_path(r"^tracker/dashboard-stats/?$", dashboard_stats),
    re_path(r"^tracker/my-activity/?$", ActivityViewSet.as_view({"get": "list"})),
    re_path(r"^tracker/student/(?P<studentId>\d+)/?$", ActivityViewSet.as_view({"get": "list"})),

    # Compatibility shortcuts
    re_path(r"^students/emails/logs/?$", student_email_logs_compat),
    re_path(r"^tickets/student/?$", ticket_student_compat),
    re_path(r"^tickets/admin/(?P<pk>\d+)/?$", ticket_admin_update_compat),
    re_path(r"^tickets/admin/?$", ticket_admin_list_compat),

    # ViewSet Router URLs
    path("", include(router.urls)),
]
