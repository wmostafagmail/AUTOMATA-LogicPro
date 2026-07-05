#!/usr/bin/env bash
# clean.sh - Remove generated simulation artifacts
echo "Removing work directory and generated files..."
rm -rf work-obj08 sim.vcd *.o
echo "Clean complete."
