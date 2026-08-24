"""community backing and on-site push

Revision ID: 008community
Revises: 007deskescal
Create Date: 2026-08-25
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008community"
down_revision: Union[str, None] = "007deskescal"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("grievances", sa.Column("consent_capture", sa.String(length=200), server_default="", nullable=False))
    op.add_column("grievances", sa.Column("impact_scope", sa.String(length=20), server_default="self", nullable=False))
    op.add_column("grievances", sa.Column("backer_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("grievances", sa.Column("push_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("grievances", sa.Column("pending_raise_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column(
        "grievances",
        sa.Column("verification_radius_m", sa.Integer(), server_default="800", nullable=False),
    )
    op.add_column(
        "grievances",
        sa.Column("onsite_radius_m", sa.Integer(), server_default="150", nullable=False),
    )

    op.create_table(
        "grievance_backers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("grievance_id", sa.String(), sa.ForeignKey("grievances.id"), nullable=False, index=True),
        sa.Column("name", sa.String(length=160), server_default="", nullable=False),
        sa.Column("mobile", sa.String(length=15), nullable=False, index=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("distance_m", sa.Float(), nullable=True),
        sa.Column("kind", sa.String(length=20), server_default="endorse", nullable=False),
        sa.Column("source", sa.String(length=20), server_default="remote", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("village", sa.String(length=120), server_default="", nullable=False),
        sa.Column("ward", sa.String(length=80), server_default="", nullable=False),
        sa.Column("photo_data_url", sa.Text(), server_default="", nullable=False),
        sa.Column("otp_verified", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "uq_grievance_backer_mobile_kind",
        "grievance_backers",
        ["grievance_id", "mobile", "kind"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_grievance_backer_mobile_kind", table_name="grievance_backers")
    op.drop_table("grievance_backers")
    op.drop_column("grievances", "onsite_radius_m")
    op.drop_column("grievances", "verification_radius_m")
    op.drop_column("grievances", "pending_raise_count")
    op.drop_column("grievances", "push_count")
    op.drop_column("grievances", "backer_count")
    op.drop_column("grievances", "impact_scope")
    op.drop_column("grievances", "consent_capture")
