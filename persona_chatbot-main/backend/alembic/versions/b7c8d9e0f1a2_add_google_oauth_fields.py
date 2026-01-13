"""add_google_oauth_fields

Revision ID: b7c8d9e0f1a2
Revises: a6a78f93597c
Create Date: 2025-01-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, None] = 'a6a78f93597c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # SQLite doesn't support ALTER COLUMN, so we need to handle it differently
    # For SQLite, we'll add the new columns first, then handle nullable constraint
    # For other databases, we can use ALTER COLUMN
    
    # Add google_id column
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    
    # Add auth_provider column with default 'email'
    op.add_column('users', sa.Column('auth_provider', sa.String(), server_default='email', nullable=False))
    
    # For SQLite, hashed_password is already nullable in the initial migration
    # So we don't need to alter it. For other databases, this would need batch operations.


def downgrade() -> None:
    """Downgrade schema."""
    # Remove auth_provider column
    op.drop_column('users', 'auth_provider')
    
    # Remove google_id column and index
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'google_id')
    
    # Note: For SQLite, we can't easily make hashed_password non-nullable again
    # without recreating the table, so we skip that step
