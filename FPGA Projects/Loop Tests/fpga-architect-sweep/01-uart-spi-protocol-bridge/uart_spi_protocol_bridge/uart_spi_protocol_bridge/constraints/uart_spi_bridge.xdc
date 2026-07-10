# UART-SPI Bridge Constraints
create_clock -name sys_clk -period 10.000 [get_ports clk_i]
set_property IOSTANDARD LVCMOS33 [get_ports {clk_i rst_i uart_rx_i spi_miso_i wr_req_i}]
set_property IOSTANDARD LVCMOS33 [get_ports {uart_tx_o spi_sclk_o spi_mosi_o spi_cs_o busy_o err_o data_avail_o}]