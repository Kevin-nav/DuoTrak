from sqlalchemy.orm import relationship
from sqlalchemy import desc

# Import all models to ensure they are registered with the Base
from .user import User
from .partnership import Partnership
from .partner_invitation import PartnerInvitation
from .badge import Badge
from .user_badge import UserBadge
from .goal import Goal
from .task import Task
from .user_behavioral_metrics import UserBehavioralMetrics
from .chat import Message, Reaction, Attachment

# Now that all models are imported and available, configure the relationships.
# This breaks the circular import dependency between the model files.

# --- User Relationships ---
User.sent_invitations = relationship(
    'PartnerInvitation',
    back_populates='sender',
    foreign_keys=[PartnerInvitation.sender_id],
    cascade='all, delete-orphan',
    order_by=desc(PartnerInvitation.created_at)
)

User.received_invitations = relationship(
    'PartnerInvitation',
    back_populates='receiver',
    foreign_keys=[PartnerInvitation.receiver_id],
    cascade='all, delete-orphan',
    order_by=desc(PartnerInvitation.created_at)
)

User.partnerships_as_user1 = relationship(
    'Partnership',
    foreign_keys=[Partnership.user1_id],
    back_populates='user1'
)

User.partnerships_as_user2 = relationship(
    'Partnership',
    foreign_keys=[Partnership.user2_id],
    back_populates='user2'
)

# This relationship links a User to their partner User record.
User.current_partner = relationship(
    "User",
    foreign_keys=[User.current_partner_id],
    primaryjoin="User.current_partner_id == User.id",
    uselist=False,
    remote_side=[User.id]
)


# --- Partnership Relationships ---
Partnership.user1 = relationship(
    "User",
    foreign_keys=[Partnership.user1_id],
    back_populates="partnerships_as_user1"
)

Partnership.user2 = relationship(
    "User",
    foreign_keys=[Partnership.user2_id],
    back_populates="partnerships_as_user2"
)



# --- PartnerInvitation Relationships ---
PartnerInvitation.sender = relationship(
    'User',
    back_populates='sent_invitations',
    foreign_keys=[PartnerInvitation.sender_id]
)

PartnerInvitation.receiver = relationship(
    'User',
    back_populates='received_invitations',
    foreign_keys=[PartnerInvitation.receiver_id]
)

# --- UserBadge Relationships ---
UserBadge.badge = relationship(
    'Badge',
    back_populates='user_badges'
)

Badge.user_badges = relationship(
    'UserBadge',
    back_populates='badge',
    cascade="all, delete-orphan"
)

