from app.models.partnership import Partnership
from app.repositories.base_repository import BaseRepository
from app.schemas.partnership import PartnershipCreate, PartnershipUpdate


class PartnershipRepository(BaseRepository[Partnership, PartnershipCreate, PartnershipUpdate]):
    pass


partnership_repo = PartnershipRepository(Partnership)
