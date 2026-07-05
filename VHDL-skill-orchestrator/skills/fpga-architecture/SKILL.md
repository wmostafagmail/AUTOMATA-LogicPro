# Skill: fpga-architecture

## Purpose

Use this skill for FPGA system partitioning, clock/reset strategy, interface planning, datapath/control separation, hierarchy, and design-risk control.

## Required Rules

- Make clock/reset style explicit and consistent across DUT and verification collateral.
- Partition architecture into clean entities/packages with compile-order-safe dependencies.
- Keep generated submodules, helper packages, and top-level integration files explicit in the file plan.
- Avoid unresolved `work` references; every referenced package/entity must exist and be listed before dependents.
- Prefer deterministic naming, width planning, and reset behavior over implicit assumptions.
- For ALU/datapath designs, declare operand/result types intentionally and make flag derivation result-based rather than input-pattern-based.
- Treat package/helper functions as part of the architecture contract; they must follow the same typing and import discipline as entities.

## Deliverables

- Architecture summary
- Module/file plan
- Interface and reset assumptions
- Compile-order-safe dependency structure
- Risk notes for CDC/reset/timing/resource concerns
