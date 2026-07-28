import uuid
import hashlib
from app.db.session import SessionLocal
from app.models.user import Role, Permission, User, Profile
from app.models.ai import AIProvider, AIModel, AIPromptTemplate

def get_password_hash(password: str) -> str:
    # Development placeholder hash
    return hashlib.sha256(password.encode()).hexdigest()

def seed_db():
    db = SessionLocal()
    try:
        print("Seeding database...")
        
        # 1. Seed Permissions
        permissions_data = [
            {"name": "ai.public.use", "description": "Access public AI Assistant"},
            {"name": "ai.member.use", "description": "Access logged-in member AI Assistant"},
            {"name": "ai.premium.use", "description": "Access premium student/user AI Assistant"},
            {"name": "ai.cms.generate", "description": "Use AI to generate CMS content and metadata"},
            {"name": "ai.cms.review", "description": "Use AI for editorial reviews and revisions checks"},
            {"name": "ai.analytics.view", "description": "Access AI usage analytics"},
            {"name": "ai.prompts.manage", "description": "Manage AI Prompt Templates and versions"},
            {"name": "ai.providers.manage", "description": "Configure AI Providers and Model entries"},
            {"name": "ai.evaluations.manage", "description": "Manage and run AI automated evaluation cases"},
        ]
        
        db_permissions = {}
        for p in permissions_data:
            existing = db.query(Permission).filter(Permission.name == p["name"]).first()
            if not existing:
                perm = Permission(name=p["name"], description=p["description"])
                db.add(perm)
                db_permissions[p["name"]] = perm
                print(f"Created permission: {p['name']}")
            else:
                db_permissions[p["name"]] = existing
        db.commit()
        
        # 2. Seed Roles and assign permissions
        roles_data = [
            {
                "name": "Administrator",
                "description": "Full system control and configurations",
                "permissions": list(db_permissions.keys())
            },
            {
                "name": "Editor",
                "description": "Editorial workflow management and reviews",
                "permissions": ["ai.public.use", "ai.member.use", "ai.cms.generate", "ai.cms.review"]
            },
            {
                "name": "Author",
                "description": "Content creators and draft authors",
                "permissions": ["ai.public.use", "ai.member.use", "ai.cms.generate"]
            },
            {
                "name": "Premium User",
                "description": "Premium members with extended learning access",
                "permissions": ["ai.public.use", "ai.member.use", "ai.premium.use"]
            },
            {
                "name": "Member",
                "description": "Registered regular members",
                "permissions": ["ai.public.use", "ai.member.use"]
            },
            {
                "name": "Subscriber",
                "description": "Email-subscribed newsletter readers",
                "permissions": ["ai.public.use"]
            }
        ]
        
        db_roles = {}
        for r in roles_data:
            existing = db.query(Role).filter(Role.name == r["name"]).first()
            if not existing:
                role = Role(
                    name=r["name"],
                    description=r["description"],
                    permissions=[db_permissions[p_name] for p_name in r["permissions"]]
                )
                db.add(role)
                db_roles[r["name"]] = role
                print(f"Created role: {r['name']}")
            else:
                # Update permissions in case they changed
                existing.permissions = [db_permissions[p_name] for p_name in r["permissions"]]
                db_roles[r["name"]] = existing
        db.commit()
        
        # 3. Seed Default Admin User
        admin_email = "admin@techrepubl1k.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_role = db_roles["Administrator"]
            user = User(
                email=admin_email,
                hashed_password=get_password_hash("adminpassword123"),
                is_active=True,
                is_verified=True,
                role_id=admin_role.id
            )
            db.add(user)
            db.flush()  # get user id
            
            profile = Profile(
                user_id=user.id,
                first_name="Joseph",
                last_name="Lorilla",
                bio="Software Developer, Researcher, and AI Practitioner.",
                avatar_url=None
            )
            db.add(profile)
            print(f"Created admin user: {admin_email}")
        db.commit()
        
        # 4. Seed AI Providers and Models
        provider_code = "ollama"
        ollama_provider = db.query(AIProvider).filter(AIProvider.code == provider_code).first()
        if not ollama_provider:
            prov = AIProvider(
                code=provider_code,
                name="Ollama (Local Models Server)",
                enabled=True,
                base_url="http://ollama:11434",
                priority=1,
                settings_jsonb={"timeout": 60}
            )
            db.add(prov)
            db.flush()
            
            models = [
                AIModel(
                    provider_id=prov.id,
                    model_key="llama3",
                    display_name="Llama 3 (8B)",
                    model_type="chat",
                    context_size=8192,
                    enabled=True,
                    supports_streaming=True
                ),
                AIModel(
                    provider_id=prov.id,
                    model_key="nomic-embed-text",
                    display_name="Nomic Embed Text",
                    model_type="embedding",
                    context_size=2048,
                    enabled=True,
                    supports_embeddings=True,
                    supports_streaming=False
                )
            ]
            db.add_all(models)
            print("Created Ollama AI Provider and Default Models (llama3, nomic-embed-text)")
        db.commit()
        
        # 5. Seed Prompt Templates
        templates = [
            {
                "key": "public_assistant",
                "name": "Public AI Assistant System Prompt",
                "description": "Grounding instructions for public visitors querying website content",
                "task_type": "public_assistant"
            },
            {
                "key": "outline_generator",
                "name": "CMS Tutorial Outline Generator",
                "description": "Generates complete structured markdown tutorial outlines",
                "task_type": "outline_generator"
            },
            {
                "key": "seo_generator",
                "name": "SEO Metadata Generator",
                "description": "Generates web page optimized title, keywords and description",
                "task_type": "seo_generator"
            }
        ]
        
        for t in templates:
            existing = db.query(AIPromptTemplate).filter(AIPromptTemplate.key == t["key"]).first()
            if not existing:
                temp = AIPromptTemplate(
                    key=t["key"],
                    name=t["name"],
                    description=t["description"],
                    task_type=t["task_type"]
                )
                db.add(temp)
                print(f"Created Prompt Template: {t['key']}")
        db.commit()
        
        print("Database seeding completed successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
