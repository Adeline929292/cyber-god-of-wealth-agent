"""purchase_intents price_quotes cooldown_lists

Revision ID: 0004_cooldown_persistence
Revises: 0003_chat_sessions
Create Date: 2026-04-29

"""

from alembic import op
import sqlalchemy as sa

revision = "0004_cooldown_persistence"
down_revision = "0003_chat_sessions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "purchase_intents",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("goal_id", sa.Integer(), sa.ForeignKey("saving_goals.id"), nullable=True),
        sa.Column("session_id", sa.String(), sa.ForeignKey("chat_sessions.id"), nullable=True),
        sa.Column("item_name", sa.String(), nullable=False),
        sa.Column("stated_price", sa.Integer(), nullable=True),
        sa.Column("chosen_price", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(), nullable=False, server_default="CNY"),
        sa.Column("reason", sa.String(), nullable=True),
        sa.Column("decision", sa.String(), nullable=False),
        sa.Column("persona", sa.String(), nullable=False),
        sa.Column("advice_text", sa.Text(), nullable=False),
        sa.Column("best_price", sa.Integer(), nullable=True),
        sa.Column("save_vs_best", sa.Integer(), nullable=True),
        sa.Column("eta_shift_days", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "price_quotes",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("purchase_intent_id", sa.Integer(), sa.ForeignKey("purchase_intents.id"), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "cooldown_lists",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("purchase_intent_id", sa.Integer(), sa.ForeignKey("purchase_intents.id"), nullable=False),
        sa.Column("items_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("cooldown_lists")
    op.drop_table("price_quotes")
    op.drop_table("purchase_intents")
