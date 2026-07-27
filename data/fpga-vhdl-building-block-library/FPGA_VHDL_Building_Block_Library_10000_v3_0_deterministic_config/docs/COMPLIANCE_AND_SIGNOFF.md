# Compliance and sign-off gates

## Protocol compliance

1. Freeze the exact protocol revision and supported optional features.
2. Replace Tier C protocol shells with hardened IP or a complete independently reviewed controller.
3. Add official/commercial VIP or a trace-based conformance suite.
4. Verify malformed packets, retries, timeouts, ordering, flow control, reset, and error recovery.
5. Verify the electrical/PHY interface separately from transaction logic.

## Timing closure

1. Select vendor, family, speed grade, package, and board clocking.
2. Fill the XDC/SDC templates with actual periods and I/O delays.
3. Run synthesis and place-and-route at slow/fast process-voltage-temperature corners.
4. Resolve setup, hold, recovery, removal, pulse-width, and unconstrained-path reports.
5. Record tool versions, seeds, constraints, and timing reports as release evidence.

## CDC safety

1. Use synchronizers only for stable levels; use handshakes or asynchronous FIFOs for multi-bit data.
2. Avoid combinational logic between synchronizer stages.
3. Constrain asynchronous clocks and mark synchronizer registers.
4. Review reconvergence and reset-domain crossings.
5. Run a dedicated CDC/RDC tool and waive findings with written rationale.

## Numerical accuracy

1. Define signedness, binary point, overflow, saturation, rounding, denormal, NaN, and divide-by-zero behavior.
2. Generate golden vectors from Python/MATLAB/C++ reference models.
3. Sweep extrema, random values, cancellation, clipping, and long accumulation sequences.
4. Measure absolute, relative, ULP, SNR, or application-specific error.
5. Freeze coefficients and verify quantization against the system budget.
