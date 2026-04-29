"""saving_goals

Revision ID: 0002_saving_goals
Revises: 0001_init
Create Date: 2026-04-29

"""

from alembic import op
import sqlalchemy as sa

revision = "0002_saving_goals"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saving_goals",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("target_amount", sa.Integer(), nullable=False),
        sa.Column("current_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("monthly_contribution", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_saving_goals_updated_at", "saving_goals", ["updated_at"])


def downgrade() -> None:
    op.drop_index("ix_saving_goals_updated_at", table_name="saving_goals")
    op.drop_table("saving_goals")
