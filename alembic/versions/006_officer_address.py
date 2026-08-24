"""address on nodal officers

Revision ID: 006officeraddr
Revises: 005userrole
Create Date: 2026-08-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006officeraddr"
down_revision: Union[str, None] = "005userrole"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "nodal_officers",
        sa.Column("address", sa.String(length=400), server_default="", nullable=False),
    )
    op.alter_column(
        "nodal_officers",
        "phone",
        existing_type=sa.String(length=40),
        type_=sa.String(length=80),
        existing_nullable=False,
        existing_server_default="",
    )


def downgrade() -> None:
    op.alter_column(
        "nodal_officers",
        "phone",
        existing_type=sa.String(length=80),
        type_=sa.String(length=40),
        existing_nullable=False,
        existing_server_default="",
    )
    op.drop_column("nodal_officers", "address")
