"""user role for admin and officers

Revision ID: 005userrole
Revises: 004playbook
Create Date: 2026-08-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005userrole"
down_revision: Union[str, None] = "004playbook"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=20), server_default="citizen", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
