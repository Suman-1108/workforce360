from datetime import datetime, timezone, timedelta, time, date
from app.database.session import SessionLocal
from app.core.security import get_password_hash
from app.models.tenant import Tenant
from app.models.subscription import SubscriptionPlan, Subscription
from app.models.user import User
from app.models.department import Department
from app.models.branch import Branch
from app.models.employee import Employee
from app.models.shift import Shift, EmployeeShift
from app.models.attendance import Attendance
from app.models.leave import LeaveType, LeaveRequest
from app.models.uniform import UniformItem, UniformDistribution


def seed_database():
    db = SessionLocal()
    try:
        print("[1/10] Checking existing subscription plans...")
        # 1. Subscription Plans
        if not db.query(SubscriptionPlan).first():
            plans = [
                SubscriptionPlan(
                    name="Starter Tier",
                    code="starter",
                    price_monthly=29.00,
                    price_yearly=290.00,
                    currency="USD",
                    max_employees=25,
                    max_branches=1,
                    has_selfie_verification=False,
                    has_rotational_shifts=False,
                    has_uniform_tracking=False,
                    has_analytics_export=False,
                    has_custom_geofence=False,
                    has_api_access=False,
                    features=[
                        "Up to 25 Active Employees",
                        "Single Branch Geofencing",
                        "Standard Morning/Evening Shifts",
                        "Basic Leave Request Workflow",
                        "Email Support (24h response)",
                        "30-Day Attendance Logs"
                    ]
                ),
                SubscriptionPlan(
                    name="Professional Tier",
                    code="professional",
                    price_monthly=79.00,
                    price_yearly=790.00,
                    currency="USD",
                    max_employees=200,
                    max_branches=-1,
                    has_selfie_verification=True,
                    has_rotational_shifts=True,
                    has_uniform_tracking=True,
                    has_analytics_export=True,
                    has_custom_geofence=False,
                    has_api_access=False,
                    features=[
                        "Up to 200 Active Employees",
                        "Unlimited Geofenced Branches",
                        "GPS & Camera Selfie Verification",
                        "Rotational & Overnight Shifts",
                        "Multi-Tier Manager Approvals",
                        "Uniform & Gear Tracking",
                        "Real-Time Analytics & CSV/Excel Exports",
                        "Priority Technical Support"
                    ]
                ),
                SubscriptionPlan(
                    name="Enterprise Tier",
                    code="enterprise",
                    price_monthly=199.00,
                    price_yearly=1990.00,
                    currency="USD",
                    max_employees=-1,
                    max_branches=-1,
                    has_selfie_verification=True,
                    has_rotational_shifts=True,
                    has_uniform_tracking=True,
                    has_analytics_export=True,
                    has_custom_geofence=True,
                    has_api_access=True,
                    features=[
                        "Unlimited Employees & Branches",
                        "Custom Geofence Radius & Polygonal Boundaries",
                        "Custom SSO / SAML Authentication",
                        "Automated Razorpay Billing & Webhooks",
                        "Full Audit Logging & Tenant Data Isolation",
                        "Dedicated Account Manager",
                        "Custom Payroll API Integrations",
                        "99.9% Uptime Guarantee SLA"
                    ]
                )
            ]
            db.add_all(plans)
            db.commit()
            print("  -> Seeded 3 subscription tiers: Starter ($29), Professional ($79), Enterprise ($199)")

        # 2. Superadmin User
        print("[2/10] Checking SuperAdmin user...")
        superadmin = db.query(User).filter(User.email == "admin@workforce360.io").first()
        if not superadmin:
            superadmin = User(
                email="admin@workforce360.io",
                password_hash=get_password_hash("Password@123"),
                first_name="Global",
                last_name="SuperAdmin",
                role="superadmin",
                is_active=True,
                is_verified=True,
                phone="+1 (555) 000-3600"
            )
            db.add(superadmin)
            db.commit()
            print("  -> Seeded SuperAdmin: admin@workforce360.io (Password@123)")

        # 3. Demo Tenant
        print("[3/10] Checking Demo Tenant...")
        tenant = db.query(Tenant).filter(Tenant.subdomain == "apex").first()
        if not tenant:
            tenant = Tenant(
                name="Apex Global Technologies",
                subdomain="apex",
                contact_email="owner@apextechnologies.com",
                contact_phone="+1 (555) 345-6789",
                address="742 Evergreen Terrace, San Francisco, CA 94107",
                status="active"
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"  -> Seeded Tenant: Apex Global Technologies (ID: {tenant.id})")

        # 4. Tenant Subscription
        sub = db.query(Subscription).filter(Subscription.tenant_id == tenant.id).first()
        if not sub:
            pro_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "professional").first()
            now = datetime.now(timezone.utc)
            sub = Subscription(
                tenant_id=tenant.id,
                plan_id=pro_plan.id,
                status="active",
                billing_cycle="monthly",
                current_period_start=now,
                current_period_end=now + timedelta(days=365)
            )
            db.add(sub)
            db.commit()
            print("  -> Assigned Professional Tier subscription to Apex Global")

        # 5. Organization Owner User
        print("[4/10] Checking Organization Owner...")
        owner = db.query(User).filter(User.email == "owner@apextechnologies.com").first()
        if not owner:
            owner = User(
                tenant_id=tenant.id,
                email="owner@apextechnologies.com",
                password_hash=get_password_hash("Password@123"),
                first_name="Marcus",
                last_name="Sterling",
                role="owner",
                is_active=True,
                is_verified=True,
                phone="+1 (555) 987-6543"
            )
            db.add(owner)
            db.commit()
            print("  -> Seeded Org Owner: owner@apextechnologies.com (Password@123)")

        # 6. Departments & Branches
        print("[5/10] Checking Departments & Branches...")
        eng_dept = db.query(Department).filter(Department.tenant_id == tenant.id, Department.name == "Engineering").first()
        if not eng_dept:
            eng_dept = Department(tenant_id=tenant.id, name="Engineering", code="ENG", description="Software & Platform Engineering", manager_name="Marcus Sterling")
            ops_dept = Department(tenant_id=tenant.id, name="Operations", code="OPS", description="Workforce Field Operations", manager_name="Sarah Jenkins")
            sales_dept = Department(tenant_id=tenant.id, name="Sales & Marketing", code="MKT", description="Enterprise Growth & Accounts", manager_name="David Miller")
            hr_dept = Department(tenant_id=tenant.id, name="Human Resources", code="HR", description="People Operations & Talent", manager_name="Elena Vance")
            db.add_all([eng_dept, ops_dept, sales_dept, hr_dept])
            db.commit()
            db.refresh(eng_dept)
            print("  -> Seeded 4 departments: ENG, OPS, MKT, HR")

        hq_branch = db.query(Branch).filter(Branch.tenant_id == tenant.id, Branch.name == "Apex HQ Campus").first()
        if not hq_branch:
            hq_branch = Branch(
                tenant_id=tenant.id,
                name="Apex HQ Campus",
                code="HQ-01",
                address="742 Evergreen Terrace",
                city="San Francisco",
                state="CA",
                latitude=37.7749,
                longitude=-122.4194,
                radius_meters=300,
                is_active=True
            )
            db.add(hq_branch)
            db.commit()
            db.refresh(hq_branch)
            print("  -> Seeded HQ Branch with 300m geofence radius")

        # 7. Shifts
        print("[6/10] Checking Shifts...")
        day_shift = db.query(Shift).filter(Shift.tenant_id == tenant.id, Shift.name == "Standard Day Shift").first()
        if not day_shift:
            day_shift = Shift(
                tenant_id=tenant.id,
                name="Standard Day Shift",
                code="S-DAY",
                type="Day",
                start_time=time(9, 0),
                end_time=time(18, 0),
                grace_period_mins=15
            )
            morning_shift = Shift(
                tenant_id=tenant.id,
                name="Early Morning Shift",
                code="S-MORN",
                type="Morning",
                start_time=time(6, 0),
                end_time=time(15, 0),
                grace_period_mins=15
            )
            evening_shift = Shift(
                tenant_id=tenant.id,
                name="Evening Rotational Shift",
                code="S-EVE",
                type="Evening",
                start_time=time(14, 0),
                end_time=time(23, 0),
                grace_period_mins=15
            )
            db.add_all([day_shift, morning_shift, evening_shift])
            db.commit()
            db.refresh(day_shift)
            print("  -> Seeded 3 standard/rotational shifts")

        # 8. Leave Types
        print("[7/10] Checking Leave Types...")
        if not db.query(LeaveType).filter(LeaveType.tenant_id == tenant.id).first():
            leave_types = [
                LeaveType(tenant_id=tenant.id, name="Casual Leave", code="CL", days_allowed_per_year=12, is_carry_forward=False),
                LeaveType(tenant_id=tenant.id, name="Medical / Sick Leave", code="SL", days_allowed_per_year=10, is_carry_forward=False),
                LeaveType(tenant_id=tenant.id, name="Earned Privilege Leave", code="PL", days_allowed_per_year=18, is_carry_forward=True),
            ]
            db.add_all(leave_types)
            db.commit()
            print("  -> Seeded 3 leave types: CL, SL, PL")

        # 9. Uniform Items
        print("[8/10] Checking Uniform Items...")
        if not db.query(UniformItem).filter(UniformItem.tenant_id == tenant.id).first():
            items = [
                UniformItem(tenant_id=tenant.id, name="High-Visibility Safety Vest", category="Protective Gear", sizes_available="S, M, L, XL, XXL", total_stock=150, distributed_stock=42),
                UniformItem(tenant_id=tenant.id, name="Operations Polo Shirt", category="Apparel", sizes_available="S, M, L, XL", total_stock=300, distributed_stock=110),
                UniformItem(tenant_id=tenant.id, name="Steel Toe Tactical Boots", category="Footwear", sizes_available="8, 9, 10, 11, 12", total_stock=90, distributed_stock=35),
            ]
            db.add_all(items)
            db.commit()
            print("  -> Seeded 3 uniform items with stock tracking")

        # 10. Demo Employee User & Profile
        print("[9/10] Checking Demo Employee...")
        emp_user = db.query(User).filter(User.email == "employee@apextechnologies.com").first()
        if not emp_user:
            emp_user = User(
                tenant_id=tenant.id,
                email="employee@apextechnologies.com",
                password_hash=get_password_hash("Password@123"),
                first_name="Alex",
                last_name="Morgan",
                role="employee",
                is_active=True,
                is_verified=True,
                phone="+1 (555) 432-1098"
            )
            db.add(emp_user)
            db.commit()
            db.refresh(emp_user)

            emp_record = Employee(
                tenant_id=tenant.id,
                user_id=emp_user.id,
                employee_id_number="EMP-1001",
                department_id=eng_dept.id,
                branch_id=hq_branch.id,
                designation="Senior Full Stack Engineer",
                employment_type="Full-time",
                joining_date=date(2023, 4, 15),
                salary=85000.00,
                status="Active",
                emergency_contact="+1 (555) 999-8877"
            )
            db.add(emp_record)
            db.commit()
            db.refresh(emp_record)

            # Assign shift
            emp_shift = EmployeeShift(
                tenant_id=tenant.id,
                employee_id=emp_record.id,
                shift_id=day_shift.id,
                effective_date=date.today() - timedelta(days=60)
            )
            db.add(emp_shift)

            # Seed past 5 days attendance
            today = date.today()
            for i in range(1, 6):
                past_d = today - timedelta(days=i)
                if past_d.weekday() < 5:  # Monday to Friday
                    cin = datetime.combine(past_d, time(8, 55))
                    cout = datetime.combine(past_d, time(18, 5))
                    att = Attendance(
                        tenant_id=tenant.id,
                        employee_id=emp_record.id,
                        date=past_d,
                        check_in=cin,
                        check_out=cout,
                        status="Present",
                        check_in_latitude=37.7749,
                        check_in_longitude=-122.4194,
                        check_in_accuracy=8.5,
                        check_in_address="742 Evergreen Terrace, San Francisco, CA",
                        check_in_selfie_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                        is_geofence_verified=True,
                        work_duration_minutes=550
                    )
                    db.add(att)

            db.commit()
            print("  -> Seeded Demo Employee: Alex Morgan (employee@apextechnologies.com / Password@123)")

        print("[10/10] Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
