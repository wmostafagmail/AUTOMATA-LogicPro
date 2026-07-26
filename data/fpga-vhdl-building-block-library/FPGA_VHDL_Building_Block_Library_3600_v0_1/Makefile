.PHONY: static core-regression all-smokes
static:
	python3 scripts/static_validate.py
core-regression:
	bash scripts/run_ghdl_regression.sh
all-smokes:
	bash scripts/run_all_block_smokes.sh
