# Bridge Constraints (generic)
set_property IOSTANDARD LVCMOS33 [get_ports clk_i]
set_property PACKAGE_PIN U18 [get_ports clk_i]

set_property IOSTANDARD LVCMOS33 [get_ports rst_i]
set_property PACKAGE_PIN V17 [get_ports rst_i]

set_property IOSTANDARD LVCMOS33 [get_ports uart_rx_data_i]
set_property PACKAGE_PIN W16 [get_ports uart_rx_data_i]

set_property IOSTANDARD LVCMOS33 [get_ports uart_tx_o]
set_property PACKAGE_PIN Y15 [get_ports uart_tx_o]

set_property IOSTANDARD LVCMOS33 [get_ports spi_mosi_o]
set_property PACKAGE_PIN AB14 [get_ports spi_mosi_o]

set_property IOSTANDARD LVCMOS33 [get_ports spi_sclk_o]
set_property PACKAGE_PIN AA15 [get_ports spi_sclk_o]

set_property IOSTANDARD LVCMOS33 [get_ports spi_cs_n_o]
set_property PACKAGE_PIN Z14 [get_ports spi_cs_n_o]

set_property IOSTANDARD LVCMOS33 [get_ports spi_miso_i]
set_property PACKAGE_PIN Y13 [get_ports spi_miso_i]