"""add ONBOARDING_PARTNERED to accountstatus

Revision ID: 25da6a79d84a
Revises: 422c73997127
Create Date: 2025-09-14 19:22:58.503936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '25da6a79d84a'
down_revision: Union[str, Sequence[str], None] = '422c73997127'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE accountstatus ADD VALUE 'ONBOARDING_PARTNERED'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
