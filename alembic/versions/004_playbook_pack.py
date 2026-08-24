"""playbook location helper and evidence on grievances

Revision ID: 004playbook
Revises: 003closedat
Create Date: 2026-08-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004playbook"
down_revision: Union[str, None] = "003closedat"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("grievances", sa.Column("playbook_id", sa.String(length=40), server_default="", nullable=False))
    op.add_column("grievances", sa.Column("village", sa.String(length=120), server_default="", nullable=False))
    op.add_column("grievances", sa.Column("ward", sa.String(length=80), server_default="", nullable=False))
    op.add_column("grievances", sa.Column("district", sa.String(length=120), server_default="", nullable=False))
    op.add_column("grievances", sa.Column("street", sa.String(length=160), server_default="", nullable=False))
    op.add_column("grievances", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("grievances", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("grievances", sa.Column("filer_role", sa.String(length=20), server_default="self", nullable=False))
    op.add_column("grievances", sa.Column("helper_name", sa.String(length=160), server_default="", nullable=False))
    op.add_column("grievances", sa.Column("helper_relation", sa.String(length=80), server_default="", nullable=False))
    op.add_column("grievances", sa.Column("answers", sa.JSON(), nullable=True))
    op.add_column("grievances", sa.Column("evidence", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("grievances", "evidence")
    op.drop_column("grievances", "answers")
    op.drop_column("grievances", "helper_relation")
    op.drop_column("grievances", "helper_name")
    op.drop_column("grievances", "filer_role")
    op.drop_column("grievances", "longitude")
    op.drop_column("grievances", "latitude")
    op.drop_column("grievances", "street")
    op.drop_column("grievances", "district")
    op.drop_column("grievances", "ward")
    op.drop_column("grievances", "village")
    op.drop_column("grievances", "playbook_id")
