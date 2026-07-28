import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.products import Product, Order, OrderItem, Payment, AccessEntitlement
from app.core.deps import get_current_user, get_current_user_optional, PermissionChecker

router = APIRouter()

UPLOAD_DIR = "/app/uploads"

# --- Pydantic Schemas ---

class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    price: float
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    resource_ids: List[uuid.UUID] = []

class OrderCreateRequest(BaseModel):
    product_id: uuid.UUID

class VerifyPaymentRequest(BaseModel):
    status: str  # verified, rejected

# --- Endpoints ---

@router.get("/products", response_model=None)
def list_products(db: Session = Depends(get_db)):
    """
    List all active premium products.
    """
    products = db.query(Product).filter(Product.is_active == True).order_by(Product.name.asc()).all()
    return {
        "success": True,
        "data": [ProductResponse.model_validate(p) for p in products],
        "meta": {"count": len(products)},
        "error": None
    }

@router.post("/orders", response_model=None, status_code=status.HTTP_201_CREATED)
def create_order(
    req: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new pending order for a premium product.
    """
    product = db.query(Product).filter(Product.id == req.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    tracking_id = f"TRK-{uuid.uuid4().hex[:8].upper()}"
    
    order = Order(
        user_id=current_user.id,
        status="pending",
        total_amount=product.price,
        currency="PHP",  # Local payment GCash support
        tracking_id=tracking_id
    )
    db.add(order)
    db.flush()
    
    order_item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        price=product.price
    )
    db.add(order_item)
    db.commit()
    db.refresh(order)
    
    return {
        "success": True,
        "data": {
            "order_id": order.id,
            "tracking_id": order.tracking_id,
            "status": order.status,
            "total_amount": order.total_amount,
            "currency": order.currency
        },
        "meta": {},
        "error": None
    }

@router.post("/orders/{order_id}/pay", response_model=None)
async def upload_payment_proof(
    order_id: uuid.UUID,
    payment_method: str = Form(...),
    transaction_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a payment receipt screenshot (GCash or Bank transfer proof) for the pending order.
    """
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Check transaction_id uniqueness
    exists = db.query(Payment).filter(Payment.transaction_id == transaction_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Transaction reference code already submitted")
        
    # Write receipt to disk
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"receipt-{uuid.uuid4()}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save payment proof image: {str(e)}")
    finally:
        await file.close()
        
    # Create Payment proof record
    payment = Payment(
        order_id=order.id,
        payment_method=payment_method,
        status="pending",
        amount=order.total_amount,
        transaction_id=transaction_id,
        proof_filepath=unique_filename
    )
    db.add(payment)
    
    # Update order status to verification pending
    order.status = "pending_verification"
    db.commit()
    
    return {
        "success": True,
        "data": {
            "message": "Payment proof submitted successfully. Access will be granted shortly upon verification.",
            "status": order.status
        },
        "meta": {},
        "error": None
    }

@router.get("/entitlements", response_model=None)
def list_entitlements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all active resource and product entitlements for the logged-in user.
    """
    entitlements = db.query(AccessEntitlement).filter(AccessEntitlement.user_id == current_user.id).all()
    
    result = []
    for ent in entitlements:
        result.append({
            "resource_id": ent.resource_id,
            "product_id": ent.product_id,
            "starts_at": ent.starts_at,
            "expires_at": ent.expires_at
        })
        
    return {
        "success": True,
        "data": result,
        "meta": {"count": len(result)},
        "error": None
    }

# --- Admin Checkout Verifications Endpoints ---

@router.get("/admin/orders", response_model=None)
def admin_list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.review"))
):
    """
    (Admin only) Retrieve all checkouts and payment proofs listings.
    """
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        payment = db.query(Payment).filter(Payment.order_id == order.id).first()
        payment_data = None
        if payment:
            payment_data = {
                "id": payment.id,
                "payment_method": payment.payment_method,
                "status": payment.status,
                "transaction_id": payment.transaction_id,
                "proof_url": f"/uploads/{payment.proof_filepath}" if payment.proof_filepath else None
            }
            
        result.append({
            "id": order.id,
            "tracking_id": order.tracking_id,
            "status": order.status,
            "total_amount": order.total_amount,
            "created_at": order.created_at,
            "user_email": order.user.email,
            "payment": payment_data
        })
        
    return {
        "success": True,
        "data": result,
        "meta": {"count": len(result)},
        "error": None
    }

@router.post("/admin/orders/{order_id}/verify", response_model=None)
def verify_order_payment(
    order_id: uuid.UUID,
    req: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.review"))
):
    """
    (Admin only) Accept or reject payment proofs, automatically creating lifetime download entitlements.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    if not payment:
        raise HTTPException(status_code=400, detail="Order has no active payment submission record")
        
    if req.status == "verified":
        payment.status = "verified"
        order.status = "paid"
        
        # Load order items to create entitlements
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        for item in order_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                # 1. Product level access entitlement
                prod_ent = AccessEntitlement(
                    user_id=order.user_id,
                    product_id=product.id,
                    starts_at=datetime.now(timezone.utc)
                )
                db.add(prod_ent)
                
                # 2. Linked files/resources access entitlements
                for resource in product.resources:
                    res_ent = AccessEntitlement(
                        user_id=order.user_id,
                        resource_id=resource.id,
                        starts_at=datetime.now(timezone.utc)
                    )
                    db.add(res_ent)
                    
    elif req.status == "rejected":
        payment.status = "rejected"
        order.status = "cancelled"
    else:
        raise HTTPException(status_code=400, detail="Invalid verification status choice")
        
    db.commit()
    
    return {
        "success": True,
        "data": {
            "message": f"Order checkout has been marked as: {order.status}",
            "order_status": order.status,
            "payment_status": payment.status
        },
        "meta": {},
        "error": None
    }

@router.post("/products", response_model=None, status_code=status.HTTP_201_CREATED)
def admin_create_product(
    prod_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    """
    (Admin/Editor only) Scaffold a new premium product in the catalog.
    """
    from app.models.resources import Resource
    # Slug check
    exists = db.query(Product).filter(Product.slug == prod_in.slug).first()
    if exists:
        raise HTTPException(status_code=400, detail="Slug already in use")
        
    resources = db.query(Resource).filter(Resource.id.in_(prod_in.resource_ids)).all()
    
    db_prod = Product(
        name=prod_in.name,
        slug=prod_in.slug,
        description=prod_in.description,
        price=prod_in.price,
        resources=resources
    )
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    
    return {
        "success": True,
        "data": {
            "id": db_prod.id,
            "name": db_prod.name,
            "slug": db_prod.slug
        },
        "meta": {},
        "error": None
    }
