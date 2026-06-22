from django.urls import path, include, re_path
from django.conf import settings
from django.http import FileResponse, Http404

def spa_index(request, path=""):
    index = settings.FRONTEND_DIR / "index.html"
    if not index.exists():
        raise Http404("Frontend not built")
    return FileResponse(open(index, "rb"), content_type="text/html")

urlpatterns = [
    path("items/", include("items.urls")),
    re_path(r"^(?!items/|static/).*$", spa_index),
]
