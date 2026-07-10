create_clock -name sysclk -period 10.0 [get_ports sysclk]
set_output_delay -clock sysclk -data_only [get_ports uart_tx]
set_input_delay -clock sysclk -data_only [get_ports uart_rx]