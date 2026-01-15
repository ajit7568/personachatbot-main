"""add_character_metadata_and_favorites

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2025-01-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8d9e0f1a2b3'
down_revision: Union[str, None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns to characters table
    op.add_column('characters', sa.Column('genre', sa.String(), nullable=True))
    op.add_column('characters', sa.Column('source', sa.String(), nullable=True, server_default='local'))
    op.add_column('characters', sa.Column('image_url', sa.String(), nullable=True))
    op.add_column('characters', sa.Column('external_id', sa.String(), nullable=True))
    
    # Create indexes for new columns
    op.create_index(op.f('ix_characters_genre'), 'characters', ['genre'], unique=False)
    op.create_index(op.f('ix_characters_source'), 'characters', ['source'], unique=False)
    
    # Update existing rows to have source='local' (using text() for SQLite compatibility)
    op.execute(sa.text("UPDATE characters SET source = 'local' WHERE source IS NULL"))
    
    # Create user_character_favorites table
    op.create_table('user_character_favorites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'character_id', name='uq_user_character_favorite')
    )
    op.create_index(op.f('ix_user_character_favorites_id'), 'user_character_favorites', ['id'], unique=False)
    op.create_index(op.f('ix_user_character_favorites_user_id'), 'user_character_favorites', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_character_favorites_character_id'), 'user_character_favorites', ['character_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop user_character_favorites table
    op.drop_index(op.f('ix_user_character_favorites_character_id'), table_name='user_character_favorites')
    op.drop_index(op.f('ix_user_character_favorites_user_id'), table_name='user_character_favorites')
    op.drop_index(op.f('ix_user_character_favorites_id'), table_name='user_character_favorites')
    op.drop_table('user_character_favorites')
    
    # Drop indexes
    op.drop_index(op.f('ix_characters_source'), table_name='characters')
    op.drop_index(op.f('ix_characters_genre'), table_name='characters')
    
    # Drop columns from characters table
    op.drop_column('characters', 'external_id')
    op.drop_column('characters', 'image_url')
    op.drop_column('characters', 'source')
    op.drop_column('characters', 'genre')
