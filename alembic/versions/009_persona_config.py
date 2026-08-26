"""sahayak persona config with last-edited-by

Revision ID: 009persona
Revises: 008community
Create Date: 2026-08-25
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009persona"
down_revision: Union[str, None] = "008community"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "persona_config",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("display_name", sa.String(length=80), server_default="Sahayak", nullable=False),
        sa.Column("instructions", sa.Text(), server_default="", nullable=False),
        sa.Column("updated_by_id", sa.String(), nullable=True),
        sa.Column("updated_by_name", sa.String(length=160), server_default="", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("persona_config")
