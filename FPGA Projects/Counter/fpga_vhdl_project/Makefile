SIM_TARGET = tb_updown_counter

all: sim

sim: clean
    ghdl -a src/updown_counter.vhd
    ghdl -a tb/tb_updown_counter.vhd
    ghdl -e $(SIM_TARGET)
    ghdl -r $(SIM_TARGET) --vcd=waveform.vcd --stop-time=10us

clean:
    rm -f *.vcd *.o *.cf
    rm -rf work