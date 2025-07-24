"""Add profile fields to user table

Revision ID: e9f3a7b2d1c8
Revises: 74b70e2bafb3
Create Date: 2025-07-07 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9f3a7b2d1c8'
down_revision: Union[str, Sequence[str], None] = '74b70e2bafb3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('bio', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('profile_picture_url', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('timezone', sa.String(length=100), server_default='UTC', nullable=False))
    op.add_column('users', sa.Column('notifications_enabled', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    op.add_column('users', sa.Column('current_streak', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('longest_streak', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('total_tasks_completed', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('goals_conquered', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'goals_conquered')
    op.drop_column('users', 'total_tasks_completed')
    op.drop_column('users', 'longest_streak')
    op.drop_column('users', 'current_streak')
    op.drop_column('users', 'notifications_enabled')
    op.drop_column('users', 'timezone')
    op.drop_column('users', 'profile_picture_url')
    op.drop_column('users', 'bio')
