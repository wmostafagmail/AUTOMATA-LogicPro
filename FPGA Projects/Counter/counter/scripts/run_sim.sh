#!/usr/bin/env bash
set -e
echo "Running GHDL simulation for Counter ALU..."
make -C .. compile sim
echo "Done. Exit code: $?"