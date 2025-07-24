"""Rename partnershipstatus enum values to lowercase

Revision ID: 625a03cb6b94
Revises: db8773867233
Create Date: 2025-07-02 10:38:47.625722

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '625a03cb6b94'
down_revision: Union[str, Sequence[str], None] = 'db8773867233'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE partnershipstatus RENAME VALUE 'ACTIVE' TO 'active'")
    op.execute("ALTER TYPE partnershipstatus RENAME VALUE 'PENDING' TO 'pending'")
    op.execute("ALTER TYPE partnershipstatus RENAME VALUE 'NO_PARTNER' TO 'no_partner'")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TYPE partnershipstatus RENAME VALUE 'active' TO 'ACTIVE'")
    op.execute("ALTER TYPE partnershipstatus RENAME VALUE 'pending' TO 'PENDING'")
    op.execute("ALTER TYPE partnershipstatus RENAME VALUE 'no_partner' TO 'NO_PARTNER'")
