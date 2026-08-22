"""initial sahayak schema

Revision ID: 001initial
Revises:
Create Date: 2026-08-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("email", sa.String(200), nullable=True, unique=True),
        sa.Column("mobile", sa.String(15), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "grievances",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("registration_id", sa.String(40), nullable=False, unique=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("kind", sa.String(20), nullable=False, server_default="public"),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("mobile", sa.String(15), nullable=False),
        sa.Column("ministry", sa.String(200), nullable=False),
        sa.Column("category", sa.String(200), nullable=False),
        sa.Column("subject", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(40), nullable=False, server_default="Registered"),
        sa.Column("expected_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("pendency_pct", sa.Integer(), nullable=False, server_default="18"),
        sa.Column("routing_reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("reminder_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_grievances_registration_id", "grievances", ["registration_id"])
    op.create_table(
        "grievance_events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("grievance_id", sa.String(), sa.ForeignKey("grievances.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "appeals",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("appeal_id", sa.String(40), nullable=False, unique=True),
        sa.Column("grievance_id", sa.String(), sa.ForeignKey("grievances.id"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("draft", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(40), nullable=False, server_default="Filed"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "news_items",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("published_on", sa.Date(), nullable=False),
        sa.Column("title", sa.String(400), nullable=False),
        sa.Column("href", sa.String(500), nullable=False, server_default="#"),
        sa.Column("size_label", sa.String(40), nullable=False, server_default=""),
    )
    op.create_table(
        "nodal_officers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("scope", sa.String(20), nullable=False),
        sa.Column("organisation", sa.String(240), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("designation", sa.String(200), nullable=False),
        sa.Column("email", sa.String(200), nullable=False, server_default=""),
        sa.Column("phone", sa.String(40), nullable=False, server_default=""),
        sa.Column("state", sa.String(80), nullable=False, server_default=""),
    )
    op.create_table(
        "department_stats",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("ministry", sa.String(200), nullable=False, unique=True),
        sa.Column("avg_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("pendency_pct", sa.Integer(), nullable=False, server_default="18"),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_table("department_stats")
    op.drop_table("nodal_officers")
    op.drop_table("news_items")
    op.drop_table("appeals")
    op.drop_table("grievance_events")
    op.drop_index("ix_grievances_registration_id", table_name="grievances")
    op.drop_table("grievances")
    op.drop_table("users")
