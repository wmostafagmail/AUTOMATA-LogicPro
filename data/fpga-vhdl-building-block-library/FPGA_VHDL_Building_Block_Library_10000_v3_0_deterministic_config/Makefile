.PHONY: static core-regression pc-regression all-smokes
static:
	python3 scripts/static_validate.py
core-regression:
	bash scripts/run_ghdl_regression.sh
pc-regression:
	bash scripts/run_program_counter_regression.sh
all-smokes:
	bash scripts/run_all_block_smokes.sh

# Deterministic configuration layer (v3.0)
.PHONY: config-validate config-rebuild config-example
config-validate:
	python3 scripts/configuration/validate_configuration_layer.py

config-rebuild:
	python3 scripts/configuration/rebuild_default_configuration_layer.py

config-example:
	python3 scripts/configuration/generate_locked_wrapper.py \
	  --manifest manifests/blocks/cpu_and_soc/program_counter.json \
	  --config configurations/examples/program_counter_64bit.json \
	  --output examples/deterministic_top/program_counter_64bit_cfg.vhd
