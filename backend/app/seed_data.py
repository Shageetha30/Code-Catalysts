import datetime
import random
import json
from sqlalchemy.orm import Session
from .models import Shipment, Batch, Reading, Incident, Checkpoint, ReviewAudit
from .ml_detector import ml_detector
from .review_priority import calculate_batch_review_priority

def seed_database(db: Session):
    # Check if database already has shipments
    if db.query(Shipment).first():
        return

    now = datetime.datetime.utcnow()

    # 1. SHIPMENT 1: Active / Normal (Comirnaty mRNA)
    shp1 = Shipment(
        id="SHP-7041",
        origin="National Cold Storage Hub (Terminal 3)",
        destination="Metropolitan Central Hospital, Pharmacy Bay",
        courier="AeroCold LifeScience Logistics",
        status="Normal",
        vaccine_name="Comirnaty (COVID-19 mRNA Formulation)",
        target_temp_min=2.0,
        target_temp_max=8.0,
        created_at=now - datetime.timedelta(hours=6),
        updated_at=now
    )
    db.add(shp1)

    batch1 = Batch(
        id="BNT-2026-X1",
        shipment_id="SHP-7041",
        vaccine_type="mRNA Lipid Nanoparticle",
        quantity_doses=5000,
        manufacturing_date="2026-08-10",
        expiry_date="2027-02-10",
        review_status="Standard",
        priority_score=12.0,
        priority_level="Low"
    )
    db.add(batch1)

    cp1_1 = Checkpoint(
        shipment_id="SHP-7041",
        step_number=1,
        location_name="National Cold Storage Hub (Terminal 3)",
        simulated_coordinates="37.7749, -122.4194 (Simulated Route)",
        custodian_role="Dispatch Operations Lead",
        custodian_name="Dr. Arthur Vance",
        handoff_status="Completed",
        recorded_at=now - datetime.timedelta(hours=6),
        notes="Pre-departure cold chamber check passed at 4.2°C. Thermal seals verified."
    )
    cp1_2 = Checkpoint(
        shipment_id="SHP-7041",
        step_number=2,
        location_name="AeroCargo Staging Bay 4",
        simulated_coordinates="37.6213, -122.3790 (Simulated Route)",
        custodian_role="Aviation Cold-Chain Custodian",
        custodian_name="Elena Rostova",
        handoff_status="Completed",
        recorded_at=now - datetime.timedelta(hours=4),
        notes="Loaded into temperature-controlled container Unit CC-99."
    )
    cp1_3 = Checkpoint(
        shipment_id="SHP-7041",
        step_number=3,
        location_name="Metro Regional Transit Hub",
        simulated_coordinates="37.8044, -122.2712 (Simulated Route)",
        custodian_role="Certified Cold Transport Specialist",
        custodian_name="Marcus Thorne",
        handoff_status="Completed",
        recorded_at=now - datetime.timedelta(hours=2),
        notes="Vehicle reefer unit operational. Sensor battery at 98%."
    )
    cp1_4 = Checkpoint(
        shipment_id="SHP-7041",
        step_number=4,
        location_name="Metropolitan Central Hospital, Pharmacy Bay",
        simulated_coordinates="37.7892, -122.4014 (Simulated Route)",
        custodian_role="Hospital Chief Pharmacist",
        custodian_name="Sarah Lin, PharmD",
        handoff_status="Pending",
        recorded_at=None,
        notes="Awaiting destination arrival and digital chain-of-custody handoff signoff."
    )
    db.add_all([cp1_1, cp1_2, cp1_3, cp1_4])

    # Generate 20 readings for SHP-7041 (stable normal pattern between 3.8°C and 5.2°C)
    for i in range(20):
        t = now - datetime.timedelta(minutes=(20 - i) * 3)
        temp = round(4.5 + 0.5 * random.uniform(-1, 1), 2)
        r = Reading(
            shipment_id="SHP-7041",
            timestamp=t,
            temperature=temp,
            humidity=44.0 + random.uniform(-1, 1),
            battery_level=98.5 - (i * 0.05),
            is_threshold_excursion=False,
            is_ml_anomaly=False,
            anomaly_score=0.18,
            anomaly_explanation="Nominal cold-chain trajectory. Mean temp 4.5°C within bounds [2.0°C - 8.0°C]."
        )
        db.add(r)

    # 2. SHIPMENT 2: Active / Alert (Rotarix with heat spike excursion)
    shp2 = Shipment(
        id="SHP-8820",
        origin="Regional Distribution Depot (Bay 12)",
        destination="District Primary Healthcare Center",
        courier="MediTrack Express Fleet",
        status="Alert",
        vaccine_name="Rotarix (Rotavirus Vaccine Live Oral)",
        target_temp_min=2.0,
        target_temp_max=8.0,
        created_at=now - datetime.timedelta(hours=4),
        updated_at=now
    )
    db.add(shp2)

    batch2 = Batch(
        id="ROTA-2026-M4",
        shipment_id="SHP-8820",
        vaccine_type="Live Attenuated Viral Suspension",
        quantity_doses=2400,
        manufacturing_date="2026-07-15",
        expiry_date="2027-01-15",
        review_status="Under Review",
        review_reason="Excursion breached 8.0°C upper limit during transfer stage. Pharmacist stability triage opened.",
        reviewed_by="Demo Dr. J. Martinez (Lead QA)",
        reviewed_at=now - datetime.timedelta(minutes=15),
        priority_score=68.5,
        priority_level="High"
    )
    db.add(batch2)

    cp2_1 = Checkpoint(
        shipment_id="SHP-8820",
        step_number=1,
        location_name="Regional Distribution Depot (Bay 12)",
        simulated_coordinates="34.0522, -118.2437 (Simulated Route)",
        custodian_role="Cold-Chain Depot Supervisor",
        custodian_name="Carlos Mendez",
        handoff_status="Completed",
        recorded_at=now - datetime.timedelta(hours=4),
        notes="Dispatched in insulated passive cooler box #41."
    )
    cp2_2 = Checkpoint(
        shipment_id="SHP-8820",
        step_number=2,
        location_name="Mid-Valley Cross-Dock Depot",
        simulated_coordinates="34.1808, -118.3089 (Simulated Route)",
        custodian_role="Cross-Dock Manager",
        custodian_name="David Patel",
        handoff_status="Delayed",
        recorded_at=now - datetime.timedelta(hours=1),
        notes="Handoff documentation delayed by 45 minutes due to dock reefer inspection."
    )
    cp2_3 = Checkpoint(
        shipment_id="SHP-8820",
        step_number=3,
        location_name="District Primary Healthcare Center",
        simulated_coordinates="34.2257, -118.4412 (Simulated Route)",
        custodian_role="Clinic Vaccine Coordinator",
        custodian_name="Nurse Rachel Adams",
        handoff_status="Pending",
        recorded_at=None,
        notes="Pending arrival inspection and batch priority review."
    )
    db.add_all([cp2_1, cp2_2, cp2_3])

    # Generate readings showing an excursion climbing from 5.0 to 10.2°C
    for i in range(20):
        t = now - datetime.timedelta(minutes=(20 - i) * 3)
        if i < 10:
            temp = round(4.8 + random.uniform(-0.3, 0.3), 2)
            is_ex = False
            is_anom = False
            score = 0.22
            expl = "Nominal cold chain."
        elif i < 14:
            # Pre-excursion rise: ML catches anomaly before crossing 8.0°C!
            temp = round(5.5 + (i - 10) * 0.7, 2)
            is_ex = (temp > 8.0)
            is_anom = True
            score = 0.74
            expl = f"Steep thermal rise (+0.70°C/step) indicates active cooling failure or open transit hatch."
        else:
            temp = round(8.4 + (i - 14) * 0.45, 2)
            is_ex = True
            is_anom = True
            score = 0.92
            expl = f"Breached upper threshold ({temp}°C > 8.0°C) with sustained thermal vector."

        r = Reading(
            shipment_id="SHP-8820",
            timestamp=t,
            temperature=temp,
            humidity=52.0,
            battery_level=94.0 - (i * 0.05),
            is_threshold_excursion=is_ex,
            is_ml_anomaly=is_anom,
            anomaly_score=score,
            anomaly_explanation=expl
        )
        db.add(r)

    # Add Incident for SHP-8820
    inc1 = Incident(
        id="INC-2026-088",
        shipment_id="SHP-8820",
        batch_id="ROTA-2026-M4",
        incident_type="Temperature Threshold",
        severity="High",
        title="Upper Thermal Threshold Breach (10.2°C)",
        description="Shipment SHP-8820 exceeded maximum safe storage temperature of 8.0°C for 18 consecutive minutes during Mid-Valley transit.",
        recorded_temp=10.2,
        status="Investigating",
        resolution_notes="Investigating secondary cooler insulation integrity with courier driver.",
        created_at=now - datetime.timedelta(minutes=30)
    )
    inc2 = Incident(
        id="INC-2026-082",
        shipment_id="SHP-8820",
        batch_id="ROTA-2026-M4",
        incident_type="Handoff Discrepancy",
        severity="Medium",
        title="Delayed Custody Verification at Mid-Valley",
        description="Physical custody handoff unverified for 45 minutes beyond scheduled ETA window.",
        recorded_temp=7.8,
        status="Open",
        created_at=now - datetime.timedelta(hours=1)
    )
    db.add_all([inc1, inc2])

    # 3. SHIPMENT 3: Active / Normal (BCG Freeze-Dried)
    shp3 = Shipment(
        id="SHP-9105",
        origin="State Serum Institute Depository",
        destination="County Immunization Clinic",
        courier="CryoSecure Couriers",
        status="Normal",
        vaccine_name="BCG Freeze-Dried Vaccine",
        target_temp_min=2.0,
        target_temp_max=8.0,
        created_at=now - datetime.timedelta(hours=8),
        updated_at=now
    )
    db.add(shp3)

    batch3 = Batch(
        id="BCG-2026-B8",
        shipment_id="SHP-9105",
        vaccine_type="Lyophilized Live Attenuated Mycobacterial",
        quantity_doses=3000,
        manufacturing_date="2026-06-20",
        expiry_date="2027-06-20",
        review_status="Standard",
        priority_score=8.5,
        priority_level="Low"
    )
    db.add(batch3)

    cp3_1 = Checkpoint(
        shipment_id="SHP-9105",
        step_number=1,
        location_name="State Serum Institute Depository",
        simulated_coordinates="42.3601, -71.0589 (Simulated Route)",
        custodian_role="Warehouse Logistics Pharmacist",
        custodian_name="Hannah Berg",
        handoff_status="Completed",
        recorded_at=now - datetime.timedelta(hours=8),
        notes="Packed with digital data logger ID #DL-9002."
    )
    cp3_2 = Checkpoint(
        shipment_id="SHP-9105",
        step_number=2,
        location_name="County Immunization Clinic",
        simulated_coordinates="42.3550, -71.0650 (Simulated Route)",
        custodian_role="Immunization Clinic Manager",
        custodian_name="George Thorne",
        handoff_status="Completed",
        recorded_at=now - datetime.timedelta(minutes=20),
        notes="Delivered in good order. Cold chain maintained."
    )
    db.add_all([cp3_1, cp3_2])

    for i in range(15):
        t = now - datetime.timedelta(minutes=(15 - i) * 4)
        db.add(Reading(
            shipment_id="SHP-9105",
            timestamp=t,
            temperature=round(4.1 + random.uniform(-0.4, 0.4), 2),
            humidity=46.0,
            battery_level=96.0,
            is_threshold_excursion=False,
            is_ml_anomaly=False,
            anomaly_score=0.12,
            anomaly_explanation="Nominal cold chain."
        ))

    # 4. SHIPMENT 4: Quarantined Batch (Inactivated Polio Vaccine)
    shp4 = Shipment(
        id="SHP-6032",
        origin="Central Vaccine Reserve",
        destination="Sub-District Health Post #9",
        courier="Rural Health Cold Logistics",
        status="Alert",
        vaccine_name="Inactivated Polio Vaccine (IPV)",
        target_temp_min=2.0,
        target_temp_max=8.0,
        created_at=now - datetime.timedelta(days=1),
        updated_at=now
    )
    db.add(shp4)

    batch4 = Batch(
        id="IPV-2026-Q9",
        shipment_id="SHP-6032",
        vaccine_type="Inactivated Trivalent Poliovirus",
        quantity_doses=1200,
        manufacturing_date="2026-05-10",
        expiry_date="2026-11-10",
        review_status="Quarantined",
        review_reason="Severe freeze excursion detected (-1.4°C). IPV is irreversibly damaged by freezing. Quarantined pending destruction protocol.",
        reviewed_by="Authorized Officer Dr. Robert Kim (Chief Medical QA)",
        reviewed_at=now - datetime.timedelta(hours=2),
        priority_score=88.0,
        priority_level="Critical"
    )
    db.add(batch4)

    audit1 = ReviewAudit(
        batch_id="IPV-2026-Q9",
        action="Quarantined",
        actor_name="Dr. Robert Kim",
        actor_role="Chief Medical QA Auditor",
        reason="Severe sub-zero freeze event recorded (-1.4°C). IPV adsorption test failed; high risk of potency loss.",
        timestamp=now - datetime.timedelta(hours=2)
    )
    db.add(audit1)

    inc3 = Incident(
        id="INC-2026-041",
        shipment_id="SHP-6032",
        batch_id="IPV-2026-Q9",
        incident_type="Temperature Threshold",
        severity="Critical",
        title="Sub-Zero Freeze Hazard Excursion (-1.4°C)",
        description="Shipment SHP-6032 dropped below freezing threshold (2.0°C) reaching -1.4°C due to dry ice over-packing.",
        recorded_temp=-1.4,
        status="Resolved",
        resolution_notes="Batch quarantined in segregated cold unit. Investigation confirmed cold packs placed in direct contact with vials.",
        created_at=now - datetime.timedelta(hours=5),
        resolved_at=now - datetime.timedelta(hours=2)
    )
    db.add(inc3)

    # Compute breakdown for all batches
    db.commit()

    # Update breakdowns
    all_batches = db.query(Batch).all()
    for b in all_batches:
        s = db.query(Shipment).filter(Shipment.id == b.shipment_id).first()
        rs = db.query(Reading).filter(Reading.shipment_id == b.shipment_id).all()
        cps = db.query(Checkpoint).filter(Checkpoint.shipment_id == b.shipment_id).all()
        res = calculate_batch_review_priority(b, rs, cps, s.target_temp_min, s.target_temp_max)
        b.priority_score = res["priority_score"]
        b.priority_level = res["priority_level"]
        b.priority_breakdown = json.dumps(res["breakdown"])
    db.commit()
