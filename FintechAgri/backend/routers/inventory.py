"""Inventory CRUD endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.inventory import Inventory
from models.user import User
from schemas.inventory import (
    InventoryCreate,
    InventoryResponse,
    InventorySummary,
    InventoryUpdate,
)
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.get("", response_model=list[InventoryResponse])
def list_inventory(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Return all inventory items for the authenticated user."""
    items = (
        db.query(Inventory)
        .filter(Inventory.user_id == current_user.id)
        .order_by(Inventory.created_at.desc())
        .all()
    )
    return items


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    payload: InventoryCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Add a new inventory item for the authenticated user."""
    item = Inventory(
        user_id=current_user.id,
        crop=payload.crop,
        quantity_quintals=payload.quantity_quintals,
        grade=payload.grade,
        storage_location=payload.storage_location,
        harvest_date=payload.harvest_date,
        estimated_value=payload.estimated_value,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=InventoryResponse)
def update_item(
    item_id: int,
    payload: InventoryUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update an inventory item (must belong to the authenticated user)."""
    item = db.query(Inventory).filter(
        Inventory.id == item_id, Inventory.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Delete an inventory item (must belong to the authenticated user)."""
    item = db.query(Inventory).filter(
        Inventory.id == item_id, Inventory.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    db.delete(item)
    db.commit()


@router.get("/summary", response_model=InventorySummary)
def inventory_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Return aggregated inventory totals for the authenticated user."""
    items = db.query(Inventory).filter(Inventory.user_id == current_user.id).all()

    total_quantity = sum(i.quantity_quintals for i in items)
    total_value = sum(i.estimated_value or 0 for i in items)

    items_by_crop: dict[str, float] = {}
    for i in items:
        items_by_crop[i.crop] = items_by_crop.get(i.crop, 0) + i.quantity_quintals

    return InventorySummary(
        total_items=len(items),
        total_quantity=total_quantity,
        total_value=total_value,
        items_by_crop=items_by_crop,
    )
