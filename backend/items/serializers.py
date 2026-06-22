from rest_framework import serializers
from django.db import IntegrityError

from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "name", "group", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_group(self, value):
        valid_groups = [choice[0] for choice in Item.GROUP_CHOICES]
        if value not in valid_groups:
            raise serializers.ValidationError(
                f"Invalid group '{value}'. Must be one of: {', '.join(valid_groups)}."
            )
        return value

    def validate(self, attrs):
        # On updates, merge with existing instance values so partial PATCH
        # can still run the uniqueness check correctly.
        instance = self.instance
        name = attrs.get("name", getattr(instance, "name", None))
        group = attrs.get("group", getattr(instance, "group", None))

        qs = Item.objects.filter(name=name, group=group)
        if instance is not None:
            qs = qs.exclude(pk=instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                {"non_field_errors": [f"An item with name '{name}' already exists in group '{group}'."]}
            )
        return attrs
