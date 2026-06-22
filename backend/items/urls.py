from django.urls import path

from .views import ItemListCreateView, ItemDetailView

urlpatterns = [
    path("", ItemListCreateView.as_view(), name="item-list-create"),
    path("<int:pk>/", ItemDetailView.as_view(), name="item-detail"),
]
