"""desk levels and grievance assignment

Revision ID: 007deskescal
Revises: 006officeraddr
Create Date: 2026-08-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007deskescal"
down_revision: Union[str, None] = "006officeraddr"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("desk_level", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("desk_title", sa.String(length=160), server_default="", nullable=False))
    op.add_column("grievances", sa.Column("assigned_user_id", sa.String(), nullable=True))
    op.add_column("grievances", sa.Column("field_officer_id", sa.String(), nullable=True))
    op.add_column(
        "grievances",
        sa.Column("escalation_level", sa.Integer(), server_default="1", nullable=False),
    )
    op.add_column("grievances", sa.Column("level_assigned_at", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key("fk_grievances_assigned_user", "grievances", "users", ["assigned_user_id"], ["id"])
    op.create_foreign_key("fk_grievances_field_officer", "grievances", "users", ["field_officer_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_grievances_field_officer", "grievances", type_="foreignkey")
    op.drop_constraint("fk_grievances_assigned_user", "grievances", type_="foreignkey")
    op.drop_column("grievances", "level_assigned_at")
    op.drop_column("grievances", "escalation_level")
    op.drop_column("grievances", "field_officer_id")
    op.drop_column("grievances", "assigned_user_id")
    op.drop_column("users", "desk_title")
    op.drop_column("users", "desk_level")
