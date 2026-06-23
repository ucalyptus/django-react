# ADR-004: unique_together Constraint at Both Model and Serializer Level

**Date:** 2026-06-23
**Status:** Accepted

## Context

The item data model requires that names be unique within a group but may repeat across groups — i.e., `("name", "group")` is the uniqueness key, not `name` alone. This constraint must be enforced reliably, with errors surfaced to API clients as actionable 400 responses rather than opaque 500s, and must hold even under concurrent requests.

## Decision

Enforce the `("name", "group")` uniqueness at **two independent layers**:

1. **Database layer:** `unique_together = [("name", "group")]` in the `Item` model's `Meta` class. Django's migration system translates this to a `UNIQUE` constraint on the underlying table.

2. **Serializer layer:** an explicit `validate()` method on the `ItemSerializer` performs a pre-save existence check (`Item.objects.filter(name=..., group=...).exists()`) and raises `serializers.ValidationError` with a human-readable message before any `INSERT` or `UPDATE` is attempted.

For update operations, the serializer's `validate()` excludes the current instance (`Item.objects.filter(...).exclude(pk=self.instance.pk)`) so a PUT/PATCH to an item that keeps its own `("name", "group")` pair does not incorrectly reject itself.

## Alternatives Considered

| Option | Reason not chosen |
|--------|------------------|
| **DB constraint only** | Django surfaces `IntegrityError` from the DB driver as a 500 unless caught explicitly; the error message is a raw SQL constraint name, not useful to API clients; requires wrapping every create/update in a `try/except IntegrityError` block |
| **Serializer check only** | Readable errors, but a TOCTOU (Time-Of-Check-Time-Of-Use) race exists: two concurrent POST requests can both pass the existence check before either commits, then one will hit an unhandled `IntegrityError` at the DB layer |
| **Application-level locking** | `select_for_update()` or `LOCK TABLE` would prevent the race but adds latency and complexity; unnecessary when the DB constraint already acts as a reliable safety net |

## Consequences

**Positive:**
- API clients receive a `400 Bad Request` with a structured error body (`{"non_field_errors": ["An item with this name already exists in the selected group."]}`) on duplicate attempts — no special exception handling in the view layer needed
- The DB `UNIQUE` constraint is a hard backstop for any code path (management commands, admin, direct ORM calls) that bypasses the serializer
- The two-layer approach is the pattern DRF's own documentation recommends for composite uniqueness

**Negative / Trade-offs:**
- Duplicate logic: the uniqueness rule is expressed in two places (model Meta and serializer). A future rename of fields must be updated in both locations
- The serializer check adds one extra `SELECT` per create/update request; negligible at current load
- Under extreme concurrent write load the DB constraint will still trigger an `IntegrityError` for the losing request in a race; callers should be prepared to handle 500 or the view layer should wrap the `save()` call in a `try/except IntegrityError` and re-raise as a `ValidationError` for completeness
