"""Replace onboarding_complete with account_status

Revision ID: a015176d7e2c
Revises: 949d342ebd04
Create Date: 2025-08-09 09:44:26.325002

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a015176d7e2c'
down_revision: Union[str, Sequence[str], None] = '949d342ebd04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    account_status = sa.Enum('AWAITING_ONBOARDING', 'AWAITING_PARTNERSHIP', 'ACTIVE', name='accountstatus')
    account_status.create(op.get_bind(), checkfirst=True)
    op.add_column('users', sa.Column('account_status', account_status, nullable=False, server_default='AWAITING_ONBOARDING'))
    op.drop_column('users', 'onboarding_complete')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('users', sa.Column('onboarding_complete', sa.BOOLEAN(), autoincrement=False, nullable=False, server_default=sa.text('false')))
    op.drop_column('users', 'account_status')
    account_status = sa.Enum('AWAITING_ONBOARDING', 'AWAITING_PARTNERSHIP', 'ACTIVE', name='accountstatus')
    account_status.drop(op.get_bind())
