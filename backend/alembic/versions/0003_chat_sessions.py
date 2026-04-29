"""chat_sessions

Revision ID: 0003_chat_sessions
Revises: 0002_saving_goals
Create Date: 2026-04-29

"""

from alembic import op
import sqlalchemy as sa

revision = "0003_chat_sessions"
down_revision = "0002_saving_goals"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_sessions",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("goal_id", sa.Integer(), sa.ForeignKey("saving_goals.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("chat_sessions")
