from django.db import models


class Item(models.Model):
    GROUP_CHOICES = [
        ("Primary", "Primary"),
        ("Secondary", "Secondary"),
    ]

    name = models.CharField(max_length=200)
    group = models.CharField(max_length=20, choices=GROUP_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("name", "group")]

    def __str__(self):
        return f"{self.name} ({self.group})"
