import json
from app.database.session import SessionLocal
from app.models.uniform import UniformItem
from app.models.tenant import Tenant

db = SessionLocal()

# Find tenant ID (e.g. Apex Technologies tenant)
tenant = db.query(Tenant).first()
if not tenant:
    print("No tenant found!")
    db.close()
    exit(0)

tenant_id = tenant.id

outfits = [
    {
        "name": "Executive Corporate Teal Suit Ensemble",
        "code": "UNIF-CORP-01",
        "category": "Corporate & Executive",
        "gender_group": "Corporate & HQ Staff",
        "model_image_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
        "description": "Tailored executive two-piece uniform featuring a slim-lapel corporate blazer in brand deep teal, matching tailored chinos, crisp white poplin shirt, and formal Italian leather dress shoes. Designed for management, front-desk corporate relations, and executive presentations.",
        "colors": "Deep Teal & Slate Charcoal",
        "sizes_available": "38R, 40R, 42R, 44R, 46L",
        "total_stock": 140,
        "distributed_stock": 42,
        "is_active": True,
        "items_breakdown": json.dumps([
            {
                "type": "outerwear",
                "label": "Executive Tailored Teal Blazer",
                "color": "Deep Teal (#075E54)",
                "sizes": "38R - 46L",
                "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "top",
                "label": "Crisp Poplin Button-Down Shirt",
                "color": "Bright White",
                "sizes": "S, M, L, XL, 2XL",
                "image_url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "bottom",
                "label": "Tailored Slim-Cut Dress Trousers",
                "color": "Slate Charcoal",
                "sizes": "30, 32, 34, 36, 38",
                "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "shoes",
                "label": "Oxford Handcrafted Commuter Shoes",
                "color": "Mahogany Brown",
                "sizes": "US 8 - 12",
                "image_url": "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "accessory",
                "label": "Silk Jacquard Corporate Tie & Clip",
                "color": "Deep Forest Teal",
                "sizes": "Standard",
                "image_url": "https://images.unsplash.com/photo-1589756823695-278bc923f962?w=400&auto=format&fit=crop&q=80"
            }
        ])
    },
    {
        "name": "High-Performance Logistics & Operations Kit",
        "code": "UNIF-OPS-02",
        "category": "Operations & Warehouse",
        "gender_group": "Warehouse & Logistics",
        "model_image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
        "description": "Ergonomic industrial workforce uniform engineered for extreme durability, moisture wicking, and maximum mobility. Features ANSI-compliant high-visibility detailing, multi-pocket reinforced ripstop cargo trousers, breathable quick-dry polo, and composite safety boots.",
        "colors": "Hi-Vis Amber & Industrial Navy",
        "sizes_available": "S, M, L, XL, 2XL, 3XL",
        "total_stock": 350,
        "distributed_stock": 184,
        "is_active": True,
        "items_breakdown": json.dumps([
            {
                "type": "top",
                "label": "Moisture-Wicking Tactical Polo Shirt",
                "color": "Industrial Navy",
                "sizes": "S, M, L, XL, 2XL, 3XL",
                "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "bottom",
                "label": "Heavy-Duty Ripstop Cargo Trousers",
                "color": "Shadow Grey",
                "sizes": "30, 32, 34, 36, 38, 40",
                "image_url": "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "outerwear",
                "label": "ANSI Class 2 Reflective Safety Vest",
                "color": "Hi-Vis Fluorescent Orange (#FF8B45)",
                "sizes": "M, L, XL, 2XL",
                "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "shoes",
                "label": "Steel-Toe Puncture-Proof Work Boots",
                "color": "Desert Tan / Matte Black",
                "sizes": "US 7 - 13",
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "accessory",
                "label": "Shock-Absorbing Work Gloves & Cap",
                "color": "Black & Orange",
                "sizes": "L / XL",
                "image_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80"
            }
        ])
    },
    {
        "name": "Tactical Facility Security & Patrol Uniform",
        "code": "UNIF-SEC-03",
        "category": "Security & Guard",
        "gender_group": "Security & Facilities",
        "model_image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
        "description": "Authoritative, weather-resistant security patrol uniform with reinforced shoulder epaulets for radio badges, tactical stretch trousers with concealed baton and flashlight holsters, weather-sealed patrol bomber, and anti-slip composite boots.",
        "colors": "Midnight Black & Dark Pewter",
        "sizes_available": "S, M, L, XL, 2XL",
        "total_stock": 190,
        "distributed_stock": 78,
        "is_active": True,
        "items_breakdown": json.dumps([
            {
                "type": "top",
                "label": "Patrol Officer Epaulet Shirt",
                "color": "Midnight Black",
                "sizes": "S, M, L, XL, 2XL",
                "image_url": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "bottom",
                "label": "Tactical Multi-Pocket Patrol Trousers",
                "color": "Midnight Black",
                "sizes": "30, 32, 34, 36, 38",
                "image_url": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "outerwear",
                "label": "Waterproof Security Patrol Bomber",
                "color": "Dark Pewter",
                "sizes": "M, L, XL, 2XL",
                "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "shoes",
                "label": "Anti-Slip Tactical Service Boots",
                "color": "Polished Black",
                "sizes": "US 8 - 13",
                "image_url": "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "accessory",
                "label": "Heavy-Duty Duty Belt with Holster Kit",
                "color": "Matte Tactical Black",
                "sizes": "Universal Adjustable",
                "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=80"
            }
        ])
    },
    {
        "name": "Field Technician & Telecom Specialist Rig",
        "code": "UNIF-TECH-04",
        "category": "Field Engineering",
        "gender_group": "Technical Field Engineers",
        "model_image_url": "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80",
        "description": "Specialized field engineer attire featuring anti-static conductive fabric, thermal zip jacket with RFID shielding chest pocket, abrasion-resistant articulated knee pants, and electrical hazard safety footwear.",
        "colors": "Steel Grey & Hazard Orange",
        "sizes_available": "S, M, L, XL, 2XL",
        "total_stock": 210,
        "distributed_stock": 95,
        "is_active": True,
        "items_breakdown": json.dumps([
            {
                "type": "top",
                "label": "Anti-Static Tech Performance Polo",
                "color": "Steel Grey",
                "sizes": "S, M, L, XL",
                "image_url": "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "outerwear",
                "label": "All-Weather Technical Softshell",
                "color": "Charcoal with Orange Accents",
                "sizes": "M, L, XL",
                "image_url": "https://images.unsplash.com/photo-1544441893-675973e31985?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "bottom",
                "label": "Cordura Reinforced Knee Work Trousers",
                "color": "Dark Graphite",
                "sizes": "32, 34, 36, 38",
                "image_url": "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "shoes",
                "label": "Electrical Hazard Rated Safety Boots",
                "color": "Black / Orange Sole",
                "sizes": "US 8 - 12",
                "image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=80"
            }
        ])
    },
    {
        "name": "Concierge & Hospitality Front-Desk Attire",
        "code": "UNIF-HOSP-05",
        "category": "Hospitality & Front Desk",
        "gender_group": "Guest Services & Concierge",
        "model_image_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
        "description": "Elegant and approachable hospitality uniform combining modern stretch-comfort tailoring, stain-resistant fabric treatment, a structured single-breasted blazer in deep teal, ivory crepe blouse, and polished comfort loafers.",
        "colors": "Deep Teal & Warm Ivory",
        "sizes_available": "XS, S, M, L, XL",
        "total_stock": 120,
        "distributed_stock": 35,
        "is_active": True,
        "items_breakdown": json.dumps([
            {
                "type": "outerwear",
                "label": "Signature Hospitality Single-Breasted Blazer",
                "color": "Deep Teal (#075E54)",
                "sizes": "XS, S, M, L, XL",
                "image_url": "https://images.unsplash.com/photo-1548624149-f9b1859aa7d0?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "top",
                "label": "Ivory Crepe Mock-Neck Blouse",
                "color": "Warm Ivory",
                "sizes": "XS, S, M, L, XL",
                "image_url": "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "bottom",
                "label": "High-Waist Comfort Stretch Cigarette Pants",
                "color": "Deep Teal",
                "sizes": "26, 28, 30, 32, 34",
                "image_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&auto=format&fit=crop&q=80"
            },
            {
                "type": "shoes",
                "label": "Orthotic-Support Leather Penny Loafers",
                "color": "Burnished Cognac",
                "sizes": "US 6 - 10",
                "image_url": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&auto=format&fit=crop&q=80"
            }
        ])
    }
]

for out_data in outfits:
    existing = db.query(UniformItem).filter(
        UniformItem.tenant_id == tenant_id,
        UniformItem.code == out_data["code"]
    ).first()

    if existing:
        for k, v in out_data.items():
            setattr(existing, k, v)
        print(f"Updated: {out_data['name']}")
    else:
        new_item = UniformItem(tenant_id=tenant_id, **out_data)
        db.add(new_item)
        print(f"Created: {out_data['name']}")

db.commit()
db.close()
print("All uniform outfit catalogue entries seeded successfully.")
