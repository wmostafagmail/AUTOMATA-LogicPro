.PHONY: static core-regression pc-regression all-smokes
static:
	python3 scripts/static_validate.py
core-regression:
	bash scripts/run_ghdl_regression.sh
pc-regression:
	bash scripts/run_program_counter_regression.sh
all-smokes:
	bash scripts/run_all_block_smokes.sh
