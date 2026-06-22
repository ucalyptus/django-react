from django.db import IntegrityError

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Item
from .serializers import ItemSerializer


class ItemListCreateView(APIView):
    """
    GET  /items/   — list all items
    POST /items/   — create a new item
    """

    def get(self, request):
        items = Item.objects.all().order_by("id")
        serializer = ItemSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ItemSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
            except IntegrityError:
                name = request.data.get("name", "")
                group = request.data.get("group", "")
                return Response(
                    {"detail": f"An item with name '{name}' already exists in group '{group}'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ItemDetailView(APIView):
    """
    GET   /items/{id}/  — retrieve a single item
    PATCH /items/{id}/  — partially update an item
    """

    def _get_object(self, pk):
        try:
            return Item.objects.get(pk=pk)
        except Item.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self._get_object(pk)
        if item is None:
            return Response(
                {"detail": "Item not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ItemSerializer(item)
        return Response(serializer.data)

    def patch(self, request, pk):
        item = self._get_object(pk)
        if item is None:
            return Response(
                {"detail": "Item not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
