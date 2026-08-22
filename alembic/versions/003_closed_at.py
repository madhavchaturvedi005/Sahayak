"""store when a grievance was closed

Revision ID: 003closedat
Revises: 002activity
Create Date: 2026-08-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003closedat"
down_revision: Union[str, None] = "002activity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("grievances", sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("grievances", "closed_at")
