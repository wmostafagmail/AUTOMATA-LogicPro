# FPGA Building Block Index — 10,000 Blocks

| ID | Block name | Category | Subcategory |
|---:|---|---|---|
| BB-0001 | `uart_spi_protocol_bridge` | Communication | UART |
| BB-0002 | `uart_core` | Communication | UART |
| BB-0003 | `uart_rx` | Communication | UART |
| BB-0004 | `uart_tx` | Communication | UART |
| BB-0005 | `uart_packet_protocol` | Communication | UART |
| BB-0006 | `spi_controller` | Communication | SPI |
| BB-0007 | `spi_master` | Communication | SPI |
| BB-0008 | `spi_slave` | Communication | SPI |
| BB-0009 | `i2c_controller` | Communication | I2C |
| BB-0010 | `i2c_master` | Communication | I2C |
| BB-0011 | `i2c_slave` | Communication | I2C |
| BB-0012 | `can_controller` | Communication | CAN |
| BB-0013 | `lin_controller` | Communication | Communication |
| BB-0014 | `rs485_packet_link` | Communication | Packet networking |
| BB-0015 | `ethernet_mac_lite` | Communication | Packet networking |
| BB-0016 | `ethernet_frame_parser` | Communication | Packet networking |
| BB-0017 | `udp_packet_endpoint` | Communication | Packet networking |
| BB-0018 | `serdes_link_layer` | Communication | SERDES link |
| BB-0019 | `lvds_source_synchronous_link` | Communication | LVDS link |
| BB-0020 | `packet_framer_deframer` | Communication | Packet networking |
| BB-0021 | `protocol_bridge_generic` | Communication | Communication |
| BB-0022 | `spi_i2c_bridge` | Communication | SPI |
| BB-0023 | `axi_stream_to_packet_bridge` | Communication | Packet networking |
| BB-0024 | `axi_stream_router` | Bus and Interconnect | AXI4-Stream |
| BB-0025 | `axi4_lite_peripheral` | Bus and Interconnect | AXI4 memory-mapped |
| BB-0026 | `axi4_lite_register_bank` | Bus and Interconnect | AXI4 memory-mapped |
| BB-0027 | `axi4_memory_mapped_slave` | Bus and Interconnect | AXI4 memory-mapped |
| BB-0028 | `axi4_memory_mapped_master` | Bus and Interconnect | AXI4 memory-mapped |
| BB-0029 | `axi_stream_source` | Bus and Interconnect | AXI4-Stream |
| BB-0030 | `axi_stream_sink` | Bus and Interconnect | AXI4-Stream |
| BB-0031 | `axi_stream_width_converter` | Bus and Interconnect | AXI4-Stream |
| BB-0032 | `axi_stream_packet_arbiter` | Bus and Interconnect | Packet networking |
| BB-0033 | `wishbone_peripheral` | Bus and Interconnect | Wishbone |
| BB-0034 | `wishbone_interconnect` | Bus and Interconnect | Wishbone |
| BB-0035 | `avalon_mm_peripheral` | Bus and Interconnect | Avalon |
| BB-0036 | `avalon_stream_endpoint` | Bus and Interconnect | Avalon |
| BB-0037 | `apb_peripheral` | Bus and Interconnect | Bus and Interconnect |
| BB-0038 | `memory_mapped_register_file` | Bus and Interconnect | Memory-mapped registers |
| BB-0039 | `register_map_subsystem` | Bus and Interconnect | Bus and Interconnect |
| BB-0040 | `csr_status_control_block` | Bus and Interconnect | Bus and Interconnect |
| BB-0041 | `address_decoder` | Bus and Interconnect | Bus and Interconnect |
| BB-0042 | `bus_bridge_generic` | Bus and Interconnect | Bus and Interconnect |
| BB-0043 | `interrupt_mapped_peripheral` | Bus and Interconnect | Bus and Interconnect |
| BB-0044 | `alu` | Compute | Compute |
| BB-0045 | `alu_core` | Compute | Compute |
| BB-0046 | `mac_unit` | Compute | Compute |
| BB-0047 | `multiply_accumulate_pipeline` | Compute | Compute |
| BB-0048 | `fixed_point_datapath` | Compute | Compute |
| BB-0049 | `saturating_arithmetic_unit` | Compute | Compute |
| BB-0050 | `barrel_shifter` | Compute | Compute |
| BB-0051 | `priority_encoder` | Compute | Compute |
| BB-0052 | `population_count` | Compute | Compute |
| BB-0053 | `cordic_engine` | Compute | Compute |
| BB-0054 | `divider_iterative` | Compute | Compute |
| BB-0055 | `sqrt_iterative` | Compute | Compute |
| BB-0056 | `matrix_vector_engine` | Compute | Compute |
| BB-0057 | `vector_dot_product_engine` | Compute | Compute |
| BB-0058 | `streaming_reduction_engine` | Compute | Compute |
| BB-0059 | `lookup_table_datapath` | Compute | Compute |
| BB-0060 | `crc_checksum_engine` | Compute | Compute |
| BB-0061 | `hash_lite_engine` | Compute | Compute |
| BB-0062 | `compression_lite_pipeline` | Compute | Compute |
| BB-0063 | `dsp_chain` | DSP | DSP |
| BB-0064 | `fir_filter` | DSP | DSP |
| BB-0065 | `iir_filter` | DSP | DSP |
| BB-0066 | `cic_filter` | DSP | DSP |
| BB-0067 | `moving_average_filter` | DSP | DSP |
| BB-0068 | `fft_pipeline` | DSP | DSP |
| BB-0069 | `windowing_stage` | DSP | DSP |
| BB-0070 | `complex_mixer` | DSP | DSP |
| BB-0071 | `nco_phase_accumulator` | DSP | DSP |
| BB-0072 | `dds_waveform_generator` | DSP | Verification methodology |
| BB-0073 | `iq_demodulator` | DSP | DSP |
| BB-0074 | `sample_rate_converter` | DSP | DSP |
| BB-0075 | `gain_offset_calibration` | DSP | DSP |
| BB-0076 | `digital_down_converter` | DSP | DSP |
| BB-0077 | `digital_up_converter` | DSP | DSP |
| BB-0078 | `sync_fifo` | Memory | Queues and buffering |
| BB-0079 | `async_fifo` | Memory | Queues and buffering |
| BB-0080 | `skid_buffer` | Memory | Queues and buffering |
| BB-0081 | `stream_fifo` | Memory | Queues and buffering |
| BB-0082 | `packet_fifo` | Memory | Packet networking |
| BB-0083 | `dual_port_ram_controller` | Memory | Memory structures |
| BB-0084 | `single_port_ram_controller` | Memory | Memory structures |
| BB-0085 | `rom_lookup_table` | Memory | Memory structures |
| BB-0086 | `boot_rom_subsystem` | Memory | Memory structures |
| BB-0087 | `dma_engine` | Memory | Memory |
| BB-0088 | `scatter_gather_dma_lite` | Memory | Memory |
| BB-0089 | `packet_buffer` | Memory | Packet networking |
| BB-0090 | `framebuffer_controller` | Memory | Frame memory |
| BB-0091 | `line_buffer` | Memory | Queues and buffering |
| BB-0092 | `ring_buffer` | Memory | Queues and buffering |
| BB-0093 | `cache_lite_readonly` | Memory | Memory structures |
| BB-0094 | `register_file` | Memory | Memory structures |
| BB-0095 | `memory_scrubber` | Memory | Memory structures |
| BB-0096 | `memory_init_loader` | Memory | Memory structures |
| BB-0097 | `video_pattern_generator` | Video and Audio | Video |
| BB-0098 | `vga_timing_generator` | Video and Audio | Video |
| BB-0099 | `hdmi_video_pipeline` | Video and Audio | Video |
| BB-0100 | `sync_generator` | Video and Audio | Video and Audio |
| BB-0101 | `active_video_window` | Video and Audio | Video |
| BB-0102 | `pixel_address_generator` | Video and Audio | Video |
| BB-0103 | `framebuffer_reader` | Video and Audio | Queues and buffering |
| BB-0104 | `camera_capture_pipeline` | Video and Audio | Video and Audio |
| BB-0105 | `image_filter_pipeline` | Video and Audio | Video and Audio |
| BB-0106 | `sobel_edge_filter` | Video and Audio | Video and Audio |
| BB-0107 | `color_space_converter` | Video and Audio | Video and Audio |
| BB-0108 | `rgb_to_grayscale` | Video and Audio | Video and Audio |
| BB-0109 | `test_pattern_generator` | Video and Audio | Video and Audio |
| BB-0110 | `sprite_overlay_engine` | Video and Audio | Video and Audio |
| BB-0111 | `video_scaler_lite` | Video and Audio | Video |
| BB-0112 | `line_buffered_convolution` | Video and Audio | Queues and buffering |
| BB-0113 | `i2s_audio_interface` | Video and Audio | Audio |
| BB-0114 | `tdm_audio_interface` | Video and Audio | Audio |
| BB-0115 | `audio_sample_pipeline` | Video and Audio | Audio |
| BB-0116 | `audio_volume_control` | Video and Audio | Audio |
| BB-0117 | `audio_mixer` | Video and Audio | Audio |
| BB-0118 | `audio_sample_rate_converter` | Video and Audio | Audio |
| BB-0119 | `pdm_microphone_decoder` | Video and Audio | Audio |
| BB-0120 | `sine_wave_audio_generator` | Video and Audio | Audio |
| BB-0121 | `cpu_core` | CPU and SoC | CPU datapath |
| BB-0122 | `microcoded_controller` | CPU and SoC | CPU datapath |
| BB-0123 | `instruction_decoder` | CPU and SoC | CPU datapath |
| BB-0124 | `program_counter` | CPU and SoC | CPU datapath |
| BB-0125 | `register_file_cpu` | CPU and SoC | CPU datapath |
| BB-0126 | `alu_cpu_datapath` | CPU and SoC | CPU datapath |
| BB-0127 | `control_fsm_cpu` | CPU and SoC | CPU datapath |
| BB-0128 | `interrupt_controller` | CPU and SoC | Interrupt peripheral |
| BB-0129 | `timer_counter_peripheral` | CPU and SoC | CPU and SoC |
| BB-0130 | `gpio_peripheral` | CPU and SoC | General-purpose peripheral |
| BB-0131 | `pwm_peripheral` | CPU and SoC | General-purpose peripheral |
| BB-0132 | `watchdog_timer` | CPU and SoC | CPU and SoC |
| BB-0133 | `simple_soc_top` | CPU and SoC | CPU and SoC |
| BB-0134 | `memory_mapped_peripheral_subsystem` | CPU and SoC | Memory-mapped peripheral fabric |
| BB-0135 | `debug_status_port` | CPU and SoC | Debug peripheral |
| BB-0136 | `uart_bootloader_interface` | CPU and SoC | UART |
| BB-0137 | `flight_controller` | Control and Robotics | Control and robotics |
| BB-0138 | `pid_controller` | Control and Robotics | Control and robotics |
| BB-0139 | `multi_axis_pid_controller` | Control and Robotics | Control and robotics |
| BB-0140 | `pwm_motor_controller` | Control and Robotics | Control and robotics |
| BB-0141 | `bldc_commutation_controller_lite` | Control and Robotics | Control and Robotics |
| BB-0142 | `stepper_motor_controller` | Control and Robotics | Control and robotics |
| BB-0143 | `quadrature_encoder_interface` | Control and Robotics | Position sensing |
| BB-0144 | `servo_pulse_controller` | Control and Robotics | Control and robotics |
| BB-0145 | `robotics_control_loop` | Control and Robotics | Control and robotics |
| BB-0146 | `sensor_fusion_pipeline` | Control and Robotics | Control and Robotics |
| BB-0147 | `imu_sensor_frontend` | Control and Robotics | Inertial sensing |
| BB-0148 | `failsafe_watchdog` | Control and Robotics | Control and Robotics |
| BB-0149 | `control_status_supervisor` | Control and Robotics | Control and Robotics |
| BB-0150 | `closed_loop_actuator_controller` | Control and Robotics | Control and Robotics |
| BB-0151 | `adc_sample_capture` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0152 | `adc_stream_processor` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0153 | `sensor_frontend_spi` | Sensors and Instrumentation | SPI |
| BB-0154 | `sensor_frontend_i2c` | Sensors and Instrumentation | I2C |
| BB-0155 | `debounce_filter` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0156 | `edge_event_counter` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0157 | `timestamp_capture` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0158 | `pulse_width_measurement` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0159 | `frequency_counter` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0160 | `event_logger_lite` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0161 | `threshold_detector` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0162 | `trigger_capture_unit` | Sensors and Instrumentation | Sensors and Instrumentation |
| BB-0163 | `fault_status_aggregator` | Safety and Reliability | Safety and Reliability |
| BB-0164 | `timeout_monitor` | Safety and Reliability | Safety and Reliability |
| BB-0165 | `watchdog_supervisor` | Safety and Reliability | Safety and Reliability |
| BB-0166 | `parity_memory_wrapper` | Safety and Reliability | Memory structures |
| BB-0167 | `ecc_memory_wrapper_lite` | Safety and Reliability | Memory structures |
| BB-0168 | `crc_packet_checker` | Safety and Reliability | Packet networking |
| BB-0169 | `safe_state_controller` | Safety and Reliability | Safety and Reliability |
| BB-0170 | `reset_sequencer` | Safety and Reliability | Safety and Reliability |
| BB-0171 | `clock_enable_supervisor` | Safety and Reliability | Safety and Reliability |
| BB-0172 | `assertion_monitor_block` | Safety and Reliability | Safety and Reliability |
| BB-0173 | `error_counter_status_block` | Safety and Reliability | Safety and Reliability |
| BB-0174 | `health_telemetry_block` | Safety and Reliability | Safety and Reliability |
| BB-0175 | `self_checking_testbench_pattern` | Verification | Verification methodology |
| BB-0176 | `scoreboard_monitor_pattern` | Verification | Verification methodology |
| BB-0177 | `bus_functional_model_pattern` | Verification | Verification |
| BB-0178 | `golden_model_comparator_pattern` | Verification | Verification |
| BB-0179 | `protocol_monitor_pattern` | Verification | Verification |
| BB-0180 | `timeout_guard_pattern` | Verification | Verification |
| BB-0181 | `clock_reset_tb_harness` | Verification | Verification |
| BB-0182 | `stream_stimulus_generator` | Verification | Verification |
| BB-0183 | `memory_model_testbench` | Verification | Memory structures |
| BB-0184 | `register_map_testbench` | Verification | Verification methodology |
| BB-0185 | `coverage_scenario_matrix` | Verification | Verification methodology |
| BB-0186 | `waveform_debug_plan` | Verification | Verification methodology |
| BB-0187 | `bitwise_logic_unit_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-0188 | `up_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-0189 | `finite_state_machine_single_shot` | Control | State machines and sequencers |
| BB-0190 | `integer_adder_combinational` | Integer Compute | Integer arithmetic |
| BB-0191 | `fixed_point_adder_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0192 | `floating_point_adder_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-0193 | `vector_adder_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-0194 | `matrix_multiplier_int8` | Tensor Compute | Matrix and tensor operations |
| BB-0195 | `cordic_sine_cosine_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-0196 | `population_counter_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0197 | `fir_decimator_combinational` | DSP Filters | Digital filters |
| BB-0198 | `fft_engine_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-0199 | `qam_mapper_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-0200 | `symbol_timing_recovery_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0201 | `single_port_ram_single_clock` | Memory | RAM, ROM and register storage |
| BB-0202 | `word_fifo_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-0203 | `instruction_cache_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0204 | `linear_dma_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-0205 | `axi4_master_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0206 | `axi_stream_source_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0207 | `apb_master_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0208 | `wishbone_master_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0209 | `crossbar_switch_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0210 | `uart_transmitter_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-0211 | `can_frame_engine_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0212 | `ethernet_tx_mac_combinational` | Ethernet MAC | Ethernet media access |
| BB-0213 | `ethernet_frame_parser_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0214 | `pcie_endpoint_wrapper_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-0215 | `usb_device_controller_single_shot` | USB | USB device and host functions |
| BB-0216 | `serializer_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0217 | `clock_divider_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0218 | `program_counter_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-0219 | `integer_execution_unit_combinational` | CPU Execution | Execution units and scheduling |
| BB-0220 | `memory_management_unit_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0221 | `gpio_controller_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-0222 | `vertex_fetch_engine_combinational` | GPU Geometry | Geometry and raster setup |
| BB-0223 | `rasterizer_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-0224 | `vga_timing_controller_streaming` | Video Timing | Display timing and frame transport |
| BB-0225 | `rgb_to_ycbcr_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-0226 | `camera_parallel_receiver_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-0227 | `i2s_transmitter_controller` | Audio Interfaces | Digital audio transport |
| BB-0228 | `audio_mixer_combinational` | Audio DSP | Audio processing and synthesis |
| BB-0229 | `dense_layer_engine_int8` | Machine Learning | Neural-network layers |
| BB-0230 | `query_projection_engine_int8` | Transformer Acceleration | Attention and sequence models |
| BB-0231 | `quantizer_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0232 | `pid_controller_single_shot` | Robotics | Motion, navigation and control |
| BB-0233 | `pwm_generator_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-0234 | `adc_capture_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0235 | `modbus_rtu_engine_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0236 | `aes_engine_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-0237 | `watchdog_supervisor_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-0238 | `logic_analyzer_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-0239 | `spi_nor_controller_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-0240 | `run_length_encoder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-0241 | `digital_down_converter_combinational` | RF and SDR | Digital radio front-end |
| BB-0242 | `range_fft_engine_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0243 | `wheel_speed_capture_single_shot` | Automotive | Vehicle-specific logic |
| BB-0244 | `irig_b_decoder_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0245 | `partial_reconfiguration_controller_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0246 | `database_filter_engine_combinational` | Scientific and Search | Domain accelerators |
| BB-0247 | `bitwise_logic_unit_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-0248 | `up_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-0249 | `finite_state_machine_continuous` | Control | State machines and sequencers |
| BB-0250 | `integer_adder_single_cycle` | Integer Compute | Integer arithmetic |
| BB-0251 | `fixed_point_adder_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0252 | `floating_point_adder_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-0253 | `vector_adder_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-0254 | `matrix_multiplier_int16` | Tensor Compute | Matrix and tensor operations |
| BB-0255 | `cordic_sine_cosine_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-0256 | `population_counter_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0257 | `fir_decimator_single_cycle` | DSP Filters | Digital filters |
| BB-0258 | `fft_engine_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-0259 | `qam_mapper_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-0260 | `symbol_timing_recovery_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0261 | `single_port_ram_dual_clock` | Memory | RAM, ROM and register storage |
| BB-0262 | `word_fifo_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-0263 | `instruction_cache_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0264 | `linear_dma_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-0265 | `axi4_master_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0266 | `axi_stream_source_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0267 | `apb_master_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0268 | `wishbone_master_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0269 | `crossbar_switch_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0270 | `uart_transmitter_target` | UART SPI I2C | Low-speed serial protocols |
| BB-0271 | `can_frame_engine_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0272 | `ethernet_tx_mac_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-0273 | `ethernet_frame_parser_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0274 | `pcie_endpoint_wrapper_target` | PCI Express | PCIe endpoints and transaction services |
| BB-0275 | `usb_device_controller_continuous` | USB | USB device and host functions |
| BB-0276 | `serializer_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0277 | `clock_divider_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0278 | `program_counter_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-0279 | `integer_execution_unit_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-0280 | `memory_management_unit_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0281 | `gpio_controller_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-0282 | `vertex_fetch_engine_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-0283 | `rasterizer_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-0284 | `vga_timing_controller_framebuffer` | Video Timing | Display timing and frame transport |
| BB-0285 | `rgb_to_ycbcr_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-0286 | `camera_parallel_receiver_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-0287 | `i2s_transmitter_target` | Audio Interfaces | Digital audio transport |
| BB-0288 | `audio_mixer_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-0289 | `dense_layer_engine_int16` | Machine Learning | Neural-network layers |
| BB-0290 | `query_projection_engine_int16` | Transformer Acceleration | Attention and sequence models |
| BB-0291 | `quantizer_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0292 | `pid_controller_continuous` | Robotics | Motion, navigation and control |
| BB-0293 | `pwm_generator_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-0294 | `adc_capture_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0295 | `modbus_rtu_engine_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0296 | `aes_engine_streaming` | Cryptography | Encryption, authentication and key services |
| BB-0297 | `watchdog_supervisor_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-0298 | `logic_analyzer_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-0299 | `spi_nor_controller_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-0300 | `run_length_encoder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-0301 | `digital_down_converter_single_cycle` | RF and SDR | Digital radio front-end |
| BB-0302 | `range_fft_engine_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0303 | `wheel_speed_capture_continuous` | Automotive | Vehicle-specific logic |
| BB-0304 | `irig_b_decoder_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0305 | `partial_reconfiguration_controller_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0306 | `database_filter_engine_single_cycle` | Scientific and Search | Domain accelerators |
| BB-0307 | `bitwise_logic_unit_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-0308 | `up_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-0309 | `finite_state_machine_programmable` | Control | State machines and sequencers |
| BB-0310 | `integer_adder_pipelined` | Integer Compute | Integer arithmetic |
| BB-0311 | `fixed_point_adder_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0312 | `floating_point_adder_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-0313 | `vector_adder_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-0314 | `matrix_multiplier_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-0315 | `cordic_sine_cosine_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-0316 | `population_counter_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0317 | `fir_decimator_pipelined` | DSP Filters | Digital filters |
| BB-0318 | `fft_engine_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-0319 | `qam_mapper_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-0320 | `symbol_timing_recovery_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0321 | `single_port_ram_packet_aware` | Memory | RAM, ROM and register storage |
| BB-0322 | `word_fifo_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-0323 | `instruction_cache_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0324 | `linear_dma_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-0325 | `axi4_master_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0326 | `axi_stream_source_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0327 | `apb_master_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0328 | `wishbone_master_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0329 | `crossbar_switch_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0330 | `uart_transmitter_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-0331 | `can_frame_engine_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0332 | `ethernet_tx_mac_pipelined` | Ethernet MAC | Ethernet media access |
| BB-0333 | `ethernet_frame_parser_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0334 | `pcie_endpoint_wrapper_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-0335 | `usb_device_controller_programmable` | USB | USB device and host functions |
| BB-0336 | `serializer_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0337 | `clock_divider_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0338 | `program_counter_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-0339 | `integer_execution_unit_pipelined` | CPU Execution | Execution units and scheduling |
| BB-0340 | `memory_management_unit_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0341 | `gpio_controller_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-0342 | `vertex_fetch_engine_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-0343 | `rasterizer_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-0344 | `vga_timing_controller_line_buffered` | Video Timing | Display timing and frame transport |
| BB-0345 | `rgb_to_ycbcr_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-0346 | `camera_parallel_receiver_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-0347 | `i2s_transmitter_bridge` | Audio Interfaces | Digital audio transport |
| BB-0348 | `audio_mixer_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-0349 | `dense_layer_engine_bf16` | Machine Learning | Neural-network layers |
| BB-0350 | `query_projection_engine_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-0351 | `quantizer_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0352 | `pid_controller_programmable` | Robotics | Motion, navigation and control |
| BB-0353 | `pwm_generator_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-0354 | `adc_capture_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0355 | `modbus_rtu_engine_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0356 | `aes_engine_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-0357 | `watchdog_supervisor_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-0358 | `logic_analyzer_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-0359 | `spi_nor_controller_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-0360 | `run_length_encoder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-0361 | `digital_down_converter_pipelined` | RF and SDR | Digital radio front-end |
| BB-0362 | `range_fft_engine_pipelined` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0363 | `wheel_speed_capture_programmable` | Automotive | Vehicle-specific logic |
| BB-0364 | `irig_b_decoder_programmable` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0365 | `partial_reconfiguration_controller_programmable` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0366 | `database_filter_engine_pipelined` | Scientific and Search | Domain accelerators |
| BB-0367 | `bitwise_logic_unit_iterative` | Logic and Primitives | Boolean and bit manipulation |
| BB-0368 | `up_counter_windowed` | Counters and Timing | Counters, timers and event measurement |
| BB-0369 | `finite_state_machine_multi_channel` | Control | State machines and sequencers |
| BB-0370 | `integer_adder_iterative` | Integer Compute | Integer arithmetic |
| BB-0371 | `fixed_point_adder_iterative` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0372 | `floating_point_adder_iterative` | Floating-Point Compute | Floating-point arithmetic |
| BB-0373 | `vector_adder_iterative` | Vector Compute | SIMD and vector datapaths |
| BB-0374 | `matrix_multiplier_sparse` | Tensor Compute | Matrix and tensor operations |
| BB-0375 | `cordic_sine_cosine_iterative` | Math Accelerators | Elementary and transcendental functions |
| BB-0376 | `population_counter_iterative` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0377 | `fir_decimator_iterative` | DSP Filters | Digital filters |
| BB-0378 | `fft_engine_iterative` | DSP Spectral | Spectral analysis and transforms |
| BB-0379 | `qam_mapper_iterative` | DSP Modulation | Modulation and waveform generation |
| BB-0380 | `symbol_timing_recovery_multi_channel` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0381 | `single_port_ram_ecc_protected` | Memory | RAM, ROM and register storage |
| BB-0382 | `word_fifo_ecc_protected` | Queues | FIFO, queue and buffering structures |
| BB-0383 | `instruction_cache_ecc_protected` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0384 | `linear_dma_multi_channel` | DMA and Memory Services | Data movement and maintenance |
| BB-0385 | `axi4_master_monitor` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0386 | `axi_stream_source_monitor` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0387 | `apb_master_monitor` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0388 | `wishbone_master_monitor` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0389 | `crossbar_switch_multi_channel` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0390 | `uart_transmitter_monitor` | UART SPI I2C | Low-speed serial protocols |
| BB-0391 | `can_frame_engine_multi_channel` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0392 | `ethernet_tx_mac_iterative` | Ethernet MAC | Ethernet media access |
| BB-0393 | `ethernet_frame_parser_multi_channel` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0394 | `pcie_endpoint_wrapper_monitor` | PCI Express | PCIe endpoints and transaction services |
| BB-0395 | `usb_device_controller_multi_channel` | USB | USB device and host functions |
| BB-0396 | `serializer_multi_channel` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0397 | `clock_divider_multi_channel` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0398 | `program_counter_multi_channel` | CPU Frontend | Fetch, prediction and decode |
| BB-0399 | `integer_execution_unit_iterative` | CPU Execution | Execution units and scheduling |
| BB-0400 | `memory_management_unit_multi_channel` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0401 | `gpio_controller_multi_channel` | SoC Peripherals | General-purpose peripherals |
| BB-0402 | `vertex_fetch_engine_iterative` | GPU Geometry | Geometry and raster setup |
| BB-0403 | `rasterizer_multi_plane` | GPU Pixel | Raster, texture and pixel operations |
| BB-0404 | `vga_timing_controller_multi_plane` | Video Timing | Display timing and frame transport |
| BB-0405 | `rgb_to_ycbcr_multi_plane` | Image Processing | Pixel and neighborhood operations |
| BB-0406 | `camera_parallel_receiver_multi_plane` | Camera and ISP | Camera capture and image signal processing |
| BB-0407 | `i2s_transmitter_monitor` | Audio Interfaces | Digital audio transport |
| BB-0408 | `audio_mixer_iterative` | Audio DSP | Audio processing and synthesis |
| BB-0409 | `dense_layer_engine_sparse` | Machine Learning | Neural-network layers |
| BB-0410 | `query_projection_engine_sparse` | Transformer Acceleration | Attention and sequence models |
| BB-0411 | `quantizer_sparse` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0412 | `pid_controller_multi_channel` | Robotics | Motion, navigation and control |
| BB-0413 | `pwm_generator_multi_channel` | Motor and Power Control | Motor drives and power electronics |
| BB-0414 | `adc_capture_multi_channel` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0415 | `modbus_rtu_engine_multi_channel` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0416 | `aes_engine_multi_context` | Cryptography | Encryption, authentication and key services |
| BB-0417 | `watchdog_supervisor_multi_channel` | Safety and Reliability | Fault detection and safe operation |
| BB-0418 | `logic_analyzer_coverage_driven` | Debug and Verification | On-chip debug and reusable verification |
| BB-0419 | `spi_nor_controller_multi_channel` | Storage | Flash, SD, NVMe and block storage |
| BB-0420 | `run_length_encoder_iterative` | Compression and Coding | Compression, decompression and channel coding |
| BB-0421 | `digital_down_converter_iterative` | RF and SDR | Digital radio front-end |
| BB-0422 | `range_fft_engine_iterative` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0423 | `wheel_speed_capture_multi_channel` | Automotive | Vehicle-specific logic |
| BB-0424 | `irig_b_decoder_multi_channel` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0425 | `partial_reconfiguration_controller_multi_channel` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0426 | `database_filter_engine_iterative` | Scientific and Search | Domain accelerators |
| BB-0427 | `bitwise_logic_unit_streaming` | Logic and Primitives | Boolean and bit manipulation |
| BB-0428 | `up_counter_timestamped` | Counters and Timing | Counters, timers and event measurement |
| BB-0429 | `finite_state_machine_fault_tolerant` | Control | State machines and sequencers |
| BB-0430 | `integer_adder_streaming` | Integer Compute | Integer arithmetic |
| BB-0431 | `fixed_point_adder_streaming` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0432 | `floating_point_adder_streaming` | Floating-Point Compute | Floating-point arithmetic |
| BB-0433 | `vector_adder_streaming` | Vector Compute | SIMD and vector datapaths |
| BB-0434 | `matrix_multiplier_pipelined` | Tensor Compute | Matrix and tensor operations |
| BB-0435 | `cordic_sine_cosine_streaming` | Math Accelerators | Elementary and transcendental functions |
| BB-0436 | `population_counter_streaming` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0437 | `fir_decimator_streaming` | DSP Filters | Digital filters |
| BB-0438 | `fft_engine_streaming` | DSP Spectral | Spectral analysis and transforms |
| BB-0439 | `qam_mapper_streaming` | DSP Modulation | Modulation and waveform generation |
| BB-0440 | `symbol_timing_recovery_fault_tolerant` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0441 | `single_port_ram_multi_queue` | Memory | RAM, ROM and register storage |
| BB-0442 | `word_fifo_multi_queue` | Queues | FIFO, queue and buffering structures |
| BB-0443 | `instruction_cache_multi_queue` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0444 | `linear_dma_fault_tolerant` | DMA and Memory Services | Data movement and maintenance |
| BB-0445 | `axi4_master_width_adapted` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0446 | `axi_stream_source_width_adapted` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0447 | `apb_master_width_adapted` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0448 | `wishbone_master_width_adapted` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0449 | `crossbar_switch_fault_tolerant` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0450 | `uart_transmitter_width_adapted` | UART SPI I2C | Low-speed serial protocols |
| BB-0451 | `can_frame_engine_fault_tolerant` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0452 | `ethernet_tx_mac_streaming` | Ethernet MAC | Ethernet media access |
| BB-0453 | `ethernet_frame_parser_fault_tolerant` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0454 | `pcie_endpoint_wrapper_width_adapted` | PCI Express | PCIe endpoints and transaction services |
| BB-0455 | `usb_device_controller_fault_tolerant` | USB | USB device and host functions |
| BB-0456 | `serializer_fault_tolerant` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0457 | `clock_divider_fault_tolerant` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0458 | `program_counter_fault_tolerant` | CPU Frontend | Fetch, prediction and decode |
| BB-0459 | `integer_execution_unit_streaming` | CPU Execution | Execution units and scheduling |
| BB-0460 | `memory_management_unit_fault_tolerant` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0461 | `gpio_controller_fault_tolerant` | SoC Peripherals | General-purpose peripherals |
| BB-0462 | `vertex_fetch_engine_streaming` | GPU Geometry | Geometry and raster setup |
| BB-0463 | `rasterizer_low_latency` | GPU Pixel | Raster, texture and pixel operations |
| BB-0464 | `vga_timing_controller_low_latency` | Video Timing | Display timing and frame transport |
| BB-0465 | `rgb_to_ycbcr_low_latency` | Image Processing | Pixel and neighborhood operations |
| BB-0466 | `camera_parallel_receiver_low_latency` | Camera and ISP | Camera capture and image signal processing |
| BB-0467 | `i2s_transmitter_width_adapted` | Audio Interfaces | Digital audio transport |
| BB-0468 | `audio_mixer_streaming` | Audio DSP | Audio processing and synthesis |
| BB-0469 | `dense_layer_engine_pipelined` | Machine Learning | Neural-network layers |
| BB-0470 | `query_projection_engine_pipelined` | Transformer Acceleration | Attention and sequence models |
| BB-0471 | `quantizer_pipelined` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0472 | `pid_controller_fault_tolerant` | Robotics | Motion, navigation and control |
| BB-0473 | `pwm_generator_fault_tolerant` | Motor and Power Control | Motor drives and power electronics |
| BB-0474 | `adc_capture_fault_tolerant` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0475 | `modbus_rtu_engine_fault_tolerant` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0476 | `aes_engine_fault_detecting` | Cryptography | Encryption, authentication and key services |
| BB-0477 | `watchdog_supervisor_fault_tolerant` | Safety and Reliability | Fault detection and safe operation |
| BB-0478 | `logic_analyzer_scoreboard_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-0479 | `spi_nor_controller_fault_tolerant` | Storage | Flash, SD, NVMe and block storage |
| BB-0480 | `run_length_encoder_streaming` | Compression and Coding | Compression, decompression and channel coding |
| BB-0481 | `digital_down_converter_streaming` | RF and SDR | Digital radio front-end |
| BB-0482 | `range_fft_engine_streaming` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0483 | `wheel_speed_capture_fault_tolerant` | Automotive | Vehicle-specific logic |
| BB-0484 | `irig_b_decoder_fault_tolerant` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0485 | `partial_reconfiguration_controller_fault_tolerant` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0486 | `database_filter_engine_streaming` | Scientific and Search | Domain accelerators |
| BB-0487 | `bitwise_logic_unit_resource_shared` | Logic and Primitives | Boolean and bit manipulation |
| BB-0488 | `up_counter_multi_channel` | Counters and Timing | Counters, timers and event measurement |
| BB-0489 | `finite_state_machine_low_power` | Control | State machines and sequencers |
| BB-0490 | `integer_adder_resource_shared` | Integer Compute | Integer arithmetic |
| BB-0491 | `fixed_point_adder_resource_shared` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0492 | `floating_point_adder_resource_shared` | Floating-Point Compute | Floating-point arithmetic |
| BB-0493 | `vector_adder_resource_shared` | Vector Compute | SIMD and vector datapaths |
| BB-0494 | `matrix_multiplier_multi_engine` | Tensor Compute | Matrix and tensor operations |
| BB-0495 | `cordic_sine_cosine_resource_shared` | Math Accelerators | Elementary and transcendental functions |
| BB-0496 | `population_counter_resource_shared` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0497 | `fir_decimator_resource_shared` | DSP Filters | Digital filters |
| BB-0498 | `fft_engine_resource_shared` | DSP Spectral | Spectral analysis and transforms |
| BB-0499 | `qam_mapper_resource_shared` | DSP Modulation | Modulation and waveform generation |
| BB-0500 | `symbol_timing_recovery_low_power` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0501 | `single_port_ram_low_latency` | Memory | RAM, ROM and register storage |
| BB-0502 | `word_fifo_low_latency` | Queues | FIFO, queue and buffering structures |
| BB-0503 | `instruction_cache_low_latency` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0504 | `linear_dma_low_power` | DMA and Memory Services | Data movement and maintenance |
| BB-0505 | `axi4_master_clock_crossing` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0506 | `axi_stream_source_clock_crossing` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0507 | `apb_master_clock_crossing` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0508 | `wishbone_master_clock_crossing` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0509 | `crossbar_switch_low_power` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0510 | `uart_transmitter_clock_crossing` | UART SPI I2C | Low-speed serial protocols |
| BB-0511 | `can_frame_engine_low_power` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0512 | `ethernet_tx_mac_resource_shared` | Ethernet MAC | Ethernet media access |
| BB-0513 | `ethernet_frame_parser_low_power` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0514 | `pcie_endpoint_wrapper_clock_crossing` | PCI Express | PCIe endpoints and transaction services |
| BB-0515 | `usb_device_controller_low_power` | USB | USB device and host functions |
| BB-0516 | `serializer_low_power` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0517 | `clock_divider_low_power` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0518 | `program_counter_low_power` | CPU Frontend | Fetch, prediction and decode |
| BB-0519 | `integer_execution_unit_resource_shared` | CPU Execution | Execution units and scheduling |
| BB-0520 | `memory_management_unit_low_power` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0521 | `gpio_controller_low_power` | SoC Peripherals | General-purpose peripherals |
| BB-0522 | `vertex_fetch_engine_resource_shared` | GPU Geometry | Geometry and raster setup |
| BB-0523 | `rasterizer_programmable` | GPU Pixel | Raster, texture and pixel operations |
| BB-0524 | `vga_timing_controller_programmable` | Video Timing | Display timing and frame transport |
| BB-0525 | `rgb_to_ycbcr_programmable` | Image Processing | Pixel and neighborhood operations |
| BB-0526 | `camera_parallel_receiver_programmable` | Camera and ISP | Camera capture and image signal processing |
| BB-0527 | `i2s_transmitter_clock_crossing` | Audio Interfaces | Digital audio transport |
| BB-0528 | `audio_mixer_resource_shared` | Audio DSP | Audio processing and synthesis |
| BB-0529 | `dense_layer_engine_multi_engine` | Machine Learning | Neural-network layers |
| BB-0530 | `query_projection_engine_multi_engine` | Transformer Acceleration | Attention and sequence models |
| BB-0531 | `quantizer_multi_engine` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0532 | `pid_controller_low_power` | Robotics | Motion, navigation and control |
| BB-0533 | `pwm_generator_low_power` | Motor and Power Control | Motor drives and power electronics |
| BB-0534 | `adc_capture_low_power` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0535 | `modbus_rtu_engine_low_power` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0536 | `aes_engine_resource_optimized` | Cryptography | Encryption, authentication and key services |
| BB-0537 | `watchdog_supervisor_low_power` | Safety and Reliability | Fault detection and safe operation |
| BB-0538 | `logic_analyzer_formal_friendly` | Debug and Verification | On-chip debug and reusable verification |
| BB-0539 | `spi_nor_controller_low_power` | Storage | Flash, SD, NVMe and block storage |
| BB-0540 | `run_length_encoder_resource_shared` | Compression and Coding | Compression, decompression and channel coding |
| BB-0541 | `digital_down_converter_resource_shared` | RF and SDR | Digital radio front-end |
| BB-0542 | `range_fft_engine_resource_shared` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0543 | `wheel_speed_capture_low_power` | Automotive | Vehicle-specific logic |
| BB-0544 | `irig_b_decoder_low_power` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0545 | `partial_reconfiguration_controller_low_power` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0546 | `database_filter_engine_resource_shared` | Scientific and Search | Domain accelerators |
| BB-0547 | `boolean_expression_evaluator_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-0548 | `down_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-0549 | `microsequencer_single_shot` | Control | State machines and sequencers |
| BB-0550 | `integer_subtractor_combinational` | Integer Compute | Integer arithmetic |
| BB-0551 | `fixed_point_multiplier_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0552 | `floating_point_multiplier_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-0553 | `vector_multiplier_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-0554 | `systolic_array_int8` | Tensor Compute | Matrix and tensor operations |
| BB-0555 | `exponential_approximator_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-0556 | `parity_reducer_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0557 | `fir_interpolator_combinational` | DSP Filters | Digital filters |
| BB-0558 | `ifft_engine_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-0559 | `qam_demapper_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-0560 | `carrier_recovery_loop_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0561 | `simple_dual_port_ram_single_clock` | Memory | RAM, ROM and register storage |
| BB-0562 | `packet_fifo_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-0563 | `data_cache_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0564 | `scatter_gather_dma_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-0565 | `axi4_slave_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0566 | `axi_stream_sink_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0567 | `apb_slave_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0568 | `wishbone_slave_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0569 | `shared_bus_interconnect_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0570 | `uart_receiver_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-0571 | `can_bit_timing_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0572 | `ethernet_rx_mac_combinational` | Ethernet MAC | Ethernet media access |
| BB-0573 | `arp_endpoint_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0574 | `pcie_tlp_parser_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-0575 | `usb_host_controller_single_shot` | USB | USB device and host functions |
| BB-0576 | `deserializer_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0577 | `clock_multiplier_wrapper_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0578 | `instruction_fetch_unit_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-0579 | `load_store_unit_combinational` | CPU Execution | Execution units and scheduling |
| BB-0580 | `protection_unit_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0581 | `timer_peripheral_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-0582 | `vertex_transform_engine_combinational` | GPU Geometry | Geometry and raster setup |
| BB-0583 | `texture_address_unit_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-0584 | `hdmi_timing_controller_streaming` | Video Timing | Display timing and frame transport |
| BB-0585 | `ycbcr_to_rgb_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-0586 | `mipi_csi2_unpacker_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-0587 | `i2s_receiver_controller` | Audio Interfaces | Digital audio transport |
| BB-0588 | `audio_gain_unit_combinational` | Audio DSP | Audio processing and synthesis |
| BB-0589 | `convolution_layer_engine_int8` | Machine Learning | Neural-network layers |
| BB-0590 | `key_projection_engine_int8` | Transformer Acceleration | Attention and sequence models |
| BB-0591 | `dequantizer_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0592 | `trajectory_generator_single_shot` | Robotics | Motion, navigation and control |
| BB-0593 | `deadtime_inserter_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-0594 | `dac_streamer_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0595 | `modbus_tcp_engine_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0596 | `chacha20_engine_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-0597 | `fault_aggregator_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-0598 | `trace_buffer_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-0599 | `qspi_flash_controller_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-0600 | `run_length_decoder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-0601 | `digital_up_converter_combinational` | RF and SDR | Digital radio front-end |
| BB-0602 | `doppler_fft_engine_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0603 | `crank_angle_decoder_single_shot` | Automotive | Vehicle-specific logic |
| BB-0604 | `gps_pps_discipliner_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0605 | `bitstream_loader_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0606 | `sort_merge_engine_combinational` | Scientific and Search | Domain accelerators |
| BB-0607 | `boolean_expression_evaluator_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-0608 | `down_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-0609 | `microsequencer_continuous` | Control | State machines and sequencers |
| BB-0610 | `integer_subtractor_single_cycle` | Integer Compute | Integer arithmetic |
| BB-0611 | `fixed_point_multiplier_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0612 | `floating_point_multiplier_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-0613 | `vector_multiplier_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-0614 | `systolic_array_int16` | Tensor Compute | Matrix and tensor operations |
| BB-0615 | `exponential_approximator_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-0616 | `parity_reducer_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0617 | `fir_interpolator_single_cycle` | DSP Filters | Digital filters |
| BB-0618 | `ifft_engine_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-0619 | `qam_demapper_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-0620 | `carrier_recovery_loop_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0621 | `simple_dual_port_ram_dual_clock` | Memory | RAM, ROM and register storage |
| BB-0622 | `packet_fifo_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-0623 | `data_cache_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0624 | `scatter_gather_dma_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-0625 | `axi4_slave_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0626 | `axi_stream_sink_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0627 | `apb_slave_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0628 | `wishbone_slave_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0629 | `shared_bus_interconnect_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0630 | `uart_receiver_target` | UART SPI I2C | Low-speed serial protocols |
| BB-0631 | `can_bit_timing_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0632 | `ethernet_rx_mac_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-0633 | `arp_endpoint_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0634 | `pcie_tlp_parser_target` | PCI Express | PCIe endpoints and transaction services |
| BB-0635 | `usb_host_controller_continuous` | USB | USB device and host functions |
| BB-0636 | `deserializer_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0637 | `clock_multiplier_wrapper_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0638 | `instruction_fetch_unit_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-0639 | `load_store_unit_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-0640 | `protection_unit_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0641 | `timer_peripheral_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-0642 | `vertex_transform_engine_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-0643 | `texture_address_unit_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-0644 | `hdmi_timing_controller_framebuffer` | Video Timing | Display timing and frame transport |
| BB-0645 | `ycbcr_to_rgb_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-0646 | `mipi_csi2_unpacker_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-0647 | `i2s_receiver_target` | Audio Interfaces | Digital audio transport |
| BB-0648 | `audio_gain_unit_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-0649 | `convolution_layer_engine_int16` | Machine Learning | Neural-network layers |
| BB-0650 | `key_projection_engine_int16` | Transformer Acceleration | Attention and sequence models |
| BB-0651 | `dequantizer_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0652 | `trajectory_generator_continuous` | Robotics | Motion, navigation and control |
| BB-0653 | `deadtime_inserter_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-0654 | `dac_streamer_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0655 | `modbus_tcp_engine_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0656 | `chacha20_engine_streaming` | Cryptography | Encryption, authentication and key services |
| BB-0657 | `fault_aggregator_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-0658 | `trace_buffer_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-0659 | `qspi_flash_controller_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-0660 | `run_length_decoder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-0661 | `digital_up_converter_single_cycle` | RF and SDR | Digital radio front-end |
| BB-0662 | `doppler_fft_engine_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0663 | `crank_angle_decoder_continuous` | Automotive | Vehicle-specific logic |
| BB-0664 | `gps_pps_discipliner_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0665 | `bitstream_loader_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0666 | `sort_merge_engine_single_cycle` | Scientific and Search | Domain accelerators |
| BB-0667 | `boolean_expression_evaluator_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-0668 | `down_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-0669 | `microsequencer_programmable` | Control | State machines and sequencers |
| BB-0670 | `integer_subtractor_pipelined` | Integer Compute | Integer arithmetic |
| BB-0671 | `fixed_point_multiplier_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0672 | `floating_point_multiplier_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-0673 | `vector_multiplier_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-0674 | `systolic_array_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-0675 | `exponential_approximator_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-0676 | `parity_reducer_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0677 | `fir_interpolator_pipelined` | DSP Filters | Digital filters |
| BB-0678 | `ifft_engine_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-0679 | `qam_demapper_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-0680 | `carrier_recovery_loop_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0681 | `simple_dual_port_ram_packet_aware` | Memory | RAM, ROM and register storage |
| BB-0682 | `packet_fifo_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-0683 | `data_cache_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0684 | `scatter_gather_dma_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-0685 | `axi4_slave_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0686 | `axi_stream_sink_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0687 | `apb_slave_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0688 | `wishbone_slave_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0689 | `shared_bus_interconnect_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0690 | `uart_receiver_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-0691 | `can_bit_timing_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0692 | `ethernet_rx_mac_pipelined` | Ethernet MAC | Ethernet media access |
| BB-0693 | `arp_endpoint_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0694 | `pcie_tlp_parser_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-0695 | `usb_host_controller_programmable` | USB | USB device and host functions |
| BB-0696 | `deserializer_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0697 | `clock_multiplier_wrapper_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0698 | `instruction_fetch_unit_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-0699 | `load_store_unit_pipelined` | CPU Execution | Execution units and scheduling |
| BB-0700 | `protection_unit_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0701 | `timer_peripheral_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-0702 | `vertex_transform_engine_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-0703 | `texture_address_unit_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-0704 | `hdmi_timing_controller_line_buffered` | Video Timing | Display timing and frame transport |
| BB-0705 | `ycbcr_to_rgb_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-0706 | `mipi_csi2_unpacker_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-0707 | `i2s_receiver_bridge` | Audio Interfaces | Digital audio transport |
| BB-0708 | `audio_gain_unit_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-0709 | `convolution_layer_engine_bf16` | Machine Learning | Neural-network layers |
| BB-0710 | `key_projection_engine_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-0711 | `dequantizer_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0712 | `trajectory_generator_programmable` | Robotics | Motion, navigation and control |
| BB-0713 | `deadtime_inserter_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-0714 | `dac_streamer_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0715 | `modbus_tcp_engine_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0716 | `chacha20_engine_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-0717 | `fault_aggregator_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-0718 | `trace_buffer_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-0719 | `qspi_flash_controller_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-0720 | `run_length_decoder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-0721 | `digital_up_converter_pipelined` | RF and SDR | Digital radio front-end |
| BB-0722 | `doppler_fft_engine_pipelined` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0723 | `crank_angle_decoder_programmable` | Automotive | Vehicle-specific logic |
| BB-0724 | `gps_pps_discipliner_programmable` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0725 | `bitstream_loader_programmable` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0726 | `sort_merge_engine_pipelined` | Scientific and Search | Domain accelerators |
| BB-0727 | `boolean_expression_evaluator_iterative` | Logic and Primitives | Boolean and bit manipulation |
| BB-0728 | `down_counter_windowed` | Counters and Timing | Counters, timers and event measurement |
| BB-0729 | `microsequencer_multi_channel` | Control | State machines and sequencers |
| BB-0730 | `integer_subtractor_iterative` | Integer Compute | Integer arithmetic |
| BB-0731 | `fixed_point_multiplier_iterative` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0732 | `floating_point_multiplier_iterative` | Floating-Point Compute | Floating-point arithmetic |
| BB-0733 | `vector_multiplier_iterative` | Vector Compute | SIMD and vector datapaths |
| BB-0734 | `systolic_array_sparse` | Tensor Compute | Matrix and tensor operations |
| BB-0735 | `exponential_approximator_iterative` | Math Accelerators | Elementary and transcendental functions |
| BB-0736 | `parity_reducer_iterative` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0737 | `fir_interpolator_iterative` | DSP Filters | Digital filters |
| BB-0738 | `ifft_engine_iterative` | DSP Spectral | Spectral analysis and transforms |
| BB-0739 | `qam_demapper_iterative` | DSP Modulation | Modulation and waveform generation |
| BB-0740 | `carrier_recovery_loop_multi_channel` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0741 | `simple_dual_port_ram_ecc_protected` | Memory | RAM, ROM and register storage |
| BB-0742 | `packet_fifo_ecc_protected` | Queues | FIFO, queue and buffering structures |
| BB-0743 | `data_cache_ecc_protected` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0744 | `scatter_gather_dma_multi_channel` | DMA and Memory Services | Data movement and maintenance |
| BB-0745 | `axi4_slave_monitor` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0746 | `axi_stream_sink_monitor` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0747 | `apb_slave_monitor` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0748 | `wishbone_slave_monitor` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0749 | `shared_bus_interconnect_multi_channel` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0750 | `uart_receiver_monitor` | UART SPI I2C | Low-speed serial protocols |
| BB-0751 | `can_bit_timing_multi_channel` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0752 | `ethernet_rx_mac_iterative` | Ethernet MAC | Ethernet media access |
| BB-0753 | `arp_endpoint_multi_channel` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0754 | `pcie_tlp_parser_monitor` | PCI Express | PCIe endpoints and transaction services |
| BB-0755 | `usb_host_controller_multi_channel` | USB | USB device and host functions |
| BB-0756 | `deserializer_multi_channel` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0757 | `clock_multiplier_wrapper_multi_channel` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0758 | `instruction_fetch_unit_multi_channel` | CPU Frontend | Fetch, prediction and decode |
| BB-0759 | `load_store_unit_iterative` | CPU Execution | Execution units and scheduling |
| BB-0760 | `protection_unit_multi_channel` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0761 | `timer_peripheral_multi_channel` | SoC Peripherals | General-purpose peripherals |
| BB-0762 | `vertex_transform_engine_iterative` | GPU Geometry | Geometry and raster setup |
| BB-0763 | `texture_address_unit_multi_plane` | GPU Pixel | Raster, texture and pixel operations |
| BB-0764 | `hdmi_timing_controller_multi_plane` | Video Timing | Display timing and frame transport |
| BB-0765 | `ycbcr_to_rgb_multi_plane` | Image Processing | Pixel and neighborhood operations |
| BB-0766 | `mipi_csi2_unpacker_multi_plane` | Camera and ISP | Camera capture and image signal processing |
| BB-0767 | `i2s_receiver_monitor` | Audio Interfaces | Digital audio transport |
| BB-0768 | `audio_gain_unit_iterative` | Audio DSP | Audio processing and synthesis |
| BB-0769 | `convolution_layer_engine_sparse` | Machine Learning | Neural-network layers |
| BB-0770 | `key_projection_engine_sparse` | Transformer Acceleration | Attention and sequence models |
| BB-0771 | `dequantizer_sparse` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0772 | `trajectory_generator_multi_channel` | Robotics | Motion, navigation and control |
| BB-0773 | `deadtime_inserter_multi_channel` | Motor and Power Control | Motor drives and power electronics |
| BB-0774 | `dac_streamer_multi_channel` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0775 | `modbus_tcp_engine_multi_channel` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0776 | `chacha20_engine_multi_context` | Cryptography | Encryption, authentication and key services |
| BB-0777 | `fault_aggregator_multi_channel` | Safety and Reliability | Fault detection and safe operation |
| BB-0778 | `trace_buffer_coverage_driven` | Debug and Verification | On-chip debug and reusable verification |
| BB-0779 | `qspi_flash_controller_multi_channel` | Storage | Flash, SD, NVMe and block storage |
| BB-0780 | `run_length_decoder_iterative` | Compression and Coding | Compression, decompression and channel coding |
| BB-0781 | `digital_up_converter_iterative` | RF and SDR | Digital radio front-end |
| BB-0782 | `doppler_fft_engine_iterative` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0783 | `crank_angle_decoder_multi_channel` | Automotive | Vehicle-specific logic |
| BB-0784 | `gps_pps_discipliner_multi_channel` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0785 | `bitstream_loader_multi_channel` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0786 | `sort_merge_engine_iterative` | Scientific and Search | Domain accelerators |
| BB-0787 | `boolean_expression_evaluator_streaming` | Logic and Primitives | Boolean and bit manipulation |
| BB-0788 | `down_counter_timestamped` | Counters and Timing | Counters, timers and event measurement |
| BB-0789 | `microsequencer_fault_tolerant` | Control | State machines and sequencers |
| BB-0790 | `integer_subtractor_streaming` | Integer Compute | Integer arithmetic |
| BB-0791 | `fixed_point_multiplier_streaming` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0792 | `floating_point_multiplier_streaming` | Floating-Point Compute | Floating-point arithmetic |
| BB-0793 | `vector_multiplier_streaming` | Vector Compute | SIMD and vector datapaths |
| BB-0794 | `systolic_array_pipelined` | Tensor Compute | Matrix and tensor operations |
| BB-0795 | `exponential_approximator_streaming` | Math Accelerators | Elementary and transcendental functions |
| BB-0796 | `parity_reducer_streaming` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0797 | `fir_interpolator_streaming` | DSP Filters | Digital filters |
| BB-0798 | `ifft_engine_streaming` | DSP Spectral | Spectral analysis and transforms |
| BB-0799 | `qam_demapper_streaming` | DSP Modulation | Modulation and waveform generation |
| BB-0800 | `carrier_recovery_loop_fault_tolerant` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0801 | `simple_dual_port_ram_multi_queue` | Memory | RAM, ROM and register storage |
| BB-0802 | `packet_fifo_multi_queue` | Queues | FIFO, queue and buffering structures |
| BB-0803 | `data_cache_multi_queue` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0804 | `scatter_gather_dma_fault_tolerant` | DMA and Memory Services | Data movement and maintenance |
| BB-0805 | `axi4_slave_width_adapted` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0806 | `axi_stream_sink_width_adapted` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0807 | `apb_slave_width_adapted` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0808 | `wishbone_slave_width_adapted` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0809 | `shared_bus_interconnect_fault_tolerant` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0810 | `uart_receiver_width_adapted` | UART SPI I2C | Low-speed serial protocols |
| BB-0811 | `can_bit_timing_fault_tolerant` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0812 | `ethernet_rx_mac_streaming` | Ethernet MAC | Ethernet media access |
| BB-0813 | `arp_endpoint_fault_tolerant` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0814 | `pcie_tlp_parser_width_adapted` | PCI Express | PCIe endpoints and transaction services |
| BB-0815 | `usb_host_controller_fault_tolerant` | USB | USB device and host functions |
| BB-0816 | `deserializer_fault_tolerant` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0817 | `clock_multiplier_wrapper_fault_tolerant` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0818 | `instruction_fetch_unit_fault_tolerant` | CPU Frontend | Fetch, prediction and decode |
| BB-0819 | `load_store_unit_streaming` | CPU Execution | Execution units and scheduling |
| BB-0820 | `protection_unit_fault_tolerant` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0821 | `timer_peripheral_fault_tolerant` | SoC Peripherals | General-purpose peripherals |
| BB-0822 | `vertex_transform_engine_streaming` | GPU Geometry | Geometry and raster setup |
| BB-0823 | `texture_address_unit_low_latency` | GPU Pixel | Raster, texture and pixel operations |
| BB-0824 | `hdmi_timing_controller_low_latency` | Video Timing | Display timing and frame transport |
| BB-0825 | `ycbcr_to_rgb_low_latency` | Image Processing | Pixel and neighborhood operations |
| BB-0826 | `mipi_csi2_unpacker_low_latency` | Camera and ISP | Camera capture and image signal processing |
| BB-0827 | `i2s_receiver_width_adapted` | Audio Interfaces | Digital audio transport |
| BB-0828 | `audio_gain_unit_streaming` | Audio DSP | Audio processing and synthesis |
| BB-0829 | `convolution_layer_engine_pipelined` | Machine Learning | Neural-network layers |
| BB-0830 | `key_projection_engine_pipelined` | Transformer Acceleration | Attention and sequence models |
| BB-0831 | `dequantizer_pipelined` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0832 | `trajectory_generator_fault_tolerant` | Robotics | Motion, navigation and control |
| BB-0833 | `deadtime_inserter_fault_tolerant` | Motor and Power Control | Motor drives and power electronics |
| BB-0834 | `dac_streamer_fault_tolerant` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0835 | `modbus_tcp_engine_fault_tolerant` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0836 | `chacha20_engine_fault_detecting` | Cryptography | Encryption, authentication and key services |
| BB-0837 | `fault_aggregator_fault_tolerant` | Safety and Reliability | Fault detection and safe operation |
| BB-0838 | `trace_buffer_scoreboard_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-0839 | `qspi_flash_controller_fault_tolerant` | Storage | Flash, SD, NVMe and block storage |
| BB-0840 | `run_length_decoder_streaming` | Compression and Coding | Compression, decompression and channel coding |
| BB-0841 | `digital_up_converter_streaming` | RF and SDR | Digital radio front-end |
| BB-0842 | `doppler_fft_engine_streaming` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0843 | `crank_angle_decoder_fault_tolerant` | Automotive | Vehicle-specific logic |
| BB-0844 | `gps_pps_discipliner_fault_tolerant` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0845 | `bitstream_loader_fault_tolerant` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0846 | `sort_merge_engine_streaming` | Scientific and Search | Domain accelerators |
| BB-0847 | `boolean_expression_evaluator_resource_shared` | Logic and Primitives | Boolean and bit manipulation |
| BB-0848 | `down_counter_multi_channel` | Counters and Timing | Counters, timers and event measurement |
| BB-0849 | `microsequencer_low_power` | Control | State machines and sequencers |
| BB-0850 | `integer_subtractor_resource_shared` | Integer Compute | Integer arithmetic |
| BB-0851 | `fixed_point_multiplier_resource_shared` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0852 | `floating_point_multiplier_resource_shared` | Floating-Point Compute | Floating-point arithmetic |
| BB-0853 | `vector_multiplier_resource_shared` | Vector Compute | SIMD and vector datapaths |
| BB-0854 | `systolic_array_multi_engine` | Tensor Compute | Matrix and tensor operations |
| BB-0855 | `exponential_approximator_resource_shared` | Math Accelerators | Elementary and transcendental functions |
| BB-0856 | `parity_reducer_resource_shared` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0857 | `fir_interpolator_resource_shared` | DSP Filters | Digital filters |
| BB-0858 | `ifft_engine_resource_shared` | DSP Spectral | Spectral analysis and transforms |
| BB-0859 | `qam_demapper_resource_shared` | DSP Modulation | Modulation and waveform generation |
| BB-0860 | `carrier_recovery_loop_low_power` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0861 | `simple_dual_port_ram_low_latency` | Memory | RAM, ROM and register storage |
| BB-0862 | `packet_fifo_low_latency` | Queues | FIFO, queue and buffering structures |
| BB-0863 | `data_cache_low_latency` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0864 | `scatter_gather_dma_low_power` | DMA and Memory Services | Data movement and maintenance |
| BB-0865 | `axi4_slave_clock_crossing` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0866 | `axi_stream_sink_clock_crossing` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0867 | `apb_slave_clock_crossing` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0868 | `wishbone_slave_clock_crossing` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0869 | `shared_bus_interconnect_low_power` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0870 | `uart_receiver_clock_crossing` | UART SPI I2C | Low-speed serial protocols |
| BB-0871 | `can_bit_timing_low_power` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0872 | `ethernet_rx_mac_resource_shared` | Ethernet MAC | Ethernet media access |
| BB-0873 | `arp_endpoint_low_power` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0874 | `pcie_tlp_parser_clock_crossing` | PCI Express | PCIe endpoints and transaction services |
| BB-0875 | `usb_host_controller_low_power` | USB | USB device and host functions |
| BB-0876 | `deserializer_low_power` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0877 | `clock_multiplier_wrapper_low_power` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0878 | `instruction_fetch_unit_low_power` | CPU Frontend | Fetch, prediction and decode |
| BB-0879 | `load_store_unit_resource_shared` | CPU Execution | Execution units and scheduling |
| BB-0880 | `protection_unit_low_power` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0881 | `timer_peripheral_low_power` | SoC Peripherals | General-purpose peripherals |
| BB-0882 | `vertex_transform_engine_resource_shared` | GPU Geometry | Geometry and raster setup |
| BB-0883 | `texture_address_unit_programmable` | GPU Pixel | Raster, texture and pixel operations |
| BB-0884 | `hdmi_timing_controller_programmable` | Video Timing | Display timing and frame transport |
| BB-0885 | `ycbcr_to_rgb_programmable` | Image Processing | Pixel and neighborhood operations |
| BB-0886 | `mipi_csi2_unpacker_programmable` | Camera and ISP | Camera capture and image signal processing |
| BB-0887 | `i2s_receiver_clock_crossing` | Audio Interfaces | Digital audio transport |
| BB-0888 | `audio_gain_unit_resource_shared` | Audio DSP | Audio processing and synthesis |
| BB-0889 | `convolution_layer_engine_multi_engine` | Machine Learning | Neural-network layers |
| BB-0890 | `key_projection_engine_multi_engine` | Transformer Acceleration | Attention and sequence models |
| BB-0891 | `dequantizer_multi_engine` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0892 | `trajectory_generator_low_power` | Robotics | Motion, navigation and control |
| BB-0893 | `deadtime_inserter_low_power` | Motor and Power Control | Motor drives and power electronics |
| BB-0894 | `dac_streamer_low_power` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0895 | `modbus_tcp_engine_low_power` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0896 | `chacha20_engine_resource_optimized` | Cryptography | Encryption, authentication and key services |
| BB-0897 | `fault_aggregator_low_power` | Safety and Reliability | Fault detection and safe operation |
| BB-0898 | `trace_buffer_formal_friendly` | Debug and Verification | On-chip debug and reusable verification |
| BB-0899 | `qspi_flash_controller_low_power` | Storage | Flash, SD, NVMe and block storage |
| BB-0900 | `run_length_decoder_resource_shared` | Compression and Coding | Compression, decompression and channel coding |
| BB-0901 | `digital_up_converter_resource_shared` | RF and SDR | Digital radio front-end |
| BB-0902 | `doppler_fft_engine_resource_shared` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0903 | `crank_angle_decoder_low_power` | Automotive | Vehicle-specific logic |
| BB-0904 | `gps_pps_discipliner_low_power` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0905 | `bitstream_loader_low_power` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0906 | `sort_merge_engine_resource_shared` | Scientific and Search | Domain accelerators |
| BB-0907 | `mask_merge_unit_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-0908 | `up_down_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-0909 | `command_sequencer_single_shot` | Control | State machines and sequencers |
| BB-0910 | `integer_multiplier_combinational` | Integer Compute | Integer arithmetic |
| BB-0911 | `fixed_point_divider_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0912 | `floating_point_divider_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-0913 | `vector_mac_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-0914 | `tensor_mac_array_int8` | Tensor Compute | Matrix and tensor operations |
| BB-0915 | `logarithm_approximator_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-0916 | `xor_reduction_engine_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0917 | `biquad_filter_combinational` | DSP Filters | Digital filters |
| BB-0918 | `dct_engine_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-0919 | `psk_mapper_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-0920 | `phase_detector_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0921 | `true_dual_port_ram_single_clock` | Memory | RAM, ROM and register storage |
| BB-0922 | `descriptor_fifo_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-0923 | `unified_cache_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0924 | `two_dimensional_dma_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-0925 | `axi4_lite_master_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0926 | `axi_stream_fifo_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0927 | `apb_decoder_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0928 | `wishbone_crossbar_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0929 | `packet_noc_router_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0930 | `uart_baud_generator_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-0931 | `can_acceptance_filter_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0932 | `ethernet_crc_engine_combinational` | Ethernet MAC | Ethernet media access |
| BB-0933 | `ipv4_header_parser_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0934 | `pcie_tlp_generator_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-0935 | `usb_packet_engine_single_shot` | USB | USB device and host functions |
| BB-0936 | `gearbox_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0937 | `clock_mux_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0938 | `instruction_prefetch_buffer_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-0939 | `branch_execution_unit_combinational` | CPU Execution | Execution units and scheduling |
| BB-0940 | `interrupt_controller_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-0941 | `watchdog_peripheral_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-0942 | `primitive_assembler_combinational` | GPU Geometry | Geometry and raster setup |
| BB-0943 | `texture_filter_unit_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-0944 | `displayport_timing_controller_streaming` | Video Timing | Display timing and frame transport |
| BB-0945 | `rgb_to_hsv_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-0946 | `raw_bayer_unpacker_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-0947 | `tdm_transmitter_controller` | Audio Interfaces | Digital audio transport |
| BB-0948 | `audio_equalizer_combinational` | Audio DSP | Audio processing and synthesis |
| BB-0949 | `depthwise_convolution_engine_int8` | Machine Learning | Neural-network layers |
| BB-0950 | `value_projection_engine_int8` | Transformer Acceleration | Attention and sequence models |
| BB-0951 | `dynamic_range_tracker_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-0952 | `waypoint_sequencer_single_shot` | Robotics | Motion, navigation and control |
| BB-0953 | `space_vector_pwm_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-0954 | `sample_trigger_engine_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-0955 | `profibus_frame_engine_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-0956 | `poly1305_engine_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-0957 | `parity_checker_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-0958 | `event_trigger_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-0959 | `nand_flash_controller_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-0960 | `lz_match_finder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-0961 | `iq_imbalance_corrector_combinational` | RF and SDR | Digital radio front-end |
| BB-0962 | `range_doppler_map_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-0963 | `cam_angle_decoder_single_shot` | Automotive | Vehicle-specific logic |
| BB-0964 | `precision_time_counter_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-0965 | `configuration_crc_checker_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-0966 | `bloom_filter_combinational` | Scientific and Search | Domain accelerators |
| BB-0967 | `mask_merge_unit_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-0968 | `up_down_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-0969 | `command_sequencer_continuous` | Control | State machines and sequencers |
| BB-0970 | `integer_multiplier_single_cycle` | Integer Compute | Integer arithmetic |
| BB-0971 | `fixed_point_divider_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-0972 | `floating_point_divider_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-0973 | `vector_mac_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-0974 | `tensor_mac_array_int16` | Tensor Compute | Matrix and tensor operations |
| BB-0975 | `logarithm_approximator_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-0976 | `xor_reduction_engine_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-0977 | `biquad_filter_single_cycle` | DSP Filters | Digital filters |
| BB-0978 | `dct_engine_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-0979 | `psk_mapper_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-0980 | `phase_detector_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-0981 | `true_dual_port_ram_dual_clock` | Memory | RAM, ROM and register storage |
| BB-0982 | `descriptor_fifo_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-0983 | `unified_cache_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-0984 | `two_dimensional_dma_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-0985 | `axi4_lite_master_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-0986 | `axi_stream_fifo_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-0987 | `apb_decoder_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-0988 | `wishbone_crossbar_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-0989 | `packet_noc_router_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-0990 | `uart_baud_generator_target` | UART SPI I2C | Low-speed serial protocols |
| BB-0991 | `can_acceptance_filter_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-0992 | `ethernet_crc_engine_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-0993 | `ipv4_header_parser_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-0994 | `pcie_tlp_generator_target` | PCI Express | PCIe endpoints and transaction services |
| BB-0995 | `usb_packet_engine_continuous` | USB | USB device and host functions |
| BB-0996 | `gearbox_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-0997 | `clock_mux_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-0998 | `instruction_prefetch_buffer_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-0999 | `branch_execution_unit_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-1000 | `interrupt_controller_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1001 | `watchdog_peripheral_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-1002 | `primitive_assembler_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-1003 | `texture_filter_unit_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-1004 | `displayport_timing_controller_framebuffer` | Video Timing | Display timing and frame transport |
| BB-1005 | `rgb_to_hsv_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-1006 | `raw_bayer_unpacker_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-1007 | `tdm_transmitter_target` | Audio Interfaces | Digital audio transport |
| BB-1008 | `audio_equalizer_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-1009 | `depthwise_convolution_engine_int16` | Machine Learning | Neural-network layers |
| BB-1010 | `value_projection_engine_int16` | Transformer Acceleration | Attention and sequence models |
| BB-1011 | `dynamic_range_tracker_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1012 | `waypoint_sequencer_continuous` | Robotics | Motion, navigation and control |
| BB-1013 | `space_vector_pwm_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-1014 | `sample_trigger_engine_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1015 | `profibus_frame_engine_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1016 | `poly1305_engine_streaming` | Cryptography | Encryption, authentication and key services |
| BB-1017 | `parity_checker_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-1018 | `event_trigger_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-1019 | `nand_flash_controller_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-1020 | `lz_match_finder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-1021 | `iq_imbalance_corrector_single_cycle` | RF and SDR | Digital radio front-end |
| BB-1022 | `range_doppler_map_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1023 | `cam_angle_decoder_continuous` | Automotive | Vehicle-specific logic |
| BB-1024 | `precision_time_counter_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1025 | `configuration_crc_checker_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1026 | `bloom_filter_single_cycle` | Scientific and Search | Domain accelerators |
| BB-1027 | `mask_merge_unit_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-1028 | `up_down_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-1029 | `command_sequencer_programmable` | Control | State machines and sequencers |
| BB-1030 | `integer_multiplier_pipelined` | Integer Compute | Integer arithmetic |
| BB-1031 | `fixed_point_divider_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1032 | `floating_point_divider_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-1033 | `vector_mac_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-1034 | `tensor_mac_array_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-1035 | `logarithm_approximator_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-1036 | `xor_reduction_engine_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1037 | `biquad_filter_pipelined` | DSP Filters | Digital filters |
| BB-1038 | `dct_engine_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-1039 | `psk_mapper_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-1040 | `phase_detector_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1041 | `true_dual_port_ram_packet_aware` | Memory | RAM, ROM and register storage |
| BB-1042 | `descriptor_fifo_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-1043 | `unified_cache_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1044 | `two_dimensional_dma_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-1045 | `axi4_lite_master_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1046 | `axi_stream_fifo_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1047 | `apb_decoder_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1048 | `wishbone_crossbar_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1049 | `packet_noc_router_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1050 | `uart_baud_generator_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-1051 | `can_acceptance_filter_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1052 | `ethernet_crc_engine_pipelined` | Ethernet MAC | Ethernet media access |
| BB-1053 | `ipv4_header_parser_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1054 | `pcie_tlp_generator_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-1055 | `usb_packet_engine_programmable` | USB | USB device and host functions |
| BB-1056 | `gearbox_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1057 | `clock_mux_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1058 | `instruction_prefetch_buffer_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-1059 | `branch_execution_unit_pipelined` | CPU Execution | Execution units and scheduling |
| BB-1060 | `interrupt_controller_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1061 | `watchdog_peripheral_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-1062 | `primitive_assembler_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-1063 | `texture_filter_unit_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-1064 | `displayport_timing_controller_line_buffered` | Video Timing | Display timing and frame transport |
| BB-1065 | `rgb_to_hsv_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-1066 | `raw_bayer_unpacker_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-1067 | `tdm_transmitter_bridge` | Audio Interfaces | Digital audio transport |
| BB-1068 | `audio_equalizer_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-1069 | `depthwise_convolution_engine_bf16` | Machine Learning | Neural-network layers |
| BB-1070 | `value_projection_engine_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-1071 | `dynamic_range_tracker_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1072 | `waypoint_sequencer_programmable` | Robotics | Motion, navigation and control |
| BB-1073 | `space_vector_pwm_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-1074 | `sample_trigger_engine_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1075 | `profibus_frame_engine_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1076 | `poly1305_engine_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-1077 | `parity_checker_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-1078 | `event_trigger_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-1079 | `nand_flash_controller_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-1080 | `lz_match_finder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-1081 | `iq_imbalance_corrector_pipelined` | RF and SDR | Digital radio front-end |
| BB-1082 | `range_doppler_map_pipelined` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1083 | `cam_angle_decoder_programmable` | Automotive | Vehicle-specific logic |
| BB-1084 | `precision_time_counter_programmable` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1085 | `configuration_crc_checker_programmable` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1086 | `bloom_filter_pipelined` | Scientific and Search | Domain accelerators |
| BB-1087 | `mask_merge_unit_iterative` | Logic and Primitives | Boolean and bit manipulation |
| BB-1088 | `up_down_counter_windowed` | Counters and Timing | Counters, timers and event measurement |
| BB-1089 | `command_sequencer_multi_channel` | Control | State machines and sequencers |
| BB-1090 | `integer_multiplier_iterative` | Integer Compute | Integer arithmetic |
| BB-1091 | `fixed_point_divider_iterative` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1092 | `floating_point_divider_iterative` | Floating-Point Compute | Floating-point arithmetic |
| BB-1093 | `vector_mac_iterative` | Vector Compute | SIMD and vector datapaths |
| BB-1094 | `tensor_mac_array_sparse` | Tensor Compute | Matrix and tensor operations |
| BB-1095 | `logarithm_approximator_iterative` | Math Accelerators | Elementary and transcendental functions |
| BB-1096 | `xor_reduction_engine_iterative` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1097 | `biquad_filter_iterative` | DSP Filters | Digital filters |
| BB-1098 | `dct_engine_iterative` | DSP Spectral | Spectral analysis and transforms |
| BB-1099 | `psk_mapper_iterative` | DSP Modulation | Modulation and waveform generation |
| BB-1100 | `phase_detector_multi_channel` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1101 | `true_dual_port_ram_ecc_protected` | Memory | RAM, ROM and register storage |
| BB-1102 | `descriptor_fifo_ecc_protected` | Queues | FIFO, queue and buffering structures |
| BB-1103 | `unified_cache_ecc_protected` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1104 | `two_dimensional_dma_multi_channel` | DMA and Memory Services | Data movement and maintenance |
| BB-1105 | `axi4_lite_master_monitor` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1106 | `axi_stream_fifo_monitor` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1107 | `apb_decoder_monitor` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1108 | `wishbone_crossbar_monitor` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1109 | `packet_noc_router_multi_channel` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1110 | `uart_baud_generator_monitor` | UART SPI I2C | Low-speed serial protocols |
| BB-1111 | `can_acceptance_filter_multi_channel` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1112 | `ethernet_crc_engine_iterative` | Ethernet MAC | Ethernet media access |
| BB-1113 | `ipv4_header_parser_multi_channel` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1114 | `pcie_tlp_generator_monitor` | PCI Express | PCIe endpoints and transaction services |
| BB-1115 | `usb_packet_engine_multi_channel` | USB | USB device and host functions |
| BB-1116 | `gearbox_multi_channel` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1117 | `clock_mux_multi_channel` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1118 | `instruction_prefetch_buffer_multi_channel` | CPU Frontend | Fetch, prediction and decode |
| BB-1119 | `branch_execution_unit_iterative` | CPU Execution | Execution units and scheduling |
| BB-1120 | `interrupt_controller_multi_channel` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1121 | `watchdog_peripheral_multi_channel` | SoC Peripherals | General-purpose peripherals |
| BB-1122 | `primitive_assembler_iterative` | GPU Geometry | Geometry and raster setup |
| BB-1123 | `texture_filter_unit_multi_plane` | GPU Pixel | Raster, texture and pixel operations |
| BB-1124 | `displayport_timing_controller_multi_plane` | Video Timing | Display timing and frame transport |
| BB-1125 | `rgb_to_hsv_multi_plane` | Image Processing | Pixel and neighborhood operations |
| BB-1126 | `raw_bayer_unpacker_multi_plane` | Camera and ISP | Camera capture and image signal processing |
| BB-1127 | `tdm_transmitter_monitor` | Audio Interfaces | Digital audio transport |
| BB-1128 | `audio_equalizer_iterative` | Audio DSP | Audio processing and synthesis |
| BB-1129 | `depthwise_convolution_engine_sparse` | Machine Learning | Neural-network layers |
| BB-1130 | `value_projection_engine_sparse` | Transformer Acceleration | Attention and sequence models |
| BB-1131 | `dynamic_range_tracker_sparse` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1132 | `waypoint_sequencer_multi_channel` | Robotics | Motion, navigation and control |
| BB-1133 | `space_vector_pwm_multi_channel` | Motor and Power Control | Motor drives and power electronics |
| BB-1134 | `sample_trigger_engine_multi_channel` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1135 | `profibus_frame_engine_multi_channel` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1136 | `poly1305_engine_multi_context` | Cryptography | Encryption, authentication and key services |
| BB-1137 | `parity_checker_multi_channel` | Safety and Reliability | Fault detection and safe operation |
| BB-1138 | `event_trigger_coverage_driven` | Debug and Verification | On-chip debug and reusable verification |
| BB-1139 | `nand_flash_controller_multi_channel` | Storage | Flash, SD, NVMe and block storage |
| BB-1140 | `lz_match_finder_iterative` | Compression and Coding | Compression, decompression and channel coding |
| BB-1141 | `iq_imbalance_corrector_iterative` | RF and SDR | Digital radio front-end |
| BB-1142 | `range_doppler_map_iterative` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1143 | `cam_angle_decoder_multi_channel` | Automotive | Vehicle-specific logic |
| BB-1144 | `precision_time_counter_multi_channel` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1145 | `configuration_crc_checker_multi_channel` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1146 | `bloom_filter_iterative` | Scientific and Search | Domain accelerators |
| BB-1147 | `mask_merge_unit_streaming` | Logic and Primitives | Boolean and bit manipulation |
| BB-1148 | `up_down_counter_timestamped` | Counters and Timing | Counters, timers and event measurement |
| BB-1149 | `command_sequencer_fault_tolerant` | Control | State machines and sequencers |
| BB-1150 | `integer_multiplier_streaming` | Integer Compute | Integer arithmetic |
| BB-1151 | `fixed_point_divider_streaming` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1152 | `floating_point_divider_streaming` | Floating-Point Compute | Floating-point arithmetic |
| BB-1153 | `vector_mac_streaming` | Vector Compute | SIMD and vector datapaths |
| BB-1154 | `tensor_mac_array_pipelined` | Tensor Compute | Matrix and tensor operations |
| BB-1155 | `logarithm_approximator_streaming` | Math Accelerators | Elementary and transcendental functions |
| BB-1156 | `xor_reduction_engine_streaming` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1157 | `biquad_filter_streaming` | DSP Filters | Digital filters |
| BB-1158 | `dct_engine_streaming` | DSP Spectral | Spectral analysis and transforms |
| BB-1159 | `psk_mapper_streaming` | DSP Modulation | Modulation and waveform generation |
| BB-1160 | `phase_detector_fault_tolerant` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1161 | `true_dual_port_ram_multi_queue` | Memory | RAM, ROM and register storage |
| BB-1162 | `descriptor_fifo_multi_queue` | Queues | FIFO, queue and buffering structures |
| BB-1163 | `unified_cache_multi_queue` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1164 | `two_dimensional_dma_fault_tolerant` | DMA and Memory Services | Data movement and maintenance |
| BB-1165 | `axi4_lite_master_width_adapted` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1166 | `axi_stream_fifo_width_adapted` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1167 | `apb_decoder_width_adapted` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1168 | `wishbone_crossbar_width_adapted` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1169 | `packet_noc_router_fault_tolerant` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1170 | `uart_baud_generator_width_adapted` | UART SPI I2C | Low-speed serial protocols |
| BB-1171 | `can_acceptance_filter_fault_tolerant` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1172 | `ethernet_crc_engine_streaming` | Ethernet MAC | Ethernet media access |
| BB-1173 | `ipv4_header_parser_fault_tolerant` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1174 | `pcie_tlp_generator_width_adapted` | PCI Express | PCIe endpoints and transaction services |
| BB-1175 | `usb_packet_engine_fault_tolerant` | USB | USB device and host functions |
| BB-1176 | `gearbox_fault_tolerant` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1177 | `clock_mux_fault_tolerant` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1178 | `instruction_prefetch_buffer_fault_tolerant` | CPU Frontend | Fetch, prediction and decode |
| BB-1179 | `branch_execution_unit_streaming` | CPU Execution | Execution units and scheduling |
| BB-1180 | `interrupt_controller_fault_tolerant` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1181 | `watchdog_peripheral_fault_tolerant` | SoC Peripherals | General-purpose peripherals |
| BB-1182 | `primitive_assembler_streaming` | GPU Geometry | Geometry and raster setup |
| BB-1183 | `texture_filter_unit_low_latency` | GPU Pixel | Raster, texture and pixel operations |
| BB-1184 | `displayport_timing_controller_low_latency` | Video Timing | Display timing and frame transport |
| BB-1185 | `rgb_to_hsv_low_latency` | Image Processing | Pixel and neighborhood operations |
| BB-1186 | `raw_bayer_unpacker_low_latency` | Camera and ISP | Camera capture and image signal processing |
| BB-1187 | `tdm_transmitter_width_adapted` | Audio Interfaces | Digital audio transport |
| BB-1188 | `audio_equalizer_streaming` | Audio DSP | Audio processing and synthesis |
| BB-1189 | `depthwise_convolution_engine_pipelined` | Machine Learning | Neural-network layers |
| BB-1190 | `value_projection_engine_pipelined` | Transformer Acceleration | Attention and sequence models |
| BB-1191 | `dynamic_range_tracker_pipelined` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1192 | `waypoint_sequencer_fault_tolerant` | Robotics | Motion, navigation and control |
| BB-1193 | `space_vector_pwm_fault_tolerant` | Motor and Power Control | Motor drives and power electronics |
| BB-1194 | `sample_trigger_engine_fault_tolerant` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1195 | `profibus_frame_engine_fault_tolerant` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1196 | `poly1305_engine_fault_detecting` | Cryptography | Encryption, authentication and key services |
| BB-1197 | `parity_checker_fault_tolerant` | Safety and Reliability | Fault detection and safe operation |
| BB-1198 | `event_trigger_scoreboard_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-1199 | `nand_flash_controller_fault_tolerant` | Storage | Flash, SD, NVMe and block storage |
| BB-1200 | `lz_match_finder_streaming` | Compression and Coding | Compression, decompression and channel coding |
| BB-1201 | `iq_imbalance_corrector_streaming` | RF and SDR | Digital radio front-end |
| BB-1202 | `range_doppler_map_streaming` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1203 | `cam_angle_decoder_fault_tolerant` | Automotive | Vehicle-specific logic |
| BB-1204 | `precision_time_counter_fault_tolerant` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1205 | `configuration_crc_checker_fault_tolerant` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1206 | `bloom_filter_streaming` | Scientific and Search | Domain accelerators |
| BB-1207 | `mask_merge_unit_resource_shared` | Logic and Primitives | Boolean and bit manipulation |
| BB-1208 | `up_down_counter_multi_channel` | Counters and Timing | Counters, timers and event measurement |
| BB-1209 | `command_sequencer_low_power` | Control | State machines and sequencers |
| BB-1210 | `integer_multiplier_resource_shared` | Integer Compute | Integer arithmetic |
| BB-1211 | `fixed_point_divider_resource_shared` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1212 | `floating_point_divider_resource_shared` | Floating-Point Compute | Floating-point arithmetic |
| BB-1213 | `vector_mac_resource_shared` | Vector Compute | SIMD and vector datapaths |
| BB-1214 | `tensor_mac_array_multi_engine` | Tensor Compute | Matrix and tensor operations |
| BB-1215 | `logarithm_approximator_resource_shared` | Math Accelerators | Elementary and transcendental functions |
| BB-1216 | `xor_reduction_engine_resource_shared` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1217 | `biquad_filter_resource_shared` | DSP Filters | Digital filters |
| BB-1218 | `dct_engine_resource_shared` | DSP Spectral | Spectral analysis and transforms |
| BB-1219 | `psk_mapper_resource_shared` | DSP Modulation | Modulation and waveform generation |
| BB-1220 | `phase_detector_low_power` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1221 | `true_dual_port_ram_low_latency` | Memory | RAM, ROM and register storage |
| BB-1222 | `descriptor_fifo_low_latency` | Queues | FIFO, queue and buffering structures |
| BB-1223 | `unified_cache_low_latency` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1224 | `two_dimensional_dma_low_power` | DMA and Memory Services | Data movement and maintenance |
| BB-1225 | `axi4_lite_master_clock_crossing` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1226 | `axi_stream_fifo_clock_crossing` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1227 | `apb_decoder_clock_crossing` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1228 | `wishbone_crossbar_clock_crossing` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1229 | `packet_noc_router_low_power` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1230 | `uart_baud_generator_clock_crossing` | UART SPI I2C | Low-speed serial protocols |
| BB-1231 | `can_acceptance_filter_low_power` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1232 | `ethernet_crc_engine_resource_shared` | Ethernet MAC | Ethernet media access |
| BB-1233 | `ipv4_header_parser_low_power` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1234 | `pcie_tlp_generator_clock_crossing` | PCI Express | PCIe endpoints and transaction services |
| BB-1235 | `usb_packet_engine_low_power` | USB | USB device and host functions |
| BB-1236 | `gearbox_low_power` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1237 | `clock_mux_low_power` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1238 | `instruction_prefetch_buffer_low_power` | CPU Frontend | Fetch, prediction and decode |
| BB-1239 | `branch_execution_unit_resource_shared` | CPU Execution | Execution units and scheduling |
| BB-1240 | `interrupt_controller_low_power` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1241 | `watchdog_peripheral_low_power` | SoC Peripherals | General-purpose peripherals |
| BB-1242 | `primitive_assembler_resource_shared` | GPU Geometry | Geometry and raster setup |
| BB-1243 | `texture_filter_unit_programmable` | GPU Pixel | Raster, texture and pixel operations |
| BB-1244 | `displayport_timing_controller_programmable` | Video Timing | Display timing and frame transport |
| BB-1245 | `rgb_to_hsv_programmable` | Image Processing | Pixel and neighborhood operations |
| BB-1246 | `raw_bayer_unpacker_programmable` | Camera and ISP | Camera capture and image signal processing |
| BB-1247 | `tdm_transmitter_clock_crossing` | Audio Interfaces | Digital audio transport |
| BB-1248 | `audio_equalizer_resource_shared` | Audio DSP | Audio processing and synthesis |
| BB-1249 | `depthwise_convolution_engine_multi_engine` | Machine Learning | Neural-network layers |
| BB-1250 | `value_projection_engine_multi_engine` | Transformer Acceleration | Attention and sequence models |
| BB-1251 | `dynamic_range_tracker_multi_engine` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1252 | `waypoint_sequencer_low_power` | Robotics | Motion, navigation and control |
| BB-1253 | `space_vector_pwm_low_power` | Motor and Power Control | Motor drives and power electronics |
| BB-1254 | `sample_trigger_engine_low_power` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1255 | `profibus_frame_engine_low_power` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1256 | `poly1305_engine_resource_optimized` | Cryptography | Encryption, authentication and key services |
| BB-1257 | `parity_checker_low_power` | Safety and Reliability | Fault detection and safe operation |
| BB-1258 | `event_trigger_formal_friendly` | Debug and Verification | On-chip debug and reusable verification |
| BB-1259 | `nand_flash_controller_low_power` | Storage | Flash, SD, NVMe and block storage |
| BB-1260 | `lz_match_finder_resource_shared` | Compression and Coding | Compression, decompression and channel coding |
| BB-1261 | `iq_imbalance_corrector_resource_shared` | RF and SDR | Digital radio front-end |
| BB-1262 | `range_doppler_map_resource_shared` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1263 | `cam_angle_decoder_low_power` | Automotive | Vehicle-specific logic |
| BB-1264 | `precision_time_counter_low_power` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1265 | `configuration_crc_checker_low_power` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1266 | `bloom_filter_resource_shared` | Scientific and Search | Domain accelerators |
| BB-1267 | `bit_set_clear_unit_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-1268 | `modulo_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-1269 | `transaction_controller_single_shot` | Control | State machines and sequencers |
| BB-1270 | `integer_divider_combinational` | Integer Compute | Integer arithmetic |
| BB-1271 | `fixed_point_rescaler_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1272 | `floating_point_fma_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-1273 | `vector_compare_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-1274 | `matrix_transpose_engine_int8` | Tensor Compute | Matrix and tensor operations |
| BB-1275 | `reciprocal_approximator_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-1276 | `crc_generator_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1277 | `polyphase_filter_combinational` | DSP Filters | Digital filters |
| BB-1278 | `idct_engine_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-1279 | `psk_demapper_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-1280 | `frequency_offset_estimator_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1281 | `multi_port_register_file_single_clock` | Memory | RAM, ROM and register storage |
| BB-1282 | `command_queue_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-1283 | `victim_cache_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1284 | `cyclic_dma_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-1285 | `axi4_lite_slave_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1286 | `axi_stream_switch_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1287 | `apb_bridge_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1288 | `wishbone_arbiter_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1289 | `circuit_noc_router_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1290 | `uart_packet_engine_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-1291 | `can_error_confinement_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1292 | `ethernet_preamble_engine_combinational` | Ethernet MAC | Ethernet media access |
| BB-1293 | `ipv4_checksum_unit_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1294 | `pcie_completion_tracker_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-1295 | `usb_endpoint_manager_single_shot` | USB | USB device and host functions |
| BB-1296 | `comma_detector_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1297 | `clock_gate_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1298 | `branch_predictor_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-1299 | `multiply_divide_unit_combinational` | CPU Execution | Execution units and scheduling |
| BB-1300 | `exception_controller_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1301 | `pwm_peripheral_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-1302 | `triangle_setup_engine_combinational` | GPU Geometry | Geometry and raster setup |
| BB-1303 | `pixel_shader_datapath_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-1304 | `video_sync_generator_streaming` | Video Timing | Display timing and frame transport |
| BB-1305 | `grayscale_converter_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-1306 | `black_level_correction_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-1307 | `tdm_receiver_controller` | Audio Interfaces | Digital audio transport |
| BB-1308 | `audio_compressor_combinational` | Audio DSP | Audio processing and synthesis |
| BB-1309 | `pooling_engine_int8` | Machine Learning | Neural-network layers |
| BB-1310 | `attention_score_engine_int8` | Transformer Acceleration | Attention and sequence models |
| BB-1311 | `zero_point_adjuster_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1312 | `inverse_kinematics_engine_single_shot` | Robotics | Motion, navigation and control |
| BB-1313 | `field_oriented_control_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-1314 | `timestamp_unit_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1315 | `profinet_packet_engine_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1316 | `sha2_engine_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-1317 | `ecc_controller_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-1318 | `protocol_monitor_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-1319 | `sd_card_controller_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-1320 | `lz_token_decoder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-1321 | `dc_offset_remover_combinational` | RF and SDR | Digital radio front-end |
| BB-1322 | `cfar_detector_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1323 | `battery_monitor_frontend_single_shot` | Automotive | Vehicle-specific logic |
| BB-1324 | `time_triggered_scheduler_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1325 | `boot_rom_controller_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1326 | `regex_match_engine_combinational` | Scientific and Search | Domain accelerators |
| BB-1327 | `bit_set_clear_unit_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-1328 | `modulo_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-1329 | `transaction_controller_continuous` | Control | State machines and sequencers |
| BB-1330 | `integer_divider_single_cycle` | Integer Compute | Integer arithmetic |
| BB-1331 | `fixed_point_rescaler_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1332 | `floating_point_fma_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-1333 | `vector_compare_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-1334 | `matrix_transpose_engine_int16` | Tensor Compute | Matrix and tensor operations |
| BB-1335 | `reciprocal_approximator_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-1336 | `crc_generator_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1337 | `polyphase_filter_single_cycle` | DSP Filters | Digital filters |
| BB-1338 | `idct_engine_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-1339 | `psk_demapper_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-1340 | `frequency_offset_estimator_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1341 | `multi_port_register_file_dual_clock` | Memory | RAM, ROM and register storage |
| BB-1342 | `command_queue_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-1343 | `victim_cache_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1344 | `cyclic_dma_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-1345 | `axi4_lite_slave_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1346 | `axi_stream_switch_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1347 | `apb_bridge_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1348 | `wishbone_arbiter_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1349 | `circuit_noc_router_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1350 | `uart_packet_engine_target` | UART SPI I2C | Low-speed serial protocols |
| BB-1351 | `can_error_confinement_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1352 | `ethernet_preamble_engine_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-1353 | `ipv4_checksum_unit_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1354 | `pcie_completion_tracker_target` | PCI Express | PCIe endpoints and transaction services |
| BB-1355 | `usb_endpoint_manager_continuous` | USB | USB device and host functions |
| BB-1356 | `comma_detector_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1357 | `clock_gate_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1358 | `branch_predictor_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-1359 | `multiply_divide_unit_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-1360 | `exception_controller_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1361 | `pwm_peripheral_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-1362 | `triangle_setup_engine_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-1363 | `pixel_shader_datapath_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-1364 | `video_sync_generator_framebuffer` | Video Timing | Display timing and frame transport |
| BB-1365 | `grayscale_converter_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-1366 | `black_level_correction_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-1367 | `tdm_receiver_target` | Audio Interfaces | Digital audio transport |
| BB-1368 | `audio_compressor_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-1369 | `pooling_engine_int16` | Machine Learning | Neural-network layers |
| BB-1370 | `attention_score_engine_int16` | Transformer Acceleration | Attention and sequence models |
| BB-1371 | `zero_point_adjuster_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1372 | `inverse_kinematics_engine_continuous` | Robotics | Motion, navigation and control |
| BB-1373 | `field_oriented_control_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-1374 | `timestamp_unit_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1375 | `profinet_packet_engine_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1376 | `sha2_engine_streaming` | Cryptography | Encryption, authentication and key services |
| BB-1377 | `ecc_controller_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-1378 | `protocol_monitor_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-1379 | `sd_card_controller_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-1380 | `lz_token_decoder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-1381 | `dc_offset_remover_single_cycle` | RF and SDR | Digital radio front-end |
| BB-1382 | `cfar_detector_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1383 | `battery_monitor_frontend_continuous` | Automotive | Vehicle-specific logic |
| BB-1384 | `time_triggered_scheduler_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1385 | `boot_rom_controller_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1386 | `regex_match_engine_single_cycle` | Scientific and Search | Domain accelerators |
| BB-1387 | `bit_set_clear_unit_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-1388 | `modulo_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-1389 | `transaction_controller_programmable` | Control | State machines and sequencers |
| BB-1390 | `integer_divider_pipelined` | Integer Compute | Integer arithmetic |
| BB-1391 | `fixed_point_rescaler_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1392 | `floating_point_fma_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-1393 | `vector_compare_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-1394 | `matrix_transpose_engine_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-1395 | `reciprocal_approximator_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-1396 | `crc_generator_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1397 | `polyphase_filter_pipelined` | DSP Filters | Digital filters |
| BB-1398 | `idct_engine_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-1399 | `psk_demapper_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-1400 | `frequency_offset_estimator_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1401 | `multi_port_register_file_packet_aware` | Memory | RAM, ROM and register storage |
| BB-1402 | `command_queue_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-1403 | `victim_cache_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1404 | `cyclic_dma_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-1405 | `axi4_lite_slave_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1406 | `axi_stream_switch_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1407 | `apb_bridge_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1408 | `wishbone_arbiter_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1409 | `circuit_noc_router_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1410 | `uart_packet_engine_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-1411 | `can_error_confinement_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1412 | `ethernet_preamble_engine_pipelined` | Ethernet MAC | Ethernet media access |
| BB-1413 | `ipv4_checksum_unit_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1414 | `pcie_completion_tracker_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-1415 | `usb_endpoint_manager_programmable` | USB | USB device and host functions |
| BB-1416 | `comma_detector_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1417 | `clock_gate_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1418 | `branch_predictor_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-1419 | `multiply_divide_unit_pipelined` | CPU Execution | Execution units and scheduling |
| BB-1420 | `exception_controller_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1421 | `pwm_peripheral_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-1422 | `triangle_setup_engine_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-1423 | `pixel_shader_datapath_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-1424 | `video_sync_generator_line_buffered` | Video Timing | Display timing and frame transport |
| BB-1425 | `grayscale_converter_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-1426 | `black_level_correction_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-1427 | `tdm_receiver_bridge` | Audio Interfaces | Digital audio transport |
| BB-1428 | `audio_compressor_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-1429 | `pooling_engine_bf16` | Machine Learning | Neural-network layers |
| BB-1430 | `attention_score_engine_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-1431 | `zero_point_adjuster_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1432 | `inverse_kinematics_engine_programmable` | Robotics | Motion, navigation and control |
| BB-1433 | `field_oriented_control_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-1434 | `timestamp_unit_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1435 | `profinet_packet_engine_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1436 | `sha2_engine_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-1437 | `ecc_controller_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-1438 | `protocol_monitor_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-1439 | `sd_card_controller_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-1440 | `lz_token_decoder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-1441 | `dc_offset_remover_pipelined` | RF and SDR | Digital radio front-end |
| BB-1442 | `cfar_detector_pipelined` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1443 | `battery_monitor_frontend_programmable` | Automotive | Vehicle-specific logic |
| BB-1444 | `time_triggered_scheduler_programmable` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1445 | `boot_rom_controller_programmable` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1446 | `regex_match_engine_pipelined` | Scientific and Search | Domain accelerators |
| BB-1447 | `bit_set_clear_unit_iterative` | Logic and Primitives | Boolean and bit manipulation |
| BB-1448 | `modulo_counter_windowed` | Counters and Timing | Counters, timers and event measurement |
| BB-1449 | `transaction_controller_multi_channel` | Control | State machines and sequencers |
| BB-1450 | `integer_divider_iterative` | Integer Compute | Integer arithmetic |
| BB-1451 | `fixed_point_rescaler_iterative` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1452 | `floating_point_fma_iterative` | Floating-Point Compute | Floating-point arithmetic |
| BB-1453 | `vector_compare_iterative` | Vector Compute | SIMD and vector datapaths |
| BB-1454 | `matrix_transpose_engine_sparse` | Tensor Compute | Matrix and tensor operations |
| BB-1455 | `reciprocal_approximator_iterative` | Math Accelerators | Elementary and transcendental functions |
| BB-1456 | `crc_generator_iterative` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1457 | `polyphase_filter_iterative` | DSP Filters | Digital filters |
| BB-1458 | `idct_engine_iterative` | DSP Spectral | Spectral analysis and transforms |
| BB-1459 | `psk_demapper_iterative` | DSP Modulation | Modulation and waveform generation |
| BB-1460 | `frequency_offset_estimator_multi_channel` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1461 | `multi_port_register_file_ecc_protected` | Memory | RAM, ROM and register storage |
| BB-1462 | `command_queue_ecc_protected` | Queues | FIFO, queue and buffering structures |
| BB-1463 | `victim_cache_ecc_protected` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1464 | `cyclic_dma_multi_channel` | DMA and Memory Services | Data movement and maintenance |
| BB-1465 | `axi4_lite_slave_monitor` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1466 | `axi_stream_switch_monitor` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1467 | `apb_bridge_monitor` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1468 | `wishbone_arbiter_monitor` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1469 | `circuit_noc_router_multi_channel` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1470 | `uart_packet_engine_monitor` | UART SPI I2C | Low-speed serial protocols |
| BB-1471 | `can_error_confinement_multi_channel` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1472 | `ethernet_preamble_engine_iterative` | Ethernet MAC | Ethernet media access |
| BB-1473 | `ipv4_checksum_unit_multi_channel` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1474 | `pcie_completion_tracker_monitor` | PCI Express | PCIe endpoints and transaction services |
| BB-1475 | `usb_endpoint_manager_multi_channel` | USB | USB device and host functions |
| BB-1476 | `comma_detector_multi_channel` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1477 | `clock_gate_multi_channel` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1478 | `branch_predictor_multi_channel` | CPU Frontend | Fetch, prediction and decode |
| BB-1479 | `multiply_divide_unit_iterative` | CPU Execution | Execution units and scheduling |
| BB-1480 | `exception_controller_multi_channel` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1481 | `pwm_peripheral_multi_channel` | SoC Peripherals | General-purpose peripherals |
| BB-1482 | `triangle_setup_engine_iterative` | GPU Geometry | Geometry and raster setup |
| BB-1483 | `pixel_shader_datapath_multi_plane` | GPU Pixel | Raster, texture and pixel operations |
| BB-1484 | `video_sync_generator_multi_plane` | Video Timing | Display timing and frame transport |
| BB-1485 | `grayscale_converter_multi_plane` | Image Processing | Pixel and neighborhood operations |
| BB-1486 | `black_level_correction_multi_plane` | Camera and ISP | Camera capture and image signal processing |
| BB-1487 | `tdm_receiver_monitor` | Audio Interfaces | Digital audio transport |
| BB-1488 | `audio_compressor_iterative` | Audio DSP | Audio processing and synthesis |
| BB-1489 | `pooling_engine_sparse` | Machine Learning | Neural-network layers |
| BB-1490 | `attention_score_engine_sparse` | Transformer Acceleration | Attention and sequence models |
| BB-1491 | `zero_point_adjuster_sparse` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1492 | `inverse_kinematics_engine_multi_channel` | Robotics | Motion, navigation and control |
| BB-1493 | `field_oriented_control_multi_channel` | Motor and Power Control | Motor drives and power electronics |
| BB-1494 | `timestamp_unit_multi_channel` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1495 | `profinet_packet_engine_multi_channel` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1496 | `sha2_engine_multi_context` | Cryptography | Encryption, authentication and key services |
| BB-1497 | `ecc_controller_multi_channel` | Safety and Reliability | Fault detection and safe operation |
| BB-1498 | `protocol_monitor_coverage_driven` | Debug and Verification | On-chip debug and reusable verification |
| BB-1499 | `sd_card_controller_multi_channel` | Storage | Flash, SD, NVMe and block storage |
| BB-1500 | `lz_token_decoder_iterative` | Compression and Coding | Compression, decompression and channel coding |
| BB-1501 | `dc_offset_remover_iterative` | RF and SDR | Digital radio front-end |
| BB-1502 | `cfar_detector_iterative` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1503 | `battery_monitor_frontend_multi_channel` | Automotive | Vehicle-specific logic |
| BB-1504 | `time_triggered_scheduler_multi_channel` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1505 | `boot_rom_controller_multi_channel` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1506 | `regex_match_engine_iterative` | Scientific and Search | Domain accelerators |
| BB-1507 | `bit_set_clear_unit_streaming` | Logic and Primitives | Boolean and bit manipulation |
| BB-1508 | `modulo_counter_timestamped` | Counters and Timing | Counters, timers and event measurement |
| BB-1509 | `transaction_controller_fault_tolerant` | Control | State machines and sequencers |
| BB-1510 | `integer_divider_streaming` | Integer Compute | Integer arithmetic |
| BB-1511 | `fixed_point_rescaler_streaming` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1512 | `floating_point_fma_streaming` | Floating-Point Compute | Floating-point arithmetic |
| BB-1513 | `vector_compare_streaming` | Vector Compute | SIMD and vector datapaths |
| BB-1514 | `matrix_transpose_engine_pipelined` | Tensor Compute | Matrix and tensor operations |
| BB-1515 | `reciprocal_approximator_streaming` | Math Accelerators | Elementary and transcendental functions |
| BB-1516 | `crc_generator_streaming` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1517 | `polyphase_filter_streaming` | DSP Filters | Digital filters |
| BB-1518 | `idct_engine_streaming` | DSP Spectral | Spectral analysis and transforms |
| BB-1519 | `psk_demapper_streaming` | DSP Modulation | Modulation and waveform generation |
| BB-1520 | `frequency_offset_estimator_fault_tolerant` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1521 | `multi_port_register_file_multi_queue` | Memory | RAM, ROM and register storage |
| BB-1522 | `command_queue_multi_queue` | Queues | FIFO, queue and buffering structures |
| BB-1523 | `victim_cache_multi_queue` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1524 | `cyclic_dma_fault_tolerant` | DMA and Memory Services | Data movement and maintenance |
| BB-1525 | `axi4_lite_slave_width_adapted` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1526 | `axi_stream_switch_width_adapted` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1527 | `apb_bridge_width_adapted` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1528 | `wishbone_arbiter_width_adapted` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1529 | `circuit_noc_router_fault_tolerant` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1530 | `uart_packet_engine_width_adapted` | UART SPI I2C | Low-speed serial protocols |
| BB-1531 | `can_error_confinement_fault_tolerant` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1532 | `ethernet_preamble_engine_streaming` | Ethernet MAC | Ethernet media access |
| BB-1533 | `ipv4_checksum_unit_fault_tolerant` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1534 | `pcie_completion_tracker_width_adapted` | PCI Express | PCIe endpoints and transaction services |
| BB-1535 | `usb_endpoint_manager_fault_tolerant` | USB | USB device and host functions |
| BB-1536 | `comma_detector_fault_tolerant` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1537 | `clock_gate_fault_tolerant` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1538 | `branch_predictor_fault_tolerant` | CPU Frontend | Fetch, prediction and decode |
| BB-1539 | `multiply_divide_unit_streaming` | CPU Execution | Execution units and scheduling |
| BB-1540 | `exception_controller_fault_tolerant` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1541 | `pwm_peripheral_fault_tolerant` | SoC Peripherals | General-purpose peripherals |
| BB-1542 | `triangle_setup_engine_streaming` | GPU Geometry | Geometry and raster setup |
| BB-1543 | `pixel_shader_datapath_low_latency` | GPU Pixel | Raster, texture and pixel operations |
| BB-1544 | `video_sync_generator_low_latency` | Video Timing | Display timing and frame transport |
| BB-1545 | `grayscale_converter_low_latency` | Image Processing | Pixel and neighborhood operations |
| BB-1546 | `black_level_correction_low_latency` | Camera and ISP | Camera capture and image signal processing |
| BB-1547 | `tdm_receiver_width_adapted` | Audio Interfaces | Digital audio transport |
| BB-1548 | `audio_compressor_streaming` | Audio DSP | Audio processing and synthesis |
| BB-1549 | `pooling_engine_pipelined` | Machine Learning | Neural-network layers |
| BB-1550 | `attention_score_engine_pipelined` | Transformer Acceleration | Attention and sequence models |
| BB-1551 | `zero_point_adjuster_pipelined` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1552 | `inverse_kinematics_engine_fault_tolerant` | Robotics | Motion, navigation and control |
| BB-1553 | `field_oriented_control_fault_tolerant` | Motor and Power Control | Motor drives and power electronics |
| BB-1554 | `timestamp_unit_fault_tolerant` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1555 | `profinet_packet_engine_fault_tolerant` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1556 | `sha2_engine_fault_detecting` | Cryptography | Encryption, authentication and key services |
| BB-1557 | `ecc_controller_fault_tolerant` | Safety and Reliability | Fault detection and safe operation |
| BB-1558 | `protocol_monitor_scoreboard_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-1559 | `sd_card_controller_fault_tolerant` | Storage | Flash, SD, NVMe and block storage |
| BB-1560 | `lz_token_decoder_streaming` | Compression and Coding | Compression, decompression and channel coding |
| BB-1561 | `dc_offset_remover_streaming` | RF and SDR | Digital radio front-end |
| BB-1562 | `cfar_detector_streaming` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1563 | `battery_monitor_frontend_fault_tolerant` | Automotive | Vehicle-specific logic |
| BB-1564 | `time_triggered_scheduler_fault_tolerant` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1565 | `boot_rom_controller_fault_tolerant` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1566 | `regex_match_engine_streaming` | Scientific and Search | Domain accelerators |
| BB-1567 | `bit_set_clear_unit_resource_shared` | Logic and Primitives | Boolean and bit manipulation |
| BB-1568 | `modulo_counter_multi_channel` | Counters and Timing | Counters, timers and event measurement |
| BB-1569 | `transaction_controller_low_power` | Control | State machines and sequencers |
| BB-1570 | `integer_divider_resource_shared` | Integer Compute | Integer arithmetic |
| BB-1571 | `fixed_point_rescaler_resource_shared` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1572 | `floating_point_fma_resource_shared` | Floating-Point Compute | Floating-point arithmetic |
| BB-1573 | `vector_compare_resource_shared` | Vector Compute | SIMD and vector datapaths |
| BB-1574 | `matrix_transpose_engine_multi_engine` | Tensor Compute | Matrix and tensor operations |
| BB-1575 | `reciprocal_approximator_resource_shared` | Math Accelerators | Elementary and transcendental functions |
| BB-1576 | `crc_generator_resource_shared` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1577 | `polyphase_filter_resource_shared` | DSP Filters | Digital filters |
| BB-1578 | `idct_engine_resource_shared` | DSP Spectral | Spectral analysis and transforms |
| BB-1579 | `psk_demapper_resource_shared` | DSP Modulation | Modulation and waveform generation |
| BB-1580 | `frequency_offset_estimator_low_power` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1581 | `multi_port_register_file_low_latency` | Memory | RAM, ROM and register storage |
| BB-1582 | `command_queue_low_latency` | Queues | FIFO, queue and buffering structures |
| BB-1583 | `victim_cache_low_latency` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1584 | `cyclic_dma_low_power` | DMA and Memory Services | Data movement and maintenance |
| BB-1585 | `axi4_lite_slave_clock_crossing` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1586 | `axi_stream_switch_clock_crossing` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1587 | `apb_bridge_clock_crossing` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1588 | `wishbone_arbiter_clock_crossing` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1589 | `circuit_noc_router_low_power` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1590 | `uart_packet_engine_clock_crossing` | UART SPI I2C | Low-speed serial protocols |
| BB-1591 | `can_error_confinement_low_power` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1592 | `ethernet_preamble_engine_resource_shared` | Ethernet MAC | Ethernet media access |
| BB-1593 | `ipv4_checksum_unit_low_power` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1594 | `pcie_completion_tracker_clock_crossing` | PCI Express | PCIe endpoints and transaction services |
| BB-1595 | `usb_endpoint_manager_low_power` | USB | USB device and host functions |
| BB-1596 | `comma_detector_low_power` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1597 | `clock_gate_low_power` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1598 | `branch_predictor_low_power` | CPU Frontend | Fetch, prediction and decode |
| BB-1599 | `multiply_divide_unit_resource_shared` | CPU Execution | Execution units and scheduling |
| BB-1600 | `exception_controller_low_power` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1601 | `pwm_peripheral_low_power` | SoC Peripherals | General-purpose peripherals |
| BB-1602 | `triangle_setup_engine_resource_shared` | GPU Geometry | Geometry and raster setup |
| BB-1603 | `pixel_shader_datapath_programmable` | GPU Pixel | Raster, texture and pixel operations |
| BB-1604 | `video_sync_generator_programmable` | Video Timing | Display timing and frame transport |
| BB-1605 | `grayscale_converter_programmable` | Image Processing | Pixel and neighborhood operations |
| BB-1606 | `black_level_correction_programmable` | Camera and ISP | Camera capture and image signal processing |
| BB-1607 | `tdm_receiver_clock_crossing` | Audio Interfaces | Digital audio transport |
| BB-1608 | `audio_compressor_resource_shared` | Audio DSP | Audio processing and synthesis |
| BB-1609 | `pooling_engine_multi_engine` | Machine Learning | Neural-network layers |
| BB-1610 | `attention_score_engine_multi_engine` | Transformer Acceleration | Attention and sequence models |
| BB-1611 | `zero_point_adjuster_multi_engine` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1612 | `inverse_kinematics_engine_low_power` | Robotics | Motion, navigation and control |
| BB-1613 | `field_oriented_control_low_power` | Motor and Power Control | Motor drives and power electronics |
| BB-1614 | `timestamp_unit_low_power` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1615 | `profinet_packet_engine_low_power` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1616 | `sha2_engine_resource_optimized` | Cryptography | Encryption, authentication and key services |
| BB-1617 | `ecc_controller_low_power` | Safety and Reliability | Fault detection and safe operation |
| BB-1618 | `protocol_monitor_formal_friendly` | Debug and Verification | On-chip debug and reusable verification |
| BB-1619 | `sd_card_controller_low_power` | Storage | Flash, SD, NVMe and block storage |
| BB-1620 | `lz_token_decoder_resource_shared` | Compression and Coding | Compression, decompression and channel coding |
| BB-1621 | `dc_offset_remover_resource_shared` | RF and SDR | Digital radio front-end |
| BB-1622 | `cfar_detector_resource_shared` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1623 | `battery_monitor_frontend_low_power` | Automotive | Vehicle-specific logic |
| BB-1624 | `time_triggered_scheduler_low_power` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1625 | `boot_rom_controller_low_power` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1626 | `regex_match_engine_resource_shared` | Scientific and Search | Domain accelerators |
| BB-1627 | `bitfield_extract_unit_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-1628 | `saturating_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-1629 | `retry_controller_single_shot` | Control | State machines and sequencers |
| BB-1630 | `integer_remainder_unit_combinational` | Integer Compute | Integer arithmetic |
| BB-1631 | `fixed_point_rounder_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1632 | `floating_point_sqrt_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-1633 | `vector_shuffle_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-1634 | `matrix_tile_loader_int8` | Tensor Compute | Matrix and tensor operations |
| BB-1635 | `square_root_engine_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-1636 | `crc_checker_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1637 | `halfband_filter_combinational` | DSP Filters | Digital filters |
| BB-1638 | `wavelet_transform_engine_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-1639 | `fsk_modulator_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-1640 | `frame_sync_detector_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1641 | `distributed_ram_single_clock` | Memory | RAM, ROM and register storage |
| BB-1642 | `response_queue_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-1643 | `write_buffer_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1644 | `memory_copy_engine_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-1645 | `axi_register_slice_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1646 | `axi_stream_broadcaster_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1647 | `ahb_master_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1648 | `wishbone_pipeline_adapter_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1649 | `virtual_channel_router_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1650 | `spi_master_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-1651 | `lin_frame_engine_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1652 | `ethernet_pause_control_combinational` | Ethernet MAC | Ethernet media access |
| BB-1653 | `ipv6_header_parser_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1654 | `pcie_dma_engine_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-1655 | `usb_control_transfer_single_shot` | USB | USB device and host functions |
| BB-1656 | `word_aligner_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1657 | `reset_synchronizer_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1658 | `branch_target_buffer_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-1659 | `csr_execution_unit_combinational` | CPU Execution | Execution units and scheduling |
| BB-1660 | `privilege_controller_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1661 | `quadrature_timer_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-1662 | `clipping_engine_combinational` | GPU Geometry | Geometry and raster setup |
| BB-1663 | `depth_test_unit_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-1664 | `active_video_generator_streaming` | Video Timing | Display timing and frame transport |
| BB-1665 | `gamma_corrector_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-1666 | `defective_pixel_correction_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-1667 | `spdif_transmitter_controller` | Audio Interfaces | Digital audio transport |
| BB-1668 | `audio_limiter_combinational` | Audio DSP | Audio processing and synthesis |
| BB-1669 | `batch_normalization_engine_int8` | Machine Learning | Neural-network layers |
| BB-1670 | `attention_softmax_engine_int8` | Transformer Acceleration | Attention and sequence models |
| BB-1671 | `scale_apply_engine_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1672 | `forward_kinematics_engine_single_shot` | Robotics | Motion, navigation and control |
| BB-1673 | `commutation_controller_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-1674 | `pulse_width_meter_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1675 | `ethercat_slave_engine_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1676 | `sha3_engine_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-1677 | `lockstep_comparator_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-1678 | `performance_counter_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-1679 | `emmc_controller_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-1680 | `huffman_encoder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-1681 | `crest_factor_reducer_combinational` | RF and SDR | Digital radio front-end |
| BB-1682 | `pulse_compressor_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1683 | `traction_control_assist_single_shot` | Automotive | Vehicle-specific logic |
| BB-1684 | `triple_modular_voter_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1685 | `secure_boot_sequencer_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1686 | `graph_traversal_engine_combinational` | Scientific and Search | Domain accelerators |
| BB-1687 | `bitfield_extract_unit_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-1688 | `saturating_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-1689 | `retry_controller_continuous` | Control | State machines and sequencers |
| BB-1690 | `integer_remainder_unit_single_cycle` | Integer Compute | Integer arithmetic |
| BB-1691 | `fixed_point_rounder_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1692 | `floating_point_sqrt_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-1693 | `vector_shuffle_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-1694 | `matrix_tile_loader_int16` | Tensor Compute | Matrix and tensor operations |
| BB-1695 | `square_root_engine_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-1696 | `crc_checker_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1697 | `halfband_filter_single_cycle` | DSP Filters | Digital filters |
| BB-1698 | `wavelet_transform_engine_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-1699 | `fsk_modulator_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-1700 | `frame_sync_detector_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1701 | `distributed_ram_dual_clock` | Memory | RAM, ROM and register storage |
| BB-1702 | `response_queue_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-1703 | `write_buffer_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1704 | `memory_copy_engine_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-1705 | `axi_register_slice_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1706 | `axi_stream_broadcaster_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1707 | `ahb_master_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1708 | `wishbone_pipeline_adapter_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1709 | `virtual_channel_router_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1710 | `spi_master_target` | UART SPI I2C | Low-speed serial protocols |
| BB-1711 | `lin_frame_engine_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1712 | `ethernet_pause_control_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-1713 | `ipv6_header_parser_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1714 | `pcie_dma_engine_target` | PCI Express | PCIe endpoints and transaction services |
| BB-1715 | `usb_control_transfer_continuous` | USB | USB device and host functions |
| BB-1716 | `word_aligner_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1717 | `reset_synchronizer_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1718 | `branch_target_buffer_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-1719 | `csr_execution_unit_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-1720 | `privilege_controller_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1721 | `quadrature_timer_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-1722 | `clipping_engine_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-1723 | `depth_test_unit_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-1724 | `active_video_generator_framebuffer` | Video Timing | Display timing and frame transport |
| BB-1725 | `gamma_corrector_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-1726 | `defective_pixel_correction_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-1727 | `spdif_transmitter_target` | Audio Interfaces | Digital audio transport |
| BB-1728 | `audio_limiter_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-1729 | `batch_normalization_engine_int16` | Machine Learning | Neural-network layers |
| BB-1730 | `attention_softmax_engine_int16` | Transformer Acceleration | Attention and sequence models |
| BB-1731 | `scale_apply_engine_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1732 | `forward_kinematics_engine_continuous` | Robotics | Motion, navigation and control |
| BB-1733 | `commutation_controller_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-1734 | `pulse_width_meter_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1735 | `ethercat_slave_engine_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1736 | `sha3_engine_streaming` | Cryptography | Encryption, authentication and key services |
| BB-1737 | `lockstep_comparator_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-1738 | `performance_counter_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-1739 | `emmc_controller_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-1740 | `huffman_encoder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-1741 | `crest_factor_reducer_single_cycle` | RF and SDR | Digital radio front-end |
| BB-1742 | `pulse_compressor_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1743 | `traction_control_assist_continuous` | Automotive | Vehicle-specific logic |
| BB-1744 | `triple_modular_voter_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1745 | `secure_boot_sequencer_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1746 | `graph_traversal_engine_single_cycle` | Scientific and Search | Domain accelerators |
| BB-1747 | `bitfield_extract_unit_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-1748 | `saturating_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-1749 | `retry_controller_programmable` | Control | State machines and sequencers |
| BB-1750 | `integer_remainder_unit_pipelined` | Integer Compute | Integer arithmetic |
| BB-1751 | `fixed_point_rounder_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1752 | `floating_point_sqrt_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-1753 | `vector_shuffle_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-1754 | `matrix_tile_loader_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-1755 | `square_root_engine_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-1756 | `crc_checker_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1757 | `halfband_filter_pipelined` | DSP Filters | Digital filters |
| BB-1758 | `wavelet_transform_engine_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-1759 | `fsk_modulator_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-1760 | `frame_sync_detector_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1761 | `distributed_ram_packet_aware` | Memory | RAM, ROM and register storage |
| BB-1762 | `response_queue_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-1763 | `write_buffer_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1764 | `memory_copy_engine_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-1765 | `axi_register_slice_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1766 | `axi_stream_broadcaster_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1767 | `ahb_master_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1768 | `wishbone_pipeline_adapter_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1769 | `virtual_channel_router_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1770 | `spi_master_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-1771 | `lin_frame_engine_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1772 | `ethernet_pause_control_pipelined` | Ethernet MAC | Ethernet media access |
| BB-1773 | `ipv6_header_parser_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1774 | `pcie_dma_engine_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-1775 | `usb_control_transfer_programmable` | USB | USB device and host functions |
| BB-1776 | `word_aligner_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1777 | `reset_synchronizer_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1778 | `branch_target_buffer_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-1779 | `csr_execution_unit_pipelined` | CPU Execution | Execution units and scheduling |
| BB-1780 | `privilege_controller_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1781 | `quadrature_timer_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-1782 | `clipping_engine_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-1783 | `depth_test_unit_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-1784 | `active_video_generator_line_buffered` | Video Timing | Display timing and frame transport |
| BB-1785 | `gamma_corrector_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-1786 | `defective_pixel_correction_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-1787 | `spdif_transmitter_bridge` | Audio Interfaces | Digital audio transport |
| BB-1788 | `audio_limiter_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-1789 | `batch_normalization_engine_bf16` | Machine Learning | Neural-network layers |
| BB-1790 | `attention_softmax_engine_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-1791 | `scale_apply_engine_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1792 | `forward_kinematics_engine_programmable` | Robotics | Motion, navigation and control |
| BB-1793 | `commutation_controller_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-1794 | `pulse_width_meter_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1795 | `ethercat_slave_engine_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1796 | `sha3_engine_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-1797 | `lockstep_comparator_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-1798 | `performance_counter_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-1799 | `emmc_controller_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-1800 | `huffman_encoder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-1801 | `crest_factor_reducer_pipelined` | RF and SDR | Digital radio front-end |
| BB-1802 | `pulse_compressor_pipelined` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1803 | `traction_control_assist_programmable` | Automotive | Vehicle-specific logic |
| BB-1804 | `triple_modular_voter_programmable` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1805 | `secure_boot_sequencer_programmable` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1806 | `graph_traversal_engine_pipelined` | Scientific and Search | Domain accelerators |
| BB-1807 | `bitfield_extract_unit_iterative` | Logic and Primitives | Boolean and bit manipulation |
| BB-1808 | `saturating_counter_windowed` | Counters and Timing | Counters, timers and event measurement |
| BB-1809 | `retry_controller_multi_channel` | Control | State machines and sequencers |
| BB-1810 | `integer_remainder_unit_iterative` | Integer Compute | Integer arithmetic |
| BB-1811 | `fixed_point_rounder_iterative` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1812 | `floating_point_sqrt_iterative` | Floating-Point Compute | Floating-point arithmetic |
| BB-1813 | `vector_shuffle_iterative` | Vector Compute | SIMD and vector datapaths |
| BB-1814 | `matrix_tile_loader_sparse` | Tensor Compute | Matrix and tensor operations |
| BB-1815 | `square_root_engine_iterative` | Math Accelerators | Elementary and transcendental functions |
| BB-1816 | `crc_checker_iterative` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1817 | `halfband_filter_iterative` | DSP Filters | Digital filters |
| BB-1818 | `wavelet_transform_engine_iterative` | DSP Spectral | Spectral analysis and transforms |
| BB-1819 | `fsk_modulator_iterative` | DSP Modulation | Modulation and waveform generation |
| BB-1820 | `frame_sync_detector_multi_channel` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1821 | `distributed_ram_ecc_protected` | Memory | RAM, ROM and register storage |
| BB-1822 | `response_queue_ecc_protected` | Queues | FIFO, queue and buffering structures |
| BB-1823 | `write_buffer_ecc_protected` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1824 | `memory_copy_engine_multi_channel` | DMA and Memory Services | Data movement and maintenance |
| BB-1825 | `axi_register_slice_monitor` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1826 | `axi_stream_broadcaster_monitor` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1827 | `ahb_master_monitor` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1828 | `wishbone_pipeline_adapter_monitor` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1829 | `virtual_channel_router_multi_channel` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1830 | `spi_master_monitor` | UART SPI I2C | Low-speed serial protocols |
| BB-1831 | `lin_frame_engine_multi_channel` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1832 | `ethernet_pause_control_iterative` | Ethernet MAC | Ethernet media access |
| BB-1833 | `ipv6_header_parser_multi_channel` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1834 | `pcie_dma_engine_monitor` | PCI Express | PCIe endpoints and transaction services |
| BB-1835 | `usb_control_transfer_multi_channel` | USB | USB device and host functions |
| BB-1836 | `word_aligner_multi_channel` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1837 | `reset_synchronizer_multi_channel` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1838 | `branch_target_buffer_multi_channel` | CPU Frontend | Fetch, prediction and decode |
| BB-1839 | `csr_execution_unit_iterative` | CPU Execution | Execution units and scheduling |
| BB-1840 | `privilege_controller_multi_channel` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1841 | `quadrature_timer_multi_channel` | SoC Peripherals | General-purpose peripherals |
| BB-1842 | `clipping_engine_iterative` | GPU Geometry | Geometry and raster setup |
| BB-1843 | `depth_test_unit_multi_plane` | GPU Pixel | Raster, texture and pixel operations |
| BB-1844 | `active_video_generator_multi_plane` | Video Timing | Display timing and frame transport |
| BB-1845 | `gamma_corrector_multi_plane` | Image Processing | Pixel and neighborhood operations |
| BB-1846 | `defective_pixel_correction_multi_plane` | Camera and ISP | Camera capture and image signal processing |
| BB-1847 | `spdif_transmitter_monitor` | Audio Interfaces | Digital audio transport |
| BB-1848 | `audio_limiter_iterative` | Audio DSP | Audio processing and synthesis |
| BB-1849 | `batch_normalization_engine_sparse` | Machine Learning | Neural-network layers |
| BB-1850 | `attention_softmax_engine_sparse` | Transformer Acceleration | Attention and sequence models |
| BB-1851 | `scale_apply_engine_sparse` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1852 | `forward_kinematics_engine_multi_channel` | Robotics | Motion, navigation and control |
| BB-1853 | `commutation_controller_multi_channel` | Motor and Power Control | Motor drives and power electronics |
| BB-1854 | `pulse_width_meter_multi_channel` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1855 | `ethercat_slave_engine_multi_channel` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1856 | `sha3_engine_multi_context` | Cryptography | Encryption, authentication and key services |
| BB-1857 | `lockstep_comparator_multi_channel` | Safety and Reliability | Fault detection and safe operation |
| BB-1858 | `performance_counter_coverage_driven` | Debug and Verification | On-chip debug and reusable verification |
| BB-1859 | `emmc_controller_multi_channel` | Storage | Flash, SD, NVMe and block storage |
| BB-1860 | `huffman_encoder_iterative` | Compression and Coding | Compression, decompression and channel coding |
| BB-1861 | `crest_factor_reducer_iterative` | RF and SDR | Digital radio front-end |
| BB-1862 | `pulse_compressor_iterative` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1863 | `traction_control_assist_multi_channel` | Automotive | Vehicle-specific logic |
| BB-1864 | `triple_modular_voter_multi_channel` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1865 | `secure_boot_sequencer_multi_channel` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1866 | `graph_traversal_engine_iterative` | Scientific and Search | Domain accelerators |
| BB-1867 | `bitfield_extract_unit_streaming` | Logic and Primitives | Boolean and bit manipulation |
| BB-1868 | `saturating_counter_timestamped` | Counters and Timing | Counters, timers and event measurement |
| BB-1869 | `retry_controller_fault_tolerant` | Control | State machines and sequencers |
| BB-1870 | `integer_remainder_unit_streaming` | Integer Compute | Integer arithmetic |
| BB-1871 | `fixed_point_rounder_streaming` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1872 | `floating_point_sqrt_streaming` | Floating-Point Compute | Floating-point arithmetic |
| BB-1873 | `vector_shuffle_streaming` | Vector Compute | SIMD and vector datapaths |
| BB-1874 | `matrix_tile_loader_pipelined` | Tensor Compute | Matrix and tensor operations |
| BB-1875 | `square_root_engine_streaming` | Math Accelerators | Elementary and transcendental functions |
| BB-1876 | `crc_checker_streaming` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1877 | `halfband_filter_streaming` | DSP Filters | Digital filters |
| BB-1878 | `wavelet_transform_engine_streaming` | DSP Spectral | Spectral analysis and transforms |
| BB-1879 | `fsk_modulator_streaming` | DSP Modulation | Modulation and waveform generation |
| BB-1880 | `frame_sync_detector_fault_tolerant` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1881 | `distributed_ram_multi_queue` | Memory | RAM, ROM and register storage |
| BB-1882 | `response_queue_multi_queue` | Queues | FIFO, queue and buffering structures |
| BB-1883 | `write_buffer_multi_queue` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1884 | `memory_copy_engine_fault_tolerant` | DMA and Memory Services | Data movement and maintenance |
| BB-1885 | `axi_register_slice_width_adapted` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1886 | `axi_stream_broadcaster_width_adapted` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1887 | `ahb_master_width_adapted` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1888 | `wishbone_pipeline_adapter_width_adapted` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1889 | `virtual_channel_router_fault_tolerant` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1890 | `spi_master_width_adapted` | UART SPI I2C | Low-speed serial protocols |
| BB-1891 | `lin_frame_engine_fault_tolerant` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1892 | `ethernet_pause_control_streaming` | Ethernet MAC | Ethernet media access |
| BB-1893 | `ipv6_header_parser_fault_tolerant` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1894 | `pcie_dma_engine_width_adapted` | PCI Express | PCIe endpoints and transaction services |
| BB-1895 | `usb_control_transfer_fault_tolerant` | USB | USB device and host functions |
| BB-1896 | `word_aligner_fault_tolerant` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1897 | `reset_synchronizer_fault_tolerant` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1898 | `branch_target_buffer_fault_tolerant` | CPU Frontend | Fetch, prediction and decode |
| BB-1899 | `csr_execution_unit_streaming` | CPU Execution | Execution units and scheduling |
| BB-1900 | `privilege_controller_fault_tolerant` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1901 | `quadrature_timer_fault_tolerant` | SoC Peripherals | General-purpose peripherals |
| BB-1902 | `clipping_engine_streaming` | GPU Geometry | Geometry and raster setup |
| BB-1903 | `depth_test_unit_low_latency` | GPU Pixel | Raster, texture and pixel operations |
| BB-1904 | `active_video_generator_low_latency` | Video Timing | Display timing and frame transport |
| BB-1905 | `gamma_corrector_low_latency` | Image Processing | Pixel and neighborhood operations |
| BB-1906 | `defective_pixel_correction_low_latency` | Camera and ISP | Camera capture and image signal processing |
| BB-1907 | `spdif_transmitter_width_adapted` | Audio Interfaces | Digital audio transport |
| BB-1908 | `audio_limiter_streaming` | Audio DSP | Audio processing and synthesis |
| BB-1909 | `batch_normalization_engine_pipelined` | Machine Learning | Neural-network layers |
| BB-1910 | `attention_softmax_engine_pipelined` | Transformer Acceleration | Attention and sequence models |
| BB-1911 | `scale_apply_engine_pipelined` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1912 | `forward_kinematics_engine_fault_tolerant` | Robotics | Motion, navigation and control |
| BB-1913 | `commutation_controller_fault_tolerant` | Motor and Power Control | Motor drives and power electronics |
| BB-1914 | `pulse_width_meter_fault_tolerant` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1915 | `ethercat_slave_engine_fault_tolerant` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1916 | `sha3_engine_fault_detecting` | Cryptography | Encryption, authentication and key services |
| BB-1917 | `lockstep_comparator_fault_tolerant` | Safety and Reliability | Fault detection and safe operation |
| BB-1918 | `performance_counter_scoreboard_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-1919 | `emmc_controller_fault_tolerant` | Storage | Flash, SD, NVMe and block storage |
| BB-1920 | `huffman_encoder_streaming` | Compression and Coding | Compression, decompression and channel coding |
| BB-1921 | `crest_factor_reducer_streaming` | RF and SDR | Digital radio front-end |
| BB-1922 | `pulse_compressor_streaming` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1923 | `traction_control_assist_fault_tolerant` | Automotive | Vehicle-specific logic |
| BB-1924 | `triple_modular_voter_fault_tolerant` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1925 | `secure_boot_sequencer_fault_tolerant` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1926 | `graph_traversal_engine_streaming` | Scientific and Search | Domain accelerators |
| BB-1927 | `bitfield_extract_unit_resource_shared` | Logic and Primitives | Boolean and bit manipulation |
| BB-1928 | `saturating_counter_multi_channel` | Counters and Timing | Counters, timers and event measurement |
| BB-1929 | `retry_controller_low_power` | Control | State machines and sequencers |
| BB-1930 | `integer_remainder_unit_resource_shared` | Integer Compute | Integer arithmetic |
| BB-1931 | `fixed_point_rounder_resource_shared` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1932 | `floating_point_sqrt_resource_shared` | Floating-Point Compute | Floating-point arithmetic |
| BB-1933 | `vector_shuffle_resource_shared` | Vector Compute | SIMD and vector datapaths |
| BB-1934 | `matrix_tile_loader_multi_engine` | Tensor Compute | Matrix and tensor operations |
| BB-1935 | `square_root_engine_resource_shared` | Math Accelerators | Elementary and transcendental functions |
| BB-1936 | `crc_checker_resource_shared` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1937 | `halfband_filter_resource_shared` | DSP Filters | Digital filters |
| BB-1938 | `wavelet_transform_engine_resource_shared` | DSP Spectral | Spectral analysis and transforms |
| BB-1939 | `fsk_modulator_resource_shared` | DSP Modulation | Modulation and waveform generation |
| BB-1940 | `frame_sync_detector_low_power` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-1941 | `distributed_ram_low_latency` | Memory | RAM, ROM and register storage |
| BB-1942 | `response_queue_low_latency` | Queues | FIFO, queue and buffering structures |
| BB-1943 | `write_buffer_low_latency` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-1944 | `memory_copy_engine_low_power` | DMA and Memory Services | Data movement and maintenance |
| BB-1945 | `axi_register_slice_clock_crossing` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-1946 | `axi_stream_broadcaster_clock_crossing` | AMBA AXI Stream | AXI4-Stream transport |
| BB-1947 | `ahb_master_clock_crossing` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-1948 | `wishbone_pipeline_adapter_clock_crossing` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-1949 | `virtual_channel_router_low_power` | Interconnect and NoC | Routing, arbitration and switching |
| BB-1950 | `spi_master_clock_crossing` | UART SPI I2C | Low-speed serial protocols |
| BB-1951 | `lin_frame_engine_low_power` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-1952 | `ethernet_pause_control_resource_shared` | Ethernet MAC | Ethernet media access |
| BB-1953 | `ipv6_header_parser_low_power` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-1954 | `pcie_dma_engine_clock_crossing` | PCI Express | PCIe endpoints and transaction services |
| BB-1955 | `usb_control_transfer_low_power` | USB | USB device and host functions |
| BB-1956 | `word_aligner_low_power` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-1957 | `reset_synchronizer_low_power` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-1958 | `branch_target_buffer_low_power` | CPU Frontend | Fetch, prediction and decode |
| BB-1959 | `csr_execution_unit_resource_shared` | CPU Execution | Execution units and scheduling |
| BB-1960 | `privilege_controller_low_power` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-1961 | `quadrature_timer_low_power` | SoC Peripherals | General-purpose peripherals |
| BB-1962 | `clipping_engine_resource_shared` | GPU Geometry | Geometry and raster setup |
| BB-1963 | `depth_test_unit_programmable` | GPU Pixel | Raster, texture and pixel operations |
| BB-1964 | `active_video_generator_programmable` | Video Timing | Display timing and frame transport |
| BB-1965 | `gamma_corrector_programmable` | Image Processing | Pixel and neighborhood operations |
| BB-1966 | `defective_pixel_correction_programmable` | Camera and ISP | Camera capture and image signal processing |
| BB-1967 | `spdif_transmitter_clock_crossing` | Audio Interfaces | Digital audio transport |
| BB-1968 | `audio_limiter_resource_shared` | Audio DSP | Audio processing and synthesis |
| BB-1969 | `batch_normalization_engine_multi_engine` | Machine Learning | Neural-network layers |
| BB-1970 | `attention_softmax_engine_multi_engine` | Transformer Acceleration | Attention and sequence models |
| BB-1971 | `scale_apply_engine_multi_engine` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-1972 | `forward_kinematics_engine_low_power` | Robotics | Motion, navigation and control |
| BB-1973 | `commutation_controller_low_power` | Motor and Power Control | Motor drives and power electronics |
| BB-1974 | `pulse_width_meter_low_power` | Sensors and DAQ | Acquisition and instrumentation |
| BB-1975 | `ethercat_slave_engine_low_power` | Industrial Protocols | Fieldbus and deterministic control |
| BB-1976 | `sha3_engine_resource_optimized` | Cryptography | Encryption, authentication and key services |
| BB-1977 | `lockstep_comparator_low_power` | Safety and Reliability | Fault detection and safe operation |
| BB-1978 | `performance_counter_formal_friendly` | Debug and Verification | On-chip debug and reusable verification |
| BB-1979 | `emmc_controller_low_power` | Storage | Flash, SD, NVMe and block storage |
| BB-1980 | `huffman_encoder_resource_shared` | Compression and Coding | Compression, decompression and channel coding |
| BB-1981 | `crest_factor_reducer_resource_shared` | RF and SDR | Digital radio front-end |
| BB-1982 | `pulse_compressor_resource_shared` | Radar and LiDAR | Ranging and detection pipelines |
| BB-1983 | `traction_control_assist_low_power` | Automotive | Vehicle-specific logic |
| BB-1984 | `triple_modular_voter_low_power` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-1985 | `secure_boot_sequencer_low_power` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-1986 | `graph_traversal_engine_resource_shared` | Scientific and Search | Domain accelerators |
| BB-1987 | `bitfield_insert_unit_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-1988 | `gray_code_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-1989 | `timeout_controller_single_shot` | Control | State machines and sequencers |
| BB-1990 | `carry_save_adder_combinational` | Integer Compute | Integer arithmetic |
| BB-1991 | `fixed_point_saturator_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-1992 | `floating_point_compare_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-1993 | `vector_pack_unpack_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-1994 | `matrix_accumulator_int8` | Tensor Compute | Matrix and tensor operations |
| BB-1995 | `inverse_square_root_engine_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-1996 | `checksum_accumulator_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-1997 | `hilbert_transform_filter_combinational` | DSP Filters | Digital filters |
| BB-1998 | `goertzel_detector_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-1999 | `fsk_demodulator_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-2000 | `preamble_correlator_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2001 | `block_ram_wrapper_single_clock` | Memory | RAM, ROM and register storage |
| BB-2002 | `reorder_buffer_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-2003 | `miss_status_table_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2004 | `memory_fill_engine_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-2005 | `axi_burst_splitter_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2006 | `axi_stream_combiner_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2007 | `ahb_slave_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2008 | `avalon_mm_master_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2009 | `round_robin_arbiter_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2010 | `spi_slave_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-2011 | `lin_schedule_table_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2012 | `ethernet_vlan_insert_combinational` | Ethernet MAC | Ethernet media access |
| BB-2013 | `udp_endpoint_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2014 | `pcie_bar_controller_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-2015 | `usb_bulk_transfer_single_shot` | USB | USB device and host functions |
| BB-2016 | `lane_bonding_controller_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2017 | `pulse_synchronizer_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2018 | `return_address_stack_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-2019 | `issue_queue_combinational` | CPU Execution | Execution units and scheduling |
| BB-2020 | `physical_memory_protection_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2021 | `rtc_controller_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-2022 | `viewport_transform_engine_combinational` | GPU Geometry | Geometry and raster setup |
| BB-2023 | `stencil_test_unit_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-2024 | `pixel_clock_enable_streaming` | Video Timing | Display timing and frame transport |
| BB-2025 | `sobel_filter_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-2026 | `lens_shading_correction_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-2027 | `spdif_receiver_controller` | Audio Interfaces | Digital audio transport |
| BB-2028 | `audio_noise_gate_combinational` | Audio DSP | Audio processing and synthesis |
| BB-2029 | `recurrent_cell_engine_int8` | Machine Learning | Neural-network layers |
| BB-2030 | `attention_value_engine_int8` | Transformer Acceleration | Attention and sequence models |
| BB-2031 | `sparse_index_decoder_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2032 | `odometry_integrator_single_shot` | Robotics | Motion, navigation and control |
| BB-2033 | `current_loop_controller_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-2034 | `frequency_meter_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2035 | `ethernet_ip_adapter_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2036 | `hmac_engine_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-2037 | `timeout_monitor_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-2038 | `assertion_monitor_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-2039 | `nvme_command_engine_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-2040 | `huffman_decoder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-2041 | `predistortion_engine_combinational` | RF and SDR | Digital radio front-end |
| BB-2042 | `chirp_generator_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2043 | `abs_timing_controller_single_shot` | Automotive | Vehicle-specific logic |
| BB-2044 | `radiation_event_counter_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2045 | `image_fallback_controller_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2046 | `packet_regex_engine_combinational` | Scientific and Search | Domain accelerators |
| BB-2047 | `bitfield_insert_unit_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-2048 | `gray_code_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-2049 | `timeout_controller_continuous` | Control | State machines and sequencers |
| BB-2050 | `carry_save_adder_single_cycle` | Integer Compute | Integer arithmetic |
| BB-2051 | `fixed_point_saturator_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2052 | `floating_point_compare_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-2053 | `vector_pack_unpack_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-2054 | `matrix_accumulator_int16` | Tensor Compute | Matrix and tensor operations |
| BB-2055 | `inverse_square_root_engine_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-2056 | `checksum_accumulator_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2057 | `hilbert_transform_filter_single_cycle` | DSP Filters | Digital filters |
| BB-2058 | `goertzel_detector_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-2059 | `fsk_demodulator_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-2060 | `preamble_correlator_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2061 | `block_ram_wrapper_dual_clock` | Memory | RAM, ROM and register storage |
| BB-2062 | `reorder_buffer_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-2063 | `miss_status_table_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2064 | `memory_fill_engine_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-2065 | `axi_burst_splitter_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2066 | `axi_stream_combiner_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2067 | `ahb_slave_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2068 | `avalon_mm_master_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2069 | `round_robin_arbiter_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2070 | `spi_slave_target` | UART SPI I2C | Low-speed serial protocols |
| BB-2071 | `lin_schedule_table_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2072 | `ethernet_vlan_insert_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-2073 | `udp_endpoint_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2074 | `pcie_bar_controller_target` | PCI Express | PCIe endpoints and transaction services |
| BB-2075 | `usb_bulk_transfer_continuous` | USB | USB device and host functions |
| BB-2076 | `lane_bonding_controller_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2077 | `pulse_synchronizer_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2078 | `return_address_stack_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-2079 | `issue_queue_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-2080 | `physical_memory_protection_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2081 | `rtc_controller_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-2082 | `viewport_transform_engine_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-2083 | `stencil_test_unit_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-2084 | `pixel_clock_enable_framebuffer` | Video Timing | Display timing and frame transport |
| BB-2085 | `sobel_filter_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-2086 | `lens_shading_correction_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-2087 | `spdif_receiver_target` | Audio Interfaces | Digital audio transport |
| BB-2088 | `audio_noise_gate_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-2089 | `recurrent_cell_engine_int16` | Machine Learning | Neural-network layers |
| BB-2090 | `attention_value_engine_int16` | Transformer Acceleration | Attention and sequence models |
| BB-2091 | `sparse_index_decoder_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2092 | `odometry_integrator_continuous` | Robotics | Motion, navigation and control |
| BB-2093 | `current_loop_controller_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-2094 | `frequency_meter_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2095 | `ethernet_ip_adapter_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2096 | `hmac_engine_streaming` | Cryptography | Encryption, authentication and key services |
| BB-2097 | `timeout_monitor_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-2098 | `assertion_monitor_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-2099 | `nvme_command_engine_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-2100 | `huffman_decoder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-2101 | `predistortion_engine_single_cycle` | RF and SDR | Digital radio front-end |
| BB-2102 | `chirp_generator_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2103 | `abs_timing_controller_continuous` | Automotive | Vehicle-specific logic |
| BB-2104 | `radiation_event_counter_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2105 | `image_fallback_controller_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2106 | `packet_regex_engine_single_cycle` | Scientific and Search | Domain accelerators |
| BB-2107 | `bitfield_insert_unit_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-2108 | `gray_code_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-2109 | `timeout_controller_programmable` | Control | State machines and sequencers |
| BB-2110 | `carry_save_adder_pipelined` | Integer Compute | Integer arithmetic |
| BB-2111 | `fixed_point_saturator_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2112 | `floating_point_compare_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-2113 | `vector_pack_unpack_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-2114 | `matrix_accumulator_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-2115 | `inverse_square_root_engine_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-2116 | `checksum_accumulator_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2117 | `hilbert_transform_filter_pipelined` | DSP Filters | Digital filters |
| BB-2118 | `goertzel_detector_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-2119 | `fsk_demodulator_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-2120 | `preamble_correlator_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2121 | `block_ram_wrapper_packet_aware` | Memory | RAM, ROM and register storage |
| BB-2122 | `reorder_buffer_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-2123 | `miss_status_table_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2124 | `memory_fill_engine_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-2125 | `axi_burst_splitter_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2126 | `axi_stream_combiner_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2127 | `ahb_slave_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2128 | `avalon_mm_master_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2129 | `round_robin_arbiter_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2130 | `spi_slave_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-2131 | `lin_schedule_table_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2132 | `ethernet_vlan_insert_pipelined` | Ethernet MAC | Ethernet media access |
| BB-2133 | `udp_endpoint_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2134 | `pcie_bar_controller_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-2135 | `usb_bulk_transfer_programmable` | USB | USB device and host functions |
| BB-2136 | `lane_bonding_controller_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2137 | `pulse_synchronizer_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2138 | `return_address_stack_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-2139 | `issue_queue_pipelined` | CPU Execution | Execution units and scheduling |
| BB-2140 | `physical_memory_protection_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2141 | `rtc_controller_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-2142 | `viewport_transform_engine_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-2143 | `stencil_test_unit_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-2144 | `pixel_clock_enable_line_buffered` | Video Timing | Display timing and frame transport |
| BB-2145 | `sobel_filter_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-2146 | `lens_shading_correction_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-2147 | `spdif_receiver_bridge` | Audio Interfaces | Digital audio transport |
| BB-2148 | `audio_noise_gate_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-2149 | `recurrent_cell_engine_bf16` | Machine Learning | Neural-network layers |
| BB-2150 | `attention_value_engine_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-2151 | `sparse_index_decoder_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2152 | `odometry_integrator_programmable` | Robotics | Motion, navigation and control |
| BB-2153 | `current_loop_controller_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-2154 | `frequency_meter_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2155 | `ethernet_ip_adapter_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2156 | `hmac_engine_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-2157 | `timeout_monitor_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-2158 | `assertion_monitor_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-2159 | `nvme_command_engine_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-2160 | `huffman_decoder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-2161 | `predistortion_engine_pipelined` | RF and SDR | Digital radio front-end |
| BB-2162 | `chirp_generator_pipelined` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2163 | `abs_timing_controller_programmable` | Automotive | Vehicle-specific logic |
| BB-2164 | `radiation_event_counter_programmable` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2165 | `image_fallback_controller_programmable` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2166 | `packet_regex_engine_pipelined` | Scientific and Search | Domain accelerators |
| BB-2167 | `bitfield_insert_unit_iterative` | Logic and Primitives | Boolean and bit manipulation |
| BB-2168 | `gray_code_counter_windowed` | Counters and Timing | Counters, timers and event measurement |
| BB-2169 | `timeout_controller_multi_channel` | Control | State machines and sequencers |
| BB-2170 | `carry_save_adder_iterative` | Integer Compute | Integer arithmetic |
| BB-2171 | `fixed_point_saturator_iterative` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2172 | `floating_point_compare_iterative` | Floating-Point Compute | Floating-point arithmetic |
| BB-2173 | `vector_pack_unpack_iterative` | Vector Compute | SIMD and vector datapaths |
| BB-2174 | `matrix_accumulator_sparse` | Tensor Compute | Matrix and tensor operations |
| BB-2175 | `inverse_square_root_engine_iterative` | Math Accelerators | Elementary and transcendental functions |
| BB-2176 | `checksum_accumulator_iterative` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2177 | `hilbert_transform_filter_iterative` | DSP Filters | Digital filters |
| BB-2178 | `goertzel_detector_iterative` | DSP Spectral | Spectral analysis and transforms |
| BB-2179 | `fsk_demodulator_iterative` | DSP Modulation | Modulation and waveform generation |
| BB-2180 | `preamble_correlator_multi_channel` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2181 | `block_ram_wrapper_ecc_protected` | Memory | RAM, ROM and register storage |
| BB-2182 | `reorder_buffer_ecc_protected` | Queues | FIFO, queue and buffering structures |
| BB-2183 | `miss_status_table_ecc_protected` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2184 | `memory_fill_engine_multi_channel` | DMA and Memory Services | Data movement and maintenance |
| BB-2185 | `axi_burst_splitter_monitor` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2186 | `axi_stream_combiner_monitor` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2187 | `ahb_slave_monitor` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2188 | `avalon_mm_master_monitor` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2189 | `round_robin_arbiter_multi_channel` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2190 | `spi_slave_monitor` | UART SPI I2C | Low-speed serial protocols |
| BB-2191 | `lin_schedule_table_multi_channel` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2192 | `ethernet_vlan_insert_iterative` | Ethernet MAC | Ethernet media access |
| BB-2193 | `udp_endpoint_multi_channel` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2194 | `pcie_bar_controller_monitor` | PCI Express | PCIe endpoints and transaction services |
| BB-2195 | `usb_bulk_transfer_multi_channel` | USB | USB device and host functions |
| BB-2196 | `lane_bonding_controller_multi_channel` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2197 | `pulse_synchronizer_multi_channel` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2198 | `return_address_stack_multi_channel` | CPU Frontend | Fetch, prediction and decode |
| BB-2199 | `issue_queue_iterative` | CPU Execution | Execution units and scheduling |
| BB-2200 | `physical_memory_protection_multi_channel` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2201 | `rtc_controller_multi_channel` | SoC Peripherals | General-purpose peripherals |
| BB-2202 | `viewport_transform_engine_iterative` | GPU Geometry | Geometry and raster setup |
| BB-2203 | `stencil_test_unit_multi_plane` | GPU Pixel | Raster, texture and pixel operations |
| BB-2204 | `pixel_clock_enable_multi_plane` | Video Timing | Display timing and frame transport |
| BB-2205 | `sobel_filter_multi_plane` | Image Processing | Pixel and neighborhood operations |
| BB-2206 | `lens_shading_correction_multi_plane` | Camera and ISP | Camera capture and image signal processing |
| BB-2207 | `spdif_receiver_monitor` | Audio Interfaces | Digital audio transport |
| BB-2208 | `audio_noise_gate_iterative` | Audio DSP | Audio processing and synthesis |
| BB-2209 | `recurrent_cell_engine_sparse` | Machine Learning | Neural-network layers |
| BB-2210 | `attention_value_engine_sparse` | Transformer Acceleration | Attention and sequence models |
| BB-2211 | `sparse_index_decoder_sparse` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2212 | `odometry_integrator_multi_channel` | Robotics | Motion, navigation and control |
| BB-2213 | `current_loop_controller_multi_channel` | Motor and Power Control | Motor drives and power electronics |
| BB-2214 | `frequency_meter_multi_channel` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2215 | `ethernet_ip_adapter_multi_channel` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2216 | `hmac_engine_multi_context` | Cryptography | Encryption, authentication and key services |
| BB-2217 | `timeout_monitor_multi_channel` | Safety and Reliability | Fault detection and safe operation |
| BB-2218 | `assertion_monitor_coverage_driven` | Debug and Verification | On-chip debug and reusable verification |
| BB-2219 | `nvme_command_engine_multi_channel` | Storage | Flash, SD, NVMe and block storage |
| BB-2220 | `huffman_decoder_iterative` | Compression and Coding | Compression, decompression and channel coding |
| BB-2221 | `predistortion_engine_iterative` | RF and SDR | Digital radio front-end |
| BB-2222 | `chirp_generator_iterative` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2223 | `abs_timing_controller_multi_channel` | Automotive | Vehicle-specific logic |
| BB-2224 | `radiation_event_counter_multi_channel` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2225 | `image_fallback_controller_multi_channel` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2226 | `packet_regex_engine_iterative` | Scientific and Search | Domain accelerators |
| BB-2227 | `bitfield_insert_unit_streaming` | Logic and Primitives | Boolean and bit manipulation |
| BB-2228 | `gray_code_counter_timestamped` | Counters and Timing | Counters, timers and event measurement |
| BB-2229 | `timeout_controller_fault_tolerant` | Control | State machines and sequencers |
| BB-2230 | `carry_save_adder_streaming` | Integer Compute | Integer arithmetic |
| BB-2231 | `fixed_point_saturator_streaming` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2232 | `floating_point_compare_streaming` | Floating-Point Compute | Floating-point arithmetic |
| BB-2233 | `vector_pack_unpack_streaming` | Vector Compute | SIMD and vector datapaths |
| BB-2234 | `matrix_accumulator_pipelined` | Tensor Compute | Matrix and tensor operations |
| BB-2235 | `inverse_square_root_engine_streaming` | Math Accelerators | Elementary and transcendental functions |
| BB-2236 | `checksum_accumulator_streaming` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2237 | `hilbert_transform_filter_streaming` | DSP Filters | Digital filters |
| BB-2238 | `goertzel_detector_streaming` | DSP Spectral | Spectral analysis and transforms |
| BB-2239 | `fsk_demodulator_streaming` | DSP Modulation | Modulation and waveform generation |
| BB-2240 | `preamble_correlator_fault_tolerant` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2241 | `block_ram_wrapper_multi_queue` | Memory | RAM, ROM and register storage |
| BB-2242 | `reorder_buffer_multi_queue` | Queues | FIFO, queue and buffering structures |
| BB-2243 | `miss_status_table_multi_queue` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2244 | `memory_fill_engine_fault_tolerant` | DMA and Memory Services | Data movement and maintenance |
| BB-2245 | `axi_burst_splitter_width_adapted` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2246 | `axi_stream_combiner_width_adapted` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2247 | `ahb_slave_width_adapted` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2248 | `avalon_mm_master_width_adapted` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2249 | `round_robin_arbiter_fault_tolerant` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2250 | `spi_slave_width_adapted` | UART SPI I2C | Low-speed serial protocols |
| BB-2251 | `lin_schedule_table_fault_tolerant` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2252 | `ethernet_vlan_insert_streaming` | Ethernet MAC | Ethernet media access |
| BB-2253 | `udp_endpoint_fault_tolerant` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2254 | `pcie_bar_controller_width_adapted` | PCI Express | PCIe endpoints and transaction services |
| BB-2255 | `usb_bulk_transfer_fault_tolerant` | USB | USB device and host functions |
| BB-2256 | `lane_bonding_controller_fault_tolerant` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2257 | `pulse_synchronizer_fault_tolerant` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2258 | `return_address_stack_fault_tolerant` | CPU Frontend | Fetch, prediction and decode |
| BB-2259 | `issue_queue_streaming` | CPU Execution | Execution units and scheduling |
| BB-2260 | `physical_memory_protection_fault_tolerant` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2261 | `rtc_controller_fault_tolerant` | SoC Peripherals | General-purpose peripherals |
| BB-2262 | `viewport_transform_engine_streaming` | GPU Geometry | Geometry and raster setup |
| BB-2263 | `stencil_test_unit_low_latency` | GPU Pixel | Raster, texture and pixel operations |
| BB-2264 | `pixel_clock_enable_low_latency` | Video Timing | Display timing and frame transport |
| BB-2265 | `sobel_filter_low_latency` | Image Processing | Pixel and neighborhood operations |
| BB-2266 | `lens_shading_correction_low_latency` | Camera and ISP | Camera capture and image signal processing |
| BB-2267 | `spdif_receiver_width_adapted` | Audio Interfaces | Digital audio transport |
| BB-2268 | `audio_noise_gate_streaming` | Audio DSP | Audio processing and synthesis |
| BB-2269 | `recurrent_cell_engine_pipelined` | Machine Learning | Neural-network layers |
| BB-2270 | `attention_value_engine_pipelined` | Transformer Acceleration | Attention and sequence models |
| BB-2271 | `sparse_index_decoder_pipelined` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2272 | `odometry_integrator_fault_tolerant` | Robotics | Motion, navigation and control |
| BB-2273 | `current_loop_controller_fault_tolerant` | Motor and Power Control | Motor drives and power electronics |
| BB-2274 | `frequency_meter_fault_tolerant` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2275 | `ethernet_ip_adapter_fault_tolerant` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2276 | `hmac_engine_fault_detecting` | Cryptography | Encryption, authentication and key services |
| BB-2277 | `timeout_monitor_fault_tolerant` | Safety and Reliability | Fault detection and safe operation |
| BB-2278 | `assertion_monitor_scoreboard_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-2279 | `nvme_command_engine_fault_tolerant` | Storage | Flash, SD, NVMe and block storage |
| BB-2280 | `huffman_decoder_streaming` | Compression and Coding | Compression, decompression and channel coding |
| BB-2281 | `predistortion_engine_streaming` | RF and SDR | Digital radio front-end |
| BB-2282 | `chirp_generator_streaming` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2283 | `abs_timing_controller_fault_tolerant` | Automotive | Vehicle-specific logic |
| BB-2284 | `radiation_event_counter_fault_tolerant` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2285 | `image_fallback_controller_fault_tolerant` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2286 | `packet_regex_engine_streaming` | Scientific and Search | Domain accelerators |
| BB-2287 | `bitfield_insert_unit_resource_shared` | Logic and Primitives | Boolean and bit manipulation |
| BB-2288 | `gray_code_counter_multi_channel` | Counters and Timing | Counters, timers and event measurement |
| BB-2289 | `timeout_controller_low_power` | Control | State machines and sequencers |
| BB-2290 | `carry_save_adder_resource_shared` | Integer Compute | Integer arithmetic |
| BB-2291 | `fixed_point_saturator_resource_shared` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2292 | `floating_point_compare_resource_shared` | Floating-Point Compute | Floating-point arithmetic |
| BB-2293 | `vector_pack_unpack_resource_shared` | Vector Compute | SIMD and vector datapaths |
| BB-2294 | `matrix_accumulator_multi_engine` | Tensor Compute | Matrix and tensor operations |
| BB-2295 | `inverse_square_root_engine_resource_shared` | Math Accelerators | Elementary and transcendental functions |
| BB-2296 | `checksum_accumulator_resource_shared` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2297 | `hilbert_transform_filter_resource_shared` | DSP Filters | Digital filters |
| BB-2298 | `goertzel_detector_resource_shared` | DSP Spectral | Spectral analysis and transforms |
| BB-2299 | `fsk_demodulator_resource_shared` | DSP Modulation | Modulation and waveform generation |
| BB-2300 | `preamble_correlator_low_power` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2301 | `block_ram_wrapper_low_latency` | Memory | RAM, ROM and register storage |
| BB-2302 | `reorder_buffer_low_latency` | Queues | FIFO, queue and buffering structures |
| BB-2303 | `miss_status_table_low_latency` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2304 | `memory_fill_engine_low_power` | DMA and Memory Services | Data movement and maintenance |
| BB-2305 | `axi_burst_splitter_clock_crossing` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2306 | `axi_stream_combiner_clock_crossing` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2307 | `ahb_slave_clock_crossing` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2308 | `avalon_mm_master_clock_crossing` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2309 | `round_robin_arbiter_low_power` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2310 | `spi_slave_clock_crossing` | UART SPI I2C | Low-speed serial protocols |
| BB-2311 | `lin_schedule_table_low_power` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2312 | `ethernet_vlan_insert_resource_shared` | Ethernet MAC | Ethernet media access |
| BB-2313 | `udp_endpoint_low_power` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2314 | `pcie_bar_controller_clock_crossing` | PCI Express | PCIe endpoints and transaction services |
| BB-2315 | `usb_bulk_transfer_low_power` | USB | USB device and host functions |
| BB-2316 | `lane_bonding_controller_low_power` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2317 | `pulse_synchronizer_low_power` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2318 | `return_address_stack_low_power` | CPU Frontend | Fetch, prediction and decode |
| BB-2319 | `issue_queue_resource_shared` | CPU Execution | Execution units and scheduling |
| BB-2320 | `physical_memory_protection_low_power` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2321 | `rtc_controller_low_power` | SoC Peripherals | General-purpose peripherals |
| BB-2322 | `viewport_transform_engine_resource_shared` | GPU Geometry | Geometry and raster setup |
| BB-2323 | `stencil_test_unit_programmable` | GPU Pixel | Raster, texture and pixel operations |
| BB-2324 | `pixel_clock_enable_programmable` | Video Timing | Display timing and frame transport |
| BB-2325 | `sobel_filter_programmable` | Image Processing | Pixel and neighborhood operations |
| BB-2326 | `lens_shading_correction_programmable` | Camera and ISP | Camera capture and image signal processing |
| BB-2327 | `spdif_receiver_clock_crossing` | Audio Interfaces | Digital audio transport |
| BB-2328 | `audio_noise_gate_resource_shared` | Audio DSP | Audio processing and synthesis |
| BB-2329 | `recurrent_cell_engine_multi_engine` | Machine Learning | Neural-network layers |
| BB-2330 | `attention_value_engine_multi_engine` | Transformer Acceleration | Attention and sequence models |
| BB-2331 | `sparse_index_decoder_multi_engine` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2332 | `odometry_integrator_low_power` | Robotics | Motion, navigation and control |
| BB-2333 | `current_loop_controller_low_power` | Motor and Power Control | Motor drives and power electronics |
| BB-2334 | `frequency_meter_low_power` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2335 | `ethernet_ip_adapter_low_power` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2336 | `hmac_engine_resource_optimized` | Cryptography | Encryption, authentication and key services |
| BB-2337 | `timeout_monitor_low_power` | Safety and Reliability | Fault detection and safe operation |
| BB-2338 | `assertion_monitor_formal_friendly` | Debug and Verification | On-chip debug and reusable verification |
| BB-2339 | `nvme_command_engine_low_power` | Storage | Flash, SD, NVMe and block storage |
| BB-2340 | `huffman_decoder_resource_shared` | Compression and Coding | Compression, decompression and channel coding |
| BB-2341 | `predistortion_engine_resource_shared` | RF and SDR | Digital radio front-end |
| BB-2342 | `chirp_generator_resource_shared` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2343 | `abs_timing_controller_low_power` | Automotive | Vehicle-specific logic |
| BB-2344 | `radiation_event_counter_low_power` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2345 | `image_fallback_controller_low_power` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2346 | `packet_regex_engine_resource_shared` | Scientific and Search | Domain accelerators |
| BB-2347 | `onehot_encoder_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-2348 | `johnson_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-2349 | `startup_sequencer_single_shot` | Control | State machines and sequencers |
| BB-2350 | `carry_lookahead_adder_combinational` | Integer Compute | Integer arithmetic |
| BB-2351 | `fixed_point_normalizer_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2352 | `floating_point_convert_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-2353 | `vector_reduce_sum_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-2354 | `matrix_reduction_engine_int8` | Tensor Compute | Matrix and tensor operations |
| BB-2355 | `arctangent_engine_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-2356 | `rolling_hash_engine_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2357 | `median_filter_combinational` | DSP Filters | Digital filters |
| BB-2358 | `spectral_power_estimator_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-2359 | `ofdm_modulator_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-2360 | `matched_filter_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2361 | `ultra_ram_wrapper_single_clock` | Memory | RAM, ROM and register storage |
| BB-2362 | `elastic_buffer_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-2363 | `translation_lookaside_buffer_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2364 | `memory_scrubber_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-2365 | `axi_burst_combiner_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2366 | `axi_stream_subset_converter_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2367 | `ahb_lite_master_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2368 | `avalon_mm_slave_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2369 | `weighted_arbiter_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2370 | `spi_flash_controller_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-2371 | `rs485_transceiver_controller_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2372 | `ethernet_vlan_strip_combinational` | Ethernet MAC | Ethernet media access |
| BB-2373 | `icmp_endpoint_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2374 | `pcie_msix_controller_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-2375 | `usb_interrupt_transfer_single_shot` | USB | USB device and host functions |
| BB-2376 | `elastic_store_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2377 | `level_synchronizer_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2378 | `instruction_decoder_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-2379 | `reservation_station_combinational` | CPU Execution | Execution units and scheduling |
| BB-2380 | `debug_module_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2381 | `interrupt_router_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-2382 | `edge_equation_engine_combinational` | GPU Geometry | Geometry and raster setup |
| BB-2383 | `alpha_blend_unit_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-2384 | `frame_counter_streaming` | Video Timing | Display timing and frame transport |
| BB-2385 | `laplacian_filter_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-2386 | `demosaic_engine_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-2387 | `pdm_decimator_controller` | Audio Interfaces | Digital audio transport |
| BB-2388 | `audio_echo_canceller_combinational` | Audio DSP | Audio processing and synthesis |
| BB-2389 | `lstm_cell_engine_int8` | Machine Learning | Neural-network layers |
| BB-2390 | `multi_head_attention_engine_int8` | Transformer Acceleration | Attention and sequence models |
| BB-2391 | `zero_skip_controller_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2392 | `sensor_fusion_engine_single_shot` | Robotics | Motion, navigation and control |
| BB-2393 | `speed_loop_controller_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-2394 | `quadrature_decoder_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2395 | `bacnet_mstp_engine_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2396 | `rsa_modexp_engine_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-2397 | `safe_state_controller_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-2398 | `bus_functional_model_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-2399 | `block_device_dma_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-2400 | `delta_encoder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-2401 | `beamforming_engine_combinational` | RF and SDR | Digital radio front-end |
| BB-2402 | `time_of_flight_counter_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2403 | `automotive_gateway_single_shot` | Automotive | Vehicle-specific logic |
| BB-2404 | `command_telemetry_framer_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2405 | `device_identity_block_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2406 | `genomic_kmer_counter_combinational` | Scientific and Search | Domain accelerators |
| BB-2407 | `onehot_encoder_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-2408 | `johnson_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-2409 | `startup_sequencer_continuous` | Control | State machines and sequencers |
| BB-2410 | `carry_lookahead_adder_single_cycle` | Integer Compute | Integer arithmetic |
| BB-2411 | `fixed_point_normalizer_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2412 | `floating_point_convert_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-2413 | `vector_reduce_sum_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-2414 | `matrix_reduction_engine_int16` | Tensor Compute | Matrix and tensor operations |
| BB-2415 | `arctangent_engine_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-2416 | `rolling_hash_engine_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2417 | `median_filter_single_cycle` | DSP Filters | Digital filters |
| BB-2418 | `spectral_power_estimator_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-2419 | `ofdm_modulator_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-2420 | `matched_filter_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2421 | `ultra_ram_wrapper_dual_clock` | Memory | RAM, ROM and register storage |
| BB-2422 | `elastic_buffer_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-2423 | `translation_lookaside_buffer_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2424 | `memory_scrubber_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-2425 | `axi_burst_combiner_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2426 | `axi_stream_subset_converter_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2427 | `ahb_lite_master_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2428 | `avalon_mm_slave_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2429 | `weighted_arbiter_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2430 | `spi_flash_controller_target` | UART SPI I2C | Low-speed serial protocols |
| BB-2431 | `rs485_transceiver_controller_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2432 | `ethernet_vlan_strip_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-2433 | `icmp_endpoint_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2434 | `pcie_msix_controller_target` | PCI Express | PCIe endpoints and transaction services |
| BB-2435 | `usb_interrupt_transfer_continuous` | USB | USB device and host functions |
| BB-2436 | `elastic_store_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2437 | `level_synchronizer_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2438 | `instruction_decoder_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-2439 | `reservation_station_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-2440 | `debug_module_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2441 | `interrupt_router_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-2442 | `edge_equation_engine_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-2443 | `alpha_blend_unit_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-2444 | `frame_counter_framebuffer` | Video Timing | Display timing and frame transport |
| BB-2445 | `laplacian_filter_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-2446 | `demosaic_engine_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-2447 | `pdm_decimator_target` | Audio Interfaces | Digital audio transport |
| BB-2448 | `audio_echo_canceller_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-2449 | `lstm_cell_engine_int16` | Machine Learning | Neural-network layers |
| BB-2450 | `multi_head_attention_engine_int16` | Transformer Acceleration | Attention and sequence models |
| BB-2451 | `zero_skip_controller_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2452 | `sensor_fusion_engine_continuous` | Robotics | Motion, navigation and control |
| BB-2453 | `speed_loop_controller_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-2454 | `quadrature_decoder_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2455 | `bacnet_mstp_engine_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2456 | `rsa_modexp_engine_streaming` | Cryptography | Encryption, authentication and key services |
| BB-2457 | `safe_state_controller_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-2458 | `bus_functional_model_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-2459 | `block_device_dma_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-2460 | `delta_encoder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-2461 | `beamforming_engine_single_cycle` | RF and SDR | Digital radio front-end |
| BB-2462 | `time_of_flight_counter_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2463 | `automotive_gateway_continuous` | Automotive | Vehicle-specific logic |
| BB-2464 | `command_telemetry_framer_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2465 | `device_identity_block_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2466 | `genomic_kmer_counter_single_cycle` | Scientific and Search | Domain accelerators |
| BB-2467 | `onehot_encoder_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-2468 | `johnson_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-2469 | `startup_sequencer_programmable` | Control | State machines and sequencers |
| BB-2470 | `carry_lookahead_adder_pipelined` | Integer Compute | Integer arithmetic |
| BB-2471 | `fixed_point_normalizer_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2472 | `floating_point_convert_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-2473 | `vector_reduce_sum_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-2474 | `matrix_reduction_engine_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-2475 | `arctangent_engine_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-2476 | `rolling_hash_engine_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2477 | `median_filter_pipelined` | DSP Filters | Digital filters |
| BB-2478 | `spectral_power_estimator_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-2479 | `ofdm_modulator_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-2480 | `matched_filter_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2481 | `ultra_ram_wrapper_packet_aware` | Memory | RAM, ROM and register storage |
| BB-2482 | `elastic_buffer_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-2483 | `translation_lookaside_buffer_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2484 | `memory_scrubber_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-2485 | `axi_burst_combiner_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2486 | `axi_stream_subset_converter_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2487 | `ahb_lite_master_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2488 | `avalon_mm_slave_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2489 | `weighted_arbiter_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2490 | `spi_flash_controller_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-2491 | `rs485_transceiver_controller_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2492 | `ethernet_vlan_strip_pipelined` | Ethernet MAC | Ethernet media access |
| BB-2493 | `icmp_endpoint_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2494 | `pcie_msix_controller_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-2495 | `usb_interrupt_transfer_programmable` | USB | USB device and host functions |
| BB-2496 | `elastic_store_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2497 | `level_synchronizer_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2498 | `instruction_decoder_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-2499 | `reservation_station_pipelined` | CPU Execution | Execution units and scheduling |
| BB-2500 | `debug_module_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2501 | `interrupt_router_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-2502 | `edge_equation_engine_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-2503 | `alpha_blend_unit_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-2504 | `frame_counter_line_buffered` | Video Timing | Display timing and frame transport |
| BB-2505 | `laplacian_filter_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-2506 | `demosaic_engine_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-2507 | `pdm_decimator_bridge` | Audio Interfaces | Digital audio transport |
| BB-2508 | `audio_echo_canceller_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-2509 | `lstm_cell_engine_bf16` | Machine Learning | Neural-network layers |
| BB-2510 | `multi_head_attention_engine_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-2511 | `zero_skip_controller_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2512 | `sensor_fusion_engine_programmable` | Robotics | Motion, navigation and control |
| BB-2513 | `speed_loop_controller_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-2514 | `quadrature_decoder_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2515 | `bacnet_mstp_engine_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2516 | `rsa_modexp_engine_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-2517 | `safe_state_controller_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-2518 | `bus_functional_model_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-2519 | `block_device_dma_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-2520 | `delta_encoder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-2521 | `beamforming_engine_pipelined` | RF and SDR | Digital radio front-end |
| BB-2522 | `time_of_flight_counter_pipelined` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2523 | `automotive_gateway_programmable` | Automotive | Vehicle-specific logic |
| BB-2524 | `command_telemetry_framer_programmable` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2525 | `device_identity_block_programmable` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2526 | `genomic_kmer_counter_pipelined` | Scientific and Search | Domain accelerators |
| BB-2527 | `onehot_encoder_iterative` | Logic and Primitives | Boolean and bit manipulation |
| BB-2528 | `johnson_counter_windowed` | Counters and Timing | Counters, timers and event measurement |
| BB-2529 | `startup_sequencer_multi_channel` | Control | State machines and sequencers |
| BB-2530 | `carry_lookahead_adder_iterative` | Integer Compute | Integer arithmetic |
| BB-2531 | `fixed_point_normalizer_iterative` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2532 | `floating_point_convert_iterative` | Floating-Point Compute | Floating-point arithmetic |
| BB-2533 | `vector_reduce_sum_iterative` | Vector Compute | SIMD and vector datapaths |
| BB-2534 | `matrix_reduction_engine_sparse` | Tensor Compute | Matrix and tensor operations |
| BB-2535 | `arctangent_engine_iterative` | Math Accelerators | Elementary and transcendental functions |
| BB-2536 | `rolling_hash_engine_iterative` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2537 | `median_filter_iterative` | DSP Filters | Digital filters |
| BB-2538 | `spectral_power_estimator_iterative` | DSP Spectral | Spectral analysis and transforms |
| BB-2539 | `ofdm_modulator_iterative` | DSP Modulation | Modulation and waveform generation |
| BB-2540 | `matched_filter_multi_channel` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2541 | `ultra_ram_wrapper_ecc_protected` | Memory | RAM, ROM and register storage |
| BB-2542 | `elastic_buffer_ecc_protected` | Queues | FIFO, queue and buffering structures |
| BB-2543 | `translation_lookaside_buffer_ecc_protected` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2544 | `memory_scrubber_multi_channel` | DMA and Memory Services | Data movement and maintenance |
| BB-2545 | `axi_burst_combiner_monitor` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2546 | `axi_stream_subset_converter_monitor` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2547 | `ahb_lite_master_monitor` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2548 | `avalon_mm_slave_monitor` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2549 | `weighted_arbiter_multi_channel` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2550 | `spi_flash_controller_monitor` | UART SPI I2C | Low-speed serial protocols |
| BB-2551 | `rs485_transceiver_controller_multi_channel` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2552 | `ethernet_vlan_strip_iterative` | Ethernet MAC | Ethernet media access |
| BB-2553 | `icmp_endpoint_multi_channel` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2554 | `pcie_msix_controller_monitor` | PCI Express | PCIe endpoints and transaction services |
| BB-2555 | `usb_interrupt_transfer_multi_channel` | USB | USB device and host functions |
| BB-2556 | `elastic_store_multi_channel` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2557 | `level_synchronizer_multi_channel` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2558 | `instruction_decoder_multi_channel` | CPU Frontend | Fetch, prediction and decode |
| BB-2559 | `reservation_station_iterative` | CPU Execution | Execution units and scheduling |
| BB-2560 | `debug_module_multi_channel` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2561 | `interrupt_router_multi_channel` | SoC Peripherals | General-purpose peripherals |
| BB-2562 | `edge_equation_engine_iterative` | GPU Geometry | Geometry and raster setup |
| BB-2563 | `alpha_blend_unit_multi_plane` | GPU Pixel | Raster, texture and pixel operations |
| BB-2564 | `frame_counter_multi_plane` | Video Timing | Display timing and frame transport |
| BB-2565 | `laplacian_filter_multi_plane` | Image Processing | Pixel and neighborhood operations |
| BB-2566 | `demosaic_engine_multi_plane` | Camera and ISP | Camera capture and image signal processing |
| BB-2567 | `pdm_decimator_monitor` | Audio Interfaces | Digital audio transport |
| BB-2568 | `audio_echo_canceller_iterative` | Audio DSP | Audio processing and synthesis |
| BB-2569 | `lstm_cell_engine_sparse` | Machine Learning | Neural-network layers |
| BB-2570 | `multi_head_attention_engine_sparse` | Transformer Acceleration | Attention and sequence models |
| BB-2571 | `zero_skip_controller_sparse` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2572 | `sensor_fusion_engine_multi_channel` | Robotics | Motion, navigation and control |
| BB-2573 | `speed_loop_controller_multi_channel` | Motor and Power Control | Motor drives and power electronics |
| BB-2574 | `quadrature_decoder_multi_channel` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2575 | `bacnet_mstp_engine_multi_channel` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2576 | `rsa_modexp_engine_multi_context` | Cryptography | Encryption, authentication and key services |
| BB-2577 | `safe_state_controller_multi_channel` | Safety and Reliability | Fault detection and safe operation |
| BB-2578 | `bus_functional_model_coverage_driven` | Debug and Verification | On-chip debug and reusable verification |
| BB-2579 | `block_device_dma_multi_channel` | Storage | Flash, SD, NVMe and block storage |
| BB-2580 | `delta_encoder_iterative` | Compression and Coding | Compression, decompression and channel coding |
| BB-2581 | `beamforming_engine_iterative` | RF and SDR | Digital radio front-end |
| BB-2582 | `time_of_flight_counter_iterative` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2583 | `automotive_gateway_multi_channel` | Automotive | Vehicle-specific logic |
| BB-2584 | `command_telemetry_framer_multi_channel` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2585 | `device_identity_block_multi_channel` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2586 | `genomic_kmer_counter_iterative` | Scientific and Search | Domain accelerators |
| BB-2587 | `onehot_encoder_streaming` | Logic and Primitives | Boolean and bit manipulation |
| BB-2588 | `johnson_counter_timestamped` | Counters and Timing | Counters, timers and event measurement |
| BB-2589 | `startup_sequencer_fault_tolerant` | Control | State machines and sequencers |
| BB-2590 | `carry_lookahead_adder_streaming` | Integer Compute | Integer arithmetic |
| BB-2591 | `fixed_point_normalizer_streaming` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2592 | `floating_point_convert_streaming` | Floating-Point Compute | Floating-point arithmetic |
| BB-2593 | `vector_reduce_sum_streaming` | Vector Compute | SIMD and vector datapaths |
| BB-2594 | `matrix_reduction_engine_pipelined` | Tensor Compute | Matrix and tensor operations |
| BB-2595 | `arctangent_engine_streaming` | Math Accelerators | Elementary and transcendental functions |
| BB-2596 | `rolling_hash_engine_streaming` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2597 | `median_filter_streaming` | DSP Filters | Digital filters |
| BB-2598 | `spectral_power_estimator_streaming` | DSP Spectral | Spectral analysis and transforms |
| BB-2599 | `ofdm_modulator_streaming` | DSP Modulation | Modulation and waveform generation |
| BB-2600 | `matched_filter_fault_tolerant` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2601 | `ultra_ram_wrapper_multi_queue` | Memory | RAM, ROM and register storage |
| BB-2602 | `elastic_buffer_multi_queue` | Queues | FIFO, queue and buffering structures |
| BB-2603 | `translation_lookaside_buffer_multi_queue` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2604 | `memory_scrubber_fault_tolerant` | DMA and Memory Services | Data movement and maintenance |
| BB-2605 | `axi_burst_combiner_width_adapted` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2606 | `axi_stream_subset_converter_width_adapted` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2607 | `ahb_lite_master_width_adapted` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2608 | `avalon_mm_slave_width_adapted` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2609 | `weighted_arbiter_fault_tolerant` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2610 | `spi_flash_controller_width_adapted` | UART SPI I2C | Low-speed serial protocols |
| BB-2611 | `rs485_transceiver_controller_fault_tolerant` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2612 | `ethernet_vlan_strip_streaming` | Ethernet MAC | Ethernet media access |
| BB-2613 | `icmp_endpoint_fault_tolerant` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2614 | `pcie_msix_controller_width_adapted` | PCI Express | PCIe endpoints and transaction services |
| BB-2615 | `usb_interrupt_transfer_fault_tolerant` | USB | USB device and host functions |
| BB-2616 | `elastic_store_fault_tolerant` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2617 | `level_synchronizer_fault_tolerant` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2618 | `instruction_decoder_fault_tolerant` | CPU Frontend | Fetch, prediction and decode |
| BB-2619 | `reservation_station_streaming` | CPU Execution | Execution units and scheduling |
| BB-2620 | `debug_module_fault_tolerant` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2621 | `interrupt_router_fault_tolerant` | SoC Peripherals | General-purpose peripherals |
| BB-2622 | `edge_equation_engine_streaming` | GPU Geometry | Geometry and raster setup |
| BB-2623 | `alpha_blend_unit_low_latency` | GPU Pixel | Raster, texture and pixel operations |
| BB-2624 | `frame_counter_low_latency` | Video Timing | Display timing and frame transport |
| BB-2625 | `laplacian_filter_low_latency` | Image Processing | Pixel and neighborhood operations |
| BB-2626 | `demosaic_engine_low_latency` | Camera and ISP | Camera capture and image signal processing |
| BB-2627 | `pdm_decimator_width_adapted` | Audio Interfaces | Digital audio transport |
| BB-2628 | `audio_echo_canceller_streaming` | Audio DSP | Audio processing and synthesis |
| BB-2629 | `lstm_cell_engine_pipelined` | Machine Learning | Neural-network layers |
| BB-2630 | `multi_head_attention_engine_pipelined` | Transformer Acceleration | Attention and sequence models |
| BB-2631 | `zero_skip_controller_pipelined` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2632 | `sensor_fusion_engine_fault_tolerant` | Robotics | Motion, navigation and control |
| BB-2633 | `speed_loop_controller_fault_tolerant` | Motor and Power Control | Motor drives and power electronics |
| BB-2634 | `quadrature_decoder_fault_tolerant` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2635 | `bacnet_mstp_engine_fault_tolerant` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2636 | `rsa_modexp_engine_fault_detecting` | Cryptography | Encryption, authentication and key services |
| BB-2637 | `safe_state_controller_fault_tolerant` | Safety and Reliability | Fault detection and safe operation |
| BB-2638 | `bus_functional_model_scoreboard_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-2639 | `block_device_dma_fault_tolerant` | Storage | Flash, SD, NVMe and block storage |
| BB-2640 | `delta_encoder_streaming` | Compression and Coding | Compression, decompression and channel coding |
| BB-2641 | `beamforming_engine_streaming` | RF and SDR | Digital radio front-end |
| BB-2642 | `time_of_flight_counter_streaming` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2643 | `automotive_gateway_fault_tolerant` | Automotive | Vehicle-specific logic |
| BB-2644 | `command_telemetry_framer_fault_tolerant` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2645 | `device_identity_block_fault_tolerant` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2646 | `genomic_kmer_counter_streaming` | Scientific and Search | Domain accelerators |
| BB-2647 | `onehot_encoder_resource_shared` | Logic and Primitives | Boolean and bit manipulation |
| BB-2648 | `johnson_counter_multi_channel` | Counters and Timing | Counters, timers and event measurement |
| BB-2649 | `startup_sequencer_low_power` | Control | State machines and sequencers |
| BB-2650 | `carry_lookahead_adder_resource_shared` | Integer Compute | Integer arithmetic |
| BB-2651 | `fixed_point_normalizer_resource_shared` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2652 | `floating_point_convert_resource_shared` | Floating-Point Compute | Floating-point arithmetic |
| BB-2653 | `vector_reduce_sum_resource_shared` | Vector Compute | SIMD and vector datapaths |
| BB-2654 | `matrix_reduction_engine_multi_engine` | Tensor Compute | Matrix and tensor operations |
| BB-2655 | `arctangent_engine_resource_shared` | Math Accelerators | Elementary and transcendental functions |
| BB-2656 | `rolling_hash_engine_resource_shared` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2657 | `median_filter_resource_shared` | DSP Filters | Digital filters |
| BB-2658 | `spectral_power_estimator_resource_shared` | DSP Spectral | Spectral analysis and transforms |
| BB-2659 | `ofdm_modulator_resource_shared` | DSP Modulation | Modulation and waveform generation |
| BB-2660 | `matched_filter_low_power` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2661 | `ultra_ram_wrapper_low_latency` | Memory | RAM, ROM and register storage |
| BB-2662 | `elastic_buffer_low_latency` | Queues | FIFO, queue and buffering structures |
| BB-2663 | `translation_lookaside_buffer_low_latency` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2664 | `memory_scrubber_low_power` | DMA and Memory Services | Data movement and maintenance |
| BB-2665 | `axi_burst_combiner_clock_crossing` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2666 | `axi_stream_subset_converter_clock_crossing` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2667 | `ahb_lite_master_clock_crossing` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2668 | `avalon_mm_slave_clock_crossing` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2669 | `weighted_arbiter_low_power` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2670 | `spi_flash_controller_clock_crossing` | UART SPI I2C | Low-speed serial protocols |
| BB-2671 | `rs485_transceiver_controller_low_power` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2672 | `ethernet_vlan_strip_resource_shared` | Ethernet MAC | Ethernet media access |
| BB-2673 | `icmp_endpoint_low_power` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2674 | `pcie_msix_controller_clock_crossing` | PCI Express | PCIe endpoints and transaction services |
| BB-2675 | `usb_interrupt_transfer_low_power` | USB | USB device and host functions |
| BB-2676 | `elastic_store_low_power` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2677 | `level_synchronizer_low_power` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2678 | `instruction_decoder_low_power` | CPU Frontend | Fetch, prediction and decode |
| BB-2679 | `reservation_station_resource_shared` | CPU Execution | Execution units and scheduling |
| BB-2680 | `debug_module_low_power` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2681 | `interrupt_router_low_power` | SoC Peripherals | General-purpose peripherals |
| BB-2682 | `edge_equation_engine_resource_shared` | GPU Geometry | Geometry and raster setup |
| BB-2683 | `alpha_blend_unit_programmable` | GPU Pixel | Raster, texture and pixel operations |
| BB-2684 | `frame_counter_programmable` | Video Timing | Display timing and frame transport |
| BB-2685 | `laplacian_filter_programmable` | Image Processing | Pixel and neighborhood operations |
| BB-2686 | `demosaic_engine_programmable` | Camera and ISP | Camera capture and image signal processing |
| BB-2687 | `pdm_decimator_clock_crossing` | Audio Interfaces | Digital audio transport |
| BB-2688 | `audio_echo_canceller_resource_shared` | Audio DSP | Audio processing and synthesis |
| BB-2689 | `lstm_cell_engine_multi_engine` | Machine Learning | Neural-network layers |
| BB-2690 | `multi_head_attention_engine_multi_engine` | Transformer Acceleration | Attention and sequence models |
| BB-2691 | `zero_skip_controller_multi_engine` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2692 | `sensor_fusion_engine_low_power` | Robotics | Motion, navigation and control |
| BB-2693 | `speed_loop_controller_low_power` | Motor and Power Control | Motor drives and power electronics |
| BB-2694 | `quadrature_decoder_low_power` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2695 | `bacnet_mstp_engine_low_power` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2696 | `rsa_modexp_engine_resource_optimized` | Cryptography | Encryption, authentication and key services |
| BB-2697 | `safe_state_controller_low_power` | Safety and Reliability | Fault detection and safe operation |
| BB-2698 | `bus_functional_model_formal_friendly` | Debug and Verification | On-chip debug and reusable verification |
| BB-2699 | `block_device_dma_low_power` | Storage | Flash, SD, NVMe and block storage |
| BB-2700 | `delta_encoder_resource_shared` | Compression and Coding | Compression, decompression and channel coding |
| BB-2701 | `beamforming_engine_resource_shared` | RF and SDR | Digital radio front-end |
| BB-2702 | `time_of_flight_counter_resource_shared` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2703 | `automotive_gateway_low_power` | Automotive | Vehicle-specific logic |
| BB-2704 | `command_telemetry_framer_low_power` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2705 | `device_identity_block_low_power` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2706 | `genomic_kmer_counter_resource_shared` | Scientific and Search | Domain accelerators |
| BB-2707 | `onehot_decoder_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-2708 | `ring_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-2709 | `shutdown_sequencer_single_shot` | Control | State machines and sequencers |
| BB-2710 | `prefix_adder_combinational` | Integer Compute | Integer arithmetic |
| BB-2711 | `fixed_point_mac_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2712 | `floating_point_reciprocal_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-2713 | `vector_reduce_max_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-2714 | `convolution_im2col_engine_int8` | Tensor Compute | Matrix and tensor operations |
| BB-2715 | `hyperbolic_function_engine_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-2716 | `min_max_reducer_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2717 | `adaptive_lms_filter_combinational` | DSP Filters | Digital filters |
| BB-2718 | `window_function_engine_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-2719 | `ofdm_demodulator_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-2720 | `automatic_gain_controller_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2721 | `synchronous_rom_single_clock` | Memory | RAM, ROM and register storage |
| BB-2722 | `skid_buffer_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-2723 | `page_table_walker_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2724 | `memory_initializer_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-2725 | `axi_id_remapper_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2726 | `axi_stream_data_fifo_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2727 | `ahb_lite_slave_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2728 | `avalon_st_source_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2729 | `age_based_arbiter_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2730 | `i2c_master_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-2731 | `rs485_packet_engine_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2732 | `ethernet_mii_adapter_combinational` | Ethernet MAC | Ethernet media access |
| BB-2733 | `packet_classifier_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2734 | `pcie_credit_manager_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-2735 | `usb_isochronous_transfer_single_shot` | USB | USB device and host functions |
| BB-2736 | `link_training_controller_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2737 | `handshake_synchronizer_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2738 | `compressed_instruction_decoder_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-2739 | `reorder_buffer_cpu_combinational` | CPU Execution | Execution units and scheduling |
| BB-2740 | `cache_coherence_controller_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2741 | `mailbox_peripheral_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-2742 | `tile_binning_engine_combinational` | GPU Geometry | Geometry and raster setup |
| BB-2743 | `color_write_unit_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-2744 | `line_counter_streaming` | Video Timing | Display timing and frame transport |
| BB-2745 | `convolution_engine_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-2746 | `white_balance_engine_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-2747 | `audio_clock_generator_controller` | Audio Interfaces | Digital audio transport |
| BB-2748 | `audio_resampler_combinational` | Audio DSP | Audio processing and synthesis |
| BB-2749 | `gru_cell_engine_int8` | Machine Learning | Neural-network layers |
| BB-2750 | `layer_norm_engine_int8` | Transformer Acceleration | Attention and sequence models |
| BB-2751 | `compressed_weight_decoder_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2752 | `attitude_estimator_single_shot` | Robotics | Motion, navigation and control |
| BB-2753 | `resolver_decoder_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-2754 | `sensor_calibration_unit_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2755 | `hart_modem_interface_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2756 | `ecc_scalar_multiplier_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-2757 | `clock_monitor_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-2758 | `scoreboard_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-2759 | `bad_block_manager_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-2760 | `delta_decoder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-2761 | `antenna_combiner_combinational` | RF and SDR | Digital radio front-end |
| BB-2762 | `point_cloud_formatter_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2763 | `diagnostics_transport_engine_single_shot` | Automotive | Vehicle-specific logic |
| BB-2764 | `spacewire_link_engine_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2765 | `temperature_telemetry_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2766 | `monte_carlo_engine_combinational` | Scientific and Search | Domain accelerators |
| BB-2767 | `onehot_decoder_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-2768 | `ring_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-2769 | `shutdown_sequencer_continuous` | Control | State machines and sequencers |
| BB-2770 | `prefix_adder_single_cycle` | Integer Compute | Integer arithmetic |
| BB-2771 | `fixed_point_mac_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2772 | `floating_point_reciprocal_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-2773 | `vector_reduce_max_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-2774 | `convolution_im2col_engine_int16` | Tensor Compute | Matrix and tensor operations |
| BB-2775 | `hyperbolic_function_engine_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-2776 | `min_max_reducer_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2777 | `adaptive_lms_filter_single_cycle` | DSP Filters | Digital filters |
| BB-2778 | `window_function_engine_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-2779 | `ofdm_demodulator_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-2780 | `automatic_gain_controller_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2781 | `synchronous_rom_dual_clock` | Memory | RAM, ROM and register storage |
| BB-2782 | `skid_buffer_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-2783 | `page_table_walker_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2784 | `memory_initializer_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-2785 | `axi_id_remapper_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2786 | `axi_stream_data_fifo_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2787 | `ahb_lite_slave_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2788 | `avalon_st_source_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2789 | `age_based_arbiter_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2790 | `i2c_master_target` | UART SPI I2C | Low-speed serial protocols |
| BB-2791 | `rs485_packet_engine_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2792 | `ethernet_mii_adapter_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-2793 | `packet_classifier_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2794 | `pcie_credit_manager_target` | PCI Express | PCIe endpoints and transaction services |
| BB-2795 | `usb_isochronous_transfer_continuous` | USB | USB device and host functions |
| BB-2796 | `link_training_controller_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2797 | `handshake_synchronizer_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2798 | `compressed_instruction_decoder_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-2799 | `reorder_buffer_cpu_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-2800 | `cache_coherence_controller_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2801 | `mailbox_peripheral_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-2802 | `tile_binning_engine_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-2803 | `color_write_unit_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-2804 | `line_counter_framebuffer` | Video Timing | Display timing and frame transport |
| BB-2805 | `convolution_engine_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-2806 | `white_balance_engine_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-2807 | `audio_clock_generator_target` | Audio Interfaces | Digital audio transport |
| BB-2808 | `audio_resampler_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-2809 | `gru_cell_engine_int16` | Machine Learning | Neural-network layers |
| BB-2810 | `layer_norm_engine_int16` | Transformer Acceleration | Attention and sequence models |
| BB-2811 | `compressed_weight_decoder_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2812 | `attitude_estimator_continuous` | Robotics | Motion, navigation and control |
| BB-2813 | `resolver_decoder_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-2814 | `sensor_calibration_unit_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2815 | `hart_modem_interface_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2816 | `ecc_scalar_multiplier_streaming` | Cryptography | Encryption, authentication and key services |
| BB-2817 | `clock_monitor_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-2818 | `scoreboard_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-2819 | `bad_block_manager_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-2820 | `delta_decoder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-2821 | `antenna_combiner_single_cycle` | RF and SDR | Digital radio front-end |
| BB-2822 | `point_cloud_formatter_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2823 | `diagnostics_transport_engine_continuous` | Automotive | Vehicle-specific logic |
| BB-2824 | `spacewire_link_engine_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2825 | `temperature_telemetry_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2826 | `monte_carlo_engine_single_cycle` | Scientific and Search | Domain accelerators |
| BB-2827 | `onehot_decoder_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-2828 | `ring_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-2829 | `shutdown_sequencer_programmable` | Control | State machines and sequencers |
| BB-2830 | `prefix_adder_pipelined` | Integer Compute | Integer arithmetic |
| BB-2831 | `fixed_point_mac_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2832 | `floating_point_reciprocal_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-2833 | `vector_reduce_max_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-2834 | `convolution_im2col_engine_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-2835 | `hyperbolic_function_engine_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-2836 | `min_max_reducer_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2837 | `adaptive_lms_filter_pipelined` | DSP Filters | Digital filters |
| BB-2838 | `window_function_engine_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-2839 | `ofdm_demodulator_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-2840 | `automatic_gain_controller_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2841 | `synchronous_rom_packet_aware` | Memory | RAM, ROM and register storage |
| BB-2842 | `skid_buffer_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-2843 | `page_table_walker_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2844 | `memory_initializer_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-2845 | `axi_id_remapper_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2846 | `axi_stream_data_fifo_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2847 | `ahb_lite_slave_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2848 | `avalon_st_source_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2849 | `age_based_arbiter_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2850 | `i2c_master_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-2851 | `rs485_packet_engine_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2852 | `ethernet_mii_adapter_pipelined` | Ethernet MAC | Ethernet media access |
| BB-2853 | `packet_classifier_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2854 | `pcie_credit_manager_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-2855 | `usb_isochronous_transfer_programmable` | USB | USB device and host functions |
| BB-2856 | `link_training_controller_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2857 | `handshake_synchronizer_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2858 | `compressed_instruction_decoder_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-2859 | `reorder_buffer_cpu_pipelined` | CPU Execution | Execution units and scheduling |
| BB-2860 | `cache_coherence_controller_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2861 | `mailbox_peripheral_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-2862 | `tile_binning_engine_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-2863 | `color_write_unit_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-2864 | `line_counter_line_buffered` | Video Timing | Display timing and frame transport |
| BB-2865 | `convolution_engine_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-2866 | `white_balance_engine_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-2867 | `audio_clock_generator_bridge` | Audio Interfaces | Digital audio transport |
| BB-2868 | `audio_resampler_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-2869 | `gru_cell_engine_bf16` | Machine Learning | Neural-network layers |
| BB-2870 | `layer_norm_engine_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-2871 | `compressed_weight_decoder_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2872 | `attitude_estimator_programmable` | Robotics | Motion, navigation and control |
| BB-2873 | `resolver_decoder_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-2874 | `sensor_calibration_unit_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2875 | `hart_modem_interface_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2876 | `ecc_scalar_multiplier_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-2877 | `clock_monitor_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-2878 | `scoreboard_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-2879 | `bad_block_manager_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-2880 | `delta_decoder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-2881 | `antenna_combiner_pipelined` | RF and SDR | Digital radio front-end |
| BB-2882 | `point_cloud_formatter_pipelined` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2883 | `diagnostics_transport_engine_programmable` | Automotive | Vehicle-specific logic |
| BB-2884 | `spacewire_link_engine_programmable` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2885 | `temperature_telemetry_programmable` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2886 | `monte_carlo_engine_pipelined` | Scientific and Search | Domain accelerators |
| BB-2887 | `onehot_decoder_iterative` | Logic and Primitives | Boolean and bit manipulation |
| BB-2888 | `ring_counter_windowed` | Counters and Timing | Counters, timers and event measurement |
| BB-2889 | `shutdown_sequencer_multi_channel` | Control | State machines and sequencers |
| BB-2890 | `prefix_adder_iterative` | Integer Compute | Integer arithmetic |
| BB-2891 | `fixed_point_mac_iterative` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2892 | `floating_point_reciprocal_iterative` | Floating-Point Compute | Floating-point arithmetic |
| BB-2893 | `vector_reduce_max_iterative` | Vector Compute | SIMD and vector datapaths |
| BB-2894 | `convolution_im2col_engine_sparse` | Tensor Compute | Matrix and tensor operations |
| BB-2895 | `hyperbolic_function_engine_iterative` | Math Accelerators | Elementary and transcendental functions |
| BB-2896 | `min_max_reducer_iterative` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2897 | `adaptive_lms_filter_iterative` | DSP Filters | Digital filters |
| BB-2898 | `window_function_engine_iterative` | DSP Spectral | Spectral analysis and transforms |
| BB-2899 | `ofdm_demodulator_iterative` | DSP Modulation | Modulation and waveform generation |
| BB-2900 | `automatic_gain_controller_multi_channel` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2901 | `synchronous_rom_ecc_protected` | Memory | RAM, ROM and register storage |
| BB-2902 | `skid_buffer_ecc_protected` | Queues | FIFO, queue and buffering structures |
| BB-2903 | `page_table_walker_ecc_protected` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2904 | `memory_initializer_multi_channel` | DMA and Memory Services | Data movement and maintenance |
| BB-2905 | `axi_id_remapper_monitor` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2906 | `axi_stream_data_fifo_monitor` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2907 | `ahb_lite_slave_monitor` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2908 | `avalon_st_source_monitor` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2909 | `age_based_arbiter_multi_channel` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2910 | `i2c_master_monitor` | UART SPI I2C | Low-speed serial protocols |
| BB-2911 | `rs485_packet_engine_multi_channel` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2912 | `ethernet_mii_adapter_iterative` | Ethernet MAC | Ethernet media access |
| BB-2913 | `packet_classifier_multi_channel` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2914 | `pcie_credit_manager_monitor` | PCI Express | PCIe endpoints and transaction services |
| BB-2915 | `usb_isochronous_transfer_multi_channel` | USB | USB device and host functions |
| BB-2916 | `link_training_controller_multi_channel` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2917 | `handshake_synchronizer_multi_channel` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2918 | `compressed_instruction_decoder_multi_channel` | CPU Frontend | Fetch, prediction and decode |
| BB-2919 | `reorder_buffer_cpu_iterative` | CPU Execution | Execution units and scheduling |
| BB-2920 | `cache_coherence_controller_multi_channel` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2921 | `mailbox_peripheral_multi_channel` | SoC Peripherals | General-purpose peripherals |
| BB-2922 | `tile_binning_engine_iterative` | GPU Geometry | Geometry and raster setup |
| BB-2923 | `color_write_unit_multi_plane` | GPU Pixel | Raster, texture and pixel operations |
| BB-2924 | `line_counter_multi_plane` | Video Timing | Display timing and frame transport |
| BB-2925 | `convolution_engine_multi_plane` | Image Processing | Pixel and neighborhood operations |
| BB-2926 | `white_balance_engine_multi_plane` | Camera and ISP | Camera capture and image signal processing |
| BB-2927 | `audio_clock_generator_monitor` | Audio Interfaces | Digital audio transport |
| BB-2928 | `audio_resampler_iterative` | Audio DSP | Audio processing and synthesis |
| BB-2929 | `gru_cell_engine_sparse` | Machine Learning | Neural-network layers |
| BB-2930 | `layer_norm_engine_sparse` | Transformer Acceleration | Attention and sequence models |
| BB-2931 | `compressed_weight_decoder_sparse` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2932 | `attitude_estimator_multi_channel` | Robotics | Motion, navigation and control |
| BB-2933 | `resolver_decoder_multi_channel` | Motor and Power Control | Motor drives and power electronics |
| BB-2934 | `sensor_calibration_unit_multi_channel` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2935 | `hart_modem_interface_multi_channel` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2936 | `ecc_scalar_multiplier_multi_context` | Cryptography | Encryption, authentication and key services |
| BB-2937 | `clock_monitor_multi_channel` | Safety and Reliability | Fault detection and safe operation |
| BB-2938 | `scoreboard_coverage_driven` | Debug and Verification | On-chip debug and reusable verification |
| BB-2939 | `bad_block_manager_multi_channel` | Storage | Flash, SD, NVMe and block storage |
| BB-2940 | `delta_decoder_iterative` | Compression and Coding | Compression, decompression and channel coding |
| BB-2941 | `antenna_combiner_iterative` | RF and SDR | Digital radio front-end |
| BB-2942 | `point_cloud_formatter_iterative` | Radar and LiDAR | Ranging and detection pipelines |
| BB-2943 | `diagnostics_transport_engine_multi_channel` | Automotive | Vehicle-specific logic |
| BB-2944 | `spacewire_link_engine_multi_channel` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-2945 | `temperature_telemetry_multi_channel` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-2946 | `monte_carlo_engine_iterative` | Scientific and Search | Domain accelerators |
| BB-2947 | `onehot_decoder_streaming` | Logic and Primitives | Boolean and bit manipulation |
| BB-2948 | `ring_counter_timestamped` | Counters and Timing | Counters, timers and event measurement |
| BB-2949 | `shutdown_sequencer_fault_tolerant` | Control | State machines and sequencers |
| BB-2950 | `prefix_adder_streaming` | Integer Compute | Integer arithmetic |
| BB-2951 | `fixed_point_mac_streaming` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-2952 | `floating_point_reciprocal_streaming` | Floating-Point Compute | Floating-point arithmetic |
| BB-2953 | `vector_reduce_max_streaming` | Vector Compute | SIMD and vector datapaths |
| BB-2954 | `convolution_im2col_engine_pipelined` | Tensor Compute | Matrix and tensor operations |
| BB-2955 | `hyperbolic_function_engine_streaming` | Math Accelerators | Elementary and transcendental functions |
| BB-2956 | `min_max_reducer_streaming` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-2957 | `adaptive_lms_filter_streaming` | DSP Filters | Digital filters |
| BB-2958 | `window_function_engine_streaming` | DSP Spectral | Spectral analysis and transforms |
| BB-2959 | `ofdm_demodulator_streaming` | DSP Modulation | Modulation and waveform generation |
| BB-2960 | `automatic_gain_controller_fault_tolerant` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-2961 | `synchronous_rom_multi_queue` | Memory | RAM, ROM and register storage |
| BB-2962 | `skid_buffer_multi_queue` | Queues | FIFO, queue and buffering structures |
| BB-2963 | `page_table_walker_multi_queue` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-2964 | `memory_initializer_fault_tolerant` | DMA and Memory Services | Data movement and maintenance |
| BB-2965 | `axi_id_remapper_width_adapted` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-2966 | `axi_stream_data_fifo_width_adapted` | AMBA AXI Stream | AXI4-Stream transport |
| BB-2967 | `ahb_lite_slave_width_adapted` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-2968 | `avalon_st_source_width_adapted` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-2969 | `age_based_arbiter_fault_tolerant` | Interconnect and NoC | Routing, arbitration and switching |
| BB-2970 | `i2c_master_width_adapted` | UART SPI I2C | Low-speed serial protocols |
| BB-2971 | `rs485_packet_engine_fault_tolerant` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-2972 | `ethernet_mii_adapter_streaming` | Ethernet MAC | Ethernet media access |
| BB-2973 | `packet_classifier_fault_tolerant` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-2974 | `pcie_credit_manager_width_adapted` | PCI Express | PCIe endpoints and transaction services |
| BB-2975 | `usb_isochronous_transfer_fault_tolerant` | USB | USB device and host functions |
| BB-2976 | `link_training_controller_fault_tolerant` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-2977 | `handshake_synchronizer_fault_tolerant` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-2978 | `compressed_instruction_decoder_fault_tolerant` | CPU Frontend | Fetch, prediction and decode |
| BB-2979 | `reorder_buffer_cpu_streaming` | CPU Execution | Execution units and scheduling |
| BB-2980 | `cache_coherence_controller_fault_tolerant` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-2981 | `mailbox_peripheral_fault_tolerant` | SoC Peripherals | General-purpose peripherals |
| BB-2982 | `tile_binning_engine_streaming` | GPU Geometry | Geometry and raster setup |
| BB-2983 | `color_write_unit_low_latency` | GPU Pixel | Raster, texture and pixel operations |
| BB-2984 | `line_counter_low_latency` | Video Timing | Display timing and frame transport |
| BB-2985 | `convolution_engine_low_latency` | Image Processing | Pixel and neighborhood operations |
| BB-2986 | `white_balance_engine_low_latency` | Camera and ISP | Camera capture and image signal processing |
| BB-2987 | `audio_clock_generator_width_adapted` | Audio Interfaces | Digital audio transport |
| BB-2988 | `audio_resampler_streaming` | Audio DSP | Audio processing and synthesis |
| BB-2989 | `gru_cell_engine_pipelined` | Machine Learning | Neural-network layers |
| BB-2990 | `layer_norm_engine_pipelined` | Transformer Acceleration | Attention and sequence models |
| BB-2991 | `compressed_weight_decoder_pipelined` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-2992 | `attitude_estimator_fault_tolerant` | Robotics | Motion, navigation and control |
| BB-2993 | `resolver_decoder_fault_tolerant` | Motor and Power Control | Motor drives and power electronics |
| BB-2994 | `sensor_calibration_unit_fault_tolerant` | Sensors and DAQ | Acquisition and instrumentation |
| BB-2995 | `hart_modem_interface_fault_tolerant` | Industrial Protocols | Fieldbus and deterministic control |
| BB-2996 | `ecc_scalar_multiplier_fault_detecting` | Cryptography | Encryption, authentication and key services |
| BB-2997 | `clock_monitor_fault_tolerant` | Safety and Reliability | Fault detection and safe operation |
| BB-2998 | `scoreboard_scoreboard_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-2999 | `bad_block_manager_fault_tolerant` | Storage | Flash, SD, NVMe and block storage |
| BB-3000 | `delta_decoder_streaming` | Compression and Coding | Compression, decompression and channel coding |
| BB-3001 | `antenna_combiner_streaming` | RF and SDR | Digital radio front-end |
| BB-3002 | `point_cloud_formatter_streaming` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3003 | `diagnostics_transport_engine_fault_tolerant` | Automotive | Vehicle-specific logic |
| BB-3004 | `spacewire_link_engine_fault_tolerant` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3005 | `temperature_telemetry_fault_tolerant` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3006 | `monte_carlo_engine_streaming` | Scientific and Search | Domain accelerators |
| BB-3007 | `onehot_decoder_resource_shared` | Logic and Primitives | Boolean and bit manipulation |
| BB-3008 | `ring_counter_multi_channel` | Counters and Timing | Counters, timers and event measurement |
| BB-3009 | `shutdown_sequencer_low_power` | Control | State machines and sequencers |
| BB-3010 | `prefix_adder_resource_shared` | Integer Compute | Integer arithmetic |
| BB-3011 | `fixed_point_mac_resource_shared` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3012 | `floating_point_reciprocal_resource_shared` | Floating-Point Compute | Floating-point arithmetic |
| BB-3013 | `vector_reduce_max_resource_shared` | Vector Compute | SIMD and vector datapaths |
| BB-3014 | `convolution_im2col_engine_multi_engine` | Tensor Compute | Matrix and tensor operations |
| BB-3015 | `hyperbolic_function_engine_resource_shared` | Math Accelerators | Elementary and transcendental functions |
| BB-3016 | `min_max_reducer_resource_shared` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3017 | `adaptive_lms_filter_resource_shared` | DSP Filters | Digital filters |
| BB-3018 | `window_function_engine_resource_shared` | DSP Spectral | Spectral analysis and transforms |
| BB-3019 | `ofdm_demodulator_resource_shared` | DSP Modulation | Modulation and waveform generation |
| BB-3020 | `automatic_gain_controller_low_power` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3021 | `synchronous_rom_low_latency` | Memory | RAM, ROM and register storage |
| BB-3022 | `skid_buffer_low_latency` | Queues | FIFO, queue and buffering structures |
| BB-3023 | `page_table_walker_low_latency` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3024 | `memory_initializer_low_power` | DMA and Memory Services | Data movement and maintenance |
| BB-3025 | `axi_id_remapper_clock_crossing` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3026 | `axi_stream_data_fifo_clock_crossing` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3027 | `ahb_lite_slave_clock_crossing` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3028 | `avalon_st_source_clock_crossing` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3029 | `age_based_arbiter_low_power` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3030 | `i2c_master_clock_crossing` | UART SPI I2C | Low-speed serial protocols |
| BB-3031 | `rs485_packet_engine_low_power` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3032 | `ethernet_mii_adapter_resource_shared` | Ethernet MAC | Ethernet media access |
| BB-3033 | `packet_classifier_low_power` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3034 | `pcie_credit_manager_clock_crossing` | PCI Express | PCIe endpoints and transaction services |
| BB-3035 | `usb_isochronous_transfer_low_power` | USB | USB device and host functions |
| BB-3036 | `link_training_controller_low_power` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3037 | `handshake_synchronizer_low_power` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3038 | `compressed_instruction_decoder_low_power` | CPU Frontend | Fetch, prediction and decode |
| BB-3039 | `reorder_buffer_cpu_resource_shared` | CPU Execution | Execution units and scheduling |
| BB-3040 | `cache_coherence_controller_low_power` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3041 | `mailbox_peripheral_low_power` | SoC Peripherals | General-purpose peripherals |
| BB-3042 | `tile_binning_engine_resource_shared` | GPU Geometry | Geometry and raster setup |
| BB-3043 | `color_write_unit_programmable` | GPU Pixel | Raster, texture and pixel operations |
| BB-3044 | `line_counter_programmable` | Video Timing | Display timing and frame transport |
| BB-3045 | `convolution_engine_programmable` | Image Processing | Pixel and neighborhood operations |
| BB-3046 | `white_balance_engine_programmable` | Camera and ISP | Camera capture and image signal processing |
| BB-3047 | `audio_clock_generator_clock_crossing` | Audio Interfaces | Digital audio transport |
| BB-3048 | `audio_resampler_resource_shared` | Audio DSP | Audio processing and synthesis |
| BB-3049 | `gru_cell_engine_multi_engine` | Machine Learning | Neural-network layers |
| BB-3050 | `layer_norm_engine_multi_engine` | Transformer Acceleration | Attention and sequence models |
| BB-3051 | `compressed_weight_decoder_multi_engine` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3052 | `attitude_estimator_low_power` | Robotics | Motion, navigation and control |
| BB-3053 | `resolver_decoder_low_power` | Motor and Power Control | Motor drives and power electronics |
| BB-3054 | `sensor_calibration_unit_low_power` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3055 | `hart_modem_interface_low_power` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3056 | `ecc_scalar_multiplier_resource_optimized` | Cryptography | Encryption, authentication and key services |
| BB-3057 | `clock_monitor_low_power` | Safety and Reliability | Fault detection and safe operation |
| BB-3058 | `scoreboard_formal_friendly` | Debug and Verification | On-chip debug and reusable verification |
| BB-3059 | `bad_block_manager_low_power` | Storage | Flash, SD, NVMe and block storage |
| BB-3060 | `delta_decoder_resource_shared` | Compression and Coding | Compression, decompression and channel coding |
| BB-3061 | `antenna_combiner_resource_shared` | RF and SDR | Digital radio front-end |
| BB-3062 | `point_cloud_formatter_resource_shared` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3063 | `diagnostics_transport_engine_low_power` | Automotive | Vehicle-specific logic |
| BB-3064 | `spacewire_link_engine_low_power` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3065 | `temperature_telemetry_low_power` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3066 | `monte_carlo_engine_resource_shared` | Scientific and Search | Domain accelerators |
| BB-3067 | `thermometer_encoder_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-3068 | `event_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-3069 | `arbitration_controller_single_shot` | Control | State machines and sequencers |
| BB-3070 | `absolute_value_unit_combinational` | Integer Compute | Integer arithmetic |
| BB-3071 | `fixed_point_reciprocal_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3072 | `floating_point_accumulator_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-3073 | `vector_prefix_sum_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-3074 | `batched_gemm_engine_int8` | Tensor Compute | Matrix and tensor operations |
| BB-3075 | `polynomial_evaluator_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-3076 | `histogram_accumulator_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3077 | `notch_filter_combinational` | DSP Filters | Digital filters |
| BB-3078 | `overlap_add_engine_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-3079 | `digital_mixer_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-3080 | `sample_slip_controller_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3081 | `asynchronous_rom_single_clock` | Memory | RAM, ROM and register storage |
| BB-3082 | `credit_queue_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-3083 | `cache_prefetcher_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3084 | `burst_coalescer_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-3085 | `axi_exclusive_access_unit_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3086 | `axi_stream_clock_converter_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3087 | `ahb_arbiter_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3088 | `avalon_st_sink_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3089 | `multicast_router_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3090 | `i2c_slave_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-3091 | `multidrop_address_filter_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3092 | `ethernet_gmii_adapter_combinational` | Ethernet MAC | Ethernet media access |
| BB-3093 | `packet_flow_table_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3094 | `pcie_replay_buffer_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-3095 | `usb_crc_engine_single_shot` | USB | USB device and host functions |
| BB-3096 | `prbs_generator_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3097 | `gray_counter_synchronizer_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3098 | `microcode_rom_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-3099 | `scoreboard_cpu_combinational` | CPU Execution | Execution units and scheduling |
| BB-3100 | `atomic_operation_unit_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3101 | `system_control_registers_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-3102 | `depth_range_mapper_combinational` | GPU Geometry | Geometry and raster setup |
| BB-3103 | `fragment_queue_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-3104 | `pixel_address_generator_streaming` | Video Timing | Display timing and frame transport |
| BB-3105 | `morphology_engine_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-3106 | `color_correction_matrix_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-3107 | `audio_frame_aligner_controller` | Audio Interfaces | Digital audio transport |
| BB-3108 | `wavetable_synthesizer_combinational` | Audio DSP | Audio processing and synthesis |
| BB-3109 | `softmax_engine_int8` | Machine Learning | Neural-network layers |
| BB-3110 | `feed_forward_network_engine_int8` | Transformer Acceleration | Attention and sequence models |
| BB-3111 | `activation_clamp_engine_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3112 | `collision_monitor_single_shot` | Robotics | Motion, navigation and control |
| BB-3113 | `encoder_capture_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-3114 | `threshold_detector_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3115 | `dmx512_controller_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3116 | `true_random_interface_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-3117 | `voltage_alarm_interface_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-3118 | `golden_model_comparator_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-3119 | `wear_leveling_engine_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-3120 | `reed_solomon_encoder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-3121 | `channel_estimator_combinational` | RF and SDR | Digital radio front-end |
| BB-3122 | `target_tracker_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3123 | `sensor_redundancy_voter_single_shot` | Automotive | Vehicle-specific logic |
| BB-3124 | `mil_std_1553_engine_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3125 | `power_telemetry_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3126 | `finite_difference_stencil_combinational` | Scientific and Search | Domain accelerators |
| BB-3127 | `thermometer_encoder_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-3128 | `event_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-3129 | `arbitration_controller_continuous` | Control | State machines and sequencers |
| BB-3130 | `absolute_value_unit_single_cycle` | Integer Compute | Integer arithmetic |
| BB-3131 | `fixed_point_reciprocal_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3132 | `floating_point_accumulator_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-3133 | `vector_prefix_sum_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-3134 | `batched_gemm_engine_int16` | Tensor Compute | Matrix and tensor operations |
| BB-3135 | `polynomial_evaluator_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-3136 | `histogram_accumulator_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3137 | `notch_filter_single_cycle` | DSP Filters | Digital filters |
| BB-3138 | `overlap_add_engine_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-3139 | `digital_mixer_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-3140 | `sample_slip_controller_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3141 | `asynchronous_rom_dual_clock` | Memory | RAM, ROM and register storage |
| BB-3142 | `credit_queue_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-3143 | `cache_prefetcher_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3144 | `burst_coalescer_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-3145 | `axi_exclusive_access_unit_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3146 | `axi_stream_clock_converter_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3147 | `ahb_arbiter_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3148 | `avalon_st_sink_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3149 | `multicast_router_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3150 | `i2c_slave_target` | UART SPI I2C | Low-speed serial protocols |
| BB-3151 | `multidrop_address_filter_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3152 | `ethernet_gmii_adapter_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-3153 | `packet_flow_table_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3154 | `pcie_replay_buffer_target` | PCI Express | PCIe endpoints and transaction services |
| BB-3155 | `usb_crc_engine_continuous` | USB | USB device and host functions |
| BB-3156 | `prbs_generator_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3157 | `gray_counter_synchronizer_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3158 | `microcode_rom_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-3159 | `scoreboard_cpu_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-3160 | `atomic_operation_unit_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3161 | `system_control_registers_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-3162 | `depth_range_mapper_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-3163 | `fragment_queue_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-3164 | `pixel_address_generator_framebuffer` | Video Timing | Display timing and frame transport |
| BB-3165 | `morphology_engine_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-3166 | `color_correction_matrix_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-3167 | `audio_frame_aligner_target` | Audio Interfaces | Digital audio transport |
| BB-3168 | `wavetable_synthesizer_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-3169 | `softmax_engine_int16` | Machine Learning | Neural-network layers |
| BB-3170 | `feed_forward_network_engine_int16` | Transformer Acceleration | Attention and sequence models |
| BB-3171 | `activation_clamp_engine_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3172 | `collision_monitor_continuous` | Robotics | Motion, navigation and control |
| BB-3173 | `encoder_capture_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-3174 | `threshold_detector_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3175 | `dmx512_controller_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3176 | `true_random_interface_streaming` | Cryptography | Encryption, authentication and key services |
| BB-3177 | `voltage_alarm_interface_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-3178 | `golden_model_comparator_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-3179 | `wear_leveling_engine_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-3180 | `reed_solomon_encoder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-3181 | `channel_estimator_single_cycle` | RF and SDR | Digital radio front-end |
| BB-3182 | `target_tracker_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3183 | `sensor_redundancy_voter_continuous` | Automotive | Vehicle-specific logic |
| BB-3184 | `mil_std_1553_engine_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3185 | `power_telemetry_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3186 | `finite_difference_stencil_single_cycle` | Scientific and Search | Domain accelerators |
| BB-3187 | `thermometer_encoder_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-3188 | `event_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-3189 | `arbitration_controller_programmable` | Control | State machines and sequencers |
| BB-3190 | `absolute_value_unit_pipelined` | Integer Compute | Integer arithmetic |
| BB-3191 | `fixed_point_reciprocal_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3192 | `floating_point_accumulator_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-3193 | `vector_prefix_sum_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-3194 | `batched_gemm_engine_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-3195 | `polynomial_evaluator_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-3196 | `histogram_accumulator_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3197 | `notch_filter_pipelined` | DSP Filters | Digital filters |
| BB-3198 | `overlap_add_engine_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-3199 | `digital_mixer_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-3200 | `sample_slip_controller_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3201 | `asynchronous_rom_packet_aware` | Memory | RAM, ROM and register storage |
| BB-3202 | `credit_queue_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-3203 | `cache_prefetcher_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3204 | `burst_coalescer_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-3205 | `axi_exclusive_access_unit_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3206 | `axi_stream_clock_converter_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3207 | `ahb_arbiter_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3208 | `avalon_st_sink_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3209 | `multicast_router_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3210 | `i2c_slave_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-3211 | `multidrop_address_filter_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3212 | `ethernet_gmii_adapter_pipelined` | Ethernet MAC | Ethernet media access |
| BB-3213 | `packet_flow_table_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3214 | `pcie_replay_buffer_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-3215 | `usb_crc_engine_programmable` | USB | USB device and host functions |
| BB-3216 | `prbs_generator_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3217 | `gray_counter_synchronizer_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3218 | `microcode_rom_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-3219 | `scoreboard_cpu_pipelined` | CPU Execution | Execution units and scheduling |
| BB-3220 | `atomic_operation_unit_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3221 | `system_control_registers_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-3222 | `depth_range_mapper_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-3223 | `fragment_queue_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-3224 | `pixel_address_generator_line_buffered` | Video Timing | Display timing and frame transport |
| BB-3225 | `morphology_engine_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-3226 | `color_correction_matrix_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-3227 | `audio_frame_aligner_bridge` | Audio Interfaces | Digital audio transport |
| BB-3228 | `wavetable_synthesizer_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-3229 | `softmax_engine_bf16` | Machine Learning | Neural-network layers |
| BB-3230 | `feed_forward_network_engine_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-3231 | `activation_clamp_engine_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3232 | `collision_monitor_programmable` | Robotics | Motion, navigation and control |
| BB-3233 | `encoder_capture_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-3234 | `threshold_detector_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3235 | `dmx512_controller_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3236 | `true_random_interface_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-3237 | `voltage_alarm_interface_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-3238 | `golden_model_comparator_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-3239 | `wear_leveling_engine_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-3240 | `reed_solomon_encoder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-3241 | `channel_estimator_pipelined` | RF and SDR | Digital radio front-end |
| BB-3242 | `target_tracker_pipelined` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3243 | `sensor_redundancy_voter_programmable` | Automotive | Vehicle-specific logic |
| BB-3244 | `mil_std_1553_engine_programmable` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3245 | `power_telemetry_programmable` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3246 | `finite_difference_stencil_pipelined` | Scientific and Search | Domain accelerators |
| BB-3247 | `thermometer_encoder_iterative` | Logic and Primitives | Boolean and bit manipulation |
| BB-3248 | `event_counter_windowed` | Counters and Timing | Counters, timers and event measurement |
| BB-3249 | `arbitration_controller_multi_channel` | Control | State machines and sequencers |
| BB-3250 | `absolute_value_unit_iterative` | Integer Compute | Integer arithmetic |
| BB-3251 | `fixed_point_reciprocal_iterative` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3252 | `floating_point_accumulator_iterative` | Floating-Point Compute | Floating-point arithmetic |
| BB-3253 | `vector_prefix_sum_iterative` | Vector Compute | SIMD and vector datapaths |
| BB-3254 | `batched_gemm_engine_sparse` | Tensor Compute | Matrix and tensor operations |
| BB-3255 | `polynomial_evaluator_iterative` | Math Accelerators | Elementary and transcendental functions |
| BB-3256 | `histogram_accumulator_iterative` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3257 | `notch_filter_iterative` | DSP Filters | Digital filters |
| BB-3258 | `overlap_add_engine_iterative` | DSP Spectral | Spectral analysis and transforms |
| BB-3259 | `digital_mixer_iterative` | DSP Modulation | Modulation and waveform generation |
| BB-3260 | `sample_slip_controller_multi_channel` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3261 | `asynchronous_rom_ecc_protected` | Memory | RAM, ROM and register storage |
| BB-3262 | `credit_queue_ecc_protected` | Queues | FIFO, queue and buffering structures |
| BB-3263 | `cache_prefetcher_ecc_protected` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3264 | `burst_coalescer_multi_channel` | DMA and Memory Services | Data movement and maintenance |
| BB-3265 | `axi_exclusive_access_unit_monitor` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3266 | `axi_stream_clock_converter_monitor` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3267 | `ahb_arbiter_monitor` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3268 | `avalon_st_sink_monitor` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3269 | `multicast_router_multi_channel` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3270 | `i2c_slave_monitor` | UART SPI I2C | Low-speed serial protocols |
| BB-3271 | `multidrop_address_filter_multi_channel` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3272 | `ethernet_gmii_adapter_iterative` | Ethernet MAC | Ethernet media access |
| BB-3273 | `packet_flow_table_multi_channel` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3274 | `pcie_replay_buffer_monitor` | PCI Express | PCIe endpoints and transaction services |
| BB-3275 | `usb_crc_engine_multi_channel` | USB | USB device and host functions |
| BB-3276 | `prbs_generator_multi_channel` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3277 | `gray_counter_synchronizer_multi_channel` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3278 | `microcode_rom_multi_channel` | CPU Frontend | Fetch, prediction and decode |
| BB-3279 | `scoreboard_cpu_iterative` | CPU Execution | Execution units and scheduling |
| BB-3280 | `atomic_operation_unit_multi_channel` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3281 | `system_control_registers_multi_channel` | SoC Peripherals | General-purpose peripherals |
| BB-3282 | `depth_range_mapper_iterative` | GPU Geometry | Geometry and raster setup |
| BB-3283 | `fragment_queue_multi_plane` | GPU Pixel | Raster, texture and pixel operations |
| BB-3284 | `pixel_address_generator_multi_plane` | Video Timing | Display timing and frame transport |
| BB-3285 | `morphology_engine_multi_plane` | Image Processing | Pixel and neighborhood operations |
| BB-3286 | `color_correction_matrix_multi_plane` | Camera and ISP | Camera capture and image signal processing |
| BB-3287 | `audio_frame_aligner_monitor` | Audio Interfaces | Digital audio transport |
| BB-3288 | `wavetable_synthesizer_iterative` | Audio DSP | Audio processing and synthesis |
| BB-3289 | `softmax_engine_sparse` | Machine Learning | Neural-network layers |
| BB-3290 | `feed_forward_network_engine_sparse` | Transformer Acceleration | Attention and sequence models |
| BB-3291 | `activation_clamp_engine_sparse` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3292 | `collision_monitor_multi_channel` | Robotics | Motion, navigation and control |
| BB-3293 | `encoder_capture_multi_channel` | Motor and Power Control | Motor drives and power electronics |
| BB-3294 | `threshold_detector_multi_channel` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3295 | `dmx512_controller_multi_channel` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3296 | `true_random_interface_multi_context` | Cryptography | Encryption, authentication and key services |
| BB-3297 | `voltage_alarm_interface_multi_channel` | Safety and Reliability | Fault detection and safe operation |
| BB-3298 | `golden_model_comparator_coverage_driven` | Debug and Verification | On-chip debug and reusable verification |
| BB-3299 | `wear_leveling_engine_multi_channel` | Storage | Flash, SD, NVMe and block storage |
| BB-3300 | `reed_solomon_encoder_iterative` | Compression and Coding | Compression, decompression and channel coding |
| BB-3301 | `channel_estimator_iterative` | RF and SDR | Digital radio front-end |
| BB-3302 | `target_tracker_iterative` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3303 | `sensor_redundancy_voter_multi_channel` | Automotive | Vehicle-specific logic |
| BB-3304 | `mil_std_1553_engine_multi_channel` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3305 | `power_telemetry_multi_channel` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3306 | `finite_difference_stencil_iterative` | Scientific and Search | Domain accelerators |
| BB-3307 | `thermometer_encoder_streaming` | Logic and Primitives | Boolean and bit manipulation |
| BB-3308 | `event_counter_timestamped` | Counters and Timing | Counters, timers and event measurement |
| BB-3309 | `arbitration_controller_fault_tolerant` | Control | State machines and sequencers |
| BB-3310 | `absolute_value_unit_streaming` | Integer Compute | Integer arithmetic |
| BB-3311 | `fixed_point_reciprocal_streaming` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3312 | `floating_point_accumulator_streaming` | Floating-Point Compute | Floating-point arithmetic |
| BB-3313 | `vector_prefix_sum_streaming` | Vector Compute | SIMD and vector datapaths |
| BB-3314 | `batched_gemm_engine_pipelined` | Tensor Compute | Matrix and tensor operations |
| BB-3315 | `polynomial_evaluator_streaming` | Math Accelerators | Elementary and transcendental functions |
| BB-3316 | `histogram_accumulator_streaming` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3317 | `notch_filter_streaming` | DSP Filters | Digital filters |
| BB-3318 | `overlap_add_engine_streaming` | DSP Spectral | Spectral analysis and transforms |
| BB-3319 | `digital_mixer_streaming` | DSP Modulation | Modulation and waveform generation |
| BB-3320 | `sample_slip_controller_fault_tolerant` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3321 | `asynchronous_rom_multi_queue` | Memory | RAM, ROM and register storage |
| BB-3322 | `credit_queue_multi_queue` | Queues | FIFO, queue and buffering structures |
| BB-3323 | `cache_prefetcher_multi_queue` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3324 | `burst_coalescer_fault_tolerant` | DMA and Memory Services | Data movement and maintenance |
| BB-3325 | `axi_exclusive_access_unit_width_adapted` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3326 | `axi_stream_clock_converter_width_adapted` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3327 | `ahb_arbiter_width_adapted` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3328 | `avalon_st_sink_width_adapted` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3329 | `multicast_router_fault_tolerant` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3330 | `i2c_slave_width_adapted` | UART SPI I2C | Low-speed serial protocols |
| BB-3331 | `multidrop_address_filter_fault_tolerant` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3332 | `ethernet_gmii_adapter_streaming` | Ethernet MAC | Ethernet media access |
| BB-3333 | `packet_flow_table_fault_tolerant` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3334 | `pcie_replay_buffer_width_adapted` | PCI Express | PCIe endpoints and transaction services |
| BB-3335 | `usb_crc_engine_fault_tolerant` | USB | USB device and host functions |
| BB-3336 | `prbs_generator_fault_tolerant` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3337 | `gray_counter_synchronizer_fault_tolerant` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3338 | `microcode_rom_fault_tolerant` | CPU Frontend | Fetch, prediction and decode |
| BB-3339 | `scoreboard_cpu_streaming` | CPU Execution | Execution units and scheduling |
| BB-3340 | `atomic_operation_unit_fault_tolerant` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3341 | `system_control_registers_fault_tolerant` | SoC Peripherals | General-purpose peripherals |
| BB-3342 | `depth_range_mapper_streaming` | GPU Geometry | Geometry and raster setup |
| BB-3343 | `fragment_queue_low_latency` | GPU Pixel | Raster, texture and pixel operations |
| BB-3344 | `pixel_address_generator_low_latency` | Video Timing | Display timing and frame transport |
| BB-3345 | `morphology_engine_low_latency` | Image Processing | Pixel and neighborhood operations |
| BB-3346 | `color_correction_matrix_low_latency` | Camera and ISP | Camera capture and image signal processing |
| BB-3347 | `audio_frame_aligner_width_adapted` | Audio Interfaces | Digital audio transport |
| BB-3348 | `wavetable_synthesizer_streaming` | Audio DSP | Audio processing and synthesis |
| BB-3349 | `softmax_engine_pipelined` | Machine Learning | Neural-network layers |
| BB-3350 | `feed_forward_network_engine_pipelined` | Transformer Acceleration | Attention and sequence models |
| BB-3351 | `activation_clamp_engine_pipelined` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3352 | `collision_monitor_fault_tolerant` | Robotics | Motion, navigation and control |
| BB-3353 | `encoder_capture_fault_tolerant` | Motor and Power Control | Motor drives and power electronics |
| BB-3354 | `threshold_detector_fault_tolerant` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3355 | `dmx512_controller_fault_tolerant` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3356 | `true_random_interface_fault_detecting` | Cryptography | Encryption, authentication and key services |
| BB-3357 | `voltage_alarm_interface_fault_tolerant` | Safety and Reliability | Fault detection and safe operation |
| BB-3358 | `golden_model_comparator_scoreboard_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-3359 | `wear_leveling_engine_fault_tolerant` | Storage | Flash, SD, NVMe and block storage |
| BB-3360 | `reed_solomon_encoder_streaming` | Compression and Coding | Compression, decompression and channel coding |
| BB-3361 | `channel_estimator_streaming` | RF and SDR | Digital radio front-end |
| BB-3362 | `target_tracker_streaming` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3363 | `sensor_redundancy_voter_fault_tolerant` | Automotive | Vehicle-specific logic |
| BB-3364 | `mil_std_1553_engine_fault_tolerant` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3365 | `power_telemetry_fault_tolerant` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3366 | `finite_difference_stencil_streaming` | Scientific and Search | Domain accelerators |
| BB-3367 | `thermometer_encoder_resource_shared` | Logic and Primitives | Boolean and bit manipulation |
| BB-3368 | `event_counter_multi_channel` | Counters and Timing | Counters, timers and event measurement |
| BB-3369 | `arbitration_controller_low_power` | Control | State machines and sequencers |
| BB-3370 | `absolute_value_unit_resource_shared` | Integer Compute | Integer arithmetic |
| BB-3371 | `fixed_point_reciprocal_resource_shared` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3372 | `floating_point_accumulator_resource_shared` | Floating-Point Compute | Floating-point arithmetic |
| BB-3373 | `vector_prefix_sum_resource_shared` | Vector Compute | SIMD and vector datapaths |
| BB-3374 | `batched_gemm_engine_multi_engine` | Tensor Compute | Matrix and tensor operations |
| BB-3375 | `polynomial_evaluator_resource_shared` | Math Accelerators | Elementary and transcendental functions |
| BB-3376 | `histogram_accumulator_resource_shared` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3377 | `notch_filter_resource_shared` | DSP Filters | Digital filters |
| BB-3378 | `overlap_add_engine_resource_shared` | DSP Spectral | Spectral analysis and transforms |
| BB-3379 | `digital_mixer_resource_shared` | DSP Modulation | Modulation and waveform generation |
| BB-3380 | `sample_slip_controller_low_power` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3381 | `asynchronous_rom_low_latency` | Memory | RAM, ROM and register storage |
| BB-3382 | `credit_queue_low_latency` | Queues | FIFO, queue and buffering structures |
| BB-3383 | `cache_prefetcher_low_latency` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3384 | `burst_coalescer_low_power` | DMA and Memory Services | Data movement and maintenance |
| BB-3385 | `axi_exclusive_access_unit_clock_crossing` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3386 | `axi_stream_clock_converter_clock_crossing` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3387 | `ahb_arbiter_clock_crossing` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3388 | `avalon_st_sink_clock_crossing` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3389 | `multicast_router_low_power` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3390 | `i2c_slave_clock_crossing` | UART SPI I2C | Low-speed serial protocols |
| BB-3391 | `multidrop_address_filter_low_power` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3392 | `ethernet_gmii_adapter_resource_shared` | Ethernet MAC | Ethernet media access |
| BB-3393 | `packet_flow_table_low_power` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3394 | `pcie_replay_buffer_clock_crossing` | PCI Express | PCIe endpoints and transaction services |
| BB-3395 | `usb_crc_engine_low_power` | USB | USB device and host functions |
| BB-3396 | `prbs_generator_low_power` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3397 | `gray_counter_synchronizer_low_power` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3398 | `microcode_rom_low_power` | CPU Frontend | Fetch, prediction and decode |
| BB-3399 | `scoreboard_cpu_resource_shared` | CPU Execution | Execution units and scheduling |
| BB-3400 | `atomic_operation_unit_low_power` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3401 | `system_control_registers_low_power` | SoC Peripherals | General-purpose peripherals |
| BB-3402 | `depth_range_mapper_resource_shared` | GPU Geometry | Geometry and raster setup |
| BB-3403 | `fragment_queue_programmable` | GPU Pixel | Raster, texture and pixel operations |
| BB-3404 | `pixel_address_generator_programmable` | Video Timing | Display timing and frame transport |
| BB-3405 | `morphology_engine_programmable` | Image Processing | Pixel and neighborhood operations |
| BB-3406 | `color_correction_matrix_programmable` | Camera and ISP | Camera capture and image signal processing |
| BB-3407 | `audio_frame_aligner_clock_crossing` | Audio Interfaces | Digital audio transport |
| BB-3408 | `wavetable_synthesizer_resource_shared` | Audio DSP | Audio processing and synthesis |
| BB-3409 | `softmax_engine_multi_engine` | Machine Learning | Neural-network layers |
| BB-3410 | `feed_forward_network_engine_multi_engine` | Transformer Acceleration | Attention and sequence models |
| BB-3411 | `activation_clamp_engine_multi_engine` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3412 | `collision_monitor_low_power` | Robotics | Motion, navigation and control |
| BB-3413 | `encoder_capture_low_power` | Motor and Power Control | Motor drives and power electronics |
| BB-3414 | `threshold_detector_low_power` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3415 | `dmx512_controller_low_power` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3416 | `true_random_interface_resource_optimized` | Cryptography | Encryption, authentication and key services |
| BB-3417 | `voltage_alarm_interface_low_power` | Safety and Reliability | Fault detection and safe operation |
| BB-3418 | `golden_model_comparator_formal_friendly` | Debug and Verification | On-chip debug and reusable verification |
| BB-3419 | `wear_leveling_engine_low_power` | Storage | Flash, SD, NVMe and block storage |
| BB-3420 | `reed_solomon_encoder_resource_shared` | Compression and Coding | Compression, decompression and channel coding |
| BB-3421 | `channel_estimator_resource_shared` | RF and SDR | Digital radio front-end |
| BB-3422 | `target_tracker_resource_shared` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3423 | `sensor_redundancy_voter_low_power` | Automotive | Vehicle-specific logic |
| BB-3424 | `mil_std_1553_engine_low_power` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3425 | `power_telemetry_low_power` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3426 | `finite_difference_stencil_resource_shared` | Scientific and Search | Domain accelerators |
| BB-3427 | `thermometer_decoder_combinational` | Logic and Primitives | Boolean and bit manipulation |
| BB-3428 | `pixel_counter_wraparound` | Counters and Timing | Counters, timers and event measurement |
| BB-3429 | `mode_controller_single_shot` | Control | State machines and sequencers |
| BB-3430 | `sign_extension_unit_combinational` | Integer Compute | Integer arithmetic |
| BB-3431 | `fixed_point_accumulator_combinational` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3432 | `floating_point_classifier_combinational` | Floating-Point Compute | Floating-point arithmetic |
| BB-3433 | `vector_lane_router_combinational` | Vector Compute | SIMD and vector datapaths |
| BB-3434 | `tensor_permutation_engine_int8` | Tensor Compute | Matrix and tensor operations |
| BB-3435 | `piecewise_linear_function_combinational` | Math Accelerators | Elementary and transcendental functions |
| BB-3436 | `stream_statistics_engine_combinational` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3437 | `gaussian_filter_combinational` | DSP Filters | Digital filters |
| BB-3438 | `channelizer_filterbank_combinational` | DSP Spectral | Spectral analysis and transforms |
| BB-3439 | `numerically_controlled_oscillator_combinational` | DSP Modulation | Modulation and waveform generation |
| BB-3440 | `clock_recovery_detector_single_shot` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3441 | `content_addressable_memory_single_clock` | Memory | RAM, ROM and register storage |
| BB-3442 | `priority_queue_single_clock` | Queues | FIFO, queue and buffering structures |
| BB-3443 | `memory_order_buffer_single_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3444 | `address_generator_single_shot` | DMA and Memory Services | Data movement and maintenance |
| BB-3445 | `axi_response_error_injector_controller` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3446 | `axi_stream_packetizer_controller` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3447 | `ahb_to_apb_bridge_controller` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3448 | `avalon_clock_crossing_bridge_controller` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3449 | `quality_of_service_scheduler_single_shot` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3450 | `i2c_bus_recovery_controller` | UART SPI I2C | Low-speed serial protocols |
| BB-3451 | `serial_collision_detector_single_shot` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3452 | `ethernet_rgmii_adapter_combinational` | Ethernet MAC | Ethernet media access |
| BB-3453 | `packet_rate_limiter_single_shot` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3454 | `pcie_configuration_space_controller` | PCI Express | PCIe endpoints and transaction services |
| BB-3455 | `usb_phy_adapter_single_shot` | USB | USB device and host functions |
| BB-3456 | `prbs_checker_single_shot` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3457 | `asynchronous_reset_controller_single_shot` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3458 | `instruction_queue_single_shot` | CPU Frontend | Fetch, prediction and decode |
| BB-3459 | `execution_bypass_network_combinational` | CPU Execution | Execution units and scheduling |
| BB-3460 | `bus_error_handler_single_shot` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3461 | `boot_mode_controller_single_shot` | SoC Peripherals | General-purpose peripherals |
| BB-3462 | `attribute_setup_engine_combinational` | GPU Geometry | Geometry and raster setup |
| BB-3463 | `pixel_counter_streaming` | GPU Pixel | Raster, texture and pixel operations |
| BB-3464 | `framebuffer_reader_streaming` | Video Timing | Display timing and frame transport |
| BB-3465 | `histogram_equalizer_streaming` | Image Processing | Pixel and neighborhood operations |
| BB-3466 | `auto_exposure_statistics_streaming` | Camera and ISP | Camera capture and image signal processing |
| BB-3467 | `audio_dma_interface_controller` | Audio Interfaces | Digital audio transport |
| BB-3468 | `sine_wave_generator_combinational` | Audio DSP | Audio processing and synthesis |
| BB-3469 | `argmax_engine_int8` | Machine Learning | Neural-network layers |
| BB-3470 | `rotary_position_encoder_int8` | Transformer Acceleration | Attention and sequence models |
| BB-3471 | `tensor_reorder_buffer_int8` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3472 | `actuator_command_mixer_single_shot` | Robotics | Motion, navigation and control |
| BB-3473 | `gate_driver_supervisor_single_shot` | Motor and Power Control | Motor drives and power electronics |
| BB-3474 | `event_logger_single_shot` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3475 | `time_sensitive_io_scheduler_single_shot` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3476 | `key_ladder_constant_time` | Cryptography | Encryption, authentication and key services |
| BB-3477 | `error_injection_controller_single_shot` | Safety and Reliability | Fault detection and safe operation |
| BB-3478 | `fault_injector_assertion_based` | Debug and Verification | On-chip debug and reusable verification |
| BB-3479 | `sector_cache_single_shot` | Storage | Flash, SD, NVMe and block storage |
| BB-3480 | `reed_solomon_decoder_combinational` | Compression and Coding | Compression, decompression and channel coding |
| BB-3481 | `equalizer_engine_combinational` | RF and SDR | Digital radio front-end |
| BB-3482 | `angle_of_arrival_engine_combinational` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3483 | `ignition_timing_scheduler_single_shot` | Automotive | Vehicle-specific logic |
| BB-3484 | `redundant_bus_selector_single_shot` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3485 | `resource_usage_monitor_single_shot` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3486 | `sparse_matrix_vector_engine_combinational` | Scientific and Search | Domain accelerators |
| BB-3487 | `thermometer_decoder_single_cycle` | Logic and Primitives | Boolean and bit manipulation |
| BB-3488 | `pixel_counter_loadable` | Counters and Timing | Counters, timers and event measurement |
| BB-3489 | `mode_controller_continuous` | Control | State machines and sequencers |
| BB-3490 | `sign_extension_unit_single_cycle` | Integer Compute | Integer arithmetic |
| BB-3491 | `fixed_point_accumulator_single_cycle` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3492 | `floating_point_classifier_single_cycle` | Floating-Point Compute | Floating-point arithmetic |
| BB-3493 | `vector_lane_router_single_cycle` | Vector Compute | SIMD and vector datapaths |
| BB-3494 | `tensor_permutation_engine_int16` | Tensor Compute | Matrix and tensor operations |
| BB-3495 | `piecewise_linear_function_single_cycle` | Math Accelerators | Elementary and transcendental functions |
| BB-3496 | `stream_statistics_engine_single_cycle` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3497 | `gaussian_filter_single_cycle` | DSP Filters | Digital filters |
| BB-3498 | `channelizer_filterbank_single_cycle` | DSP Spectral | Spectral analysis and transforms |
| BB-3499 | `numerically_controlled_oscillator_single_cycle` | DSP Modulation | Modulation and waveform generation |
| BB-3500 | `clock_recovery_detector_continuous` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3501 | `content_addressable_memory_dual_clock` | Memory | RAM, ROM and register storage |
| BB-3502 | `priority_queue_dual_clock` | Queues | FIFO, queue and buffering structures |
| BB-3503 | `memory_order_buffer_dual_clock` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3504 | `address_generator_continuous` | DMA and Memory Services | Data movement and maintenance |
| BB-3505 | `axi_response_error_injector_target` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3506 | `axi_stream_packetizer_target` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3507 | `ahb_to_apb_bridge_target` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3508 | `avalon_clock_crossing_bridge_target` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3509 | `quality_of_service_scheduler_continuous` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3510 | `i2c_bus_recovery_target` | UART SPI I2C | Low-speed serial protocols |
| BB-3511 | `serial_collision_detector_continuous` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3512 | `ethernet_rgmii_adapter_single_cycle` | Ethernet MAC | Ethernet media access |
| BB-3513 | `packet_rate_limiter_continuous` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3514 | `pcie_configuration_space_target` | PCI Express | PCIe endpoints and transaction services |
| BB-3515 | `usb_phy_adapter_continuous` | USB | USB device and host functions |
| BB-3516 | `prbs_checker_continuous` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3517 | `asynchronous_reset_controller_continuous` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3518 | `instruction_queue_continuous` | CPU Frontend | Fetch, prediction and decode |
| BB-3519 | `execution_bypass_network_single_cycle` | CPU Execution | Execution units and scheduling |
| BB-3520 | `bus_error_handler_continuous` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3521 | `boot_mode_controller_continuous` | SoC Peripherals | General-purpose peripherals |
| BB-3522 | `attribute_setup_engine_single_cycle` | GPU Geometry | Geometry and raster setup |
| BB-3523 | `pixel_counter_framebuffer` | GPU Pixel | Raster, texture and pixel operations |
| BB-3524 | `framebuffer_reader_framebuffer` | Video Timing | Display timing and frame transport |
| BB-3525 | `histogram_equalizer_framebuffer` | Image Processing | Pixel and neighborhood operations |
| BB-3526 | `auto_exposure_statistics_framebuffer` | Camera and ISP | Camera capture and image signal processing |
| BB-3527 | `audio_dma_interface_target` | Audio Interfaces | Digital audio transport |
| BB-3528 | `sine_wave_generator_single_cycle` | Audio DSP | Audio processing and synthesis |
| BB-3529 | `argmax_engine_int16` | Machine Learning | Neural-network layers |
| BB-3530 | `rotary_position_encoder_int16` | Transformer Acceleration | Attention and sequence models |
| BB-3531 | `tensor_reorder_buffer_int16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3532 | `actuator_command_mixer_continuous` | Robotics | Motion, navigation and control |
| BB-3533 | `gate_driver_supervisor_continuous` | Motor and Power Control | Motor drives and power electronics |
| BB-3534 | `event_logger_continuous` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3535 | `time_sensitive_io_scheduler_continuous` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3536 | `key_ladder_streaming` | Cryptography | Encryption, authentication and key services |
| BB-3537 | `error_injection_controller_continuous` | Safety and Reliability | Fault detection and safe operation |
| BB-3538 | `fault_injector_transaction_level` | Debug and Verification | On-chip debug and reusable verification |
| BB-3539 | `sector_cache_continuous` | Storage | Flash, SD, NVMe and block storage |
| BB-3540 | `reed_solomon_decoder_single_cycle` | Compression and Coding | Compression, decompression and channel coding |
| BB-3541 | `equalizer_engine_single_cycle` | RF and SDR | Digital radio front-end |
| BB-3542 | `angle_of_arrival_engine_single_cycle` | Radar and LiDAR | Ranging and detection pipelines |
| BB-3543 | `ignition_timing_scheduler_continuous` | Automotive | Vehicle-specific logic |
| BB-3544 | `redundant_bus_selector_continuous` | Aerospace and Time | Deterministic and high-reliability timing |
| BB-3545 | `resource_usage_monitor_continuous` | Reconfiguration and Management | Configuration, boot and telemetry |
| BB-3546 | `sparse_matrix_vector_engine_single_cycle` | Scientific and Search | Domain accelerators |
| BB-3547 | `thermometer_decoder_pipelined` | Logic and Primitives | Boolean and bit manipulation |
| BB-3548 | `pixel_counter_prescaled` | Counters and Timing | Counters, timers and event measurement |
| BB-3549 | `mode_controller_programmable` | Control | State machines and sequencers |
| BB-3550 | `sign_extension_unit_pipelined` | Integer Compute | Integer arithmetic |
| BB-3551 | `fixed_point_accumulator_pipelined` | Fixed-Point Compute | Fixed-point arithmetic |
| BB-3552 | `floating_point_classifier_pipelined` | Floating-Point Compute | Floating-point arithmetic |
| BB-3553 | `vector_lane_router_pipelined` | Vector Compute | SIMD and vector datapaths |
| BB-3554 | `tensor_permutation_engine_bf16` | Tensor Compute | Matrix and tensor operations |
| BB-3555 | `piecewise_linear_function_pipelined` | Math Accelerators | Elementary and transcendental functions |
| BB-3556 | `stream_statistics_engine_pipelined` | Reductions and Checksums | Reductions, CRC and hashing |
| BB-3557 | `gaussian_filter_pipelined` | DSP Filters | Digital filters |
| BB-3558 | `channelizer_filterbank_pipelined` | DSP Spectral | Spectral analysis and transforms |
| BB-3559 | `numerically_controlled_oscillator_pipelined` | DSP Modulation | Modulation and waveform generation |
| BB-3560 | `clock_recovery_detector_programmable` | DSP Synchronization | Timing, carrier and clock recovery |
| BB-3561 | `content_addressable_memory_packet_aware` | Memory | RAM, ROM and register storage |
| BB-3562 | `priority_queue_packet_aware` | Queues | FIFO, queue and buffering structures |
| BB-3563 | `memory_order_buffer_packet_aware` | Cache and Translation | Caches, TLBs and memory ordering |
| BB-3564 | `address_generator_programmable` | DMA and Memory Services | Data movement and maintenance |
| BB-3565 | `axi_response_error_injector_bridge` | AMBA AXI Memory-Mapped | AXI4 and AXI4-Lite |
| BB-3566 | `axi_stream_packetizer_bridge` | AMBA AXI Stream | AXI4-Stream transport |
| BB-3567 | `ahb_to_apb_bridge_bridge` | AMBA Peripheral Buses | APB, AHB and AHB-Lite |
| BB-3568 | `avalon_clock_crossing_bridge_bridge` | Wishbone and Avalon | Open and vendor-neutral bus fabrics |
| BB-3569 | `quality_of_service_scheduler_programmable` | Interconnect and NoC | Routing, arbitration and switching |
| BB-3570 | `i2c_bus_recovery_bridge` | UART SPI I2C | Low-speed serial protocols |
| BB-3571 | `serial_collision_detector_programmable` | CAN LIN RS485 | Automotive and multidrop serial links |
| BB-3572 | `ethernet_rgmii_adapter_pipelined` | Ethernet MAC | Ethernet media access |
| BB-3573 | `packet_rate_limiter_programmable` | Network Packet Processing | IPv4, IPv6, UDP and packet pipelines |
| BB-3574 | `pcie_configuration_space_bridge` | PCI Express | PCIe endpoints and transaction services |
| BB-3575 | `usb_phy_adapter_programmable` | USB | USB device and host functions |
| BB-3576 | `prbs_checker_programmable` | SERDES and LVDS | High-speed serial and source-synchronous links |
| BB-3577 | `asynchronous_reset_controller_programmable` | Clock Reset CDC | Clocking, reset and domain crossing |
| BB-3578 | `instruction_queue_programmable` | CPU Frontend | Fetch, prediction and decode |
| BB-3579 | `execution_bypass_network_pipelined` | CPU Execution | Execution units and scheduling |
| BB-3580 | `bus_error_handler_programmable` | CPU Memory and Privilege | Memory management, interrupts and privilege |
| BB-3581 | `boot_mode_controller_programmable` | SoC Peripherals | General-purpose peripherals |
| BB-3582 | `attribute_setup_engine_pipelined` | GPU Geometry | Geometry and raster setup |
| BB-3583 | `pixel_counter_line_buffered` | GPU Pixel | Raster, texture and pixel operations |
| BB-3584 | `framebuffer_reader_line_buffered` | Video Timing | Display timing and frame transport |
| BB-3585 | `histogram_equalizer_line_buffered` | Image Processing | Pixel and neighborhood operations |
| BB-3586 | `auto_exposure_statistics_line_buffered` | Camera and ISP | Camera capture and image signal processing |
| BB-3587 | `audio_dma_interface_bridge` | Audio Interfaces | Digital audio transport |
| BB-3588 | `sine_wave_generator_pipelined` | Audio DSP | Audio processing and synthesis |
| BB-3589 | `argmax_engine_bf16` | Machine Learning | Neural-network layers |
| BB-3590 | `rotary_position_encoder_bf16` | Transformer Acceleration | Attention and sequence models |
| BB-3591 | `tensor_reorder_buffer_bf16` | Quantization and Sparsity | Low-precision and sparse AI |
| BB-3592 | `actuator_command_mixer_programmable` | Robotics | Motion, navigation and control |
| BB-3593 | `gate_driver_supervisor_programmable` | Motor and Power Control | Motor drives and power electronics |
| BB-3594 | `event_logger_programmable` | Sensors and DAQ | Acquisition and instrumentation |
| BB-3595 | `time_sensitive_io_scheduler_programmable` | Industrial Protocols | Fieldbus and deterministic control |
| BB-3596 | `key_ladder_key_agile` | Cryptography | Encryption, authentication and key services |
| BB-3597 | `error_injection_controller_programmable` | Safety and Reliability | Fault detection and safe operation |
| BB-3598 | `fault_injector_randomized` | Debug and Verification | On-chip debug and reusable verification |
| BB-3599 | `sector_cache_programmable` | Storage | Flash, SD, NVMe and block storage |
| BB-3600 | `reed_solomon_decoder_pipelined` | Compression and Coding | Compression, decompression and channel coding |
| BB-3601 | `carry_skip_adder_combinational` | Advanced Integer Arithmetic | Adder architectures |
| BB-3602 | `carry_skip_adder_single_cycle` | Advanced Integer Arithmetic | Adder architectures |
| BB-3603 | `carry_skip_adder_shallow_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3604 | `carry_skip_adder_deep_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3605 | `carry_skip_adder_iterative` | Advanced Integer Arithmetic | Adder architectures |
| BB-3606 | `carry_skip_adder_digit_serial` | Advanced Integer Arithmetic | Adder architectures |
| BB-3607 | `carry_skip_adder_resource_shared` | Advanced Integer Arithmetic | Adder architectures |
| BB-3608 | `carry_skip_adder_fully_parallel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3609 | `carry_skip_adder_vectorized` | Advanced Integer Arithmetic | Adder architectures |
| BB-3610 | `carry_skip_adder_streaming` | Advanced Integer Arithmetic | Adder architectures |
| BB-3611 | `carry_skip_adder_buffered_stream` | Advanced Integer Arithmetic | Adder architectures |
| BB-3612 | `carry_skip_adder_multi_channel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3613 | `carry_skip_adder_programmable_precision` | Advanced Integer Arithmetic | Adder architectures |
| BB-3614 | `carry_skip_adder_saturating` | Advanced Integer Arithmetic | Adder architectures |
| BB-3615 | `carry_skip_adder_fault_detecting` | Advanced Integer Arithmetic | Adder architectures |
| BB-3616 | `carry_skip_adder_low_power` | Advanced Integer Arithmetic | Adder architectures |
| BB-3617 | `conditional_sum_adder_combinational` | Advanced Integer Arithmetic | Adder architectures |
| BB-3618 | `conditional_sum_adder_single_cycle` | Advanced Integer Arithmetic | Adder architectures |
| BB-3619 | `conditional_sum_adder_shallow_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3620 | `conditional_sum_adder_deep_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3621 | `conditional_sum_adder_iterative` | Advanced Integer Arithmetic | Adder architectures |
| BB-3622 | `conditional_sum_adder_digit_serial` | Advanced Integer Arithmetic | Adder architectures |
| BB-3623 | `conditional_sum_adder_resource_shared` | Advanced Integer Arithmetic | Adder architectures |
| BB-3624 | `conditional_sum_adder_fully_parallel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3625 | `conditional_sum_adder_vectorized` | Advanced Integer Arithmetic | Adder architectures |
| BB-3626 | `conditional_sum_adder_streaming` | Advanced Integer Arithmetic | Adder architectures |
| BB-3627 | `conditional_sum_adder_buffered_stream` | Advanced Integer Arithmetic | Adder architectures |
| BB-3628 | `conditional_sum_adder_multi_channel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3629 | `conditional_sum_adder_programmable_precision` | Advanced Integer Arithmetic | Adder architectures |
| BB-3630 | `conditional_sum_adder_saturating` | Advanced Integer Arithmetic | Adder architectures |
| BB-3631 | `conditional_sum_adder_fault_detecting` | Advanced Integer Arithmetic | Adder architectures |
| BB-3632 | `conditional_sum_adder_low_power` | Advanced Integer Arithmetic | Adder architectures |
| BB-3633 | `signed_digit_adder_combinational` | Advanced Integer Arithmetic | Adder architectures |
| BB-3634 | `signed_digit_adder_single_cycle` | Advanced Integer Arithmetic | Adder architectures |
| BB-3635 | `signed_digit_adder_shallow_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3636 | `signed_digit_adder_deep_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3637 | `signed_digit_adder_iterative` | Advanced Integer Arithmetic | Adder architectures |
| BB-3638 | `signed_digit_adder_digit_serial` | Advanced Integer Arithmetic | Adder architectures |
| BB-3639 | `signed_digit_adder_resource_shared` | Advanced Integer Arithmetic | Adder architectures |
| BB-3640 | `signed_digit_adder_fully_parallel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3641 | `signed_digit_adder_vectorized` | Advanced Integer Arithmetic | Adder architectures |
| BB-3642 | `signed_digit_adder_streaming` | Advanced Integer Arithmetic | Adder architectures |
| BB-3643 | `signed_digit_adder_buffered_stream` | Advanced Integer Arithmetic | Adder architectures |
| BB-3644 | `signed_digit_adder_multi_channel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3645 | `signed_digit_adder_programmable_precision` | Advanced Integer Arithmetic | Adder architectures |
| BB-3646 | `signed_digit_adder_saturating` | Advanced Integer Arithmetic | Adder architectures |
| BB-3647 | `signed_digit_adder_fault_detecting` | Advanced Integer Arithmetic | Adder architectures |
| BB-3648 | `signed_digit_adder_low_power` | Advanced Integer Arithmetic | Adder architectures |
| BB-3649 | `end_around_carry_adder_combinational` | Advanced Integer Arithmetic | Adder architectures |
| BB-3650 | `end_around_carry_adder_single_cycle` | Advanced Integer Arithmetic | Adder architectures |
| BB-3651 | `end_around_carry_adder_shallow_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3652 | `end_around_carry_adder_deep_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3653 | `end_around_carry_adder_iterative` | Advanced Integer Arithmetic | Adder architectures |
| BB-3654 | `end_around_carry_adder_digit_serial` | Advanced Integer Arithmetic | Adder architectures |
| BB-3655 | `end_around_carry_adder_resource_shared` | Advanced Integer Arithmetic | Adder architectures |
| BB-3656 | `end_around_carry_adder_fully_parallel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3657 | `end_around_carry_adder_vectorized` | Advanced Integer Arithmetic | Adder architectures |
| BB-3658 | `end_around_carry_adder_streaming` | Advanced Integer Arithmetic | Adder architectures |
| BB-3659 | `end_around_carry_adder_buffered_stream` | Advanced Integer Arithmetic | Adder architectures |
| BB-3660 | `end_around_carry_adder_multi_channel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3661 | `end_around_carry_adder_programmable_precision` | Advanced Integer Arithmetic | Adder architectures |
| BB-3662 | `end_around_carry_adder_saturating` | Advanced Integer Arithmetic | Adder architectures |
| BB-3663 | `end_around_carry_adder_fault_detecting` | Advanced Integer Arithmetic | Adder architectures |
| BB-3664 | `end_around_carry_adder_low_power` | Advanced Integer Arithmetic | Adder architectures |
| BB-3665 | `multioperand_compressor_tree_combinational` | Advanced Integer Arithmetic | Adder architectures |
| BB-3666 | `multioperand_compressor_tree_single_cycle` | Advanced Integer Arithmetic | Adder architectures |
| BB-3667 | `multioperand_compressor_tree_shallow_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3668 | `multioperand_compressor_tree_deep_pipeline` | Advanced Integer Arithmetic | Adder architectures |
| BB-3669 | `multioperand_compressor_tree_iterative` | Advanced Integer Arithmetic | Adder architectures |
| BB-3670 | `multioperand_compressor_tree_digit_serial` | Advanced Integer Arithmetic | Adder architectures |
| BB-3671 | `multioperand_compressor_tree_resource_shared` | Advanced Integer Arithmetic | Adder architectures |
| BB-3672 | `multioperand_compressor_tree_fully_parallel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3673 | `multioperand_compressor_tree_vectorized` | Advanced Integer Arithmetic | Adder architectures |
| BB-3674 | `multioperand_compressor_tree_streaming` | Advanced Integer Arithmetic | Adder architectures |
| BB-3675 | `multioperand_compressor_tree_buffered_stream` | Advanced Integer Arithmetic | Adder architectures |
| BB-3676 | `multioperand_compressor_tree_multi_channel` | Advanced Integer Arithmetic | Adder architectures |
| BB-3677 | `multioperand_compressor_tree_programmable_precision` | Advanced Integer Arithmetic | Adder architectures |
| BB-3678 | `multioperand_compressor_tree_saturating` | Advanced Integer Arithmetic | Adder architectures |
| BB-3679 | `multioperand_compressor_tree_fault_detecting` | Advanced Integer Arithmetic | Adder architectures |
| BB-3680 | `multioperand_compressor_tree_low_power` | Advanced Integer Arithmetic | Adder architectures |
| BB-3681 | `booth_radix4_multiplier_combinational` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3682 | `booth_radix4_multiplier_single_cycle` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3683 | `booth_radix4_multiplier_shallow_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3684 | `booth_radix4_multiplier_deep_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3685 | `booth_radix4_multiplier_iterative` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3686 | `booth_radix4_multiplier_digit_serial` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3687 | `booth_radix4_multiplier_resource_shared` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3688 | `booth_radix4_multiplier_fully_parallel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3689 | `booth_radix4_multiplier_vectorized` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3690 | `booth_radix4_multiplier_streaming` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3691 | `booth_radix4_multiplier_buffered_stream` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3692 | `booth_radix4_multiplier_multi_channel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3693 | `booth_radix4_multiplier_programmable_precision` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3694 | `booth_radix4_multiplier_saturating` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3695 | `booth_radix4_multiplier_fault_detecting` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3696 | `booth_radix4_multiplier_low_power` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3697 | `booth_radix8_multiplier_combinational` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3698 | `booth_radix8_multiplier_single_cycle` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3699 | `booth_radix8_multiplier_shallow_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3700 | `booth_radix8_multiplier_deep_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3701 | `booth_radix8_multiplier_iterative` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3702 | `booth_radix8_multiplier_digit_serial` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3703 | `booth_radix8_multiplier_resource_shared` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3704 | `booth_radix8_multiplier_fully_parallel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3705 | `booth_radix8_multiplier_vectorized` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3706 | `booth_radix8_multiplier_streaming` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3707 | `booth_radix8_multiplier_buffered_stream` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3708 | `booth_radix8_multiplier_multi_channel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3709 | `booth_radix8_multiplier_programmable_precision` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3710 | `booth_radix8_multiplier_saturating` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3711 | `booth_radix8_multiplier_fault_detecting` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3712 | `booth_radix8_multiplier_low_power` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3713 | `wallace_tree_multiplier_combinational` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3714 | `wallace_tree_multiplier_single_cycle` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3715 | `wallace_tree_multiplier_shallow_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3716 | `wallace_tree_multiplier_deep_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3717 | `wallace_tree_multiplier_iterative` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3718 | `wallace_tree_multiplier_digit_serial` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3719 | `wallace_tree_multiplier_resource_shared` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3720 | `wallace_tree_multiplier_fully_parallel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3721 | `wallace_tree_multiplier_vectorized` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3722 | `wallace_tree_multiplier_streaming` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3723 | `wallace_tree_multiplier_buffered_stream` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3724 | `wallace_tree_multiplier_multi_channel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3725 | `wallace_tree_multiplier_programmable_precision` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3726 | `wallace_tree_multiplier_saturating` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3727 | `wallace_tree_multiplier_fault_detecting` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3728 | `wallace_tree_multiplier_low_power` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3729 | `dadda_tree_multiplier_combinational` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3730 | `dadda_tree_multiplier_single_cycle` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3731 | `dadda_tree_multiplier_shallow_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3732 | `dadda_tree_multiplier_deep_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3733 | `dadda_tree_multiplier_iterative` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3734 | `dadda_tree_multiplier_digit_serial` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3735 | `dadda_tree_multiplier_resource_shared` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3736 | `dadda_tree_multiplier_fully_parallel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3737 | `dadda_tree_multiplier_vectorized` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3738 | `dadda_tree_multiplier_streaming` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3739 | `dadda_tree_multiplier_buffered_stream` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3740 | `dadda_tree_multiplier_multi_channel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3741 | `dadda_tree_multiplier_programmable_precision` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3742 | `dadda_tree_multiplier_saturating` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3743 | `dadda_tree_multiplier_fault_detecting` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3744 | `dadda_tree_multiplier_low_power` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3745 | `karatsuba_multiplier_combinational` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3746 | `karatsuba_multiplier_single_cycle` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3747 | `karatsuba_multiplier_shallow_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3748 | `karatsuba_multiplier_deep_pipeline` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3749 | `karatsuba_multiplier_iterative` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3750 | `karatsuba_multiplier_digit_serial` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3751 | `karatsuba_multiplier_resource_shared` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3752 | `karatsuba_multiplier_fully_parallel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3753 | `karatsuba_multiplier_vectorized` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3754 | `karatsuba_multiplier_streaming` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3755 | `karatsuba_multiplier_buffered_stream` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3756 | `karatsuba_multiplier_multi_channel` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3757 | `karatsuba_multiplier_programmable_precision` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3758 | `karatsuba_multiplier_saturating` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3759 | `karatsuba_multiplier_fault_detecting` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3760 | `karatsuba_multiplier_low_power` | Advanced Integer Arithmetic | Multiplier architectures |
| BB-3761 | `srt_divider_combinational` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3762 | `srt_divider_single_cycle` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3763 | `srt_divider_shallow_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3764 | `srt_divider_deep_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3765 | `srt_divider_iterative` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3766 | `srt_divider_digit_serial` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3767 | `srt_divider_resource_shared` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3768 | `srt_divider_fully_parallel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3769 | `srt_divider_vectorized` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3770 | `srt_divider_streaming` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3771 | `srt_divider_buffered_stream` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3772 | `srt_divider_multi_channel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3773 | `srt_divider_programmable_precision` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3774 | `srt_divider_saturating` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3775 | `srt_divider_fault_detecting` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3776 | `srt_divider_low_power` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3777 | `nonrestoring_divider_combinational` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3778 | `nonrestoring_divider_single_cycle` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3779 | `nonrestoring_divider_shallow_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3780 | `nonrestoring_divider_deep_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3781 | `nonrestoring_divider_iterative` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3782 | `nonrestoring_divider_digit_serial` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3783 | `nonrestoring_divider_resource_shared` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3784 | `nonrestoring_divider_fully_parallel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3785 | `nonrestoring_divider_vectorized` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3786 | `nonrestoring_divider_streaming` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3787 | `nonrestoring_divider_buffered_stream` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3788 | `nonrestoring_divider_multi_channel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3789 | `nonrestoring_divider_programmable_precision` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3790 | `nonrestoring_divider_saturating` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3791 | `nonrestoring_divider_fault_detecting` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3792 | `nonrestoring_divider_low_power` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3793 | `goldschmidt_reciprocal_combinational` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3794 | `goldschmidt_reciprocal_single_cycle` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3795 | `goldschmidt_reciprocal_shallow_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3796 | `goldschmidt_reciprocal_deep_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3797 | `goldschmidt_reciprocal_iterative` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3798 | `goldschmidt_reciprocal_digit_serial` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3799 | `goldschmidt_reciprocal_resource_shared` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3800 | `goldschmidt_reciprocal_fully_parallel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3801 | `goldschmidt_reciprocal_vectorized` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3802 | `goldschmidt_reciprocal_streaming` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3803 | `goldschmidt_reciprocal_buffered_stream` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3804 | `goldschmidt_reciprocal_multi_channel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3805 | `goldschmidt_reciprocal_programmable_precision` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3806 | `goldschmidt_reciprocal_saturating` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3807 | `goldschmidt_reciprocal_fault_detecting` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3808 | `goldschmidt_reciprocal_low_power` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3809 | `newton_raphson_reciprocal_combinational` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3810 | `newton_raphson_reciprocal_single_cycle` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3811 | `newton_raphson_reciprocal_shallow_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3812 | `newton_raphson_reciprocal_deep_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3813 | `newton_raphson_reciprocal_iterative` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3814 | `newton_raphson_reciprocal_digit_serial` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3815 | `newton_raphson_reciprocal_resource_shared` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3816 | `newton_raphson_reciprocal_fully_parallel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3817 | `newton_raphson_reciprocal_vectorized` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3818 | `newton_raphson_reciprocal_streaming` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3819 | `newton_raphson_reciprocal_buffered_stream` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3820 | `newton_raphson_reciprocal_multi_channel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3821 | `newton_raphson_reciprocal_programmable_precision` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3822 | `newton_raphson_reciprocal_saturating` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3823 | `newton_raphson_reciprocal_fault_detecting` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3824 | `newton_raphson_reciprocal_low_power` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3825 | `reciprocal_sqrt_pipeline_combinational` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3826 | `reciprocal_sqrt_pipeline_single_cycle` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3827 | `reciprocal_sqrt_pipeline_shallow_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3828 | `reciprocal_sqrt_pipeline_deep_pipeline` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3829 | `reciprocal_sqrt_pipeline_iterative` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3830 | `reciprocal_sqrt_pipeline_digit_serial` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3831 | `reciprocal_sqrt_pipeline_resource_shared` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3832 | `reciprocal_sqrt_pipeline_fully_parallel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3833 | `reciprocal_sqrt_pipeline_vectorized` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3834 | `reciprocal_sqrt_pipeline_streaming` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3835 | `reciprocal_sqrt_pipeline_buffered_stream` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3836 | `reciprocal_sqrt_pipeline_multi_channel` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3837 | `reciprocal_sqrt_pipeline_programmable_precision` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3838 | `reciprocal_sqrt_pipeline_saturating` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3839 | `reciprocal_sqrt_pipeline_fault_detecting` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3840 | `reciprocal_sqrt_pipeline_low_power` | Advanced Integer Arithmetic | Division and reciprocal |
| BB-3841 | `bit_permutation_network_combinational` | Bit Manipulation | Permutation and counting |
| BB-3842 | `bit_permutation_network_single_cycle` | Bit Manipulation | Permutation and counting |
| BB-3843 | `bit_permutation_network_shallow_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3844 | `bit_permutation_network_deep_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3845 | `bit_permutation_network_iterative` | Bit Manipulation | Permutation and counting |
| BB-3846 | `bit_permutation_network_digit_serial` | Bit Manipulation | Permutation and counting |
| BB-3847 | `bit_permutation_network_resource_shared` | Bit Manipulation | Permutation and counting |
| BB-3848 | `bit_permutation_network_fully_parallel` | Bit Manipulation | Permutation and counting |
| BB-3849 | `bit_permutation_network_vectorized` | Bit Manipulation | Permutation and counting |
| BB-3850 | `bit_permutation_network_streaming` | Bit Manipulation | Permutation and counting |
| BB-3851 | `bit_permutation_network_buffered_stream` | Bit Manipulation | Permutation and counting |
| BB-3852 | `bit_permutation_network_multi_channel` | Bit Manipulation | Permutation and counting |
| BB-3853 | `bit_permutation_network_programmable_precision` | Bit Manipulation | Permutation and counting |
| BB-3854 | `bit_permutation_network_saturating` | Bit Manipulation | Permutation and counting |
| BB-3855 | `bit_permutation_network_fault_detecting` | Bit Manipulation | Permutation and counting |
| BB-3856 | `bit_permutation_network_low_power` | Bit Manipulation | Permutation and counting |
| BB-3857 | `parallel_bit_extract_combinational` | Bit Manipulation | Permutation and counting |
| BB-3858 | `parallel_bit_extract_single_cycle` | Bit Manipulation | Permutation and counting |
| BB-3859 | `parallel_bit_extract_shallow_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3860 | `parallel_bit_extract_deep_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3861 | `parallel_bit_extract_iterative` | Bit Manipulation | Permutation and counting |
| BB-3862 | `parallel_bit_extract_digit_serial` | Bit Manipulation | Permutation and counting |
| BB-3863 | `parallel_bit_extract_resource_shared` | Bit Manipulation | Permutation and counting |
| BB-3864 | `parallel_bit_extract_fully_parallel` | Bit Manipulation | Permutation and counting |
| BB-3865 | `parallel_bit_extract_vectorized` | Bit Manipulation | Permutation and counting |
| BB-3866 | `parallel_bit_extract_streaming` | Bit Manipulation | Permutation and counting |
| BB-3867 | `parallel_bit_extract_buffered_stream` | Bit Manipulation | Permutation and counting |
| BB-3868 | `parallel_bit_extract_multi_channel` | Bit Manipulation | Permutation and counting |
| BB-3869 | `parallel_bit_extract_programmable_precision` | Bit Manipulation | Permutation and counting |
| BB-3870 | `parallel_bit_extract_saturating` | Bit Manipulation | Permutation and counting |
| BB-3871 | `parallel_bit_extract_fault_detecting` | Bit Manipulation | Permutation and counting |
| BB-3872 | `parallel_bit_extract_low_power` | Bit Manipulation | Permutation and counting |
| BB-3873 | `parallel_bit_deposit_combinational` | Bit Manipulation | Permutation and counting |
| BB-3874 | `parallel_bit_deposit_single_cycle` | Bit Manipulation | Permutation and counting |
| BB-3875 | `parallel_bit_deposit_shallow_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3876 | `parallel_bit_deposit_deep_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3877 | `parallel_bit_deposit_iterative` | Bit Manipulation | Permutation and counting |
| BB-3878 | `parallel_bit_deposit_digit_serial` | Bit Manipulation | Permutation and counting |
| BB-3879 | `parallel_bit_deposit_resource_shared` | Bit Manipulation | Permutation and counting |
| BB-3880 | `parallel_bit_deposit_fully_parallel` | Bit Manipulation | Permutation and counting |
| BB-3881 | `parallel_bit_deposit_vectorized` | Bit Manipulation | Permutation and counting |
| BB-3882 | `parallel_bit_deposit_streaming` | Bit Manipulation | Permutation and counting |
| BB-3883 | `parallel_bit_deposit_buffered_stream` | Bit Manipulation | Permutation and counting |
| BB-3884 | `parallel_bit_deposit_multi_channel` | Bit Manipulation | Permutation and counting |
| BB-3885 | `parallel_bit_deposit_programmable_precision` | Bit Manipulation | Permutation and counting |
| BB-3886 | `parallel_bit_deposit_saturating` | Bit Manipulation | Permutation and counting |
| BB-3887 | `parallel_bit_deposit_fault_detecting` | Bit Manipulation | Permutation and counting |
| BB-3888 | `parallel_bit_deposit_low_power` | Bit Manipulation | Permutation and counting |
| BB-3889 | `count_leading_zeros_combinational` | Bit Manipulation | Permutation and counting |
| BB-3890 | `count_leading_zeros_single_cycle` | Bit Manipulation | Permutation and counting |
| BB-3891 | `count_leading_zeros_shallow_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3892 | `count_leading_zeros_deep_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3893 | `count_leading_zeros_iterative` | Bit Manipulation | Permutation and counting |
| BB-3894 | `count_leading_zeros_digit_serial` | Bit Manipulation | Permutation and counting |
| BB-3895 | `count_leading_zeros_resource_shared` | Bit Manipulation | Permutation and counting |
| BB-3896 | `count_leading_zeros_fully_parallel` | Bit Manipulation | Permutation and counting |
| BB-3897 | `count_leading_zeros_vectorized` | Bit Manipulation | Permutation and counting |
| BB-3898 | `count_leading_zeros_streaming` | Bit Manipulation | Permutation and counting |
| BB-3899 | `count_leading_zeros_buffered_stream` | Bit Manipulation | Permutation and counting |
| BB-3900 | `count_leading_zeros_multi_channel` | Bit Manipulation | Permutation and counting |
| BB-3901 | `count_leading_zeros_programmable_precision` | Bit Manipulation | Permutation and counting |
| BB-3902 | `count_leading_zeros_saturating` | Bit Manipulation | Permutation and counting |
| BB-3903 | `count_leading_zeros_fault_detecting` | Bit Manipulation | Permutation and counting |
| BB-3904 | `count_leading_zeros_low_power` | Bit Manipulation | Permutation and counting |
| BB-3905 | `bit_reverse_network_combinational` | Bit Manipulation | Permutation and counting |
| BB-3906 | `bit_reverse_network_single_cycle` | Bit Manipulation | Permutation and counting |
| BB-3907 | `bit_reverse_network_shallow_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3908 | `bit_reverse_network_deep_pipeline` | Bit Manipulation | Permutation and counting |
| BB-3909 | `bit_reverse_network_iterative` | Bit Manipulation | Permutation and counting |
| BB-3910 | `bit_reverse_network_digit_serial` | Bit Manipulation | Permutation and counting |
| BB-3911 | `bit_reverse_network_resource_shared` | Bit Manipulation | Permutation and counting |
| BB-3912 | `bit_reverse_network_fully_parallel` | Bit Manipulation | Permutation and counting |
| BB-3913 | `bit_reverse_network_vectorized` | Bit Manipulation | Permutation and counting |
| BB-3914 | `bit_reverse_network_streaming` | Bit Manipulation | Permutation and counting |
| BB-3915 | `bit_reverse_network_buffered_stream` | Bit Manipulation | Permutation and counting |
| BB-3916 | `bit_reverse_network_multi_channel` | Bit Manipulation | Permutation and counting |
| BB-3917 | `bit_reverse_network_programmable_precision` | Bit Manipulation | Permutation and counting |
| BB-3918 | `bit_reverse_network_saturating` | Bit Manipulation | Permutation and counting |
| BB-3919 | `bit_reverse_network_fault_detecting` | Bit Manipulation | Permutation and counting |
| BB-3920 | `bit_reverse_network_low_power` | Bit Manipulation | Permutation and counting |
| BB-3921 | `binary_to_bcd_converter_combinational` | Numeric Formats | Format conversion |
| BB-3922 | `binary_to_bcd_converter_single_cycle` | Numeric Formats | Format conversion |
| BB-3923 | `binary_to_bcd_converter_shallow_pipeline` | Numeric Formats | Format conversion |
| BB-3924 | `binary_to_bcd_converter_deep_pipeline` | Numeric Formats | Format conversion |
| BB-3925 | `binary_to_bcd_converter_iterative` | Numeric Formats | Format conversion |
| BB-3926 | `binary_to_bcd_converter_digit_serial` | Numeric Formats | Format conversion |
| BB-3927 | `binary_to_bcd_converter_resource_shared` | Numeric Formats | Format conversion |
| BB-3928 | `binary_to_bcd_converter_fully_parallel` | Numeric Formats | Format conversion |
| BB-3929 | `binary_to_bcd_converter_vectorized` | Numeric Formats | Format conversion |
| BB-3930 | `binary_to_bcd_converter_streaming` | Numeric Formats | Format conversion |
| BB-3931 | `binary_to_bcd_converter_buffered_stream` | Numeric Formats | Format conversion |
| BB-3932 | `binary_to_bcd_converter_multi_channel` | Numeric Formats | Format conversion |
| BB-3933 | `binary_to_bcd_converter_programmable_precision` | Numeric Formats | Format conversion |
| BB-3934 | `binary_to_bcd_converter_saturating` | Numeric Formats | Format conversion |
| BB-3935 | `binary_to_bcd_converter_fault_detecting` | Numeric Formats | Format conversion |
| BB-3936 | `binary_to_bcd_converter_low_power` | Numeric Formats | Format conversion |
| BB-3937 | `bcd_to_binary_converter_combinational` | Numeric Formats | Format conversion |
| BB-3938 | `bcd_to_binary_converter_single_cycle` | Numeric Formats | Format conversion |
| BB-3939 | `bcd_to_binary_converter_shallow_pipeline` | Numeric Formats | Format conversion |
| BB-3940 | `bcd_to_binary_converter_deep_pipeline` | Numeric Formats | Format conversion |
| BB-3941 | `bcd_to_binary_converter_iterative` | Numeric Formats | Format conversion |
| BB-3942 | `bcd_to_binary_converter_digit_serial` | Numeric Formats | Format conversion |
| BB-3943 | `bcd_to_binary_converter_resource_shared` | Numeric Formats | Format conversion |
| BB-3944 | `bcd_to_binary_converter_fully_parallel` | Numeric Formats | Format conversion |
| BB-3945 | `bcd_to_binary_converter_vectorized` | Numeric Formats | Format conversion |
| BB-3946 | `bcd_to_binary_converter_streaming` | Numeric Formats | Format conversion |
| BB-3947 | `bcd_to_binary_converter_buffered_stream` | Numeric Formats | Format conversion |
| BB-3948 | `bcd_to_binary_converter_multi_channel` | Numeric Formats | Format conversion |
| BB-3949 | `bcd_to_binary_converter_programmable_precision` | Numeric Formats | Format conversion |
| BB-3950 | `bcd_to_binary_converter_saturating` | Numeric Formats | Format conversion |
| BB-3951 | `bcd_to_binary_converter_fault_detecting` | Numeric Formats | Format conversion |
| BB-3952 | `bcd_to_binary_converter_low_power` | Numeric Formats | Format conversion |
| BB-3953 | `fixed_to_float_converter_combinational` | Numeric Formats | Format conversion |
| BB-3954 | `fixed_to_float_converter_single_cycle` | Numeric Formats | Format conversion |
| BB-3955 | `fixed_to_float_converter_shallow_pipeline` | Numeric Formats | Format conversion |
| BB-3956 | `fixed_to_float_converter_deep_pipeline` | Numeric Formats | Format conversion |
| BB-3957 | `fixed_to_float_converter_iterative` | Numeric Formats | Format conversion |
| BB-3958 | `fixed_to_float_converter_digit_serial` | Numeric Formats | Format conversion |
| BB-3959 | `fixed_to_float_converter_resource_shared` | Numeric Formats | Format conversion |
| BB-3960 | `fixed_to_float_converter_fully_parallel` | Numeric Formats | Format conversion |
| BB-3961 | `fixed_to_float_converter_vectorized` | Numeric Formats | Format conversion |
| BB-3962 | `fixed_to_float_converter_streaming` | Numeric Formats | Format conversion |
| BB-3963 | `fixed_to_float_converter_buffered_stream` | Numeric Formats | Format conversion |
| BB-3964 | `fixed_to_float_converter_multi_channel` | Numeric Formats | Format conversion |
| BB-3965 | `fixed_to_float_converter_programmable_precision` | Numeric Formats | Format conversion |
| BB-3966 | `fixed_to_float_converter_saturating` | Numeric Formats | Format conversion |
| BB-3967 | `fixed_to_float_converter_fault_detecting` | Numeric Formats | Format conversion |
| BB-3968 | `fixed_to_float_converter_low_power` | Numeric Formats | Format conversion |
| BB-3969 | `float_to_fixed_converter_combinational` | Numeric Formats | Format conversion |
| BB-3970 | `float_to_fixed_converter_single_cycle` | Numeric Formats | Format conversion |
| BB-3971 | `float_to_fixed_converter_shallow_pipeline` | Numeric Formats | Format conversion |
| BB-3972 | `float_to_fixed_converter_deep_pipeline` | Numeric Formats | Format conversion |
| BB-3973 | `float_to_fixed_converter_iterative` | Numeric Formats | Format conversion |
| BB-3974 | `float_to_fixed_converter_digit_serial` | Numeric Formats | Format conversion |
| BB-3975 | `float_to_fixed_converter_resource_shared` | Numeric Formats | Format conversion |
| BB-3976 | `float_to_fixed_converter_fully_parallel` | Numeric Formats | Format conversion |
| BB-3977 | `float_to_fixed_converter_vectorized` | Numeric Formats | Format conversion |
| BB-3978 | `float_to_fixed_converter_streaming` | Numeric Formats | Format conversion |
| BB-3979 | `float_to_fixed_converter_buffered_stream` | Numeric Formats | Format conversion |
| BB-3980 | `float_to_fixed_converter_multi_channel` | Numeric Formats | Format conversion |
| BB-3981 | `float_to_fixed_converter_programmable_precision` | Numeric Formats | Format conversion |
| BB-3982 | `float_to_fixed_converter_saturating` | Numeric Formats | Format conversion |
| BB-3983 | `float_to_fixed_converter_fault_detecting` | Numeric Formats | Format conversion |
| BB-3984 | `float_to_fixed_converter_low_power` | Numeric Formats | Format conversion |
| BB-3985 | `posit_format_converter_combinational` | Numeric Formats | Format conversion |
| BB-3986 | `posit_format_converter_single_cycle` | Numeric Formats | Format conversion |
| BB-3987 | `posit_format_converter_shallow_pipeline` | Numeric Formats | Format conversion |
| BB-3988 | `posit_format_converter_deep_pipeline` | Numeric Formats | Format conversion |
| BB-3989 | `posit_format_converter_iterative` | Numeric Formats | Format conversion |
| BB-3990 | `posit_format_converter_digit_serial` | Numeric Formats | Format conversion |
| BB-3991 | `posit_format_converter_resource_shared` | Numeric Formats | Format conversion |
| BB-3992 | `posit_format_converter_fully_parallel` | Numeric Formats | Format conversion |
| BB-3993 | `posit_format_converter_vectorized` | Numeric Formats | Format conversion |
| BB-3994 | `posit_format_converter_streaming` | Numeric Formats | Format conversion |
| BB-3995 | `posit_format_converter_buffered_stream` | Numeric Formats | Format conversion |
| BB-3996 | `posit_format_converter_multi_channel` | Numeric Formats | Format conversion |
| BB-3997 | `posit_format_converter_programmable_precision` | Numeric Formats | Format conversion |
| BB-3998 | `posit_format_converter_saturating` | Numeric Formats | Format conversion |
| BB-3999 | `posit_format_converter_fault_detecting` | Numeric Formats | Format conversion |
| BB-4000 | `posit_format_converter_low_power` | Numeric Formats | Format conversion |
| BB-4001 | `floating_point_dot_product_combinational` | Advanced Floating Point | Floating-point support |
| BB-4002 | `floating_point_dot_product_single_cycle` | Advanced Floating Point | Floating-point support |
| BB-4003 | `floating_point_dot_product_shallow_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4004 | `floating_point_dot_product_deep_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4005 | `floating_point_dot_product_iterative` | Advanced Floating Point | Floating-point support |
| BB-4006 | `floating_point_dot_product_digit_serial` | Advanced Floating Point | Floating-point support |
| BB-4007 | `floating_point_dot_product_resource_shared` | Advanced Floating Point | Floating-point support |
| BB-4008 | `floating_point_dot_product_fully_parallel` | Advanced Floating Point | Floating-point support |
| BB-4009 | `floating_point_dot_product_vectorized` | Advanced Floating Point | Floating-point support |
| BB-4010 | `floating_point_dot_product_streaming` | Advanced Floating Point | Floating-point support |
| BB-4011 | `floating_point_dot_product_buffered_stream` | Advanced Floating Point | Floating-point support |
| BB-4012 | `floating_point_dot_product_multi_channel` | Advanced Floating Point | Floating-point support |
| BB-4013 | `floating_point_dot_product_programmable_precision` | Advanced Floating Point | Floating-point support |
| BB-4014 | `floating_point_dot_product_saturating` | Advanced Floating Point | Floating-point support |
| BB-4015 | `floating_point_dot_product_fault_detecting` | Advanced Floating Point | Floating-point support |
| BB-4016 | `floating_point_dot_product_low_power` | Advanced Floating Point | Floating-point support |
| BB-4017 | `floating_point_matrix_fma_combinational` | Advanced Floating Point | Floating-point support |
| BB-4018 | `floating_point_matrix_fma_single_cycle` | Advanced Floating Point | Floating-point support |
| BB-4019 | `floating_point_matrix_fma_shallow_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4020 | `floating_point_matrix_fma_deep_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4021 | `floating_point_matrix_fma_iterative` | Advanced Floating Point | Floating-point support |
| BB-4022 | `floating_point_matrix_fma_digit_serial` | Advanced Floating Point | Floating-point support |
| BB-4023 | `floating_point_matrix_fma_resource_shared` | Advanced Floating Point | Floating-point support |
| BB-4024 | `floating_point_matrix_fma_fully_parallel` | Advanced Floating Point | Floating-point support |
| BB-4025 | `floating_point_matrix_fma_vectorized` | Advanced Floating Point | Floating-point support |
| BB-4026 | `floating_point_matrix_fma_streaming` | Advanced Floating Point | Floating-point support |
| BB-4027 | `floating_point_matrix_fma_buffered_stream` | Advanced Floating Point | Floating-point support |
| BB-4028 | `floating_point_matrix_fma_multi_channel` | Advanced Floating Point | Floating-point support |
| BB-4029 | `floating_point_matrix_fma_programmable_precision` | Advanced Floating Point | Floating-point support |
| BB-4030 | `floating_point_matrix_fma_saturating` | Advanced Floating Point | Floating-point support |
| BB-4031 | `floating_point_matrix_fma_fault_detecting` | Advanced Floating Point | Floating-point support |
| BB-4032 | `floating_point_matrix_fma_low_power` | Advanced Floating Point | Floating-point support |
| BB-4033 | `denormal_handler_combinational` | Advanced Floating Point | Floating-point support |
| BB-4034 | `denormal_handler_single_cycle` | Advanced Floating Point | Floating-point support |
| BB-4035 | `denormal_handler_shallow_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4036 | `denormal_handler_deep_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4037 | `denormal_handler_iterative` | Advanced Floating Point | Floating-point support |
| BB-4038 | `denormal_handler_digit_serial` | Advanced Floating Point | Floating-point support |
| BB-4039 | `denormal_handler_resource_shared` | Advanced Floating Point | Floating-point support |
| BB-4040 | `denormal_handler_fully_parallel` | Advanced Floating Point | Floating-point support |
| BB-4041 | `denormal_handler_vectorized` | Advanced Floating Point | Floating-point support |
| BB-4042 | `denormal_handler_streaming` | Advanced Floating Point | Floating-point support |
| BB-4043 | `denormal_handler_buffered_stream` | Advanced Floating Point | Floating-point support |
| BB-4044 | `denormal_handler_multi_channel` | Advanced Floating Point | Floating-point support |
| BB-4045 | `denormal_handler_programmable_precision` | Advanced Floating Point | Floating-point support |
| BB-4046 | `denormal_handler_saturating` | Advanced Floating Point | Floating-point support |
| BB-4047 | `denormal_handler_fault_detecting` | Advanced Floating Point | Floating-point support |
| BB-4048 | `denormal_handler_low_power` | Advanced Floating Point | Floating-point support |
| BB-4049 | `floating_point_rounding_unit_combinational` | Advanced Floating Point | Floating-point support |
| BB-4050 | `floating_point_rounding_unit_single_cycle` | Advanced Floating Point | Floating-point support |
| BB-4051 | `floating_point_rounding_unit_shallow_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4052 | `floating_point_rounding_unit_deep_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4053 | `floating_point_rounding_unit_iterative` | Advanced Floating Point | Floating-point support |
| BB-4054 | `floating_point_rounding_unit_digit_serial` | Advanced Floating Point | Floating-point support |
| BB-4055 | `floating_point_rounding_unit_resource_shared` | Advanced Floating Point | Floating-point support |
| BB-4056 | `floating_point_rounding_unit_fully_parallel` | Advanced Floating Point | Floating-point support |
| BB-4057 | `floating_point_rounding_unit_vectorized` | Advanced Floating Point | Floating-point support |
| BB-4058 | `floating_point_rounding_unit_streaming` | Advanced Floating Point | Floating-point support |
| BB-4059 | `floating_point_rounding_unit_buffered_stream` | Advanced Floating Point | Floating-point support |
| BB-4060 | `floating_point_rounding_unit_multi_channel` | Advanced Floating Point | Floating-point support |
| BB-4061 | `floating_point_rounding_unit_programmable_precision` | Advanced Floating Point | Floating-point support |
| BB-4062 | `floating_point_rounding_unit_saturating` | Advanced Floating Point | Floating-point support |
| BB-4063 | `floating_point_rounding_unit_fault_detecting` | Advanced Floating Point | Floating-point support |
| BB-4064 | `floating_point_rounding_unit_low_power` | Advanced Floating Point | Floating-point support |
| BB-4065 | `floating_point_exception_unit_combinational` | Advanced Floating Point | Floating-point support |
| BB-4066 | `floating_point_exception_unit_single_cycle` | Advanced Floating Point | Floating-point support |
| BB-4067 | `floating_point_exception_unit_shallow_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4068 | `floating_point_exception_unit_deep_pipeline` | Advanced Floating Point | Floating-point support |
| BB-4069 | `floating_point_exception_unit_iterative` | Advanced Floating Point | Floating-point support |
| BB-4070 | `floating_point_exception_unit_digit_serial` | Advanced Floating Point | Floating-point support |
| BB-4071 | `floating_point_exception_unit_resource_shared` | Advanced Floating Point | Floating-point support |
| BB-4072 | `floating_point_exception_unit_fully_parallel` | Advanced Floating Point | Floating-point support |
| BB-4073 | `floating_point_exception_unit_vectorized` | Advanced Floating Point | Floating-point support |
| BB-4074 | `floating_point_exception_unit_streaming` | Advanced Floating Point | Floating-point support |
| BB-4075 | `floating_point_exception_unit_buffered_stream` | Advanced Floating Point | Floating-point support |
| BB-4076 | `floating_point_exception_unit_multi_channel` | Advanced Floating Point | Floating-point support |
| BB-4077 | `floating_point_exception_unit_programmable_precision` | Advanced Floating Point | Floating-point support |
| BB-4078 | `floating_point_exception_unit_saturating` | Advanced Floating Point | Floating-point support |
| BB-4079 | `floating_point_exception_unit_fault_detecting` | Advanced Floating Point | Floating-point support |
| BB-4080 | `floating_point_exception_unit_low_power` | Advanced Floating Point | Floating-point support |
| BB-4081 | `decimal_adder_combinational` | Decimal Arithmetic | Decimal datapaths |
| BB-4082 | `decimal_adder_single_cycle` | Decimal Arithmetic | Decimal datapaths |
| BB-4083 | `decimal_adder_shallow_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4084 | `decimal_adder_deep_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4085 | `decimal_adder_iterative` | Decimal Arithmetic | Decimal datapaths |
| BB-4086 | `decimal_adder_digit_serial` | Decimal Arithmetic | Decimal datapaths |
| BB-4087 | `decimal_adder_resource_shared` | Decimal Arithmetic | Decimal datapaths |
| BB-4088 | `decimal_adder_fully_parallel` | Decimal Arithmetic | Decimal datapaths |
| BB-4089 | `decimal_adder_vectorized` | Decimal Arithmetic | Decimal datapaths |
| BB-4090 | `decimal_adder_streaming` | Decimal Arithmetic | Decimal datapaths |
| BB-4091 | `decimal_adder_buffered_stream` | Decimal Arithmetic | Decimal datapaths |
| BB-4092 | `decimal_adder_multi_channel` | Decimal Arithmetic | Decimal datapaths |
| BB-4093 | `decimal_adder_programmable_precision` | Decimal Arithmetic | Decimal datapaths |
| BB-4094 | `decimal_adder_saturating` | Decimal Arithmetic | Decimal datapaths |
| BB-4095 | `decimal_adder_fault_detecting` | Decimal Arithmetic | Decimal datapaths |
| BB-4096 | `decimal_adder_low_power` | Decimal Arithmetic | Decimal datapaths |
| BB-4097 | `decimal_multiplier_combinational` | Decimal Arithmetic | Decimal datapaths |
| BB-4098 | `decimal_multiplier_single_cycle` | Decimal Arithmetic | Decimal datapaths |
| BB-4099 | `decimal_multiplier_shallow_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4100 | `decimal_multiplier_deep_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4101 | `decimal_multiplier_iterative` | Decimal Arithmetic | Decimal datapaths |
| BB-4102 | `decimal_multiplier_digit_serial` | Decimal Arithmetic | Decimal datapaths |
| BB-4103 | `decimal_multiplier_resource_shared` | Decimal Arithmetic | Decimal datapaths |
| BB-4104 | `decimal_multiplier_fully_parallel` | Decimal Arithmetic | Decimal datapaths |
| BB-4105 | `decimal_multiplier_vectorized` | Decimal Arithmetic | Decimal datapaths |
| BB-4106 | `decimal_multiplier_streaming` | Decimal Arithmetic | Decimal datapaths |
| BB-4107 | `decimal_multiplier_buffered_stream` | Decimal Arithmetic | Decimal datapaths |
| BB-4108 | `decimal_multiplier_multi_channel` | Decimal Arithmetic | Decimal datapaths |
| BB-4109 | `decimal_multiplier_programmable_precision` | Decimal Arithmetic | Decimal datapaths |
| BB-4110 | `decimal_multiplier_saturating` | Decimal Arithmetic | Decimal datapaths |
| BB-4111 | `decimal_multiplier_fault_detecting` | Decimal Arithmetic | Decimal datapaths |
| BB-4112 | `decimal_multiplier_low_power` | Decimal Arithmetic | Decimal datapaths |
| BB-4113 | `decimal_divider_combinational` | Decimal Arithmetic | Decimal datapaths |
| BB-4114 | `decimal_divider_single_cycle` | Decimal Arithmetic | Decimal datapaths |
| BB-4115 | `decimal_divider_shallow_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4116 | `decimal_divider_deep_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4117 | `decimal_divider_iterative` | Decimal Arithmetic | Decimal datapaths |
| BB-4118 | `decimal_divider_digit_serial` | Decimal Arithmetic | Decimal datapaths |
| BB-4119 | `decimal_divider_resource_shared` | Decimal Arithmetic | Decimal datapaths |
| BB-4120 | `decimal_divider_fully_parallel` | Decimal Arithmetic | Decimal datapaths |
| BB-4121 | `decimal_divider_vectorized` | Decimal Arithmetic | Decimal datapaths |
| BB-4122 | `decimal_divider_streaming` | Decimal Arithmetic | Decimal datapaths |
| BB-4123 | `decimal_divider_buffered_stream` | Decimal Arithmetic | Decimal datapaths |
| BB-4124 | `decimal_divider_multi_channel` | Decimal Arithmetic | Decimal datapaths |
| BB-4125 | `decimal_divider_programmable_precision` | Decimal Arithmetic | Decimal datapaths |
| BB-4126 | `decimal_divider_saturating` | Decimal Arithmetic | Decimal datapaths |
| BB-4127 | `decimal_divider_fault_detecting` | Decimal Arithmetic | Decimal datapaths |
| BB-4128 | `decimal_divider_low_power` | Decimal Arithmetic | Decimal datapaths |
| BB-4129 | `decimal_rounder_combinational` | Decimal Arithmetic | Decimal datapaths |
| BB-4130 | `decimal_rounder_single_cycle` | Decimal Arithmetic | Decimal datapaths |
| BB-4131 | `decimal_rounder_shallow_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4132 | `decimal_rounder_deep_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4133 | `decimal_rounder_iterative` | Decimal Arithmetic | Decimal datapaths |
| BB-4134 | `decimal_rounder_digit_serial` | Decimal Arithmetic | Decimal datapaths |
| BB-4135 | `decimal_rounder_resource_shared` | Decimal Arithmetic | Decimal datapaths |
| BB-4136 | `decimal_rounder_fully_parallel` | Decimal Arithmetic | Decimal datapaths |
| BB-4137 | `decimal_rounder_vectorized` | Decimal Arithmetic | Decimal datapaths |
| BB-4138 | `decimal_rounder_streaming` | Decimal Arithmetic | Decimal datapaths |
| BB-4139 | `decimal_rounder_buffered_stream` | Decimal Arithmetic | Decimal datapaths |
| BB-4140 | `decimal_rounder_multi_channel` | Decimal Arithmetic | Decimal datapaths |
| BB-4141 | `decimal_rounder_programmable_precision` | Decimal Arithmetic | Decimal datapaths |
| BB-4142 | `decimal_rounder_saturating` | Decimal Arithmetic | Decimal datapaths |
| BB-4143 | `decimal_rounder_fault_detecting` | Decimal Arithmetic | Decimal datapaths |
| BB-4144 | `decimal_rounder_low_power` | Decimal Arithmetic | Decimal datapaths |
| BB-4145 | `packed_bcd_alu_combinational` | Decimal Arithmetic | Decimal datapaths |
| BB-4146 | `packed_bcd_alu_single_cycle` | Decimal Arithmetic | Decimal datapaths |
| BB-4147 | `packed_bcd_alu_shallow_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4148 | `packed_bcd_alu_deep_pipeline` | Decimal Arithmetic | Decimal datapaths |
| BB-4149 | `packed_bcd_alu_iterative` | Decimal Arithmetic | Decimal datapaths |
| BB-4150 | `packed_bcd_alu_digit_serial` | Decimal Arithmetic | Decimal datapaths |
| BB-4151 | `packed_bcd_alu_resource_shared` | Decimal Arithmetic | Decimal datapaths |
| BB-4152 | `packed_bcd_alu_fully_parallel` | Decimal Arithmetic | Decimal datapaths |
| BB-4153 | `packed_bcd_alu_vectorized` | Decimal Arithmetic | Decimal datapaths |
| BB-4154 | `packed_bcd_alu_streaming` | Decimal Arithmetic | Decimal datapaths |
| BB-4155 | `packed_bcd_alu_buffered_stream` | Decimal Arithmetic | Decimal datapaths |
| BB-4156 | `packed_bcd_alu_multi_channel` | Decimal Arithmetic | Decimal datapaths |
| BB-4157 | `packed_bcd_alu_programmable_precision` | Decimal Arithmetic | Decimal datapaths |
| BB-4158 | `packed_bcd_alu_saturating` | Decimal Arithmetic | Decimal datapaths |
| BB-4159 | `packed_bcd_alu_fault_detecting` | Decimal Arithmetic | Decimal datapaths |
| BB-4160 | `packed_bcd_alu_low_power` | Decimal Arithmetic | Decimal datapaths |
| BB-4161 | `lfsr_random_generator_single_lane` | Statistics and Random | Random and online statistics |
| BB-4162 | `lfsr_random_generator_multi_lane` | Statistics and Random | Random and online statistics |
| BB-4163 | `lfsr_random_generator_pipelined` | Statistics and Random | Random and online statistics |
| BB-4164 | `lfsr_random_generator_deep_pipelined` | Statistics and Random | Random and online statistics |
| BB-4165 | `lfsr_random_generator_frame_aware` | Statistics and Random | Random and online statistics |
| BB-4166 | `lfsr_random_generator_packet_aware` | Statistics and Random | Random and online statistics |
| BB-4167 | `lfsr_random_generator_backpressure_capable` | Statistics and Random | Random and online statistics |
| BB-4168 | `lfsr_random_generator_rate_adaptive` | Statistics and Random | Random and online statistics |
| BB-4169 | `lfsr_random_generator_time_multiplexed` | Statistics and Random | Random and online statistics |
| BB-4170 | `lfsr_random_generator_fully_parallel` | Statistics and Random | Random and online statistics |
| BB-4171 | `lfsr_random_generator_buffered` | Statistics and Random | Random and online statistics |
| BB-4172 | `lfsr_random_generator_clock_crossing` | Statistics and Random | Random and online statistics |
| BB-4173 | `lfsr_random_generator_error_detecting` | Statistics and Random | Random and online statistics |
| BB-4174 | `lfsr_random_generator_formally_instrumented` | Statistics and Random | Random and online statistics |
| BB-4175 | `lfsr_random_generator_low_power` | Statistics and Random | Random and online statistics |
| BB-4176 | `lfsr_random_generator_axi_stream` | Statistics and Random | Random and online statistics |
| BB-4177 | `xorshift_random_generator_single_lane` | Statistics and Random | Random and online statistics |
| BB-4178 | `xorshift_random_generator_multi_lane` | Statistics and Random | Random and online statistics |
| BB-4179 | `xorshift_random_generator_pipelined` | Statistics and Random | Random and online statistics |
| BB-4180 | `xorshift_random_generator_deep_pipelined` | Statistics and Random | Random and online statistics |
| BB-4181 | `xorshift_random_generator_frame_aware` | Statistics and Random | Random and online statistics |
| BB-4182 | `xorshift_random_generator_packet_aware` | Statistics and Random | Random and online statistics |
| BB-4183 | `xorshift_random_generator_backpressure_capable` | Statistics and Random | Random and online statistics |
| BB-4184 | `xorshift_random_generator_rate_adaptive` | Statistics and Random | Random and online statistics |
| BB-4185 | `xorshift_random_generator_time_multiplexed` | Statistics and Random | Random and online statistics |
| BB-4186 | `xorshift_random_generator_fully_parallel` | Statistics and Random | Random and online statistics |
| BB-4187 | `xorshift_random_generator_buffered` | Statistics and Random | Random and online statistics |
| BB-4188 | `xorshift_random_generator_clock_crossing` | Statistics and Random | Random and online statistics |
| BB-4189 | `xorshift_random_generator_error_detecting` | Statistics and Random | Random and online statistics |
| BB-4190 | `xorshift_random_generator_formally_instrumented` | Statistics and Random | Random and online statistics |
| BB-4191 | `xorshift_random_generator_low_power` | Statistics and Random | Random and online statistics |
| BB-4192 | `xorshift_random_generator_axi_stream` | Statistics and Random | Random and online statistics |
| BB-4193 | `gaussian_noise_generator_single_lane` | Statistics and Random | Random and online statistics |
| BB-4194 | `gaussian_noise_generator_multi_lane` | Statistics and Random | Random and online statistics |
| BB-4195 | `gaussian_noise_generator_pipelined` | Statistics and Random | Random and online statistics |
| BB-4196 | `gaussian_noise_generator_deep_pipelined` | Statistics and Random | Random and online statistics |
| BB-4197 | `gaussian_noise_generator_frame_aware` | Statistics and Random | Random and online statistics |
| BB-4198 | `gaussian_noise_generator_packet_aware` | Statistics and Random | Random and online statistics |
| BB-4199 | `gaussian_noise_generator_backpressure_capable` | Statistics and Random | Random and online statistics |
| BB-4200 | `gaussian_noise_generator_rate_adaptive` | Statistics and Random | Random and online statistics |
| BB-4201 | `gaussian_noise_generator_time_multiplexed` | Statistics and Random | Random and online statistics |
| BB-4202 | `gaussian_noise_generator_fully_parallel` | Statistics and Random | Random and online statistics |
| BB-4203 | `gaussian_noise_generator_buffered` | Statistics and Random | Random and online statistics |
| BB-4204 | `gaussian_noise_generator_clock_crossing` | Statistics and Random | Random and online statistics |
| BB-4205 | `gaussian_noise_generator_error_detecting` | Statistics and Random | Random and online statistics |
| BB-4206 | `gaussian_noise_generator_formally_instrumented` | Statistics and Random | Random and online statistics |
| BB-4207 | `gaussian_noise_generator_low_power` | Statistics and Random | Random and online statistics |
| BB-4208 | `gaussian_noise_generator_axi_stream` | Statistics and Random | Random and online statistics |
| BB-4209 | `running_variance_engine_single_lane` | Statistics and Random | Random and online statistics |
| BB-4210 | `running_variance_engine_multi_lane` | Statistics and Random | Random and online statistics |
| BB-4211 | `running_variance_engine_pipelined` | Statistics and Random | Random and online statistics |
| BB-4212 | `running_variance_engine_deep_pipelined` | Statistics and Random | Random and online statistics |
| BB-4213 | `running_variance_engine_frame_aware` | Statistics and Random | Random and online statistics |
| BB-4214 | `running_variance_engine_packet_aware` | Statistics and Random | Random and online statistics |
| BB-4215 | `running_variance_engine_backpressure_capable` | Statistics and Random | Random and online statistics |
| BB-4216 | `running_variance_engine_rate_adaptive` | Statistics and Random | Random and online statistics |
| BB-4217 | `running_variance_engine_time_multiplexed` | Statistics and Random | Random and online statistics |
| BB-4218 | `running_variance_engine_fully_parallel` | Statistics and Random | Random and online statistics |
| BB-4219 | `running_variance_engine_buffered` | Statistics and Random | Random and online statistics |
| BB-4220 | `running_variance_engine_clock_crossing` | Statistics and Random | Random and online statistics |
| BB-4221 | `running_variance_engine_error_detecting` | Statistics and Random | Random and online statistics |
| BB-4222 | `running_variance_engine_formally_instrumented` | Statistics and Random | Random and online statistics |
| BB-4223 | `running_variance_engine_low_power` | Statistics and Random | Random and online statistics |
| BB-4224 | `running_variance_engine_axi_stream` | Statistics and Random | Random and online statistics |
| BB-4225 | `percentile_estimator_single_lane` | Statistics and Random | Random and online statistics |
| BB-4226 | `percentile_estimator_multi_lane` | Statistics and Random | Random and online statistics |
| BB-4227 | `percentile_estimator_pipelined` | Statistics and Random | Random and online statistics |
| BB-4228 | `percentile_estimator_deep_pipelined` | Statistics and Random | Random and online statistics |
| BB-4229 | `percentile_estimator_frame_aware` | Statistics and Random | Random and online statistics |
| BB-4230 | `percentile_estimator_packet_aware` | Statistics and Random | Random and online statistics |
| BB-4231 | `percentile_estimator_backpressure_capable` | Statistics and Random | Random and online statistics |
| BB-4232 | `percentile_estimator_rate_adaptive` | Statistics and Random | Random and online statistics |
| BB-4233 | `percentile_estimator_time_multiplexed` | Statistics and Random | Random and online statistics |
| BB-4234 | `percentile_estimator_fully_parallel` | Statistics and Random | Random and online statistics |
| BB-4235 | `percentile_estimator_buffered` | Statistics and Random | Random and online statistics |
| BB-4236 | `percentile_estimator_clock_crossing` | Statistics and Random | Random and online statistics |
| BB-4237 | `percentile_estimator_error_detecting` | Statistics and Random | Random and online statistics |
| BB-4238 | `percentile_estimator_formally_instrumented` | Statistics and Random | Random and online statistics |
| BB-4239 | `percentile_estimator_low_power` | Statistics and Random | Random and online statistics |
| BB-4240 | `percentile_estimator_axi_stream` | Statistics and Random | Random and online statistics |
| BB-4241 | `perceptron_branch_predictor_single_shot` | CPU Branch Prediction | Prediction structures |
| BB-4242 | `perceptron_branch_predictor_continuous` | CPU Branch Prediction | Prediction structures |
| BB-4243 | `perceptron_branch_predictor_microcoded` | CPU Branch Prediction | Prediction structures |
| BB-4244 | `perceptron_branch_predictor_table_driven` | CPU Branch Prediction | Prediction structures |
| BB-4245 | `perceptron_branch_predictor_multi_channel` | CPU Branch Prediction | Prediction structures |
| BB-4246 | `perceptron_branch_predictor_queued` | CPU Branch Prediction | Prediction structures |
| BB-4247 | `perceptron_branch_predictor_priority_aware` | CPU Branch Prediction | Prediction structures |
| BB-4248 | `perceptron_branch_predictor_deadline_aware` | CPU Branch Prediction | Prediction structures |
| BB-4249 | `perceptron_branch_predictor_redundant` | CPU Branch Prediction | Prediction structures |
| BB-4250 | `perceptron_branch_predictor_lockstep_checked` | CPU Branch Prediction | Prediction structures |
| BB-4251 | `perceptron_branch_predictor_formally_instrumented` | CPU Branch Prediction | Prediction structures |
| BB-4252 | `perceptron_branch_predictor_low_power` | CPU Branch Prediction | Prediction structures |
| BB-4253 | `perceptron_branch_predictor_clock_crossing` | CPU Branch Prediction | Prediction structures |
| BB-4254 | `perceptron_branch_predictor_software_configurable` | CPU Branch Prediction | Prediction structures |
| BB-4255 | `perceptron_branch_predictor_event_driven` | CPU Branch Prediction | Prediction structures |
| BB-4256 | `perceptron_branch_predictor_fail_safe` | CPU Branch Prediction | Prediction structures |
| BB-4257 | `tagged_geometric_predictor_single_shot` | CPU Branch Prediction | Prediction structures |
| BB-4258 | `tagged_geometric_predictor_continuous` | CPU Branch Prediction | Prediction structures |
| BB-4259 | `tagged_geometric_predictor_microcoded` | CPU Branch Prediction | Prediction structures |
| BB-4260 | `tagged_geometric_predictor_table_driven` | CPU Branch Prediction | Prediction structures |
| BB-4261 | `tagged_geometric_predictor_multi_channel` | CPU Branch Prediction | Prediction structures |
| BB-4262 | `tagged_geometric_predictor_queued` | CPU Branch Prediction | Prediction structures |
| BB-4263 | `tagged_geometric_predictor_priority_aware` | CPU Branch Prediction | Prediction structures |
| BB-4264 | `tagged_geometric_predictor_deadline_aware` | CPU Branch Prediction | Prediction structures |
| BB-4265 | `tagged_geometric_predictor_redundant` | CPU Branch Prediction | Prediction structures |
| BB-4266 | `tagged_geometric_predictor_lockstep_checked` | CPU Branch Prediction | Prediction structures |
| BB-4267 | `tagged_geometric_predictor_formally_instrumented` | CPU Branch Prediction | Prediction structures |
| BB-4268 | `tagged_geometric_predictor_low_power` | CPU Branch Prediction | Prediction structures |
| BB-4269 | `tagged_geometric_predictor_clock_crossing` | CPU Branch Prediction | Prediction structures |
| BB-4270 | `tagged_geometric_predictor_software_configurable` | CPU Branch Prediction | Prediction structures |
| BB-4271 | `tagged_geometric_predictor_event_driven` | CPU Branch Prediction | Prediction structures |
| BB-4272 | `tagged_geometric_predictor_fail_safe` | CPU Branch Prediction | Prediction structures |
| BB-4273 | `loop_branch_predictor_single_shot` | CPU Branch Prediction | Prediction structures |
| BB-4274 | `loop_branch_predictor_continuous` | CPU Branch Prediction | Prediction structures |
| BB-4275 | `loop_branch_predictor_microcoded` | CPU Branch Prediction | Prediction structures |
| BB-4276 | `loop_branch_predictor_table_driven` | CPU Branch Prediction | Prediction structures |
| BB-4277 | `loop_branch_predictor_multi_channel` | CPU Branch Prediction | Prediction structures |
| BB-4278 | `loop_branch_predictor_queued` | CPU Branch Prediction | Prediction structures |
| BB-4279 | `loop_branch_predictor_priority_aware` | CPU Branch Prediction | Prediction structures |
| BB-4280 | `loop_branch_predictor_deadline_aware` | CPU Branch Prediction | Prediction structures |
| BB-4281 | `loop_branch_predictor_redundant` | CPU Branch Prediction | Prediction structures |
| BB-4282 | `loop_branch_predictor_lockstep_checked` | CPU Branch Prediction | Prediction structures |
| BB-4283 | `loop_branch_predictor_formally_instrumented` | CPU Branch Prediction | Prediction structures |
| BB-4284 | `loop_branch_predictor_low_power` | CPU Branch Prediction | Prediction structures |
| BB-4285 | `loop_branch_predictor_clock_crossing` | CPU Branch Prediction | Prediction structures |
| BB-4286 | `loop_branch_predictor_software_configurable` | CPU Branch Prediction | Prediction structures |
| BB-4287 | `loop_branch_predictor_event_driven` | CPU Branch Prediction | Prediction structures |
| BB-4288 | `loop_branch_predictor_fail_safe` | CPU Branch Prediction | Prediction structures |
| BB-4289 | `indirect_branch_predictor_single_shot` | CPU Branch Prediction | Prediction structures |
| BB-4290 | `indirect_branch_predictor_continuous` | CPU Branch Prediction | Prediction structures |
| BB-4291 | `indirect_branch_predictor_microcoded` | CPU Branch Prediction | Prediction structures |
| BB-4292 | `indirect_branch_predictor_table_driven` | CPU Branch Prediction | Prediction structures |
| BB-4293 | `indirect_branch_predictor_multi_channel` | CPU Branch Prediction | Prediction structures |
| BB-4294 | `indirect_branch_predictor_queued` | CPU Branch Prediction | Prediction structures |
| BB-4295 | `indirect_branch_predictor_priority_aware` | CPU Branch Prediction | Prediction structures |
| BB-4296 | `indirect_branch_predictor_deadline_aware` | CPU Branch Prediction | Prediction structures |
| BB-4297 | `indirect_branch_predictor_redundant` | CPU Branch Prediction | Prediction structures |
| BB-4298 | `indirect_branch_predictor_lockstep_checked` | CPU Branch Prediction | Prediction structures |
| BB-4299 | `indirect_branch_predictor_formally_instrumented` | CPU Branch Prediction | Prediction structures |
| BB-4300 | `indirect_branch_predictor_low_power` | CPU Branch Prediction | Prediction structures |
| BB-4301 | `indirect_branch_predictor_clock_crossing` | CPU Branch Prediction | Prediction structures |
| BB-4302 | `indirect_branch_predictor_software_configurable` | CPU Branch Prediction | Prediction structures |
| BB-4303 | `indirect_branch_predictor_event_driven` | CPU Branch Prediction | Prediction structures |
| BB-4304 | `indirect_branch_predictor_fail_safe` | CPU Branch Prediction | Prediction structures |
| BB-4305 | `branch_confidence_estimator_single_shot` | CPU Branch Prediction | Prediction structures |
| BB-4306 | `branch_confidence_estimator_continuous` | CPU Branch Prediction | Prediction structures |
| BB-4307 | `branch_confidence_estimator_microcoded` | CPU Branch Prediction | Prediction structures |
| BB-4308 | `branch_confidence_estimator_table_driven` | CPU Branch Prediction | Prediction structures |
| BB-4309 | `branch_confidence_estimator_multi_channel` | CPU Branch Prediction | Prediction structures |
| BB-4310 | `branch_confidence_estimator_queued` | CPU Branch Prediction | Prediction structures |
| BB-4311 | `branch_confidence_estimator_priority_aware` | CPU Branch Prediction | Prediction structures |
| BB-4312 | `branch_confidence_estimator_deadline_aware` | CPU Branch Prediction | Prediction structures |
| BB-4313 | `branch_confidence_estimator_redundant` | CPU Branch Prediction | Prediction structures |
| BB-4314 | `branch_confidence_estimator_lockstep_checked` | CPU Branch Prediction | Prediction structures |
| BB-4315 | `branch_confidence_estimator_formally_instrumented` | CPU Branch Prediction | Prediction structures |
| BB-4316 | `branch_confidence_estimator_low_power` | CPU Branch Prediction | Prediction structures |
| BB-4317 | `branch_confidence_estimator_clock_crossing` | CPU Branch Prediction | Prediction structures |
| BB-4318 | `branch_confidence_estimator_software_configurable` | CPU Branch Prediction | Prediction structures |
| BB-4319 | `branch_confidence_estimator_event_driven` | CPU Branch Prediction | Prediction structures |
| BB-4320 | `branch_confidence_estimator_fail_safe` | CPU Branch Prediction | Prediction structures |
| BB-4321 | `physical_register_renamer_single_shot` | CPU Rename and Scheduling | Rename and issue |
| BB-4322 | `physical_register_renamer_continuous` | CPU Rename and Scheduling | Rename and issue |
| BB-4323 | `physical_register_renamer_microcoded` | CPU Rename and Scheduling | Rename and issue |
| BB-4324 | `physical_register_renamer_table_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4325 | `physical_register_renamer_multi_channel` | CPU Rename and Scheduling | Rename and issue |
| BB-4326 | `physical_register_renamer_queued` | CPU Rename and Scheduling | Rename and issue |
| BB-4327 | `physical_register_renamer_priority_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4328 | `physical_register_renamer_deadline_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4329 | `physical_register_renamer_redundant` | CPU Rename and Scheduling | Rename and issue |
| BB-4330 | `physical_register_renamer_lockstep_checked` | CPU Rename and Scheduling | Rename and issue |
| BB-4331 | `physical_register_renamer_formally_instrumented` | CPU Rename and Scheduling | Rename and issue |
| BB-4332 | `physical_register_renamer_low_power` | CPU Rename and Scheduling | Rename and issue |
| BB-4333 | `physical_register_renamer_clock_crossing` | CPU Rename and Scheduling | Rename and issue |
| BB-4334 | `physical_register_renamer_software_configurable` | CPU Rename and Scheduling | Rename and issue |
| BB-4335 | `physical_register_renamer_event_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4336 | `physical_register_renamer_fail_safe` | CPU Rename and Scheduling | Rename and issue |
| BB-4337 | `free_list_allocator_single_shot` | CPU Rename and Scheduling | Rename and issue |
| BB-4338 | `free_list_allocator_continuous` | CPU Rename and Scheduling | Rename and issue |
| BB-4339 | `free_list_allocator_microcoded` | CPU Rename and Scheduling | Rename and issue |
| BB-4340 | `free_list_allocator_table_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4341 | `free_list_allocator_multi_channel` | CPU Rename and Scheduling | Rename and issue |
| BB-4342 | `free_list_allocator_queued` | CPU Rename and Scheduling | Rename and issue |
| BB-4343 | `free_list_allocator_priority_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4344 | `free_list_allocator_deadline_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4345 | `free_list_allocator_redundant` | CPU Rename and Scheduling | Rename and issue |
| BB-4346 | `free_list_allocator_lockstep_checked` | CPU Rename and Scheduling | Rename and issue |
| BB-4347 | `free_list_allocator_formally_instrumented` | CPU Rename and Scheduling | Rename and issue |
| BB-4348 | `free_list_allocator_low_power` | CPU Rename and Scheduling | Rename and issue |
| BB-4349 | `free_list_allocator_clock_crossing` | CPU Rename and Scheduling | Rename and issue |
| BB-4350 | `free_list_allocator_software_configurable` | CPU Rename and Scheduling | Rename and issue |
| BB-4351 | `free_list_allocator_event_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4352 | `free_list_allocator_fail_safe` | CPU Rename and Scheduling | Rename and issue |
| BB-4353 | `wakeup_select_unit_single_shot` | CPU Rename and Scheduling | Rename and issue |
| BB-4354 | `wakeup_select_unit_continuous` | CPU Rename and Scheduling | Rename and issue |
| BB-4355 | `wakeup_select_unit_microcoded` | CPU Rename and Scheduling | Rename and issue |
| BB-4356 | `wakeup_select_unit_table_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4357 | `wakeup_select_unit_multi_channel` | CPU Rename and Scheduling | Rename and issue |
| BB-4358 | `wakeup_select_unit_queued` | CPU Rename and Scheduling | Rename and issue |
| BB-4359 | `wakeup_select_unit_priority_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4360 | `wakeup_select_unit_deadline_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4361 | `wakeup_select_unit_redundant` | CPU Rename and Scheduling | Rename and issue |
| BB-4362 | `wakeup_select_unit_lockstep_checked` | CPU Rename and Scheduling | Rename and issue |
| BB-4363 | `wakeup_select_unit_formally_instrumented` | CPU Rename and Scheduling | Rename and issue |
| BB-4364 | `wakeup_select_unit_low_power` | CPU Rename and Scheduling | Rename and issue |
| BB-4365 | `wakeup_select_unit_clock_crossing` | CPU Rename and Scheduling | Rename and issue |
| BB-4366 | `wakeup_select_unit_software_configurable` | CPU Rename and Scheduling | Rename and issue |
| BB-4367 | `wakeup_select_unit_event_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4368 | `wakeup_select_unit_fail_safe` | CPU Rename and Scheduling | Rename and issue |
| BB-4369 | `dependency_matrix_scheduler_single_shot` | CPU Rename and Scheduling | Rename and issue |
| BB-4370 | `dependency_matrix_scheduler_continuous` | CPU Rename and Scheduling | Rename and issue |
| BB-4371 | `dependency_matrix_scheduler_microcoded` | CPU Rename and Scheduling | Rename and issue |
| BB-4372 | `dependency_matrix_scheduler_table_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4373 | `dependency_matrix_scheduler_multi_channel` | CPU Rename and Scheduling | Rename and issue |
| BB-4374 | `dependency_matrix_scheduler_queued` | CPU Rename and Scheduling | Rename and issue |
| BB-4375 | `dependency_matrix_scheduler_priority_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4376 | `dependency_matrix_scheduler_deadline_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4377 | `dependency_matrix_scheduler_redundant` | CPU Rename and Scheduling | Rename and issue |
| BB-4378 | `dependency_matrix_scheduler_lockstep_checked` | CPU Rename and Scheduling | Rename and issue |
| BB-4379 | `dependency_matrix_scheduler_formally_instrumented` | CPU Rename and Scheduling | Rename and issue |
| BB-4380 | `dependency_matrix_scheduler_low_power` | CPU Rename and Scheduling | Rename and issue |
| BB-4381 | `dependency_matrix_scheduler_clock_crossing` | CPU Rename and Scheduling | Rename and issue |
| BB-4382 | `dependency_matrix_scheduler_software_configurable` | CPU Rename and Scheduling | Rename and issue |
| BB-4383 | `dependency_matrix_scheduler_event_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4384 | `dependency_matrix_scheduler_fail_safe` | CPU Rename and Scheduling | Rename and issue |
| BB-4385 | `microop_replay_queue_single_shot` | CPU Rename and Scheduling | Rename and issue |
| BB-4386 | `microop_replay_queue_continuous` | CPU Rename and Scheduling | Rename and issue |
| BB-4387 | `microop_replay_queue_microcoded` | CPU Rename and Scheduling | Rename and issue |
| BB-4388 | `microop_replay_queue_table_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4389 | `microop_replay_queue_multi_channel` | CPU Rename and Scheduling | Rename and issue |
| BB-4390 | `microop_replay_queue_queued` | CPU Rename and Scheduling | Rename and issue |
| BB-4391 | `microop_replay_queue_priority_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4392 | `microop_replay_queue_deadline_aware` | CPU Rename and Scheduling | Rename and issue |
| BB-4393 | `microop_replay_queue_redundant` | CPU Rename and Scheduling | Rename and issue |
| BB-4394 | `microop_replay_queue_lockstep_checked` | CPU Rename and Scheduling | Rename and issue |
| BB-4395 | `microop_replay_queue_formally_instrumented` | CPU Rename and Scheduling | Rename and issue |
| BB-4396 | `microop_replay_queue_low_power` | CPU Rename and Scheduling | Rename and issue |
| BB-4397 | `microop_replay_queue_clock_crossing` | CPU Rename and Scheduling | Rename and issue |
| BB-4398 | `microop_replay_queue_software_configurable` | CPU Rename and Scheduling | Rename and issue |
| BB-4399 | `microop_replay_queue_event_driven` | CPU Rename and Scheduling | Rename and issue |
| BB-4400 | `microop_replay_queue_fail_safe` | CPU Rename and Scheduling | Rename and issue |
| BB-4401 | `reorder_commit_engine_single_shot` | CPU Retirement and Recovery | Commit and recovery |
| BB-4402 | `reorder_commit_engine_continuous` | CPU Retirement and Recovery | Commit and recovery |
| BB-4403 | `reorder_commit_engine_microcoded` | CPU Retirement and Recovery | Commit and recovery |
| BB-4404 | `reorder_commit_engine_table_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4405 | `reorder_commit_engine_multi_channel` | CPU Retirement and Recovery | Commit and recovery |
| BB-4406 | `reorder_commit_engine_queued` | CPU Retirement and Recovery | Commit and recovery |
| BB-4407 | `reorder_commit_engine_priority_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4408 | `reorder_commit_engine_deadline_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4409 | `reorder_commit_engine_redundant` | CPU Retirement and Recovery | Commit and recovery |
| BB-4410 | `reorder_commit_engine_lockstep_checked` | CPU Retirement and Recovery | Commit and recovery |
| BB-4411 | `reorder_commit_engine_formally_instrumented` | CPU Retirement and Recovery | Commit and recovery |
| BB-4412 | `reorder_commit_engine_low_power` | CPU Retirement and Recovery | Commit and recovery |
| BB-4413 | `reorder_commit_engine_clock_crossing` | CPU Retirement and Recovery | Commit and recovery |
| BB-4414 | `reorder_commit_engine_software_configurable` | CPU Retirement and Recovery | Commit and recovery |
| BB-4415 | `reorder_commit_engine_event_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4416 | `reorder_commit_engine_fail_safe` | CPU Retirement and Recovery | Commit and recovery |
| BB-4417 | `precise_state_recovery_single_shot` | CPU Retirement and Recovery | Commit and recovery |
| BB-4418 | `precise_state_recovery_continuous` | CPU Retirement and Recovery | Commit and recovery |
| BB-4419 | `precise_state_recovery_microcoded` | CPU Retirement and Recovery | Commit and recovery |
| BB-4420 | `precise_state_recovery_table_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4421 | `precise_state_recovery_multi_channel` | CPU Retirement and Recovery | Commit and recovery |
| BB-4422 | `precise_state_recovery_queued` | CPU Retirement and Recovery | Commit and recovery |
| BB-4423 | `precise_state_recovery_priority_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4424 | `precise_state_recovery_deadline_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4425 | `precise_state_recovery_redundant` | CPU Retirement and Recovery | Commit and recovery |
| BB-4426 | `precise_state_recovery_lockstep_checked` | CPU Retirement and Recovery | Commit and recovery |
| BB-4427 | `precise_state_recovery_formally_instrumented` | CPU Retirement and Recovery | Commit and recovery |
| BB-4428 | `precise_state_recovery_low_power` | CPU Retirement and Recovery | Commit and recovery |
| BB-4429 | `precise_state_recovery_clock_crossing` | CPU Retirement and Recovery | Commit and recovery |
| BB-4430 | `precise_state_recovery_software_configurable` | CPU Retirement and Recovery | Commit and recovery |
| BB-4431 | `precise_state_recovery_event_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4432 | `precise_state_recovery_fail_safe` | CPU Retirement and Recovery | Commit and recovery |
| BB-4433 | `speculative_checkpoint_file_single_shot` | CPU Retirement and Recovery | Commit and recovery |
| BB-4434 | `speculative_checkpoint_file_continuous` | CPU Retirement and Recovery | Commit and recovery |
| BB-4435 | `speculative_checkpoint_file_microcoded` | CPU Retirement and Recovery | Commit and recovery |
| BB-4436 | `speculative_checkpoint_file_table_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4437 | `speculative_checkpoint_file_multi_channel` | CPU Retirement and Recovery | Commit and recovery |
| BB-4438 | `speculative_checkpoint_file_queued` | CPU Retirement and Recovery | Commit and recovery |
| BB-4439 | `speculative_checkpoint_file_priority_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4440 | `speculative_checkpoint_file_deadline_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4441 | `speculative_checkpoint_file_redundant` | CPU Retirement and Recovery | Commit and recovery |
| BB-4442 | `speculative_checkpoint_file_lockstep_checked` | CPU Retirement and Recovery | Commit and recovery |
| BB-4443 | `speculative_checkpoint_file_formally_instrumented` | CPU Retirement and Recovery | Commit and recovery |
| BB-4444 | `speculative_checkpoint_file_low_power` | CPU Retirement and Recovery | Commit and recovery |
| BB-4445 | `speculative_checkpoint_file_clock_crossing` | CPU Retirement and Recovery | Commit and recovery |
| BB-4446 | `speculative_checkpoint_file_software_configurable` | CPU Retirement and Recovery | Commit and recovery |
| BB-4447 | `speculative_checkpoint_file_event_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4448 | `speculative_checkpoint_file_fail_safe` | CPU Retirement and Recovery | Commit and recovery |
| BB-4449 | `store_commit_queue_single_shot` | CPU Retirement and Recovery | Commit and recovery |
| BB-4450 | `store_commit_queue_continuous` | CPU Retirement and Recovery | Commit and recovery |
| BB-4451 | `store_commit_queue_microcoded` | CPU Retirement and Recovery | Commit and recovery |
| BB-4452 | `store_commit_queue_table_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4453 | `store_commit_queue_multi_channel` | CPU Retirement and Recovery | Commit and recovery |
| BB-4454 | `store_commit_queue_queued` | CPU Retirement and Recovery | Commit and recovery |
| BB-4455 | `store_commit_queue_priority_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4456 | `store_commit_queue_deadline_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4457 | `store_commit_queue_redundant` | CPU Retirement and Recovery | Commit and recovery |
| BB-4458 | `store_commit_queue_lockstep_checked` | CPU Retirement and Recovery | Commit and recovery |
| BB-4459 | `store_commit_queue_formally_instrumented` | CPU Retirement and Recovery | Commit and recovery |
| BB-4460 | `store_commit_queue_low_power` | CPU Retirement and Recovery | Commit and recovery |
| BB-4461 | `store_commit_queue_clock_crossing` | CPU Retirement and Recovery | Commit and recovery |
| BB-4462 | `store_commit_queue_software_configurable` | CPU Retirement and Recovery | Commit and recovery |
| BB-4463 | `store_commit_queue_event_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4464 | `store_commit_queue_fail_safe` | CPU Retirement and Recovery | Commit and recovery |
| BB-4465 | `exception_replay_controller_single_shot` | CPU Retirement and Recovery | Commit and recovery |
| BB-4466 | `exception_replay_controller_continuous` | CPU Retirement and Recovery | Commit and recovery |
| BB-4467 | `exception_replay_controller_microcoded` | CPU Retirement and Recovery | Commit and recovery |
| BB-4468 | `exception_replay_controller_table_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4469 | `exception_replay_controller_multi_channel` | CPU Retirement and Recovery | Commit and recovery |
| BB-4470 | `exception_replay_controller_queued` | CPU Retirement and Recovery | Commit and recovery |
| BB-4471 | `exception_replay_controller_priority_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4472 | `exception_replay_controller_deadline_aware` | CPU Retirement and Recovery | Commit and recovery |
| BB-4473 | `exception_replay_controller_redundant` | CPU Retirement and Recovery | Commit and recovery |
| BB-4474 | `exception_replay_controller_lockstep_checked` | CPU Retirement and Recovery | Commit and recovery |
| BB-4475 | `exception_replay_controller_formally_instrumented` | CPU Retirement and Recovery | Commit and recovery |
| BB-4476 | `exception_replay_controller_low_power` | CPU Retirement and Recovery | Commit and recovery |
| BB-4477 | `exception_replay_controller_clock_crossing` | CPU Retirement and Recovery | Commit and recovery |
| BB-4478 | `exception_replay_controller_software_configurable` | CPU Retirement and Recovery | Commit and recovery |
| BB-4479 | `exception_replay_controller_event_driven` | CPU Retirement and Recovery | Commit and recovery |
| BB-4480 | `exception_replay_controller_fail_safe` | CPU Retirement and Recovery | Commit and recovery |
| BB-4481 | `mesi_directory_engine_single_port` | Cache Coherence | Coherent cache control |
| BB-4482 | `mesi_directory_engine_dual_port` | Cache Coherence | Coherent cache control |
| BB-4483 | `mesi_directory_engine_banked` | Cache Coherence | Coherent cache control |
| BB-4484 | `mesi_directory_engine_interleaved` | Cache Coherence | Coherent cache control |
| BB-4485 | `mesi_directory_engine_write_back` | Cache Coherence | Coherent cache control |
| BB-4486 | `mesi_directory_engine_write_through` | Cache Coherence | Coherent cache control |
| BB-4487 | `mesi_directory_engine_nonblocking` | Cache Coherence | Coherent cache control |
| BB-4488 | `mesi_directory_engine_pipelined` | Cache Coherence | Coherent cache control |
| BB-4489 | `mesi_directory_engine_burst_optimized` | Cache Coherence | Coherent cache control |
| BB-4490 | `mesi_directory_engine_multi_channel` | Cache Coherence | Coherent cache control |
| BB-4491 | `mesi_directory_engine_ecc_protected` | Cache Coherence | Coherent cache control |
| BB-4492 | `mesi_directory_engine_scrubbed` | Cache Coherence | Coherent cache control |
| BB-4493 | `mesi_directory_engine_clock_crossing` | Cache Coherence | Coherent cache control |
| BB-4494 | `mesi_directory_engine_qos_aware` | Cache Coherence | Coherent cache control |
| BB-4495 | `mesi_directory_engine_low_power` | Cache Coherence | Coherent cache control |
| BB-4496 | `mesi_directory_engine_formally_instrumented` | Cache Coherence | Coherent cache control |
| BB-4497 | `moesi_directory_engine_single_port` | Cache Coherence | Coherent cache control |
| BB-4498 | `moesi_directory_engine_dual_port` | Cache Coherence | Coherent cache control |
| BB-4499 | `moesi_directory_engine_banked` | Cache Coherence | Coherent cache control |
| BB-4500 | `moesi_directory_engine_interleaved` | Cache Coherence | Coherent cache control |
| BB-4501 | `moesi_directory_engine_write_back` | Cache Coherence | Coherent cache control |
| BB-4502 | `moesi_directory_engine_write_through` | Cache Coherence | Coherent cache control |
| BB-4503 | `moesi_directory_engine_nonblocking` | Cache Coherence | Coherent cache control |
| BB-4504 | `moesi_directory_engine_pipelined` | Cache Coherence | Coherent cache control |
| BB-4505 | `moesi_directory_engine_burst_optimized` | Cache Coherence | Coherent cache control |
| BB-4506 | `moesi_directory_engine_multi_channel` | Cache Coherence | Coherent cache control |
| BB-4507 | `moesi_directory_engine_ecc_protected` | Cache Coherence | Coherent cache control |
| BB-4508 | `moesi_directory_engine_scrubbed` | Cache Coherence | Coherent cache control |
| BB-4509 | `moesi_directory_engine_clock_crossing` | Cache Coherence | Coherent cache control |
| BB-4510 | `moesi_directory_engine_qos_aware` | Cache Coherence | Coherent cache control |
| BB-4511 | `moesi_directory_engine_low_power` | Cache Coherence | Coherent cache control |
| BB-4512 | `moesi_directory_engine_formally_instrumented` | Cache Coherence | Coherent cache control |
| BB-4513 | `snoop_request_filter_single_port` | Cache Coherence | Coherent cache control |
| BB-4514 | `snoop_request_filter_dual_port` | Cache Coherence | Coherent cache control |
| BB-4515 | `snoop_request_filter_banked` | Cache Coherence | Coherent cache control |
| BB-4516 | `snoop_request_filter_interleaved` | Cache Coherence | Coherent cache control |
| BB-4517 | `snoop_request_filter_write_back` | Cache Coherence | Coherent cache control |
| BB-4518 | `snoop_request_filter_write_through` | Cache Coherence | Coherent cache control |
| BB-4519 | `snoop_request_filter_nonblocking` | Cache Coherence | Coherent cache control |
| BB-4520 | `snoop_request_filter_pipelined` | Cache Coherence | Coherent cache control |
| BB-4521 | `snoop_request_filter_burst_optimized` | Cache Coherence | Coherent cache control |
| BB-4522 | `snoop_request_filter_multi_channel` | Cache Coherence | Coherent cache control |
| BB-4523 | `snoop_request_filter_ecc_protected` | Cache Coherence | Coherent cache control |
| BB-4524 | `snoop_request_filter_scrubbed` | Cache Coherence | Coherent cache control |
| BB-4525 | `snoop_request_filter_clock_crossing` | Cache Coherence | Coherent cache control |
| BB-4526 | `snoop_request_filter_qos_aware` | Cache Coherence | Coherent cache control |
| BB-4527 | `snoop_request_filter_low_power` | Cache Coherence | Coherent cache control |
| BB-4528 | `snoop_request_filter_formally_instrumented` | Cache Coherence | Coherent cache control |
| BB-4529 | `coherence_probe_router_single_port` | Cache Coherence | Coherent cache control |
| BB-4530 | `coherence_probe_router_dual_port` | Cache Coherence | Coherent cache control |
| BB-4531 | `coherence_probe_router_banked` | Cache Coherence | Coherent cache control |
| BB-4532 | `coherence_probe_router_interleaved` | Cache Coherence | Coherent cache control |
| BB-4533 | `coherence_probe_router_write_back` | Cache Coherence | Coherent cache control |
| BB-4534 | `coherence_probe_router_write_through` | Cache Coherence | Coherent cache control |
| BB-4535 | `coherence_probe_router_nonblocking` | Cache Coherence | Coherent cache control |
| BB-4536 | `coherence_probe_router_pipelined` | Cache Coherence | Coherent cache control |
| BB-4537 | `coherence_probe_router_burst_optimized` | Cache Coherence | Coherent cache control |
| BB-4538 | `coherence_probe_router_multi_channel` | Cache Coherence | Coherent cache control |
| BB-4539 | `coherence_probe_router_ecc_protected` | Cache Coherence | Coherent cache control |
| BB-4540 | `coherence_probe_router_scrubbed` | Cache Coherence | Coherent cache control |
| BB-4541 | `coherence_probe_router_clock_crossing` | Cache Coherence | Coherent cache control |
| BB-4542 | `coherence_probe_router_qos_aware` | Cache Coherence | Coherent cache control |
| BB-4543 | `coherence_probe_router_low_power` | Cache Coherence | Coherent cache control |
| BB-4544 | `coherence_probe_router_formally_instrumented` | Cache Coherence | Coherent cache control |
| BB-4545 | `cache_line_ownership_tracker_single_port` | Cache Coherence | Coherent cache control |
| BB-4546 | `cache_line_ownership_tracker_dual_port` | Cache Coherence | Coherent cache control |
| BB-4547 | `cache_line_ownership_tracker_banked` | Cache Coherence | Coherent cache control |
| BB-4548 | `cache_line_ownership_tracker_interleaved` | Cache Coherence | Coherent cache control |
| BB-4549 | `cache_line_ownership_tracker_write_back` | Cache Coherence | Coherent cache control |
| BB-4550 | `cache_line_ownership_tracker_write_through` | Cache Coherence | Coherent cache control |
| BB-4551 | `cache_line_ownership_tracker_nonblocking` | Cache Coherence | Coherent cache control |
| BB-4552 | `cache_line_ownership_tracker_pipelined` | Cache Coherence | Coherent cache control |
| BB-4553 | `cache_line_ownership_tracker_burst_optimized` | Cache Coherence | Coherent cache control |
| BB-4554 | `cache_line_ownership_tracker_multi_channel` | Cache Coherence | Coherent cache control |
| BB-4555 | `cache_line_ownership_tracker_ecc_protected` | Cache Coherence | Coherent cache control |
| BB-4556 | `cache_line_ownership_tracker_scrubbed` | Cache Coherence | Coherent cache control |
| BB-4557 | `cache_line_ownership_tracker_clock_crossing` | Cache Coherence | Coherent cache control |
| BB-4558 | `cache_line_ownership_tracker_qos_aware` | Cache Coherence | Coherent cache control |
| BB-4559 | `cache_line_ownership_tracker_low_power` | Cache Coherence | Coherent cache control |
| BB-4560 | `cache_line_ownership_tracker_formally_instrumented` | Cache Coherence | Coherent cache control |
| BB-4561 | `stage2_address_translator_single_shot` | CPU Virtualization | Virtualization and IOMMU |
| BB-4562 | `stage2_address_translator_continuous` | CPU Virtualization | Virtualization and IOMMU |
| BB-4563 | `stage2_address_translator_microcoded` | CPU Virtualization | Virtualization and IOMMU |
| BB-4564 | `stage2_address_translator_table_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4565 | `stage2_address_translator_multi_channel` | CPU Virtualization | Virtualization and IOMMU |
| BB-4566 | `stage2_address_translator_queued` | CPU Virtualization | Virtualization and IOMMU |
| BB-4567 | `stage2_address_translator_priority_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4568 | `stage2_address_translator_deadline_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4569 | `stage2_address_translator_redundant` | CPU Virtualization | Virtualization and IOMMU |
| BB-4570 | `stage2_address_translator_lockstep_checked` | CPU Virtualization | Virtualization and IOMMU |
| BB-4571 | `stage2_address_translator_formally_instrumented` | CPU Virtualization | Virtualization and IOMMU |
| BB-4572 | `stage2_address_translator_low_power` | CPU Virtualization | Virtualization and IOMMU |
| BB-4573 | `stage2_address_translator_clock_crossing` | CPU Virtualization | Virtualization and IOMMU |
| BB-4574 | `stage2_address_translator_software_configurable` | CPU Virtualization | Virtualization and IOMMU |
| BB-4575 | `stage2_address_translator_event_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4576 | `stage2_address_translator_fail_safe` | CPU Virtualization | Virtualization and IOMMU |
| BB-4577 | `virtual_interrupt_controller_single_shot` | CPU Virtualization | Virtualization and IOMMU |
| BB-4578 | `virtual_interrupt_controller_continuous` | CPU Virtualization | Virtualization and IOMMU |
| BB-4579 | `virtual_interrupt_controller_microcoded` | CPU Virtualization | Virtualization and IOMMU |
| BB-4580 | `virtual_interrupt_controller_table_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4581 | `virtual_interrupt_controller_multi_channel` | CPU Virtualization | Virtualization and IOMMU |
| BB-4582 | `virtual_interrupt_controller_queued` | CPU Virtualization | Virtualization and IOMMU |
| BB-4583 | `virtual_interrupt_controller_priority_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4584 | `virtual_interrupt_controller_deadline_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4585 | `virtual_interrupt_controller_redundant` | CPU Virtualization | Virtualization and IOMMU |
| BB-4586 | `virtual_interrupt_controller_lockstep_checked` | CPU Virtualization | Virtualization and IOMMU |
| BB-4587 | `virtual_interrupt_controller_formally_instrumented` | CPU Virtualization | Virtualization and IOMMU |
| BB-4588 | `virtual_interrupt_controller_low_power` | CPU Virtualization | Virtualization and IOMMU |
| BB-4589 | `virtual_interrupt_controller_clock_crossing` | CPU Virtualization | Virtualization and IOMMU |
| BB-4590 | `virtual_interrupt_controller_software_configurable` | CPU Virtualization | Virtualization and IOMMU |
| BB-4591 | `virtual_interrupt_controller_event_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4592 | `virtual_interrupt_controller_fail_safe` | CPU Virtualization | Virtualization and IOMMU |
| BB-4593 | `guest_timer_virtualizer_single_shot` | CPU Virtualization | Virtualization and IOMMU |
| BB-4594 | `guest_timer_virtualizer_continuous` | CPU Virtualization | Virtualization and IOMMU |
| BB-4595 | `guest_timer_virtualizer_microcoded` | CPU Virtualization | Virtualization and IOMMU |
| BB-4596 | `guest_timer_virtualizer_table_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4597 | `guest_timer_virtualizer_multi_channel` | CPU Virtualization | Virtualization and IOMMU |
| BB-4598 | `guest_timer_virtualizer_queued` | CPU Virtualization | Virtualization and IOMMU |
| BB-4599 | `guest_timer_virtualizer_priority_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4600 | `guest_timer_virtualizer_deadline_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4601 | `guest_timer_virtualizer_redundant` | CPU Virtualization | Virtualization and IOMMU |
| BB-4602 | `guest_timer_virtualizer_lockstep_checked` | CPU Virtualization | Virtualization and IOMMU |
| BB-4603 | `guest_timer_virtualizer_formally_instrumented` | CPU Virtualization | Virtualization and IOMMU |
| BB-4604 | `guest_timer_virtualizer_low_power` | CPU Virtualization | Virtualization and IOMMU |
| BB-4605 | `guest_timer_virtualizer_clock_crossing` | CPU Virtualization | Virtualization and IOMMU |
| BB-4606 | `guest_timer_virtualizer_software_configurable` | CPU Virtualization | Virtualization and IOMMU |
| BB-4607 | `guest_timer_virtualizer_event_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4608 | `guest_timer_virtualizer_fail_safe` | CPU Virtualization | Virtualization and IOMMU |
| BB-4609 | `iommu_translation_engine_single_shot` | CPU Virtualization | Virtualization and IOMMU |
| BB-4610 | `iommu_translation_engine_continuous` | CPU Virtualization | Virtualization and IOMMU |
| BB-4611 | `iommu_translation_engine_microcoded` | CPU Virtualization | Virtualization and IOMMU |
| BB-4612 | `iommu_translation_engine_table_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4613 | `iommu_translation_engine_multi_channel` | CPU Virtualization | Virtualization and IOMMU |
| BB-4614 | `iommu_translation_engine_queued` | CPU Virtualization | Virtualization and IOMMU |
| BB-4615 | `iommu_translation_engine_priority_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4616 | `iommu_translation_engine_deadline_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4617 | `iommu_translation_engine_redundant` | CPU Virtualization | Virtualization and IOMMU |
| BB-4618 | `iommu_translation_engine_lockstep_checked` | CPU Virtualization | Virtualization and IOMMU |
| BB-4619 | `iommu_translation_engine_formally_instrumented` | CPU Virtualization | Virtualization and IOMMU |
| BB-4620 | `iommu_translation_engine_low_power` | CPU Virtualization | Virtualization and IOMMU |
| BB-4621 | `iommu_translation_engine_clock_crossing` | CPU Virtualization | Virtualization and IOMMU |
| BB-4622 | `iommu_translation_engine_software_configurable` | CPU Virtualization | Virtualization and IOMMU |
| BB-4623 | `iommu_translation_engine_event_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4624 | `iommu_translation_engine_fail_safe` | CPU Virtualization | Virtualization and IOMMU |
| BB-4625 | `privilege_trap_router_single_shot` | CPU Virtualization | Virtualization and IOMMU |
| BB-4626 | `privilege_trap_router_continuous` | CPU Virtualization | Virtualization and IOMMU |
| BB-4627 | `privilege_trap_router_microcoded` | CPU Virtualization | Virtualization and IOMMU |
| BB-4628 | `privilege_trap_router_table_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4629 | `privilege_trap_router_multi_channel` | CPU Virtualization | Virtualization and IOMMU |
| BB-4630 | `privilege_trap_router_queued` | CPU Virtualization | Virtualization and IOMMU |
| BB-4631 | `privilege_trap_router_priority_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4632 | `privilege_trap_router_deadline_aware` | CPU Virtualization | Virtualization and IOMMU |
| BB-4633 | `privilege_trap_router_redundant` | CPU Virtualization | Virtualization and IOMMU |
| BB-4634 | `privilege_trap_router_lockstep_checked` | CPU Virtualization | Virtualization and IOMMU |
| BB-4635 | `privilege_trap_router_formally_instrumented` | CPU Virtualization | Virtualization and IOMMU |
| BB-4636 | `privilege_trap_router_low_power` | CPU Virtualization | Virtualization and IOMMU |
| BB-4637 | `privilege_trap_router_clock_crossing` | CPU Virtualization | Virtualization and IOMMU |
| BB-4638 | `privilege_trap_router_software_configurable` | CPU Virtualization | Virtualization and IOMMU |
| BB-4639 | `privilege_trap_router_event_driven` | CPU Virtualization | Virtualization and IOMMU |
| BB-4640 | `privilege_trap_router_fail_safe` | CPU Virtualization | Virtualization and IOMMU |
| BB-4641 | `riscv_bitmanip_unit_combinational` | RISC-V Extensions | ISA extension units |
| BB-4642 | `riscv_bitmanip_unit_single_cycle` | RISC-V Extensions | ISA extension units |
| BB-4643 | `riscv_bitmanip_unit_shallow_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4644 | `riscv_bitmanip_unit_deep_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4645 | `riscv_bitmanip_unit_iterative` | RISC-V Extensions | ISA extension units |
| BB-4646 | `riscv_bitmanip_unit_digit_serial` | RISC-V Extensions | ISA extension units |
| BB-4647 | `riscv_bitmanip_unit_resource_shared` | RISC-V Extensions | ISA extension units |
| BB-4648 | `riscv_bitmanip_unit_fully_parallel` | RISC-V Extensions | ISA extension units |
| BB-4649 | `riscv_bitmanip_unit_vectorized` | RISC-V Extensions | ISA extension units |
| BB-4650 | `riscv_bitmanip_unit_streaming` | RISC-V Extensions | ISA extension units |
| BB-4651 | `riscv_bitmanip_unit_buffered_stream` | RISC-V Extensions | ISA extension units |
| BB-4652 | `riscv_bitmanip_unit_multi_channel` | RISC-V Extensions | ISA extension units |
| BB-4653 | `riscv_bitmanip_unit_programmable_precision` | RISC-V Extensions | ISA extension units |
| BB-4654 | `riscv_bitmanip_unit_saturating` | RISC-V Extensions | ISA extension units |
| BB-4655 | `riscv_bitmanip_unit_fault_detecting` | RISC-V Extensions | ISA extension units |
| BB-4656 | `riscv_bitmanip_unit_low_power` | RISC-V Extensions | ISA extension units |
| BB-4657 | `riscv_vector_lane_combinational` | RISC-V Extensions | ISA extension units |
| BB-4658 | `riscv_vector_lane_single_cycle` | RISC-V Extensions | ISA extension units |
| BB-4659 | `riscv_vector_lane_shallow_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4660 | `riscv_vector_lane_deep_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4661 | `riscv_vector_lane_iterative` | RISC-V Extensions | ISA extension units |
| BB-4662 | `riscv_vector_lane_digit_serial` | RISC-V Extensions | ISA extension units |
| BB-4663 | `riscv_vector_lane_resource_shared` | RISC-V Extensions | ISA extension units |
| BB-4664 | `riscv_vector_lane_fully_parallel` | RISC-V Extensions | ISA extension units |
| BB-4665 | `riscv_vector_lane_vectorized` | RISC-V Extensions | ISA extension units |
| BB-4666 | `riscv_vector_lane_streaming` | RISC-V Extensions | ISA extension units |
| BB-4667 | `riscv_vector_lane_buffered_stream` | RISC-V Extensions | ISA extension units |
| BB-4668 | `riscv_vector_lane_multi_channel` | RISC-V Extensions | ISA extension units |
| BB-4669 | `riscv_vector_lane_programmable_precision` | RISC-V Extensions | ISA extension units |
| BB-4670 | `riscv_vector_lane_saturating` | RISC-V Extensions | ISA extension units |
| BB-4671 | `riscv_vector_lane_fault_detecting` | RISC-V Extensions | ISA extension units |
| BB-4672 | `riscv_vector_lane_low_power` | RISC-V Extensions | ISA extension units |
| BB-4673 | `riscv_crypto_unit_combinational` | RISC-V Extensions | ISA extension units |
| BB-4674 | `riscv_crypto_unit_single_cycle` | RISC-V Extensions | ISA extension units |
| BB-4675 | `riscv_crypto_unit_shallow_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4676 | `riscv_crypto_unit_deep_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4677 | `riscv_crypto_unit_iterative` | RISC-V Extensions | ISA extension units |
| BB-4678 | `riscv_crypto_unit_digit_serial` | RISC-V Extensions | ISA extension units |
| BB-4679 | `riscv_crypto_unit_resource_shared` | RISC-V Extensions | ISA extension units |
| BB-4680 | `riscv_crypto_unit_fully_parallel` | RISC-V Extensions | ISA extension units |
| BB-4681 | `riscv_crypto_unit_vectorized` | RISC-V Extensions | ISA extension units |
| BB-4682 | `riscv_crypto_unit_streaming` | RISC-V Extensions | ISA extension units |
| BB-4683 | `riscv_crypto_unit_buffered_stream` | RISC-V Extensions | ISA extension units |
| BB-4684 | `riscv_crypto_unit_multi_channel` | RISC-V Extensions | ISA extension units |
| BB-4685 | `riscv_crypto_unit_programmable_precision` | RISC-V Extensions | ISA extension units |
| BB-4686 | `riscv_crypto_unit_saturating` | RISC-V Extensions | ISA extension units |
| BB-4687 | `riscv_crypto_unit_fault_detecting` | RISC-V Extensions | ISA extension units |
| BB-4688 | `riscv_crypto_unit_low_power` | RISC-V Extensions | ISA extension units |
| BB-4689 | `riscv_hypervisor_unit_combinational` | RISC-V Extensions | ISA extension units |
| BB-4690 | `riscv_hypervisor_unit_single_cycle` | RISC-V Extensions | ISA extension units |
| BB-4691 | `riscv_hypervisor_unit_shallow_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4692 | `riscv_hypervisor_unit_deep_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4693 | `riscv_hypervisor_unit_iterative` | RISC-V Extensions | ISA extension units |
| BB-4694 | `riscv_hypervisor_unit_digit_serial` | RISC-V Extensions | ISA extension units |
| BB-4695 | `riscv_hypervisor_unit_resource_shared` | RISC-V Extensions | ISA extension units |
| BB-4696 | `riscv_hypervisor_unit_fully_parallel` | RISC-V Extensions | ISA extension units |
| BB-4697 | `riscv_hypervisor_unit_vectorized` | RISC-V Extensions | ISA extension units |
| BB-4698 | `riscv_hypervisor_unit_streaming` | RISC-V Extensions | ISA extension units |
| BB-4699 | `riscv_hypervisor_unit_buffered_stream` | RISC-V Extensions | ISA extension units |
| BB-4700 | `riscv_hypervisor_unit_multi_channel` | RISC-V Extensions | ISA extension units |
| BB-4701 | `riscv_hypervisor_unit_programmable_precision` | RISC-V Extensions | ISA extension units |
| BB-4702 | `riscv_hypervisor_unit_saturating` | RISC-V Extensions | ISA extension units |
| BB-4703 | `riscv_hypervisor_unit_fault_detecting` | RISC-V Extensions | ISA extension units |
| BB-4704 | `riscv_hypervisor_unit_low_power` | RISC-V Extensions | ISA extension units |
| BB-4705 | `riscv_packed_simd_unit_combinational` | RISC-V Extensions | ISA extension units |
| BB-4706 | `riscv_packed_simd_unit_single_cycle` | RISC-V Extensions | ISA extension units |
| BB-4707 | `riscv_packed_simd_unit_shallow_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4708 | `riscv_packed_simd_unit_deep_pipeline` | RISC-V Extensions | ISA extension units |
| BB-4709 | `riscv_packed_simd_unit_iterative` | RISC-V Extensions | ISA extension units |
| BB-4710 | `riscv_packed_simd_unit_digit_serial` | RISC-V Extensions | ISA extension units |
| BB-4711 | `riscv_packed_simd_unit_resource_shared` | RISC-V Extensions | ISA extension units |
| BB-4712 | `riscv_packed_simd_unit_fully_parallel` | RISC-V Extensions | ISA extension units |
| BB-4713 | `riscv_packed_simd_unit_vectorized` | RISC-V Extensions | ISA extension units |
| BB-4714 | `riscv_packed_simd_unit_streaming` | RISC-V Extensions | ISA extension units |
| BB-4715 | `riscv_packed_simd_unit_buffered_stream` | RISC-V Extensions | ISA extension units |
| BB-4716 | `riscv_packed_simd_unit_multi_channel` | RISC-V Extensions | ISA extension units |
| BB-4717 | `riscv_packed_simd_unit_programmable_precision` | RISC-V Extensions | ISA extension units |
| BB-4718 | `riscv_packed_simd_unit_saturating` | RISC-V Extensions | ISA extension units |
| BB-4719 | `riscv_packed_simd_unit_fault_detecting` | RISC-V Extensions | ISA extension units |
| BB-4720 | `riscv_packed_simd_unit_low_power` | RISC-V Extensions | ISA extension units |
| BB-4721 | `triangle_edge_walker_streaming` | GPU Rasterization | Raster operations |
| BB-4722 | `triangle_edge_walker_framebuffer` | GPU Rasterization | Raster operations |
| BB-4723 | `triangle_edge_walker_line_buffered` | GPU Rasterization | Raster operations |
| BB-4724 | `triangle_edge_walker_tile_based` | GPU Rasterization | Raster operations |
| BB-4725 | `triangle_edge_walker_multi_plane` | GPU Rasterization | Raster operations |
| BB-4726 | `triangle_edge_walker_multi_channel` | GPU Rasterization | Raster operations |
| BB-4727 | `triangle_edge_walker_fixed_latency` | GPU Rasterization | Raster operations |
| BB-4728 | `triangle_edge_walker_low_latency` | GPU Rasterization | Raster operations |
| BB-4729 | `triangle_edge_walker_high_throughput` | GPU Rasterization | Raster operations |
| BB-4730 | `triangle_edge_walker_rate_adaptive` | GPU Rasterization | Raster operations |
| BB-4731 | `triangle_edge_walker_clock_crossing` | GPU Rasterization | Raster operations |
| BB-4732 | `triangle_edge_walker_metadata_aware` | GPU Rasterization | Raster operations |
| BB-4733 | `triangle_edge_walker_error_resilient` | GPU Rasterization | Raster operations |
| BB-4734 | `triangle_edge_walker_programmable` | GPU Rasterization | Raster operations |
| BB-4735 | `triangle_edge_walker_low_power` | GPU Rasterization | Raster operations |
| BB-4736 | `triangle_edge_walker_axi_stream` | GPU Rasterization | Raster operations |
| BB-4737 | `hierarchical_z_unit_streaming` | GPU Rasterization | Raster operations |
| BB-4738 | `hierarchical_z_unit_framebuffer` | GPU Rasterization | Raster operations |
| BB-4739 | `hierarchical_z_unit_line_buffered` | GPU Rasterization | Raster operations |
| BB-4740 | `hierarchical_z_unit_tile_based` | GPU Rasterization | Raster operations |
| BB-4741 | `hierarchical_z_unit_multi_plane` | GPU Rasterization | Raster operations |
| BB-4742 | `hierarchical_z_unit_multi_channel` | GPU Rasterization | Raster operations |
| BB-4743 | `hierarchical_z_unit_fixed_latency` | GPU Rasterization | Raster operations |
| BB-4744 | `hierarchical_z_unit_low_latency` | GPU Rasterization | Raster operations |
| BB-4745 | `hierarchical_z_unit_high_throughput` | GPU Rasterization | Raster operations |
| BB-4746 | `hierarchical_z_unit_rate_adaptive` | GPU Rasterization | Raster operations |
| BB-4747 | `hierarchical_z_unit_clock_crossing` | GPU Rasterization | Raster operations |
| BB-4748 | `hierarchical_z_unit_metadata_aware` | GPU Rasterization | Raster operations |
| BB-4749 | `hierarchical_z_unit_error_resilient` | GPU Rasterization | Raster operations |
| BB-4750 | `hierarchical_z_unit_programmable` | GPU Rasterization | Raster operations |
| BB-4751 | `hierarchical_z_unit_low_power` | GPU Rasterization | Raster operations |
| BB-4752 | `hierarchical_z_unit_axi_stream` | GPU Rasterization | Raster operations |
| BB-4753 | `multisample_pattern_generator_streaming` | GPU Rasterization | Raster operations |
| BB-4754 | `multisample_pattern_generator_framebuffer` | GPU Rasterization | Raster operations |
| BB-4755 | `multisample_pattern_generator_line_buffered` | GPU Rasterization | Raster operations |
| BB-4756 | `multisample_pattern_generator_tile_based` | GPU Rasterization | Raster operations |
| BB-4757 | `multisample_pattern_generator_multi_plane` | GPU Rasterization | Raster operations |
| BB-4758 | `multisample_pattern_generator_multi_channel` | GPU Rasterization | Raster operations |
| BB-4759 | `multisample_pattern_generator_fixed_latency` | GPU Rasterization | Raster operations |
| BB-4760 | `multisample_pattern_generator_low_latency` | GPU Rasterization | Raster operations |
| BB-4761 | `multisample_pattern_generator_high_throughput` | GPU Rasterization | Raster operations |
| BB-4762 | `multisample_pattern_generator_rate_adaptive` | GPU Rasterization | Raster operations |
| BB-4763 | `multisample_pattern_generator_clock_crossing` | GPU Rasterization | Raster operations |
| BB-4764 | `multisample_pattern_generator_metadata_aware` | GPU Rasterization | Raster operations |
| BB-4765 | `multisample_pattern_generator_error_resilient` | GPU Rasterization | Raster operations |
| BB-4766 | `multisample_pattern_generator_programmable` | GPU Rasterization | Raster operations |
| BB-4767 | `multisample_pattern_generator_low_power` | GPU Rasterization | Raster operations |
| BB-4768 | `multisample_pattern_generator_axi_stream` | GPU Rasterization | Raster operations |
| BB-4769 | `conservative_rasterizer_streaming` | GPU Rasterization | Raster operations |
| BB-4770 | `conservative_rasterizer_framebuffer` | GPU Rasterization | Raster operations |
| BB-4771 | `conservative_rasterizer_line_buffered` | GPU Rasterization | Raster operations |
| BB-4772 | `conservative_rasterizer_tile_based` | GPU Rasterization | Raster operations |
| BB-4773 | `conservative_rasterizer_multi_plane` | GPU Rasterization | Raster operations |
| BB-4774 | `conservative_rasterizer_multi_channel` | GPU Rasterization | Raster operations |
| BB-4775 | `conservative_rasterizer_fixed_latency` | GPU Rasterization | Raster operations |
| BB-4776 | `conservative_rasterizer_low_latency` | GPU Rasterization | Raster operations |
| BB-4777 | `conservative_rasterizer_high_throughput` | GPU Rasterization | Raster operations |
| BB-4778 | `conservative_rasterizer_rate_adaptive` | GPU Rasterization | Raster operations |
| BB-4779 | `conservative_rasterizer_clock_crossing` | GPU Rasterization | Raster operations |
| BB-4780 | `conservative_rasterizer_metadata_aware` | GPU Rasterization | Raster operations |
| BB-4781 | `conservative_rasterizer_error_resilient` | GPU Rasterization | Raster operations |
| BB-4782 | `conservative_rasterizer_programmable` | GPU Rasterization | Raster operations |
| BB-4783 | `conservative_rasterizer_low_power` | GPU Rasterization | Raster operations |
| BB-4784 | `conservative_rasterizer_axi_stream` | GPU Rasterization | Raster operations |
| BB-4785 | `variable_rate_shading_map_streaming` | GPU Rasterization | Raster operations |
| BB-4786 | `variable_rate_shading_map_framebuffer` | GPU Rasterization | Raster operations |
| BB-4787 | `variable_rate_shading_map_line_buffered` | GPU Rasterization | Raster operations |
| BB-4788 | `variable_rate_shading_map_tile_based` | GPU Rasterization | Raster operations |
| BB-4789 | `variable_rate_shading_map_multi_plane` | GPU Rasterization | Raster operations |
| BB-4790 | `variable_rate_shading_map_multi_channel` | GPU Rasterization | Raster operations |
| BB-4791 | `variable_rate_shading_map_fixed_latency` | GPU Rasterization | Raster operations |
| BB-4792 | `variable_rate_shading_map_low_latency` | GPU Rasterization | Raster operations |
| BB-4793 | `variable_rate_shading_map_high_throughput` | GPU Rasterization | Raster operations |
| BB-4794 | `variable_rate_shading_map_rate_adaptive` | GPU Rasterization | Raster operations |
| BB-4795 | `variable_rate_shading_map_clock_crossing` | GPU Rasterization | Raster operations |
| BB-4796 | `variable_rate_shading_map_metadata_aware` | GPU Rasterization | Raster operations |
| BB-4797 | `variable_rate_shading_map_error_resilient` | GPU Rasterization | Raster operations |
| BB-4798 | `variable_rate_shading_map_programmable` | GPU Rasterization | Raster operations |
| BB-4799 | `variable_rate_shading_map_low_power` | GPU Rasterization | Raster operations |
| BB-4800 | `variable_rate_shading_map_axi_stream` | GPU Rasterization | Raster operations |
| BB-4801 | `texture_cache_controller_streaming` | GPU Texture Processing | Texture sampling |
| BB-4802 | `texture_cache_controller_framebuffer` | GPU Texture Processing | Texture sampling |
| BB-4803 | `texture_cache_controller_line_buffered` | GPU Texture Processing | Texture sampling |
| BB-4804 | `texture_cache_controller_tile_based` | GPU Texture Processing | Texture sampling |
| BB-4805 | `texture_cache_controller_multi_plane` | GPU Texture Processing | Texture sampling |
| BB-4806 | `texture_cache_controller_multi_channel` | GPU Texture Processing | Texture sampling |
| BB-4807 | `texture_cache_controller_fixed_latency` | GPU Texture Processing | Texture sampling |
| BB-4808 | `texture_cache_controller_low_latency` | GPU Texture Processing | Texture sampling |
| BB-4809 | `texture_cache_controller_high_throughput` | GPU Texture Processing | Texture sampling |
| BB-4810 | `texture_cache_controller_rate_adaptive` | GPU Texture Processing | Texture sampling |
| BB-4811 | `texture_cache_controller_clock_crossing` | GPU Texture Processing | Texture sampling |
| BB-4812 | `texture_cache_controller_metadata_aware` | GPU Texture Processing | Texture sampling |
| BB-4813 | `texture_cache_controller_error_resilient` | GPU Texture Processing | Texture sampling |
| BB-4814 | `texture_cache_controller_programmable` | GPU Texture Processing | Texture sampling |
| BB-4815 | `texture_cache_controller_low_power` | GPU Texture Processing | Texture sampling |
| BB-4816 | `texture_cache_controller_axi_stream` | GPU Texture Processing | Texture sampling |
| BB-4817 | `anisotropic_filter_engine_streaming` | GPU Texture Processing | Texture sampling |
| BB-4818 | `anisotropic_filter_engine_framebuffer` | GPU Texture Processing | Texture sampling |
| BB-4819 | `anisotropic_filter_engine_line_buffered` | GPU Texture Processing | Texture sampling |
| BB-4820 | `anisotropic_filter_engine_tile_based` | GPU Texture Processing | Texture sampling |
| BB-4821 | `anisotropic_filter_engine_multi_plane` | GPU Texture Processing | Texture sampling |
| BB-4822 | `anisotropic_filter_engine_multi_channel` | GPU Texture Processing | Texture sampling |
| BB-4823 | `anisotropic_filter_engine_fixed_latency` | GPU Texture Processing | Texture sampling |
| BB-4824 | `anisotropic_filter_engine_low_latency` | GPU Texture Processing | Texture sampling |
| BB-4825 | `anisotropic_filter_engine_high_throughput` | GPU Texture Processing | Texture sampling |
| BB-4826 | `anisotropic_filter_engine_rate_adaptive` | GPU Texture Processing | Texture sampling |
| BB-4827 | `anisotropic_filter_engine_clock_crossing` | GPU Texture Processing | Texture sampling |
| BB-4828 | `anisotropic_filter_engine_metadata_aware` | GPU Texture Processing | Texture sampling |
| BB-4829 | `anisotropic_filter_engine_error_resilient` | GPU Texture Processing | Texture sampling |
| BB-4830 | `anisotropic_filter_engine_programmable` | GPU Texture Processing | Texture sampling |
| BB-4831 | `anisotropic_filter_engine_low_power` | GPU Texture Processing | Texture sampling |
| BB-4832 | `anisotropic_filter_engine_axi_stream` | GPU Texture Processing | Texture sampling |
| BB-4833 | `texture_border_unit_streaming` | GPU Texture Processing | Texture sampling |
| BB-4834 | `texture_border_unit_framebuffer` | GPU Texture Processing | Texture sampling |
| BB-4835 | `texture_border_unit_line_buffered` | GPU Texture Processing | Texture sampling |
| BB-4836 | `texture_border_unit_tile_based` | GPU Texture Processing | Texture sampling |
| BB-4837 | `texture_border_unit_multi_plane` | GPU Texture Processing | Texture sampling |
| BB-4838 | `texture_border_unit_multi_channel` | GPU Texture Processing | Texture sampling |
| BB-4839 | `texture_border_unit_fixed_latency` | GPU Texture Processing | Texture sampling |
| BB-4840 | `texture_border_unit_low_latency` | GPU Texture Processing | Texture sampling |
| BB-4841 | `texture_border_unit_high_throughput` | GPU Texture Processing | Texture sampling |
| BB-4842 | `texture_border_unit_rate_adaptive` | GPU Texture Processing | Texture sampling |
| BB-4843 | `texture_border_unit_clock_crossing` | GPU Texture Processing | Texture sampling |
| BB-4844 | `texture_border_unit_metadata_aware` | GPU Texture Processing | Texture sampling |
| BB-4845 | `texture_border_unit_error_resilient` | GPU Texture Processing | Texture sampling |
| BB-4846 | `texture_border_unit_programmable` | GPU Texture Processing | Texture sampling |
| BB-4847 | `texture_border_unit_low_power` | GPU Texture Processing | Texture sampling |
| BB-4848 | `texture_border_unit_axi_stream` | GPU Texture Processing | Texture sampling |
| BB-4849 | `texture_decompression_engine_streaming` | GPU Texture Processing | Texture sampling |
| BB-4850 | `texture_decompression_engine_framebuffer` | GPU Texture Processing | Texture sampling |
| BB-4851 | `texture_decompression_engine_line_buffered` | GPU Texture Processing | Texture sampling |
| BB-4852 | `texture_decompression_engine_tile_based` | GPU Texture Processing | Texture sampling |
| BB-4853 | `texture_decompression_engine_multi_plane` | GPU Texture Processing | Texture sampling |
| BB-4854 | `texture_decompression_engine_multi_channel` | GPU Texture Processing | Texture sampling |
| BB-4855 | `texture_decompression_engine_fixed_latency` | GPU Texture Processing | Texture sampling |
| BB-4856 | `texture_decompression_engine_low_latency` | GPU Texture Processing | Texture sampling |
| BB-4857 | `texture_decompression_engine_high_throughput` | GPU Texture Processing | Texture sampling |
| BB-4858 | `texture_decompression_engine_rate_adaptive` | GPU Texture Processing | Texture sampling |
| BB-4859 | `texture_decompression_engine_clock_crossing` | GPU Texture Processing | Texture sampling |
| BB-4860 | `texture_decompression_engine_metadata_aware` | GPU Texture Processing | Texture sampling |
| BB-4861 | `texture_decompression_engine_error_resilient` | GPU Texture Processing | Texture sampling |
| BB-4862 | `texture_decompression_engine_programmable` | GPU Texture Processing | Texture sampling |
| BB-4863 | `texture_decompression_engine_low_power` | GPU Texture Processing | Texture sampling |
| BB-4864 | `texture_decompression_engine_axi_stream` | GPU Texture Processing | Texture sampling |
| BB-4865 | `sampler_state_unit_streaming` | GPU Texture Processing | Texture sampling |
| BB-4866 | `sampler_state_unit_framebuffer` | GPU Texture Processing | Texture sampling |
| BB-4867 | `sampler_state_unit_line_buffered` | GPU Texture Processing | Texture sampling |
| BB-4868 | `sampler_state_unit_tile_based` | GPU Texture Processing | Texture sampling |
| BB-4869 | `sampler_state_unit_multi_plane` | GPU Texture Processing | Texture sampling |
| BB-4870 | `sampler_state_unit_multi_channel` | GPU Texture Processing | Texture sampling |
| BB-4871 | `sampler_state_unit_fixed_latency` | GPU Texture Processing | Texture sampling |
| BB-4872 | `sampler_state_unit_low_latency` | GPU Texture Processing | Texture sampling |
| BB-4873 | `sampler_state_unit_high_throughput` | GPU Texture Processing | Texture sampling |
| BB-4874 | `sampler_state_unit_rate_adaptive` | GPU Texture Processing | Texture sampling |
| BB-4875 | `sampler_state_unit_clock_crossing` | GPU Texture Processing | Texture sampling |
| BB-4876 | `sampler_state_unit_metadata_aware` | GPU Texture Processing | Texture sampling |
| BB-4877 | `sampler_state_unit_error_resilient` | GPU Texture Processing | Texture sampling |
| BB-4878 | `sampler_state_unit_programmable` | GPU Texture Processing | Texture sampling |
| BB-4879 | `sampler_state_unit_low_power` | GPU Texture Processing | Texture sampling |
| BB-4880 | `sampler_state_unit_axi_stream` | GPU Texture Processing | Texture sampling |
| BB-4881 | `warp_scheduler_combinational` | GPU Shader Architecture | Shader execution |
| BB-4882 | `warp_scheduler_single_cycle` | GPU Shader Architecture | Shader execution |
| BB-4883 | `warp_scheduler_shallow_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4884 | `warp_scheduler_deep_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4885 | `warp_scheduler_iterative` | GPU Shader Architecture | Shader execution |
| BB-4886 | `warp_scheduler_digit_serial` | GPU Shader Architecture | Shader execution |
| BB-4887 | `warp_scheduler_resource_shared` | GPU Shader Architecture | Shader execution |
| BB-4888 | `warp_scheduler_fully_parallel` | GPU Shader Architecture | Shader execution |
| BB-4889 | `warp_scheduler_vectorized` | GPU Shader Architecture | Shader execution |
| BB-4890 | `warp_scheduler_streaming` | GPU Shader Architecture | Shader execution |
| BB-4891 | `warp_scheduler_buffered_stream` | GPU Shader Architecture | Shader execution |
| BB-4892 | `warp_scheduler_multi_channel` | GPU Shader Architecture | Shader execution |
| BB-4893 | `warp_scheduler_programmable_precision` | GPU Shader Architecture | Shader execution |
| BB-4894 | `warp_scheduler_saturating` | GPU Shader Architecture | Shader execution |
| BB-4895 | `warp_scheduler_fault_detecting` | GPU Shader Architecture | Shader execution |
| BB-4896 | `warp_scheduler_low_power` | GPU Shader Architecture | Shader execution |
| BB-4897 | `wavefront_scoreboard_combinational` | GPU Shader Architecture | Shader execution |
| BB-4898 | `wavefront_scoreboard_single_cycle` | GPU Shader Architecture | Shader execution |
| BB-4899 | `wavefront_scoreboard_shallow_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4900 | `wavefront_scoreboard_deep_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4901 | `wavefront_scoreboard_iterative` | GPU Shader Architecture | Shader execution |
| BB-4902 | `wavefront_scoreboard_digit_serial` | GPU Shader Architecture | Shader execution |
| BB-4903 | `wavefront_scoreboard_resource_shared` | GPU Shader Architecture | Shader execution |
| BB-4904 | `wavefront_scoreboard_fully_parallel` | GPU Shader Architecture | Shader execution |
| BB-4905 | `wavefront_scoreboard_vectorized` | GPU Shader Architecture | Shader execution |
| BB-4906 | `wavefront_scoreboard_streaming` | GPU Shader Architecture | Shader execution |
| BB-4907 | `wavefront_scoreboard_buffered_stream` | GPU Shader Architecture | Shader execution |
| BB-4908 | `wavefront_scoreboard_multi_channel` | GPU Shader Architecture | Shader execution |
| BB-4909 | `wavefront_scoreboard_programmable_precision` | GPU Shader Architecture | Shader execution |
| BB-4910 | `wavefront_scoreboard_saturating` | GPU Shader Architecture | Shader execution |
| BB-4911 | `wavefront_scoreboard_fault_detecting` | GPU Shader Architecture | Shader execution |
| BB-4912 | `wavefront_scoreboard_low_power` | GPU Shader Architecture | Shader execution |
| BB-4913 | `shader_register_file_combinational` | GPU Shader Architecture | Shader execution |
| BB-4914 | `shader_register_file_single_cycle` | GPU Shader Architecture | Shader execution |
| BB-4915 | `shader_register_file_shallow_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4916 | `shader_register_file_deep_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4917 | `shader_register_file_iterative` | GPU Shader Architecture | Shader execution |
| BB-4918 | `shader_register_file_digit_serial` | GPU Shader Architecture | Shader execution |
| BB-4919 | `shader_register_file_resource_shared` | GPU Shader Architecture | Shader execution |
| BB-4920 | `shader_register_file_fully_parallel` | GPU Shader Architecture | Shader execution |
| BB-4921 | `shader_register_file_vectorized` | GPU Shader Architecture | Shader execution |
| BB-4922 | `shader_register_file_streaming` | GPU Shader Architecture | Shader execution |
| BB-4923 | `shader_register_file_buffered_stream` | GPU Shader Architecture | Shader execution |
| BB-4924 | `shader_register_file_multi_channel` | GPU Shader Architecture | Shader execution |
| BB-4925 | `shader_register_file_programmable_precision` | GPU Shader Architecture | Shader execution |
| BB-4926 | `shader_register_file_saturating` | GPU Shader Architecture | Shader execution |
| BB-4927 | `shader_register_file_fault_detecting` | GPU Shader Architecture | Shader execution |
| BB-4928 | `shader_register_file_low_power` | GPU Shader Architecture | Shader execution |
| BB-4929 | `divergent_branch_stack_combinational` | GPU Shader Architecture | Shader execution |
| BB-4930 | `divergent_branch_stack_single_cycle` | GPU Shader Architecture | Shader execution |
| BB-4931 | `divergent_branch_stack_shallow_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4932 | `divergent_branch_stack_deep_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4933 | `divergent_branch_stack_iterative` | GPU Shader Architecture | Shader execution |
| BB-4934 | `divergent_branch_stack_digit_serial` | GPU Shader Architecture | Shader execution |
| BB-4935 | `divergent_branch_stack_resource_shared` | GPU Shader Architecture | Shader execution |
| BB-4936 | `divergent_branch_stack_fully_parallel` | GPU Shader Architecture | Shader execution |
| BB-4937 | `divergent_branch_stack_vectorized` | GPU Shader Architecture | Shader execution |
| BB-4938 | `divergent_branch_stack_streaming` | GPU Shader Architecture | Shader execution |
| BB-4939 | `divergent_branch_stack_buffered_stream` | GPU Shader Architecture | Shader execution |
| BB-4940 | `divergent_branch_stack_multi_channel` | GPU Shader Architecture | Shader execution |
| BB-4941 | `divergent_branch_stack_programmable_precision` | GPU Shader Architecture | Shader execution |
| BB-4942 | `divergent_branch_stack_saturating` | GPU Shader Architecture | Shader execution |
| BB-4943 | `divergent_branch_stack_fault_detecting` | GPU Shader Architecture | Shader execution |
| BB-4944 | `divergent_branch_stack_low_power` | GPU Shader Architecture | Shader execution |
| BB-4945 | `shader_special_function_unit_combinational` | GPU Shader Architecture | Shader execution |
| BB-4946 | `shader_special_function_unit_single_cycle` | GPU Shader Architecture | Shader execution |
| BB-4947 | `shader_special_function_unit_shallow_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4948 | `shader_special_function_unit_deep_pipeline` | GPU Shader Architecture | Shader execution |
| BB-4949 | `shader_special_function_unit_iterative` | GPU Shader Architecture | Shader execution |
| BB-4950 | `shader_special_function_unit_digit_serial` | GPU Shader Architecture | Shader execution |
| BB-4951 | `shader_special_function_unit_resource_shared` | GPU Shader Architecture | Shader execution |
| BB-4952 | `shader_special_function_unit_fully_parallel` | GPU Shader Architecture | Shader execution |
| BB-4953 | `shader_special_function_unit_vectorized` | GPU Shader Architecture | Shader execution |
| BB-4954 | `shader_special_function_unit_streaming` | GPU Shader Architecture | Shader execution |
| BB-4955 | `shader_special_function_unit_buffered_stream` | GPU Shader Architecture | Shader execution |
| BB-4956 | `shader_special_function_unit_multi_channel` | GPU Shader Architecture | Shader execution |
| BB-4957 | `shader_special_function_unit_programmable_precision` | GPU Shader Architecture | Shader execution |
| BB-4958 | `shader_special_function_unit_saturating` | GPU Shader Architecture | Shader execution |
| BB-4959 | `shader_special_function_unit_fault_detecting` | GPU Shader Architecture | Shader execution |
| BB-4960 | `shader_special_function_unit_low_power` | GPU Shader Architecture | Shader execution |
| BB-4961 | `bezier_curve_rasterizer_streaming` | 2D Graphics | Vector and blit engines |
| BB-4962 | `bezier_curve_rasterizer_framebuffer` | 2D Graphics | Vector and blit engines |
| BB-4963 | `bezier_curve_rasterizer_line_buffered` | 2D Graphics | Vector and blit engines |
| BB-4964 | `bezier_curve_rasterizer_tile_based` | 2D Graphics | Vector and blit engines |
| BB-4965 | `bezier_curve_rasterizer_multi_plane` | 2D Graphics | Vector and blit engines |
| BB-4966 | `bezier_curve_rasterizer_multi_channel` | 2D Graphics | Vector and blit engines |
| BB-4967 | `bezier_curve_rasterizer_fixed_latency` | 2D Graphics | Vector and blit engines |
| BB-4968 | `bezier_curve_rasterizer_low_latency` | 2D Graphics | Vector and blit engines |
| BB-4969 | `bezier_curve_rasterizer_high_throughput` | 2D Graphics | Vector and blit engines |
| BB-4970 | `bezier_curve_rasterizer_rate_adaptive` | 2D Graphics | Vector and blit engines |
| BB-4971 | `bezier_curve_rasterizer_clock_crossing` | 2D Graphics | Vector and blit engines |
| BB-4972 | `bezier_curve_rasterizer_metadata_aware` | 2D Graphics | Vector and blit engines |
| BB-4973 | `bezier_curve_rasterizer_error_resilient` | 2D Graphics | Vector and blit engines |
| BB-4974 | `bezier_curve_rasterizer_programmable` | 2D Graphics | Vector and blit engines |
| BB-4975 | `bezier_curve_rasterizer_low_power` | 2D Graphics | Vector and blit engines |
| BB-4976 | `bezier_curve_rasterizer_axi_stream` | 2D Graphics | Vector and blit engines |
| BB-4977 | `antialiased_line_engine_streaming` | 2D Graphics | Vector and blit engines |
| BB-4978 | `antialiased_line_engine_framebuffer` | 2D Graphics | Vector and blit engines |
| BB-4979 | `antialiased_line_engine_line_buffered` | 2D Graphics | Vector and blit engines |
| BB-4980 | `antialiased_line_engine_tile_based` | 2D Graphics | Vector and blit engines |
| BB-4981 | `antialiased_line_engine_multi_plane` | 2D Graphics | Vector and blit engines |
| BB-4982 | `antialiased_line_engine_multi_channel` | 2D Graphics | Vector and blit engines |
| BB-4983 | `antialiased_line_engine_fixed_latency` | 2D Graphics | Vector and blit engines |
| BB-4984 | `antialiased_line_engine_low_latency` | 2D Graphics | Vector and blit engines |
| BB-4985 | `antialiased_line_engine_high_throughput` | 2D Graphics | Vector and blit engines |
| BB-4986 | `antialiased_line_engine_rate_adaptive` | 2D Graphics | Vector and blit engines |
| BB-4987 | `antialiased_line_engine_clock_crossing` | 2D Graphics | Vector and blit engines |
| BB-4988 | `antialiased_line_engine_metadata_aware` | 2D Graphics | Vector and blit engines |
| BB-4989 | `antialiased_line_engine_error_resilient` | 2D Graphics | Vector and blit engines |
| BB-4990 | `antialiased_line_engine_programmable` | 2D Graphics | Vector and blit engines |
| BB-4991 | `antialiased_line_engine_low_power` | 2D Graphics | Vector and blit engines |
| BB-4992 | `antialiased_line_engine_axi_stream` | 2D Graphics | Vector and blit engines |
| BB-4993 | `scanline_polygon_filler_streaming` | 2D Graphics | Vector and blit engines |
| BB-4994 | `scanline_polygon_filler_framebuffer` | 2D Graphics | Vector and blit engines |
| BB-4995 | `scanline_polygon_filler_line_buffered` | 2D Graphics | Vector and blit engines |
| BB-4996 | `scanline_polygon_filler_tile_based` | 2D Graphics | Vector and blit engines |
| BB-4997 | `scanline_polygon_filler_multi_plane` | 2D Graphics | Vector and blit engines |
| BB-4998 | `scanline_polygon_filler_multi_channel` | 2D Graphics | Vector and blit engines |
| BB-4999 | `scanline_polygon_filler_fixed_latency` | 2D Graphics | Vector and blit engines |
| BB-5000 | `scanline_polygon_filler_low_latency` | 2D Graphics | Vector and blit engines |
| BB-5001 | `scanline_polygon_filler_high_throughput` | 2D Graphics | Vector and blit engines |
| BB-5002 | `scanline_polygon_filler_rate_adaptive` | 2D Graphics | Vector and blit engines |
| BB-5003 | `scanline_polygon_filler_clock_crossing` | 2D Graphics | Vector and blit engines |
| BB-5004 | `scanline_polygon_filler_metadata_aware` | 2D Graphics | Vector and blit engines |
| BB-5005 | `scanline_polygon_filler_error_resilient` | 2D Graphics | Vector and blit engines |
| BB-5006 | `scanline_polygon_filler_programmable` | 2D Graphics | Vector and blit engines |
| BB-5007 | `scanline_polygon_filler_low_power` | 2D Graphics | Vector and blit engines |
| BB-5008 | `scanline_polygon_filler_axi_stream` | 2D Graphics | Vector and blit engines |
| BB-5009 | `glyph_cache_controller_streaming` | 2D Graphics | Vector and blit engines |
| BB-5010 | `glyph_cache_controller_framebuffer` | 2D Graphics | Vector and blit engines |
| BB-5011 | `glyph_cache_controller_line_buffered` | 2D Graphics | Vector and blit engines |
| BB-5012 | `glyph_cache_controller_tile_based` | 2D Graphics | Vector and blit engines |
| BB-5013 | `glyph_cache_controller_multi_plane` | 2D Graphics | Vector and blit engines |
| BB-5014 | `glyph_cache_controller_multi_channel` | 2D Graphics | Vector and blit engines |
| BB-5015 | `glyph_cache_controller_fixed_latency` | 2D Graphics | Vector and blit engines |
| BB-5016 | `glyph_cache_controller_low_latency` | 2D Graphics | Vector and blit engines |
| BB-5017 | `glyph_cache_controller_high_throughput` | 2D Graphics | Vector and blit engines |
| BB-5018 | `glyph_cache_controller_rate_adaptive` | 2D Graphics | Vector and blit engines |
| BB-5019 | `glyph_cache_controller_clock_crossing` | 2D Graphics | Vector and blit engines |
| BB-5020 | `glyph_cache_controller_metadata_aware` | 2D Graphics | Vector and blit engines |
| BB-5021 | `glyph_cache_controller_error_resilient` | 2D Graphics | Vector and blit engines |
| BB-5022 | `glyph_cache_controller_programmable` | 2D Graphics | Vector and blit engines |
| BB-5023 | `glyph_cache_controller_low_power` | 2D Graphics | Vector and blit engines |
| BB-5024 | `glyph_cache_controller_axi_stream` | 2D Graphics | Vector and blit engines |
| BB-5025 | `affine_blit_engine_streaming` | 2D Graphics | Vector and blit engines |
| BB-5026 | `affine_blit_engine_framebuffer` | 2D Graphics | Vector and blit engines |
| BB-5027 | `affine_blit_engine_line_buffered` | 2D Graphics | Vector and blit engines |
| BB-5028 | `affine_blit_engine_tile_based` | 2D Graphics | Vector and blit engines |
| BB-5029 | `affine_blit_engine_multi_plane` | 2D Graphics | Vector and blit engines |
| BB-5030 | `affine_blit_engine_multi_channel` | 2D Graphics | Vector and blit engines |
| BB-5031 | `affine_blit_engine_fixed_latency` | 2D Graphics | Vector and blit engines |
| BB-5032 | `affine_blit_engine_low_latency` | 2D Graphics | Vector and blit engines |
| BB-5033 | `affine_blit_engine_high_throughput` | 2D Graphics | Vector and blit engines |
| BB-5034 | `affine_blit_engine_rate_adaptive` | 2D Graphics | Vector and blit engines |
| BB-5035 | `affine_blit_engine_clock_crossing` | 2D Graphics | Vector and blit engines |
| BB-5036 | `affine_blit_engine_metadata_aware` | 2D Graphics | Vector and blit engines |
| BB-5037 | `affine_blit_engine_error_resilient` | 2D Graphics | Vector and blit engines |
| BB-5038 | `affine_blit_engine_programmable` | 2D Graphics | Vector and blit engines |
| BB-5039 | `affine_blit_engine_low_power` | 2D Graphics | Vector and blit engines |
| BB-5040 | `affine_blit_engine_axi_stream` | 2D Graphics | Vector and blit engines |
| BB-5041 | `multi_layer_compositor_streaming` | Display Composition | Display planes and color |
| BB-5042 | `multi_layer_compositor_framebuffer` | Display Composition | Display planes and color |
| BB-5043 | `multi_layer_compositor_line_buffered` | Display Composition | Display planes and color |
| BB-5044 | `multi_layer_compositor_tile_based` | Display Composition | Display planes and color |
| BB-5045 | `multi_layer_compositor_multi_plane` | Display Composition | Display planes and color |
| BB-5046 | `multi_layer_compositor_multi_channel` | Display Composition | Display planes and color |
| BB-5047 | `multi_layer_compositor_fixed_latency` | Display Composition | Display planes and color |
| BB-5048 | `multi_layer_compositor_low_latency` | Display Composition | Display planes and color |
| BB-5049 | `multi_layer_compositor_high_throughput` | Display Composition | Display planes and color |
| BB-5050 | `multi_layer_compositor_rate_adaptive` | Display Composition | Display planes and color |
| BB-5051 | `multi_layer_compositor_clock_crossing` | Display Composition | Display planes and color |
| BB-5052 | `multi_layer_compositor_metadata_aware` | Display Composition | Display planes and color |
| BB-5053 | `multi_layer_compositor_error_resilient` | Display Composition | Display planes and color |
| BB-5054 | `multi_layer_compositor_programmable` | Display Composition | Display planes and color |
| BB-5055 | `multi_layer_compositor_low_power` | Display Composition | Display planes and color |
| BB-5056 | `multi_layer_compositor_axi_stream` | Display Composition | Display planes and color |
| BB-5057 | `cursor_plane_engine_streaming` | Display Composition | Display planes and color |
| BB-5058 | `cursor_plane_engine_framebuffer` | Display Composition | Display planes and color |
| BB-5059 | `cursor_plane_engine_line_buffered` | Display Composition | Display planes and color |
| BB-5060 | `cursor_plane_engine_tile_based` | Display Composition | Display planes and color |
| BB-5061 | `cursor_plane_engine_multi_plane` | Display Composition | Display planes and color |
| BB-5062 | `cursor_plane_engine_multi_channel` | Display Composition | Display planes and color |
| BB-5063 | `cursor_plane_engine_fixed_latency` | Display Composition | Display planes and color |
| BB-5064 | `cursor_plane_engine_low_latency` | Display Composition | Display planes and color |
| BB-5065 | `cursor_plane_engine_high_throughput` | Display Composition | Display planes and color |
| BB-5066 | `cursor_plane_engine_rate_adaptive` | Display Composition | Display planes and color |
| BB-5067 | `cursor_plane_engine_clock_crossing` | Display Composition | Display planes and color |
| BB-5068 | `cursor_plane_engine_metadata_aware` | Display Composition | Display planes and color |
| BB-5069 | `cursor_plane_engine_error_resilient` | Display Composition | Display planes and color |
| BB-5070 | `cursor_plane_engine_programmable` | Display Composition | Display planes and color |
| BB-5071 | `cursor_plane_engine_low_power` | Display Composition | Display planes and color |
| BB-5072 | `cursor_plane_engine_axi_stream` | Display Composition | Display planes and color |
| BB-5073 | `color_key_blender_streaming` | Display Composition | Display planes and color |
| BB-5074 | `color_key_blender_framebuffer` | Display Composition | Display planes and color |
| BB-5075 | `color_key_blender_line_buffered` | Display Composition | Display planes and color |
| BB-5076 | `color_key_blender_tile_based` | Display Composition | Display planes and color |
| BB-5077 | `color_key_blender_multi_plane` | Display Composition | Display planes and color |
| BB-5078 | `color_key_blender_multi_channel` | Display Composition | Display planes and color |
| BB-5079 | `color_key_blender_fixed_latency` | Display Composition | Display planes and color |
| BB-5080 | `color_key_blender_low_latency` | Display Composition | Display planes and color |
| BB-5081 | `color_key_blender_high_throughput` | Display Composition | Display planes and color |
| BB-5082 | `color_key_blender_rate_adaptive` | Display Composition | Display planes and color |
| BB-5083 | `color_key_blender_clock_crossing` | Display Composition | Display planes and color |
| BB-5084 | `color_key_blender_metadata_aware` | Display Composition | Display planes and color |
| BB-5085 | `color_key_blender_error_resilient` | Display Composition | Display planes and color |
| BB-5086 | `color_key_blender_programmable` | Display Composition | Display planes and color |
| BB-5087 | `color_key_blender_low_power` | Display Composition | Display planes and color |
| BB-5088 | `color_key_blender_axi_stream` | Display Composition | Display planes and color |
| BB-5089 | `display_gamma_lut_streaming` | Display Composition | Display planes and color |
| BB-5090 | `display_gamma_lut_framebuffer` | Display Composition | Display planes and color |
| BB-5091 | `display_gamma_lut_line_buffered` | Display Composition | Display planes and color |
| BB-5092 | `display_gamma_lut_tile_based` | Display Composition | Display planes and color |
| BB-5093 | `display_gamma_lut_multi_plane` | Display Composition | Display planes and color |
| BB-5094 | `display_gamma_lut_multi_channel` | Display Composition | Display planes and color |
| BB-5095 | `display_gamma_lut_fixed_latency` | Display Composition | Display planes and color |
| BB-5096 | `display_gamma_lut_low_latency` | Display Composition | Display planes and color |
| BB-5097 | `display_gamma_lut_high_throughput` | Display Composition | Display planes and color |
| BB-5098 | `display_gamma_lut_rate_adaptive` | Display Composition | Display planes and color |
| BB-5099 | `display_gamma_lut_clock_crossing` | Display Composition | Display planes and color |
| BB-5100 | `display_gamma_lut_metadata_aware` | Display Composition | Display planes and color |
| BB-5101 | `display_gamma_lut_error_resilient` | Display Composition | Display planes and color |
| BB-5102 | `display_gamma_lut_programmable` | Display Composition | Display planes and color |
| BB-5103 | `display_gamma_lut_low_power` | Display Composition | Display planes and color |
| BB-5104 | `display_gamma_lut_axi_stream` | Display Composition | Display planes and color |
| BB-5105 | `display_damage_tracker_streaming` | Display Composition | Display planes and color |
| BB-5106 | `display_damage_tracker_framebuffer` | Display Composition | Display planes and color |
| BB-5107 | `display_damage_tracker_line_buffered` | Display Composition | Display planes and color |
| BB-5108 | `display_damage_tracker_tile_based` | Display Composition | Display planes and color |
| BB-5109 | `display_damage_tracker_multi_plane` | Display Composition | Display planes and color |
| BB-5110 | `display_damage_tracker_multi_channel` | Display Composition | Display planes and color |
| BB-5111 | `display_damage_tracker_fixed_latency` | Display Composition | Display planes and color |
| BB-5112 | `display_damage_tracker_low_latency` | Display Composition | Display planes and color |
| BB-5113 | `display_damage_tracker_high_throughput` | Display Composition | Display planes and color |
| BB-5114 | `display_damage_tracker_rate_adaptive` | Display Composition | Display planes and color |
| BB-5115 | `display_damage_tracker_clock_crossing` | Display Composition | Display planes and color |
| BB-5116 | `display_damage_tracker_metadata_aware` | Display Composition | Display planes and color |
| BB-5117 | `display_damage_tracker_error_resilient` | Display Composition | Display planes and color |
| BB-5118 | `display_damage_tracker_programmable` | Display Composition | Display planes and color |
| BB-5119 | `display_damage_tracker_low_power` | Display Composition | Display planes and color |
| BB-5120 | `display_damage_tracker_axi_stream` | Display Composition | Display planes and color |
| BB-5121 | `tensor_dma_scheduler_single_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5122 | `tensor_dma_scheduler_dual_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5123 | `tensor_dma_scheduler_banked` | AI Tensor Movement | Tensor data orchestration |
| BB-5124 | `tensor_dma_scheduler_interleaved` | AI Tensor Movement | Tensor data orchestration |
| BB-5125 | `tensor_dma_scheduler_write_back` | AI Tensor Movement | Tensor data orchestration |
| BB-5126 | `tensor_dma_scheduler_write_through` | AI Tensor Movement | Tensor data orchestration |
| BB-5127 | `tensor_dma_scheduler_nonblocking` | AI Tensor Movement | Tensor data orchestration |
| BB-5128 | `tensor_dma_scheduler_pipelined` | AI Tensor Movement | Tensor data orchestration |
| BB-5129 | `tensor_dma_scheduler_burst_optimized` | AI Tensor Movement | Tensor data orchestration |
| BB-5130 | `tensor_dma_scheduler_multi_channel` | AI Tensor Movement | Tensor data orchestration |
| BB-5131 | `tensor_dma_scheduler_ecc_protected` | AI Tensor Movement | Tensor data orchestration |
| BB-5132 | `tensor_dma_scheduler_scrubbed` | AI Tensor Movement | Tensor data orchestration |
| BB-5133 | `tensor_dma_scheduler_clock_crossing` | AI Tensor Movement | Tensor data orchestration |
| BB-5134 | `tensor_dma_scheduler_qos_aware` | AI Tensor Movement | Tensor data orchestration |
| BB-5135 | `tensor_dma_scheduler_low_power` | AI Tensor Movement | Tensor data orchestration |
| BB-5136 | `tensor_dma_scheduler_formally_instrumented` | AI Tensor Movement | Tensor data orchestration |
| BB-5137 | `tensor_tile_swizzler_single_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5138 | `tensor_tile_swizzler_dual_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5139 | `tensor_tile_swizzler_banked` | AI Tensor Movement | Tensor data orchestration |
| BB-5140 | `tensor_tile_swizzler_interleaved` | AI Tensor Movement | Tensor data orchestration |
| BB-5141 | `tensor_tile_swizzler_write_back` | AI Tensor Movement | Tensor data orchestration |
| BB-5142 | `tensor_tile_swizzler_write_through` | AI Tensor Movement | Tensor data orchestration |
| BB-5143 | `tensor_tile_swizzler_nonblocking` | AI Tensor Movement | Tensor data orchestration |
| BB-5144 | `tensor_tile_swizzler_pipelined` | AI Tensor Movement | Tensor data orchestration |
| BB-5145 | `tensor_tile_swizzler_burst_optimized` | AI Tensor Movement | Tensor data orchestration |
| BB-5146 | `tensor_tile_swizzler_multi_channel` | AI Tensor Movement | Tensor data orchestration |
| BB-5147 | `tensor_tile_swizzler_ecc_protected` | AI Tensor Movement | Tensor data orchestration |
| BB-5148 | `tensor_tile_swizzler_scrubbed` | AI Tensor Movement | Tensor data orchestration |
| BB-5149 | `tensor_tile_swizzler_clock_crossing` | AI Tensor Movement | Tensor data orchestration |
| BB-5150 | `tensor_tile_swizzler_qos_aware` | AI Tensor Movement | Tensor data orchestration |
| BB-5151 | `tensor_tile_swizzler_low_power` | AI Tensor Movement | Tensor data orchestration |
| BB-5152 | `tensor_tile_swizzler_formally_instrumented` | AI Tensor Movement | Tensor data orchestration |
| BB-5153 | `tensor_layout_converter_single_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5154 | `tensor_layout_converter_dual_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5155 | `tensor_layout_converter_banked` | AI Tensor Movement | Tensor data orchestration |
| BB-5156 | `tensor_layout_converter_interleaved` | AI Tensor Movement | Tensor data orchestration |
| BB-5157 | `tensor_layout_converter_write_back` | AI Tensor Movement | Tensor data orchestration |
| BB-5158 | `tensor_layout_converter_write_through` | AI Tensor Movement | Tensor data orchestration |
| BB-5159 | `tensor_layout_converter_nonblocking` | AI Tensor Movement | Tensor data orchestration |
| BB-5160 | `tensor_layout_converter_pipelined` | AI Tensor Movement | Tensor data orchestration |
| BB-5161 | `tensor_layout_converter_burst_optimized` | AI Tensor Movement | Tensor data orchestration |
| BB-5162 | `tensor_layout_converter_multi_channel` | AI Tensor Movement | Tensor data orchestration |
| BB-5163 | `tensor_layout_converter_ecc_protected` | AI Tensor Movement | Tensor data orchestration |
| BB-5164 | `tensor_layout_converter_scrubbed` | AI Tensor Movement | Tensor data orchestration |
| BB-5165 | `tensor_layout_converter_clock_crossing` | AI Tensor Movement | Tensor data orchestration |
| BB-5166 | `tensor_layout_converter_qos_aware` | AI Tensor Movement | Tensor data orchestration |
| BB-5167 | `tensor_layout_converter_low_power` | AI Tensor Movement | Tensor data orchestration |
| BB-5168 | `tensor_layout_converter_formally_instrumented` | AI Tensor Movement | Tensor data orchestration |
| BB-5169 | `tensor_double_buffer_single_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5170 | `tensor_double_buffer_dual_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5171 | `tensor_double_buffer_banked` | AI Tensor Movement | Tensor data orchestration |
| BB-5172 | `tensor_double_buffer_interleaved` | AI Tensor Movement | Tensor data orchestration |
| BB-5173 | `tensor_double_buffer_write_back` | AI Tensor Movement | Tensor data orchestration |
| BB-5174 | `tensor_double_buffer_write_through` | AI Tensor Movement | Tensor data orchestration |
| BB-5175 | `tensor_double_buffer_nonblocking` | AI Tensor Movement | Tensor data orchestration |
| BB-5176 | `tensor_double_buffer_pipelined` | AI Tensor Movement | Tensor data orchestration |
| BB-5177 | `tensor_double_buffer_burst_optimized` | AI Tensor Movement | Tensor data orchestration |
| BB-5178 | `tensor_double_buffer_multi_channel` | AI Tensor Movement | Tensor data orchestration |
| BB-5179 | `tensor_double_buffer_ecc_protected` | AI Tensor Movement | Tensor data orchestration |
| BB-5180 | `tensor_double_buffer_scrubbed` | AI Tensor Movement | Tensor data orchestration |
| BB-5181 | `tensor_double_buffer_clock_crossing` | AI Tensor Movement | Tensor data orchestration |
| BB-5182 | `tensor_double_buffer_qos_aware` | AI Tensor Movement | Tensor data orchestration |
| BB-5183 | `tensor_double_buffer_low_power` | AI Tensor Movement | Tensor data orchestration |
| BB-5184 | `tensor_double_buffer_formally_instrumented` | AI Tensor Movement | Tensor data orchestration |
| BB-5185 | `tensor_bank_conflict_resolver_single_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5186 | `tensor_bank_conflict_resolver_dual_port` | AI Tensor Movement | Tensor data orchestration |
| BB-5187 | `tensor_bank_conflict_resolver_banked` | AI Tensor Movement | Tensor data orchestration |
| BB-5188 | `tensor_bank_conflict_resolver_interleaved` | AI Tensor Movement | Tensor data orchestration |
| BB-5189 | `tensor_bank_conflict_resolver_write_back` | AI Tensor Movement | Tensor data orchestration |
| BB-5190 | `tensor_bank_conflict_resolver_write_through` | AI Tensor Movement | Tensor data orchestration |
| BB-5191 | `tensor_bank_conflict_resolver_nonblocking` | AI Tensor Movement | Tensor data orchestration |
| BB-5192 | `tensor_bank_conflict_resolver_pipelined` | AI Tensor Movement | Tensor data orchestration |
| BB-5193 | `tensor_bank_conflict_resolver_burst_optimized` | AI Tensor Movement | Tensor data orchestration |
| BB-5194 | `tensor_bank_conflict_resolver_multi_channel` | AI Tensor Movement | Tensor data orchestration |
| BB-5195 | `tensor_bank_conflict_resolver_ecc_protected` | AI Tensor Movement | Tensor data orchestration |
| BB-5196 | `tensor_bank_conflict_resolver_scrubbed` | AI Tensor Movement | Tensor data orchestration |
| BB-5197 | `tensor_bank_conflict_resolver_clock_crossing` | AI Tensor Movement | Tensor data orchestration |
| BB-5198 | `tensor_bank_conflict_resolver_qos_aware` | AI Tensor Movement | Tensor data orchestration |
| BB-5199 | `tensor_bank_conflict_resolver_low_power` | AI Tensor Movement | Tensor data orchestration |
| BB-5200 | `tensor_bank_conflict_resolver_formally_instrumented` | AI Tensor Movement | Tensor data orchestration |
| BB-5201 | `winograd_convolution_engine_combinational` | AI Convolution | Advanced convolution |
| BB-5202 | `winograd_convolution_engine_single_cycle` | AI Convolution | Advanced convolution |
| BB-5203 | `winograd_convolution_engine_shallow_pipeline` | AI Convolution | Advanced convolution |
| BB-5204 | `winograd_convolution_engine_deep_pipeline` | AI Convolution | Advanced convolution |
| BB-5205 | `winograd_convolution_engine_iterative` | AI Convolution | Advanced convolution |
| BB-5206 | `winograd_convolution_engine_digit_serial` | AI Convolution | Advanced convolution |
| BB-5207 | `winograd_convolution_engine_resource_shared` | AI Convolution | Advanced convolution |
| BB-5208 | `winograd_convolution_engine_fully_parallel` | AI Convolution | Advanced convolution |
| BB-5209 | `winograd_convolution_engine_vectorized` | AI Convolution | Advanced convolution |
| BB-5210 | `winograd_convolution_engine_streaming` | AI Convolution | Advanced convolution |
| BB-5211 | `winograd_convolution_engine_buffered_stream` | AI Convolution | Advanced convolution |
| BB-5212 | `winograd_convolution_engine_multi_channel` | AI Convolution | Advanced convolution |
| BB-5213 | `winograd_convolution_engine_programmable_precision` | AI Convolution | Advanced convolution |
| BB-5214 | `winograd_convolution_engine_saturating` | AI Convolution | Advanced convolution |
| BB-5215 | `winograd_convolution_engine_fault_detecting` | AI Convolution | Advanced convolution |
| BB-5216 | `winograd_convolution_engine_low_power` | AI Convolution | Advanced convolution |
| BB-5217 | `fft_convolution_engine_combinational` | AI Convolution | Advanced convolution |
| BB-5218 | `fft_convolution_engine_single_cycle` | AI Convolution | Advanced convolution |
| BB-5219 | `fft_convolution_engine_shallow_pipeline` | AI Convolution | Advanced convolution |
| BB-5220 | `fft_convolution_engine_deep_pipeline` | AI Convolution | Advanced convolution |
| BB-5221 | `fft_convolution_engine_iterative` | AI Convolution | Advanced convolution |
| BB-5222 | `fft_convolution_engine_digit_serial` | AI Convolution | Advanced convolution |
| BB-5223 | `fft_convolution_engine_resource_shared` | AI Convolution | Advanced convolution |
| BB-5224 | `fft_convolution_engine_fully_parallel` | AI Convolution | Advanced convolution |
| BB-5225 | `fft_convolution_engine_vectorized` | AI Convolution | Advanced convolution |
| BB-5226 | `fft_convolution_engine_streaming` | AI Convolution | Advanced convolution |
| BB-5227 | `fft_convolution_engine_buffered_stream` | AI Convolution | Advanced convolution |
| BB-5228 | `fft_convolution_engine_multi_channel` | AI Convolution | Advanced convolution |
| BB-5229 | `fft_convolution_engine_programmable_precision` | AI Convolution | Advanced convolution |
| BB-5230 | `fft_convolution_engine_saturating` | AI Convolution | Advanced convolution |
| BB-5231 | `fft_convolution_engine_fault_detecting` | AI Convolution | Advanced convolution |
| BB-5232 | `fft_convolution_engine_low_power` | AI Convolution | Advanced convolution |
| BB-5233 | `dilated_convolution_engine_combinational` | AI Convolution | Advanced convolution |
| BB-5234 | `dilated_convolution_engine_single_cycle` | AI Convolution | Advanced convolution |
| BB-5235 | `dilated_convolution_engine_shallow_pipeline` | AI Convolution | Advanced convolution |
| BB-5236 | `dilated_convolution_engine_deep_pipeline` | AI Convolution | Advanced convolution |
| BB-5237 | `dilated_convolution_engine_iterative` | AI Convolution | Advanced convolution |
| BB-5238 | `dilated_convolution_engine_digit_serial` | AI Convolution | Advanced convolution |
| BB-5239 | `dilated_convolution_engine_resource_shared` | AI Convolution | Advanced convolution |
| BB-5240 | `dilated_convolution_engine_fully_parallel` | AI Convolution | Advanced convolution |
| BB-5241 | `dilated_convolution_engine_vectorized` | AI Convolution | Advanced convolution |
| BB-5242 | `dilated_convolution_engine_streaming` | AI Convolution | Advanced convolution |
| BB-5243 | `dilated_convolution_engine_buffered_stream` | AI Convolution | Advanced convolution |
| BB-5244 | `dilated_convolution_engine_multi_channel` | AI Convolution | Advanced convolution |
| BB-5245 | `dilated_convolution_engine_programmable_precision` | AI Convolution | Advanced convolution |
| BB-5246 | `dilated_convolution_engine_saturating` | AI Convolution | Advanced convolution |
| BB-5247 | `dilated_convolution_engine_fault_detecting` | AI Convolution | Advanced convolution |
| BB-5248 | `dilated_convolution_engine_low_power` | AI Convolution | Advanced convolution |
| BB-5249 | `deformable_convolution_engine_combinational` | AI Convolution | Advanced convolution |
| BB-5250 | `deformable_convolution_engine_single_cycle` | AI Convolution | Advanced convolution |
| BB-5251 | `deformable_convolution_engine_shallow_pipeline` | AI Convolution | Advanced convolution |
| BB-5252 | `deformable_convolution_engine_deep_pipeline` | AI Convolution | Advanced convolution |
| BB-5253 | `deformable_convolution_engine_iterative` | AI Convolution | Advanced convolution |
| BB-5254 | `deformable_convolution_engine_digit_serial` | AI Convolution | Advanced convolution |
| BB-5255 | `deformable_convolution_engine_resource_shared` | AI Convolution | Advanced convolution |
| BB-5256 | `deformable_convolution_engine_fully_parallel` | AI Convolution | Advanced convolution |
| BB-5257 | `deformable_convolution_engine_vectorized` | AI Convolution | Advanced convolution |
| BB-5258 | `deformable_convolution_engine_streaming` | AI Convolution | Advanced convolution |
| BB-5259 | `deformable_convolution_engine_buffered_stream` | AI Convolution | Advanced convolution |
| BB-5260 | `deformable_convolution_engine_multi_channel` | AI Convolution | Advanced convolution |
| BB-5261 | `deformable_convolution_engine_programmable_precision` | AI Convolution | Advanced convolution |
| BB-5262 | `deformable_convolution_engine_saturating` | AI Convolution | Advanced convolution |
| BB-5263 | `deformable_convolution_engine_fault_detecting` | AI Convolution | Advanced convolution |
| BB-5264 | `deformable_convolution_engine_low_power` | AI Convolution | Advanced convolution |
| BB-5265 | `grouped_convolution_engine_combinational` | AI Convolution | Advanced convolution |
| BB-5266 | `grouped_convolution_engine_single_cycle` | AI Convolution | Advanced convolution |
| BB-5267 | `grouped_convolution_engine_shallow_pipeline` | AI Convolution | Advanced convolution |
| BB-5268 | `grouped_convolution_engine_deep_pipeline` | AI Convolution | Advanced convolution |
| BB-5269 | `grouped_convolution_engine_iterative` | AI Convolution | Advanced convolution |
| BB-5270 | `grouped_convolution_engine_digit_serial` | AI Convolution | Advanced convolution |
| BB-5271 | `grouped_convolution_engine_resource_shared` | AI Convolution | Advanced convolution |
| BB-5272 | `grouped_convolution_engine_fully_parallel` | AI Convolution | Advanced convolution |
| BB-5273 | `grouped_convolution_engine_vectorized` | AI Convolution | Advanced convolution |
| BB-5274 | `grouped_convolution_engine_streaming` | AI Convolution | Advanced convolution |
| BB-5275 | `grouped_convolution_engine_buffered_stream` | AI Convolution | Advanced convolution |
| BB-5276 | `grouped_convolution_engine_multi_channel` | AI Convolution | Advanced convolution |
| BB-5277 | `grouped_convolution_engine_programmable_precision` | AI Convolution | Advanced convolution |
| BB-5278 | `grouped_convolution_engine_saturating` | AI Convolution | Advanced convolution |
| BB-5279 | `grouped_convolution_engine_fault_detecting` | AI Convolution | Advanced convolution |
| BB-5280 | `grouped_convolution_engine_low_power` | AI Convolution | Advanced convolution |
| BB-5281 | `rms_norm_engine_combinational` | AI Activation and Normalization | Activation and normalization |
| BB-5282 | `rms_norm_engine_single_cycle` | AI Activation and Normalization | Activation and normalization |
| BB-5283 | `rms_norm_engine_shallow_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5284 | `rms_norm_engine_deep_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5285 | `rms_norm_engine_iterative` | AI Activation and Normalization | Activation and normalization |
| BB-5286 | `rms_norm_engine_digit_serial` | AI Activation and Normalization | Activation and normalization |
| BB-5287 | `rms_norm_engine_resource_shared` | AI Activation and Normalization | Activation and normalization |
| BB-5288 | `rms_norm_engine_fully_parallel` | AI Activation and Normalization | Activation and normalization |
| BB-5289 | `rms_norm_engine_vectorized` | AI Activation and Normalization | Activation and normalization |
| BB-5290 | `rms_norm_engine_streaming` | AI Activation and Normalization | Activation and normalization |
| BB-5291 | `rms_norm_engine_buffered_stream` | AI Activation and Normalization | Activation and normalization |
| BB-5292 | `rms_norm_engine_multi_channel` | AI Activation and Normalization | Activation and normalization |
| BB-5293 | `rms_norm_engine_programmable_precision` | AI Activation and Normalization | Activation and normalization |
| BB-5294 | `rms_norm_engine_saturating` | AI Activation and Normalization | Activation and normalization |
| BB-5295 | `rms_norm_engine_fault_detecting` | AI Activation and Normalization | Activation and normalization |
| BB-5296 | `rms_norm_engine_low_power` | AI Activation and Normalization | Activation and normalization |
| BB-5297 | `local_response_norm_combinational` | AI Activation and Normalization | Activation and normalization |
| BB-5298 | `local_response_norm_single_cycle` | AI Activation and Normalization | Activation and normalization |
| BB-5299 | `local_response_norm_shallow_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5300 | `local_response_norm_deep_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5301 | `local_response_norm_iterative` | AI Activation and Normalization | Activation and normalization |
| BB-5302 | `local_response_norm_digit_serial` | AI Activation and Normalization | Activation and normalization |
| BB-5303 | `local_response_norm_resource_shared` | AI Activation and Normalization | Activation and normalization |
| BB-5304 | `local_response_norm_fully_parallel` | AI Activation and Normalization | Activation and normalization |
| BB-5305 | `local_response_norm_vectorized` | AI Activation and Normalization | Activation and normalization |
| BB-5306 | `local_response_norm_streaming` | AI Activation and Normalization | Activation and normalization |
| BB-5307 | `local_response_norm_buffered_stream` | AI Activation and Normalization | Activation and normalization |
| BB-5308 | `local_response_norm_multi_channel` | AI Activation and Normalization | Activation and normalization |
| BB-5309 | `local_response_norm_programmable_precision` | AI Activation and Normalization | Activation and normalization |
| BB-5310 | `local_response_norm_saturating` | AI Activation and Normalization | Activation and normalization |
| BB-5311 | `local_response_norm_fault_detecting` | AI Activation and Normalization | Activation and normalization |
| BB-5312 | `local_response_norm_low_power` | AI Activation and Normalization | Activation and normalization |
| BB-5313 | `parametric_relu_engine_combinational` | AI Activation and Normalization | Activation and normalization |
| BB-5314 | `parametric_relu_engine_single_cycle` | AI Activation and Normalization | Activation and normalization |
| BB-5315 | `parametric_relu_engine_shallow_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5316 | `parametric_relu_engine_deep_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5317 | `parametric_relu_engine_iterative` | AI Activation and Normalization | Activation and normalization |
| BB-5318 | `parametric_relu_engine_digit_serial` | AI Activation and Normalization | Activation and normalization |
| BB-5319 | `parametric_relu_engine_resource_shared` | AI Activation and Normalization | Activation and normalization |
| BB-5320 | `parametric_relu_engine_fully_parallel` | AI Activation and Normalization | Activation and normalization |
| BB-5321 | `parametric_relu_engine_vectorized` | AI Activation and Normalization | Activation and normalization |
| BB-5322 | `parametric_relu_engine_streaming` | AI Activation and Normalization | Activation and normalization |
| BB-5323 | `parametric_relu_engine_buffered_stream` | AI Activation and Normalization | Activation and normalization |
| BB-5324 | `parametric_relu_engine_multi_channel` | AI Activation and Normalization | Activation and normalization |
| BB-5325 | `parametric_relu_engine_programmable_precision` | AI Activation and Normalization | Activation and normalization |
| BB-5326 | `parametric_relu_engine_saturating` | AI Activation and Normalization | Activation and normalization |
| BB-5327 | `parametric_relu_engine_fault_detecting` | AI Activation and Normalization | Activation and normalization |
| BB-5328 | `parametric_relu_engine_low_power` | AI Activation and Normalization | Activation and normalization |
| BB-5329 | `mish_activation_engine_combinational` | AI Activation and Normalization | Activation and normalization |
| BB-5330 | `mish_activation_engine_single_cycle` | AI Activation and Normalization | Activation and normalization |
| BB-5331 | `mish_activation_engine_shallow_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5332 | `mish_activation_engine_deep_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5333 | `mish_activation_engine_iterative` | AI Activation and Normalization | Activation and normalization |
| BB-5334 | `mish_activation_engine_digit_serial` | AI Activation and Normalization | Activation and normalization |
| BB-5335 | `mish_activation_engine_resource_shared` | AI Activation and Normalization | Activation and normalization |
| BB-5336 | `mish_activation_engine_fully_parallel` | AI Activation and Normalization | Activation and normalization |
| BB-5337 | `mish_activation_engine_vectorized` | AI Activation and Normalization | Activation and normalization |
| BB-5338 | `mish_activation_engine_streaming` | AI Activation and Normalization | Activation and normalization |
| BB-5339 | `mish_activation_engine_buffered_stream` | AI Activation and Normalization | Activation and normalization |
| BB-5340 | `mish_activation_engine_multi_channel` | AI Activation and Normalization | Activation and normalization |
| BB-5341 | `mish_activation_engine_programmable_precision` | AI Activation and Normalization | Activation and normalization |
| BB-5342 | `mish_activation_engine_saturating` | AI Activation and Normalization | Activation and normalization |
| BB-5343 | `mish_activation_engine_fault_detecting` | AI Activation and Normalization | Activation and normalization |
| BB-5344 | `mish_activation_engine_low_power` | AI Activation and Normalization | Activation and normalization |
| BB-5345 | `activation_lookup_interpolator_combinational` | AI Activation and Normalization | Activation and normalization |
| BB-5346 | `activation_lookup_interpolator_single_cycle` | AI Activation and Normalization | Activation and normalization |
| BB-5347 | `activation_lookup_interpolator_shallow_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5348 | `activation_lookup_interpolator_deep_pipeline` | AI Activation and Normalization | Activation and normalization |
| BB-5349 | `activation_lookup_interpolator_iterative` | AI Activation and Normalization | Activation and normalization |
| BB-5350 | `activation_lookup_interpolator_digit_serial` | AI Activation and Normalization | Activation and normalization |
| BB-5351 | `activation_lookup_interpolator_resource_shared` | AI Activation and Normalization | Activation and normalization |
| BB-5352 | `activation_lookup_interpolator_fully_parallel` | AI Activation and Normalization | Activation and normalization |
| BB-5353 | `activation_lookup_interpolator_vectorized` | AI Activation and Normalization | Activation and normalization |
| BB-5354 | `activation_lookup_interpolator_streaming` | AI Activation and Normalization | Activation and normalization |
| BB-5355 | `activation_lookup_interpolator_buffered_stream` | AI Activation and Normalization | Activation and normalization |
| BB-5356 | `activation_lookup_interpolator_multi_channel` | AI Activation and Normalization | Activation and normalization |
| BB-5357 | `activation_lookup_interpolator_programmable_precision` | AI Activation and Normalization | Activation and normalization |
| BB-5358 | `activation_lookup_interpolator_saturating` | AI Activation and Normalization | Activation and normalization |
| BB-5359 | `activation_lookup_interpolator_fault_detecting` | AI Activation and Normalization | Activation and normalization |
| BB-5360 | `activation_lookup_interpolator_low_power` | AI Activation and Normalization | Activation and normalization |
| BB-5361 | `adaptive_pooling_engine_single_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5362 | `adaptive_pooling_engine_multi_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5363 | `adaptive_pooling_engine_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5364 | `adaptive_pooling_engine_deep_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5365 | `adaptive_pooling_engine_frame_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5366 | `adaptive_pooling_engine_packet_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5367 | `adaptive_pooling_engine_backpressure_capable` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5368 | `adaptive_pooling_engine_rate_adaptive` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5369 | `adaptive_pooling_engine_time_multiplexed` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5370 | `adaptive_pooling_engine_fully_parallel` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5371 | `adaptive_pooling_engine_buffered` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5372 | `adaptive_pooling_engine_clock_crossing` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5373 | `adaptive_pooling_engine_error_detecting` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5374 | `adaptive_pooling_engine_formally_instrumented` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5375 | `adaptive_pooling_engine_low_power` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5376 | `adaptive_pooling_engine_axi_stream` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5377 | `roi_align_engine_single_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5378 | `roi_align_engine_multi_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5379 | `roi_align_engine_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5380 | `roi_align_engine_deep_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5381 | `roi_align_engine_frame_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5382 | `roi_align_engine_packet_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5383 | `roi_align_engine_backpressure_capable` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5384 | `roi_align_engine_rate_adaptive` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5385 | `roi_align_engine_time_multiplexed` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5386 | `roi_align_engine_fully_parallel` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5387 | `roi_align_engine_buffered` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5388 | `roi_align_engine_clock_crossing` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5389 | `roi_align_engine_error_detecting` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5390 | `roi_align_engine_formally_instrumented` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5391 | `roi_align_engine_low_power` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5392 | `roi_align_engine_axi_stream` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5393 | `non_max_suppression_engine_single_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5394 | `non_max_suppression_engine_multi_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5395 | `non_max_suppression_engine_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5396 | `non_max_suppression_engine_deep_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5397 | `non_max_suppression_engine_frame_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5398 | `non_max_suppression_engine_packet_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5399 | `non_max_suppression_engine_backpressure_capable` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5400 | `non_max_suppression_engine_rate_adaptive` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5401 | `non_max_suppression_engine_time_multiplexed` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5402 | `non_max_suppression_engine_fully_parallel` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5403 | `non_max_suppression_engine_buffered` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5404 | `non_max_suppression_engine_clock_crossing` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5405 | `non_max_suppression_engine_error_detecting` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5406 | `non_max_suppression_engine_formally_instrumented` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5407 | `non_max_suppression_engine_low_power` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5408 | `non_max_suppression_engine_axi_stream` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5409 | `topk_selection_engine_single_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5410 | `topk_selection_engine_multi_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5411 | `topk_selection_engine_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5412 | `topk_selection_engine_deep_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5413 | `topk_selection_engine_frame_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5414 | `topk_selection_engine_packet_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5415 | `topk_selection_engine_backpressure_capable` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5416 | `topk_selection_engine_rate_adaptive` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5417 | `topk_selection_engine_time_multiplexed` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5418 | `topk_selection_engine_fully_parallel` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5419 | `topk_selection_engine_buffered` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5420 | `topk_selection_engine_clock_crossing` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5421 | `topk_selection_engine_error_detecting` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5422 | `topk_selection_engine_formally_instrumented` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5423 | `topk_selection_engine_low_power` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5424 | `topk_selection_engine_axi_stream` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5425 | `bounding_box_decoder_single_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5426 | `bounding_box_decoder_multi_lane` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5427 | `bounding_box_decoder_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5428 | `bounding_box_decoder_deep_pipelined` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5429 | `bounding_box_decoder_frame_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5430 | `bounding_box_decoder_packet_aware` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5431 | `bounding_box_decoder_backpressure_capable` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5432 | `bounding_box_decoder_rate_adaptive` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5433 | `bounding_box_decoder_time_multiplexed` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5434 | `bounding_box_decoder_fully_parallel` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5435 | `bounding_box_decoder_buffered` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5436 | `bounding_box_decoder_clock_crossing` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5437 | `bounding_box_decoder_error_detecting` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5438 | `bounding_box_decoder_formally_instrumented` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5439 | `bounding_box_decoder_low_power` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5440 | `bounding_box_decoder_axi_stream` | AI Pooling and Postprocessing | Pooling and detection postprocess |
| BB-5441 | `flash_attention_tile_engine_combinational` | Transformer Attention | Advanced attention |
| BB-5442 | `flash_attention_tile_engine_single_cycle` | Transformer Attention | Advanced attention |
| BB-5443 | `flash_attention_tile_engine_shallow_pipeline` | Transformer Attention | Advanced attention |
| BB-5444 | `flash_attention_tile_engine_deep_pipeline` | Transformer Attention | Advanced attention |
| BB-5445 | `flash_attention_tile_engine_iterative` | Transformer Attention | Advanced attention |
| BB-5446 | `flash_attention_tile_engine_digit_serial` | Transformer Attention | Advanced attention |
| BB-5447 | `flash_attention_tile_engine_resource_shared` | Transformer Attention | Advanced attention |
| BB-5448 | `flash_attention_tile_engine_fully_parallel` | Transformer Attention | Advanced attention |
| BB-5449 | `flash_attention_tile_engine_vectorized` | Transformer Attention | Advanced attention |
| BB-5450 | `flash_attention_tile_engine_streaming` | Transformer Attention | Advanced attention |
| BB-5451 | `flash_attention_tile_engine_buffered_stream` | Transformer Attention | Advanced attention |
| BB-5452 | `flash_attention_tile_engine_multi_channel` | Transformer Attention | Advanced attention |
| BB-5453 | `flash_attention_tile_engine_programmable_precision` | Transformer Attention | Advanced attention |
| BB-5454 | `flash_attention_tile_engine_saturating` | Transformer Attention | Advanced attention |
| BB-5455 | `flash_attention_tile_engine_fault_detecting` | Transformer Attention | Advanced attention |
| BB-5456 | `flash_attention_tile_engine_low_power` | Transformer Attention | Advanced attention |
| BB-5457 | `causal_mask_generator_combinational` | Transformer Attention | Advanced attention |
| BB-5458 | `causal_mask_generator_single_cycle` | Transformer Attention | Advanced attention |
| BB-5459 | `causal_mask_generator_shallow_pipeline` | Transformer Attention | Advanced attention |
| BB-5460 | `causal_mask_generator_deep_pipeline` | Transformer Attention | Advanced attention |
| BB-5461 | `causal_mask_generator_iterative` | Transformer Attention | Advanced attention |
| BB-5462 | `causal_mask_generator_digit_serial` | Transformer Attention | Advanced attention |
| BB-5463 | `causal_mask_generator_resource_shared` | Transformer Attention | Advanced attention |
| BB-5464 | `causal_mask_generator_fully_parallel` | Transformer Attention | Advanced attention |
| BB-5465 | `causal_mask_generator_vectorized` | Transformer Attention | Advanced attention |
| BB-5466 | `causal_mask_generator_streaming` | Transformer Attention | Advanced attention |
| BB-5467 | `causal_mask_generator_buffered_stream` | Transformer Attention | Advanced attention |
| BB-5468 | `causal_mask_generator_multi_channel` | Transformer Attention | Advanced attention |
| BB-5469 | `causal_mask_generator_programmable_precision` | Transformer Attention | Advanced attention |
| BB-5470 | `causal_mask_generator_saturating` | Transformer Attention | Advanced attention |
| BB-5471 | `causal_mask_generator_fault_detecting` | Transformer Attention | Advanced attention |
| BB-5472 | `causal_mask_generator_low_power` | Transformer Attention | Advanced attention |
| BB-5473 | `attention_dropout_engine_combinational` | Transformer Attention | Advanced attention |
| BB-5474 | `attention_dropout_engine_single_cycle` | Transformer Attention | Advanced attention |
| BB-5475 | `attention_dropout_engine_shallow_pipeline` | Transformer Attention | Advanced attention |
| BB-5476 | `attention_dropout_engine_deep_pipeline` | Transformer Attention | Advanced attention |
| BB-5477 | `attention_dropout_engine_iterative` | Transformer Attention | Advanced attention |
| BB-5478 | `attention_dropout_engine_digit_serial` | Transformer Attention | Advanced attention |
| BB-5479 | `attention_dropout_engine_resource_shared` | Transformer Attention | Advanced attention |
| BB-5480 | `attention_dropout_engine_fully_parallel` | Transformer Attention | Advanced attention |
| BB-5481 | `attention_dropout_engine_vectorized` | Transformer Attention | Advanced attention |
| BB-5482 | `attention_dropout_engine_streaming` | Transformer Attention | Advanced attention |
| BB-5483 | `attention_dropout_engine_buffered_stream` | Transformer Attention | Advanced attention |
| BB-5484 | `attention_dropout_engine_multi_channel` | Transformer Attention | Advanced attention |
| BB-5485 | `attention_dropout_engine_programmable_precision` | Transformer Attention | Advanced attention |
| BB-5486 | `attention_dropout_engine_saturating` | Transformer Attention | Advanced attention |
| BB-5487 | `attention_dropout_engine_fault_detecting` | Transformer Attention | Advanced attention |
| BB-5488 | `attention_dropout_engine_low_power` | Transformer Attention | Advanced attention |
| BB-5489 | `grouped_query_attention_combinational` | Transformer Attention | Advanced attention |
| BB-5490 | `grouped_query_attention_single_cycle` | Transformer Attention | Advanced attention |
| BB-5491 | `grouped_query_attention_shallow_pipeline` | Transformer Attention | Advanced attention |
| BB-5492 | `grouped_query_attention_deep_pipeline` | Transformer Attention | Advanced attention |
| BB-5493 | `grouped_query_attention_iterative` | Transformer Attention | Advanced attention |
| BB-5494 | `grouped_query_attention_digit_serial` | Transformer Attention | Advanced attention |
| BB-5495 | `grouped_query_attention_resource_shared` | Transformer Attention | Advanced attention |
| BB-5496 | `grouped_query_attention_fully_parallel` | Transformer Attention | Advanced attention |
| BB-5497 | `grouped_query_attention_vectorized` | Transformer Attention | Advanced attention |
| BB-5498 | `grouped_query_attention_streaming` | Transformer Attention | Advanced attention |
| BB-5499 | `grouped_query_attention_buffered_stream` | Transformer Attention | Advanced attention |
| BB-5500 | `grouped_query_attention_multi_channel` | Transformer Attention | Advanced attention |
| BB-5501 | `grouped_query_attention_programmable_precision` | Transformer Attention | Advanced attention |
| BB-5502 | `grouped_query_attention_saturating` | Transformer Attention | Advanced attention |
| BB-5503 | `grouped_query_attention_fault_detecting` | Transformer Attention | Advanced attention |
| BB-5504 | `grouped_query_attention_low_power` | Transformer Attention | Advanced attention |
| BB-5505 | `sliding_window_attention_combinational` | Transformer Attention | Advanced attention |
| BB-5506 | `sliding_window_attention_single_cycle` | Transformer Attention | Advanced attention |
| BB-5507 | `sliding_window_attention_shallow_pipeline` | Transformer Attention | Advanced attention |
| BB-5508 | `sliding_window_attention_deep_pipeline` | Transformer Attention | Advanced attention |
| BB-5509 | `sliding_window_attention_iterative` | Transformer Attention | Advanced attention |
| BB-5510 | `sliding_window_attention_digit_serial` | Transformer Attention | Advanced attention |
| BB-5511 | `sliding_window_attention_resource_shared` | Transformer Attention | Advanced attention |
| BB-5512 | `sliding_window_attention_fully_parallel` | Transformer Attention | Advanced attention |
| BB-5513 | `sliding_window_attention_vectorized` | Transformer Attention | Advanced attention |
| BB-5514 | `sliding_window_attention_streaming` | Transformer Attention | Advanced attention |
| BB-5515 | `sliding_window_attention_buffered_stream` | Transformer Attention | Advanced attention |
| BB-5516 | `sliding_window_attention_multi_channel` | Transformer Attention | Advanced attention |
| BB-5517 | `sliding_window_attention_programmable_precision` | Transformer Attention | Advanced attention |
| BB-5518 | `sliding_window_attention_saturating` | Transformer Attention | Advanced attention |
| BB-5519 | `sliding_window_attention_fault_detecting` | Transformer Attention | Advanced attention |
| BB-5520 | `sliding_window_attention_low_power` | Transformer Attention | Advanced attention |
| BB-5521 | `kv_cache_allocator_single_port` | Transformer KV and Position | KV-cache and position |
| BB-5522 | `kv_cache_allocator_dual_port` | Transformer KV and Position | KV-cache and position |
| BB-5523 | `kv_cache_allocator_banked` | Transformer KV and Position | KV-cache and position |
| BB-5524 | `kv_cache_allocator_interleaved` | Transformer KV and Position | KV-cache and position |
| BB-5525 | `kv_cache_allocator_write_back` | Transformer KV and Position | KV-cache and position |
| BB-5526 | `kv_cache_allocator_write_through` | Transformer KV and Position | KV-cache and position |
| BB-5527 | `kv_cache_allocator_nonblocking` | Transformer KV and Position | KV-cache and position |
| BB-5528 | `kv_cache_allocator_pipelined` | Transformer KV and Position | KV-cache and position |
| BB-5529 | `kv_cache_allocator_burst_optimized` | Transformer KV and Position | KV-cache and position |
| BB-5530 | `kv_cache_allocator_multi_channel` | Transformer KV and Position | KV-cache and position |
| BB-5531 | `kv_cache_allocator_ecc_protected` | Transformer KV and Position | KV-cache and position |
| BB-5532 | `kv_cache_allocator_scrubbed` | Transformer KV and Position | KV-cache and position |
| BB-5533 | `kv_cache_allocator_clock_crossing` | Transformer KV and Position | KV-cache and position |
| BB-5534 | `kv_cache_allocator_qos_aware` | Transformer KV and Position | KV-cache and position |
| BB-5535 | `kv_cache_allocator_low_power` | Transformer KV and Position | KV-cache and position |
| BB-5536 | `kv_cache_allocator_formally_instrumented` | Transformer KV and Position | KV-cache and position |
| BB-5537 | `kv_cache_compactor_single_port` | Transformer KV and Position | KV-cache and position |
| BB-5538 | `kv_cache_compactor_dual_port` | Transformer KV and Position | KV-cache and position |
| BB-5539 | `kv_cache_compactor_banked` | Transformer KV and Position | KV-cache and position |
| BB-5540 | `kv_cache_compactor_interleaved` | Transformer KV and Position | KV-cache and position |
| BB-5541 | `kv_cache_compactor_write_back` | Transformer KV and Position | KV-cache and position |
| BB-5542 | `kv_cache_compactor_write_through` | Transformer KV and Position | KV-cache and position |
| BB-5543 | `kv_cache_compactor_nonblocking` | Transformer KV and Position | KV-cache and position |
| BB-5544 | `kv_cache_compactor_pipelined` | Transformer KV and Position | KV-cache and position |
| BB-5545 | `kv_cache_compactor_burst_optimized` | Transformer KV and Position | KV-cache and position |
| BB-5546 | `kv_cache_compactor_multi_channel` | Transformer KV and Position | KV-cache and position |
| BB-5547 | `kv_cache_compactor_ecc_protected` | Transformer KV and Position | KV-cache and position |
| BB-5548 | `kv_cache_compactor_scrubbed` | Transformer KV and Position | KV-cache and position |
| BB-5549 | `kv_cache_compactor_clock_crossing` | Transformer KV and Position | KV-cache and position |
| BB-5550 | `kv_cache_compactor_qos_aware` | Transformer KV and Position | KV-cache and position |
| BB-5551 | `kv_cache_compactor_low_power` | Transformer KV and Position | KV-cache and position |
| BB-5552 | `kv_cache_compactor_formally_instrumented` | Transformer KV and Position | KV-cache and position |
| BB-5553 | `paged_attention_manager_single_port` | Transformer KV and Position | KV-cache and position |
| BB-5554 | `paged_attention_manager_dual_port` | Transformer KV and Position | KV-cache and position |
| BB-5555 | `paged_attention_manager_banked` | Transformer KV and Position | KV-cache and position |
| BB-5556 | `paged_attention_manager_interleaved` | Transformer KV and Position | KV-cache and position |
| BB-5557 | `paged_attention_manager_write_back` | Transformer KV and Position | KV-cache and position |
| BB-5558 | `paged_attention_manager_write_through` | Transformer KV and Position | KV-cache and position |
| BB-5559 | `paged_attention_manager_nonblocking` | Transformer KV and Position | KV-cache and position |
| BB-5560 | `paged_attention_manager_pipelined` | Transformer KV and Position | KV-cache and position |
| BB-5561 | `paged_attention_manager_burst_optimized` | Transformer KV and Position | KV-cache and position |
| BB-5562 | `paged_attention_manager_multi_channel` | Transformer KV and Position | KV-cache and position |
| BB-5563 | `paged_attention_manager_ecc_protected` | Transformer KV and Position | KV-cache and position |
| BB-5564 | `paged_attention_manager_scrubbed` | Transformer KV and Position | KV-cache and position |
| BB-5565 | `paged_attention_manager_clock_crossing` | Transformer KV and Position | KV-cache and position |
| BB-5566 | `paged_attention_manager_qos_aware` | Transformer KV and Position | KV-cache and position |
| BB-5567 | `paged_attention_manager_low_power` | Transformer KV and Position | KV-cache and position |
| BB-5568 | `paged_attention_manager_formally_instrumented` | Transformer KV and Position | KV-cache and position |
| BB-5569 | `sinusoidal_position_encoder_single_port` | Transformer KV and Position | KV-cache and position |
| BB-5570 | `sinusoidal_position_encoder_dual_port` | Transformer KV and Position | KV-cache and position |
| BB-5571 | `sinusoidal_position_encoder_banked` | Transformer KV and Position | KV-cache and position |
| BB-5572 | `sinusoidal_position_encoder_interleaved` | Transformer KV and Position | KV-cache and position |
| BB-5573 | `sinusoidal_position_encoder_write_back` | Transformer KV and Position | KV-cache and position |
| BB-5574 | `sinusoidal_position_encoder_write_through` | Transformer KV and Position | KV-cache and position |
| BB-5575 | `sinusoidal_position_encoder_nonblocking` | Transformer KV and Position | KV-cache and position |
| BB-5576 | `sinusoidal_position_encoder_pipelined` | Transformer KV and Position | KV-cache and position |
| BB-5577 | `sinusoidal_position_encoder_burst_optimized` | Transformer KV and Position | KV-cache and position |
| BB-5578 | `sinusoidal_position_encoder_multi_channel` | Transformer KV and Position | KV-cache and position |
| BB-5579 | `sinusoidal_position_encoder_ecc_protected` | Transformer KV and Position | KV-cache and position |
| BB-5580 | `sinusoidal_position_encoder_scrubbed` | Transformer KV and Position | KV-cache and position |
| BB-5581 | `sinusoidal_position_encoder_clock_crossing` | Transformer KV and Position | KV-cache and position |
| BB-5582 | `sinusoidal_position_encoder_qos_aware` | Transformer KV and Position | KV-cache and position |
| BB-5583 | `sinusoidal_position_encoder_low_power` | Transformer KV and Position | KV-cache and position |
| BB-5584 | `sinusoidal_position_encoder_formally_instrumented` | Transformer KV and Position | KV-cache and position |
| BB-5585 | `relative_position_bias_single_port` | Transformer KV and Position | KV-cache and position |
| BB-5586 | `relative_position_bias_dual_port` | Transformer KV and Position | KV-cache and position |
| BB-5587 | `relative_position_bias_banked` | Transformer KV and Position | KV-cache and position |
| BB-5588 | `relative_position_bias_interleaved` | Transformer KV and Position | KV-cache and position |
| BB-5589 | `relative_position_bias_write_back` | Transformer KV and Position | KV-cache and position |
| BB-5590 | `relative_position_bias_write_through` | Transformer KV and Position | KV-cache and position |
| BB-5591 | `relative_position_bias_nonblocking` | Transformer KV and Position | KV-cache and position |
| BB-5592 | `relative_position_bias_pipelined` | Transformer KV and Position | KV-cache and position |
| BB-5593 | `relative_position_bias_burst_optimized` | Transformer KV and Position | KV-cache and position |
| BB-5594 | `relative_position_bias_multi_channel` | Transformer KV and Position | KV-cache and position |
| BB-5595 | `relative_position_bias_ecc_protected` | Transformer KV and Position | KV-cache and position |
| BB-5596 | `relative_position_bias_scrubbed` | Transformer KV and Position | KV-cache and position |
| BB-5597 | `relative_position_bias_clock_crossing` | Transformer KV and Position | KV-cache and position |
| BB-5598 | `relative_position_bias_qos_aware` | Transformer KV and Position | KV-cache and position |
| BB-5599 | `relative_position_bias_low_power` | Transformer KV and Position | KV-cache and position |
| BB-5600 | `relative_position_bias_formally_instrumented` | Transformer KV and Position | KV-cache and position |
| BB-5601 | `csr_tensor_decoder_single_lane` | Sparse AI | Sparse tensor processing |
| BB-5602 | `csr_tensor_decoder_multi_lane` | Sparse AI | Sparse tensor processing |
| BB-5603 | `csr_tensor_decoder_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5604 | `csr_tensor_decoder_deep_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5605 | `csr_tensor_decoder_frame_aware` | Sparse AI | Sparse tensor processing |
| BB-5606 | `csr_tensor_decoder_packet_aware` | Sparse AI | Sparse tensor processing |
| BB-5607 | `csr_tensor_decoder_backpressure_capable` | Sparse AI | Sparse tensor processing |
| BB-5608 | `csr_tensor_decoder_rate_adaptive` | Sparse AI | Sparse tensor processing |
| BB-5609 | `csr_tensor_decoder_time_multiplexed` | Sparse AI | Sparse tensor processing |
| BB-5610 | `csr_tensor_decoder_fully_parallel` | Sparse AI | Sparse tensor processing |
| BB-5611 | `csr_tensor_decoder_buffered` | Sparse AI | Sparse tensor processing |
| BB-5612 | `csr_tensor_decoder_clock_crossing` | Sparse AI | Sparse tensor processing |
| BB-5613 | `csr_tensor_decoder_error_detecting` | Sparse AI | Sparse tensor processing |
| BB-5614 | `csr_tensor_decoder_formally_instrumented` | Sparse AI | Sparse tensor processing |
| BB-5615 | `csr_tensor_decoder_low_power` | Sparse AI | Sparse tensor processing |
| BB-5616 | `csr_tensor_decoder_axi_stream` | Sparse AI | Sparse tensor processing |
| BB-5617 | `csc_tensor_decoder_single_lane` | Sparse AI | Sparse tensor processing |
| BB-5618 | `csc_tensor_decoder_multi_lane` | Sparse AI | Sparse tensor processing |
| BB-5619 | `csc_tensor_decoder_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5620 | `csc_tensor_decoder_deep_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5621 | `csc_tensor_decoder_frame_aware` | Sparse AI | Sparse tensor processing |
| BB-5622 | `csc_tensor_decoder_packet_aware` | Sparse AI | Sparse tensor processing |
| BB-5623 | `csc_tensor_decoder_backpressure_capable` | Sparse AI | Sparse tensor processing |
| BB-5624 | `csc_tensor_decoder_rate_adaptive` | Sparse AI | Sparse tensor processing |
| BB-5625 | `csc_tensor_decoder_time_multiplexed` | Sparse AI | Sparse tensor processing |
| BB-5626 | `csc_tensor_decoder_fully_parallel` | Sparse AI | Sparse tensor processing |
| BB-5627 | `csc_tensor_decoder_buffered` | Sparse AI | Sparse tensor processing |
| BB-5628 | `csc_tensor_decoder_clock_crossing` | Sparse AI | Sparse tensor processing |
| BB-5629 | `csc_tensor_decoder_error_detecting` | Sparse AI | Sparse tensor processing |
| BB-5630 | `csc_tensor_decoder_formally_instrumented` | Sparse AI | Sparse tensor processing |
| BB-5631 | `csc_tensor_decoder_low_power` | Sparse AI | Sparse tensor processing |
| BB-5632 | `csc_tensor_decoder_axi_stream` | Sparse AI | Sparse tensor processing |
| BB-5633 | `block_sparse_scheduler_single_lane` | Sparse AI | Sparse tensor processing |
| BB-5634 | `block_sparse_scheduler_multi_lane` | Sparse AI | Sparse tensor processing |
| BB-5635 | `block_sparse_scheduler_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5636 | `block_sparse_scheduler_deep_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5637 | `block_sparse_scheduler_frame_aware` | Sparse AI | Sparse tensor processing |
| BB-5638 | `block_sparse_scheduler_packet_aware` | Sparse AI | Sparse tensor processing |
| BB-5639 | `block_sparse_scheduler_backpressure_capable` | Sparse AI | Sparse tensor processing |
| BB-5640 | `block_sparse_scheduler_rate_adaptive` | Sparse AI | Sparse tensor processing |
| BB-5641 | `block_sparse_scheduler_time_multiplexed` | Sparse AI | Sparse tensor processing |
| BB-5642 | `block_sparse_scheduler_fully_parallel` | Sparse AI | Sparse tensor processing |
| BB-5643 | `block_sparse_scheduler_buffered` | Sparse AI | Sparse tensor processing |
| BB-5644 | `block_sparse_scheduler_clock_crossing` | Sparse AI | Sparse tensor processing |
| BB-5645 | `block_sparse_scheduler_error_detecting` | Sparse AI | Sparse tensor processing |
| BB-5646 | `block_sparse_scheduler_formally_instrumented` | Sparse AI | Sparse tensor processing |
| BB-5647 | `block_sparse_scheduler_low_power` | Sparse AI | Sparse tensor processing |
| BB-5648 | `block_sparse_scheduler_axi_stream` | Sparse AI | Sparse tensor processing |
| BB-5649 | `structured_sparsity_pruner_single_lane` | Sparse AI | Sparse tensor processing |
| BB-5650 | `structured_sparsity_pruner_multi_lane` | Sparse AI | Sparse tensor processing |
| BB-5651 | `structured_sparsity_pruner_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5652 | `structured_sparsity_pruner_deep_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5653 | `structured_sparsity_pruner_frame_aware` | Sparse AI | Sparse tensor processing |
| BB-5654 | `structured_sparsity_pruner_packet_aware` | Sparse AI | Sparse tensor processing |
| BB-5655 | `structured_sparsity_pruner_backpressure_capable` | Sparse AI | Sparse tensor processing |
| BB-5656 | `structured_sparsity_pruner_rate_adaptive` | Sparse AI | Sparse tensor processing |
| BB-5657 | `structured_sparsity_pruner_time_multiplexed` | Sparse AI | Sparse tensor processing |
| BB-5658 | `structured_sparsity_pruner_fully_parallel` | Sparse AI | Sparse tensor processing |
| BB-5659 | `structured_sparsity_pruner_buffered` | Sparse AI | Sparse tensor processing |
| BB-5660 | `structured_sparsity_pruner_clock_crossing` | Sparse AI | Sparse tensor processing |
| BB-5661 | `structured_sparsity_pruner_error_detecting` | Sparse AI | Sparse tensor processing |
| BB-5662 | `structured_sparsity_pruner_formally_instrumented` | Sparse AI | Sparse tensor processing |
| BB-5663 | `structured_sparsity_pruner_low_power` | Sparse AI | Sparse tensor processing |
| BB-5664 | `structured_sparsity_pruner_axi_stream` | Sparse AI | Sparse tensor processing |
| BB-5665 | `sparse_accumulator_bank_single_lane` | Sparse AI | Sparse tensor processing |
| BB-5666 | `sparse_accumulator_bank_multi_lane` | Sparse AI | Sparse tensor processing |
| BB-5667 | `sparse_accumulator_bank_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5668 | `sparse_accumulator_bank_deep_pipelined` | Sparse AI | Sparse tensor processing |
| BB-5669 | `sparse_accumulator_bank_frame_aware` | Sparse AI | Sparse tensor processing |
| BB-5670 | `sparse_accumulator_bank_packet_aware` | Sparse AI | Sparse tensor processing |
| BB-5671 | `sparse_accumulator_bank_backpressure_capable` | Sparse AI | Sparse tensor processing |
| BB-5672 | `sparse_accumulator_bank_rate_adaptive` | Sparse AI | Sparse tensor processing |
| BB-5673 | `sparse_accumulator_bank_time_multiplexed` | Sparse AI | Sparse tensor processing |
| BB-5674 | `sparse_accumulator_bank_fully_parallel` | Sparse AI | Sparse tensor processing |
| BB-5675 | `sparse_accumulator_bank_buffered` | Sparse AI | Sparse tensor processing |
| BB-5676 | `sparse_accumulator_bank_clock_crossing` | Sparse AI | Sparse tensor processing |
| BB-5677 | `sparse_accumulator_bank_error_detecting` | Sparse AI | Sparse tensor processing |
| BB-5678 | `sparse_accumulator_bank_formally_instrumented` | Sparse AI | Sparse tensor processing |
| BB-5679 | `sparse_accumulator_bank_low_power` | Sparse AI | Sparse tensor processing |
| BB-5680 | `sparse_accumulator_bank_axi_stream` | Sparse AI | Sparse tensor processing |
| BB-5681 | `block_floating_quantizer_combinational` | AI Quantization | Advanced quantization |
| BB-5682 | `block_floating_quantizer_single_cycle` | AI Quantization | Advanced quantization |
| BB-5683 | `block_floating_quantizer_shallow_pipeline` | AI Quantization | Advanced quantization |
| BB-5684 | `block_floating_quantizer_deep_pipeline` | AI Quantization | Advanced quantization |
| BB-5685 | `block_floating_quantizer_iterative` | AI Quantization | Advanced quantization |
| BB-5686 | `block_floating_quantizer_digit_serial` | AI Quantization | Advanced quantization |
| BB-5687 | `block_floating_quantizer_resource_shared` | AI Quantization | Advanced quantization |
| BB-5688 | `block_floating_quantizer_fully_parallel` | AI Quantization | Advanced quantization |
| BB-5689 | `block_floating_quantizer_vectorized` | AI Quantization | Advanced quantization |
| BB-5690 | `block_floating_quantizer_streaming` | AI Quantization | Advanced quantization |
| BB-5691 | `block_floating_quantizer_buffered_stream` | AI Quantization | Advanced quantization |
| BB-5692 | `block_floating_quantizer_multi_channel` | AI Quantization | Advanced quantization |
| BB-5693 | `block_floating_quantizer_programmable_precision` | AI Quantization | Advanced quantization |
| BB-5694 | `block_floating_quantizer_saturating` | AI Quantization | Advanced quantization |
| BB-5695 | `block_floating_quantizer_fault_detecting` | AI Quantization | Advanced quantization |
| BB-5696 | `block_floating_quantizer_low_power` | AI Quantization | Advanced quantization |
| BB-5697 | `logarithmic_quantizer_combinational` | AI Quantization | Advanced quantization |
| BB-5698 | `logarithmic_quantizer_single_cycle` | AI Quantization | Advanced quantization |
| BB-5699 | `logarithmic_quantizer_shallow_pipeline` | AI Quantization | Advanced quantization |
| BB-5700 | `logarithmic_quantizer_deep_pipeline` | AI Quantization | Advanced quantization |
| BB-5701 | `logarithmic_quantizer_iterative` | AI Quantization | Advanced quantization |
| BB-5702 | `logarithmic_quantizer_digit_serial` | AI Quantization | Advanced quantization |
| BB-5703 | `logarithmic_quantizer_resource_shared` | AI Quantization | Advanced quantization |
| BB-5704 | `logarithmic_quantizer_fully_parallel` | AI Quantization | Advanced quantization |
| BB-5705 | `logarithmic_quantizer_vectorized` | AI Quantization | Advanced quantization |
| BB-5706 | `logarithmic_quantizer_streaming` | AI Quantization | Advanced quantization |
| BB-5707 | `logarithmic_quantizer_buffered_stream` | AI Quantization | Advanced quantization |
| BB-5708 | `logarithmic_quantizer_multi_channel` | AI Quantization | Advanced quantization |
| BB-5709 | `logarithmic_quantizer_programmable_precision` | AI Quantization | Advanced quantization |
| BB-5710 | `logarithmic_quantizer_saturating` | AI Quantization | Advanced quantization |
| BB-5711 | `logarithmic_quantizer_fault_detecting` | AI Quantization | Advanced quantization |
| BB-5712 | `logarithmic_quantizer_low_power` | AI Quantization | Advanced quantization |
| BB-5713 | `stochastic_rounding_unit_combinational` | AI Quantization | Advanced quantization |
| BB-5714 | `stochastic_rounding_unit_single_cycle` | AI Quantization | Advanced quantization |
| BB-5715 | `stochastic_rounding_unit_shallow_pipeline` | AI Quantization | Advanced quantization |
| BB-5716 | `stochastic_rounding_unit_deep_pipeline` | AI Quantization | Advanced quantization |
| BB-5717 | `stochastic_rounding_unit_iterative` | AI Quantization | Advanced quantization |
| BB-5718 | `stochastic_rounding_unit_digit_serial` | AI Quantization | Advanced quantization |
| BB-5719 | `stochastic_rounding_unit_resource_shared` | AI Quantization | Advanced quantization |
| BB-5720 | `stochastic_rounding_unit_fully_parallel` | AI Quantization | Advanced quantization |
| BB-5721 | `stochastic_rounding_unit_vectorized` | AI Quantization | Advanced quantization |
| BB-5722 | `stochastic_rounding_unit_streaming` | AI Quantization | Advanced quantization |
| BB-5723 | `stochastic_rounding_unit_buffered_stream` | AI Quantization | Advanced quantization |
| BB-5724 | `stochastic_rounding_unit_multi_channel` | AI Quantization | Advanced quantization |
| BB-5725 | `stochastic_rounding_unit_programmable_precision` | AI Quantization | Advanced quantization |
| BB-5726 | `stochastic_rounding_unit_saturating` | AI Quantization | Advanced quantization |
| BB-5727 | `stochastic_rounding_unit_fault_detecting` | AI Quantization | Advanced quantization |
| BB-5728 | `stochastic_rounding_unit_low_power` | AI Quantization | Advanced quantization |
| BB-5729 | `calibration_histogram_engine_combinational` | AI Quantization | Advanced quantization |
| BB-5730 | `calibration_histogram_engine_single_cycle` | AI Quantization | Advanced quantization |
| BB-5731 | `calibration_histogram_engine_shallow_pipeline` | AI Quantization | Advanced quantization |
| BB-5732 | `calibration_histogram_engine_deep_pipeline` | AI Quantization | Advanced quantization |
| BB-5733 | `calibration_histogram_engine_iterative` | AI Quantization | Advanced quantization |
| BB-5734 | `calibration_histogram_engine_digit_serial` | AI Quantization | Advanced quantization |
| BB-5735 | `calibration_histogram_engine_resource_shared` | AI Quantization | Advanced quantization |
| BB-5736 | `calibration_histogram_engine_fully_parallel` | AI Quantization | Advanced quantization |
| BB-5737 | `calibration_histogram_engine_vectorized` | AI Quantization | Advanced quantization |
| BB-5738 | `calibration_histogram_engine_streaming` | AI Quantization | Advanced quantization |
| BB-5739 | `calibration_histogram_engine_buffered_stream` | AI Quantization | Advanced quantization |
| BB-5740 | `calibration_histogram_engine_multi_channel` | AI Quantization | Advanced quantization |
| BB-5741 | `calibration_histogram_engine_programmable_precision` | AI Quantization | Advanced quantization |
| BB-5742 | `calibration_histogram_engine_saturating` | AI Quantization | Advanced quantization |
| BB-5743 | `calibration_histogram_engine_fault_detecting` | AI Quantization | Advanced quantization |
| BB-5744 | `calibration_histogram_engine_low_power` | AI Quantization | Advanced quantization |
| BB-5745 | `mixed_precision_dispatcher_combinational` | AI Quantization | Advanced quantization |
| BB-5746 | `mixed_precision_dispatcher_single_cycle` | AI Quantization | Advanced quantization |
| BB-5747 | `mixed_precision_dispatcher_shallow_pipeline` | AI Quantization | Advanced quantization |
| BB-5748 | `mixed_precision_dispatcher_deep_pipeline` | AI Quantization | Advanced quantization |
| BB-5749 | `mixed_precision_dispatcher_iterative` | AI Quantization | Advanced quantization |
| BB-5750 | `mixed_precision_dispatcher_digit_serial` | AI Quantization | Advanced quantization |
| BB-5751 | `mixed_precision_dispatcher_resource_shared` | AI Quantization | Advanced quantization |
| BB-5752 | `mixed_precision_dispatcher_fully_parallel` | AI Quantization | Advanced quantization |
| BB-5753 | `mixed_precision_dispatcher_vectorized` | AI Quantization | Advanced quantization |
| BB-5754 | `mixed_precision_dispatcher_streaming` | AI Quantization | Advanced quantization |
| BB-5755 | `mixed_precision_dispatcher_buffered_stream` | AI Quantization | Advanced quantization |
| BB-5756 | `mixed_precision_dispatcher_multi_channel` | AI Quantization | Advanced quantization |
| BB-5757 | `mixed_precision_dispatcher_programmable_precision` | AI Quantization | Advanced quantization |
| BB-5758 | `mixed_precision_dispatcher_saturating` | AI Quantization | Advanced quantization |
| BB-5759 | `mixed_precision_dispatcher_fault_detecting` | AI Quantization | Advanced quantization |
| BB-5760 | `mixed_precision_dispatcher_low_power` | AI Quantization | Advanced quantization |
| BB-5761 | `gradient_accumulator_combinational` | AI Training | Training datapaths |
| BB-5762 | `gradient_accumulator_single_cycle` | AI Training | Training datapaths |
| BB-5763 | `gradient_accumulator_shallow_pipeline` | AI Training | Training datapaths |
| BB-5764 | `gradient_accumulator_deep_pipeline` | AI Training | Training datapaths |
| BB-5765 | `gradient_accumulator_iterative` | AI Training | Training datapaths |
| BB-5766 | `gradient_accumulator_digit_serial` | AI Training | Training datapaths |
| BB-5767 | `gradient_accumulator_resource_shared` | AI Training | Training datapaths |
| BB-5768 | `gradient_accumulator_fully_parallel` | AI Training | Training datapaths |
| BB-5769 | `gradient_accumulator_vectorized` | AI Training | Training datapaths |
| BB-5770 | `gradient_accumulator_streaming` | AI Training | Training datapaths |
| BB-5771 | `gradient_accumulator_buffered_stream` | AI Training | Training datapaths |
| BB-5772 | `gradient_accumulator_multi_channel` | AI Training | Training datapaths |
| BB-5773 | `gradient_accumulator_programmable_precision` | AI Training | Training datapaths |
| BB-5774 | `gradient_accumulator_saturating` | AI Training | Training datapaths |
| BB-5775 | `gradient_accumulator_fault_detecting` | AI Training | Training datapaths |
| BB-5776 | `gradient_accumulator_low_power` | AI Training | Training datapaths |
| BB-5777 | `weight_update_engine_combinational` | AI Training | Training datapaths |
| BB-5778 | `weight_update_engine_single_cycle` | AI Training | Training datapaths |
| BB-5779 | `weight_update_engine_shallow_pipeline` | AI Training | Training datapaths |
| BB-5780 | `weight_update_engine_deep_pipeline` | AI Training | Training datapaths |
| BB-5781 | `weight_update_engine_iterative` | AI Training | Training datapaths |
| BB-5782 | `weight_update_engine_digit_serial` | AI Training | Training datapaths |
| BB-5783 | `weight_update_engine_resource_shared` | AI Training | Training datapaths |
| BB-5784 | `weight_update_engine_fully_parallel` | AI Training | Training datapaths |
| BB-5785 | `weight_update_engine_vectorized` | AI Training | Training datapaths |
| BB-5786 | `weight_update_engine_streaming` | AI Training | Training datapaths |
| BB-5787 | `weight_update_engine_buffered_stream` | AI Training | Training datapaths |
| BB-5788 | `weight_update_engine_multi_channel` | AI Training | Training datapaths |
| BB-5789 | `weight_update_engine_programmable_precision` | AI Training | Training datapaths |
| BB-5790 | `weight_update_engine_saturating` | AI Training | Training datapaths |
| BB-5791 | `weight_update_engine_fault_detecting` | AI Training | Training datapaths |
| BB-5792 | `weight_update_engine_low_power` | AI Training | Training datapaths |
| BB-5793 | `adam_optimizer_engine_combinational` | AI Training | Training datapaths |
| BB-5794 | `adam_optimizer_engine_single_cycle` | AI Training | Training datapaths |
| BB-5795 | `adam_optimizer_engine_shallow_pipeline` | AI Training | Training datapaths |
| BB-5796 | `adam_optimizer_engine_deep_pipeline` | AI Training | Training datapaths |
| BB-5797 | `adam_optimizer_engine_iterative` | AI Training | Training datapaths |
| BB-5798 | `adam_optimizer_engine_digit_serial` | AI Training | Training datapaths |
| BB-5799 | `adam_optimizer_engine_resource_shared` | AI Training | Training datapaths |
| BB-5800 | `adam_optimizer_engine_fully_parallel` | AI Training | Training datapaths |
| BB-5801 | `adam_optimizer_engine_vectorized` | AI Training | Training datapaths |
| BB-5802 | `adam_optimizer_engine_streaming` | AI Training | Training datapaths |
| BB-5803 | `adam_optimizer_engine_buffered_stream` | AI Training | Training datapaths |
| BB-5804 | `adam_optimizer_engine_multi_channel` | AI Training | Training datapaths |
| BB-5805 | `adam_optimizer_engine_programmable_precision` | AI Training | Training datapaths |
| BB-5806 | `adam_optimizer_engine_saturating` | AI Training | Training datapaths |
| BB-5807 | `adam_optimizer_engine_fault_detecting` | AI Training | Training datapaths |
| BB-5808 | `adam_optimizer_engine_low_power` | AI Training | Training datapaths |
| BB-5809 | `loss_scaling_controller_combinational` | AI Training | Training datapaths |
| BB-5810 | `loss_scaling_controller_single_cycle` | AI Training | Training datapaths |
| BB-5811 | `loss_scaling_controller_shallow_pipeline` | AI Training | Training datapaths |
| BB-5812 | `loss_scaling_controller_deep_pipeline` | AI Training | Training datapaths |
| BB-5813 | `loss_scaling_controller_iterative` | AI Training | Training datapaths |
| BB-5814 | `loss_scaling_controller_digit_serial` | AI Training | Training datapaths |
| BB-5815 | `loss_scaling_controller_resource_shared` | AI Training | Training datapaths |
| BB-5816 | `loss_scaling_controller_fully_parallel` | AI Training | Training datapaths |
| BB-5817 | `loss_scaling_controller_vectorized` | AI Training | Training datapaths |
| BB-5818 | `loss_scaling_controller_streaming` | AI Training | Training datapaths |
| BB-5819 | `loss_scaling_controller_buffered_stream` | AI Training | Training datapaths |
| BB-5820 | `loss_scaling_controller_multi_channel` | AI Training | Training datapaths |
| BB-5821 | `loss_scaling_controller_programmable_precision` | AI Training | Training datapaths |
| BB-5822 | `loss_scaling_controller_saturating` | AI Training | Training datapaths |
| BB-5823 | `loss_scaling_controller_fault_detecting` | AI Training | Training datapaths |
| BB-5824 | `loss_scaling_controller_low_power` | AI Training | Training datapaths |
| BB-5825 | `backpropagation_datapath_combinational` | AI Training | Training datapaths |
| BB-5826 | `backpropagation_datapath_single_cycle` | AI Training | Training datapaths |
| BB-5827 | `backpropagation_datapath_shallow_pipeline` | AI Training | Training datapaths |
| BB-5828 | `backpropagation_datapath_deep_pipeline` | AI Training | Training datapaths |
| BB-5829 | `backpropagation_datapath_iterative` | AI Training | Training datapaths |
| BB-5830 | `backpropagation_datapath_digit_serial` | AI Training | Training datapaths |
| BB-5831 | `backpropagation_datapath_resource_shared` | AI Training | Training datapaths |
| BB-5832 | `backpropagation_datapath_fully_parallel` | AI Training | Training datapaths |
| BB-5833 | `backpropagation_datapath_vectorized` | AI Training | Training datapaths |
| BB-5834 | `backpropagation_datapath_streaming` | AI Training | Training datapaths |
| BB-5835 | `backpropagation_datapath_buffered_stream` | AI Training | Training datapaths |
| BB-5836 | `backpropagation_datapath_multi_channel` | AI Training | Training datapaths |
| BB-5837 | `backpropagation_datapath_programmable_precision` | AI Training | Training datapaths |
| BB-5838 | `backpropagation_datapath_saturating` | AI Training | Training datapaths |
| BB-5839 | `backpropagation_datapath_fault_detecting` | AI Training | Training datapaths |
| BB-5840 | `backpropagation_datapath_low_power` | AI Training | Training datapaths |
| BB-5841 | `normalized_lms_filter_single_lane` | Adaptive DSP | Adaptive filters |
| BB-5842 | `normalized_lms_filter_multi_lane` | Adaptive DSP | Adaptive filters |
| BB-5843 | `normalized_lms_filter_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5844 | `normalized_lms_filter_deep_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5845 | `normalized_lms_filter_frame_aware` | Adaptive DSP | Adaptive filters |
| BB-5846 | `normalized_lms_filter_packet_aware` | Adaptive DSP | Adaptive filters |
| BB-5847 | `normalized_lms_filter_backpressure_capable` | Adaptive DSP | Adaptive filters |
| BB-5848 | `normalized_lms_filter_rate_adaptive` | Adaptive DSP | Adaptive filters |
| BB-5849 | `normalized_lms_filter_time_multiplexed` | Adaptive DSP | Adaptive filters |
| BB-5850 | `normalized_lms_filter_fully_parallel` | Adaptive DSP | Adaptive filters |
| BB-5851 | `normalized_lms_filter_buffered` | Adaptive DSP | Adaptive filters |
| BB-5852 | `normalized_lms_filter_clock_crossing` | Adaptive DSP | Adaptive filters |
| BB-5853 | `normalized_lms_filter_error_detecting` | Adaptive DSP | Adaptive filters |
| BB-5854 | `normalized_lms_filter_formally_instrumented` | Adaptive DSP | Adaptive filters |
| BB-5855 | `normalized_lms_filter_low_power` | Adaptive DSP | Adaptive filters |
| BB-5856 | `normalized_lms_filter_axi_stream` | Adaptive DSP | Adaptive filters |
| BB-5857 | `recursive_least_squares_filter_single_lane` | Adaptive DSP | Adaptive filters |
| BB-5858 | `recursive_least_squares_filter_multi_lane` | Adaptive DSP | Adaptive filters |
| BB-5859 | `recursive_least_squares_filter_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5860 | `recursive_least_squares_filter_deep_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5861 | `recursive_least_squares_filter_frame_aware` | Adaptive DSP | Adaptive filters |
| BB-5862 | `recursive_least_squares_filter_packet_aware` | Adaptive DSP | Adaptive filters |
| BB-5863 | `recursive_least_squares_filter_backpressure_capable` | Adaptive DSP | Adaptive filters |
| BB-5864 | `recursive_least_squares_filter_rate_adaptive` | Adaptive DSP | Adaptive filters |
| BB-5865 | `recursive_least_squares_filter_time_multiplexed` | Adaptive DSP | Adaptive filters |
| BB-5866 | `recursive_least_squares_filter_fully_parallel` | Adaptive DSP | Adaptive filters |
| BB-5867 | `recursive_least_squares_filter_buffered` | Adaptive DSP | Adaptive filters |
| BB-5868 | `recursive_least_squares_filter_clock_crossing` | Adaptive DSP | Adaptive filters |
| BB-5869 | `recursive_least_squares_filter_error_detecting` | Adaptive DSP | Adaptive filters |
| BB-5870 | `recursive_least_squares_filter_formally_instrumented` | Adaptive DSP | Adaptive filters |
| BB-5871 | `recursive_least_squares_filter_low_power` | Adaptive DSP | Adaptive filters |
| BB-5872 | `recursive_least_squares_filter_axi_stream` | Adaptive DSP | Adaptive filters |
| BB-5873 | `affine_projection_filter_single_lane` | Adaptive DSP | Adaptive filters |
| BB-5874 | `affine_projection_filter_multi_lane` | Adaptive DSP | Adaptive filters |
| BB-5875 | `affine_projection_filter_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5876 | `affine_projection_filter_deep_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5877 | `affine_projection_filter_frame_aware` | Adaptive DSP | Adaptive filters |
| BB-5878 | `affine_projection_filter_packet_aware` | Adaptive DSP | Adaptive filters |
| BB-5879 | `affine_projection_filter_backpressure_capable` | Adaptive DSP | Adaptive filters |
| BB-5880 | `affine_projection_filter_rate_adaptive` | Adaptive DSP | Adaptive filters |
| BB-5881 | `affine_projection_filter_time_multiplexed` | Adaptive DSP | Adaptive filters |
| BB-5882 | `affine_projection_filter_fully_parallel` | Adaptive DSP | Adaptive filters |
| BB-5883 | `affine_projection_filter_buffered` | Adaptive DSP | Adaptive filters |
| BB-5884 | `affine_projection_filter_clock_crossing` | Adaptive DSP | Adaptive filters |
| BB-5885 | `affine_projection_filter_error_detecting` | Adaptive DSP | Adaptive filters |
| BB-5886 | `affine_projection_filter_formally_instrumented` | Adaptive DSP | Adaptive filters |
| BB-5887 | `affine_projection_filter_low_power` | Adaptive DSP | Adaptive filters |
| BB-5888 | `affine_projection_filter_axi_stream` | Adaptive DSP | Adaptive filters |
| BB-5889 | `adaptive_notch_tracker_single_lane` | Adaptive DSP | Adaptive filters |
| BB-5890 | `adaptive_notch_tracker_multi_lane` | Adaptive DSP | Adaptive filters |
| BB-5891 | `adaptive_notch_tracker_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5892 | `adaptive_notch_tracker_deep_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5893 | `adaptive_notch_tracker_frame_aware` | Adaptive DSP | Adaptive filters |
| BB-5894 | `adaptive_notch_tracker_packet_aware` | Adaptive DSP | Adaptive filters |
| BB-5895 | `adaptive_notch_tracker_backpressure_capable` | Adaptive DSP | Adaptive filters |
| BB-5896 | `adaptive_notch_tracker_rate_adaptive` | Adaptive DSP | Adaptive filters |
| BB-5897 | `adaptive_notch_tracker_time_multiplexed` | Adaptive DSP | Adaptive filters |
| BB-5898 | `adaptive_notch_tracker_fully_parallel` | Adaptive DSP | Adaptive filters |
| BB-5899 | `adaptive_notch_tracker_buffered` | Adaptive DSP | Adaptive filters |
| BB-5900 | `adaptive_notch_tracker_clock_crossing` | Adaptive DSP | Adaptive filters |
| BB-5901 | `adaptive_notch_tracker_error_detecting` | Adaptive DSP | Adaptive filters |
| BB-5902 | `adaptive_notch_tracker_formally_instrumented` | Adaptive DSP | Adaptive filters |
| BB-5903 | `adaptive_notch_tracker_low_power` | Adaptive DSP | Adaptive filters |
| BB-5904 | `adaptive_notch_tracker_axi_stream` | Adaptive DSP | Adaptive filters |
| BB-5905 | `echo_path_estimator_single_lane` | Adaptive DSP | Adaptive filters |
| BB-5906 | `echo_path_estimator_multi_lane` | Adaptive DSP | Adaptive filters |
| BB-5907 | `echo_path_estimator_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5908 | `echo_path_estimator_deep_pipelined` | Adaptive DSP | Adaptive filters |
| BB-5909 | `echo_path_estimator_frame_aware` | Adaptive DSP | Adaptive filters |
| BB-5910 | `echo_path_estimator_packet_aware` | Adaptive DSP | Adaptive filters |
| BB-5911 | `echo_path_estimator_backpressure_capable` | Adaptive DSP | Adaptive filters |
| BB-5912 | `echo_path_estimator_rate_adaptive` | Adaptive DSP | Adaptive filters |
| BB-5913 | `echo_path_estimator_time_multiplexed` | Adaptive DSP | Adaptive filters |
| BB-5914 | `echo_path_estimator_fully_parallel` | Adaptive DSP | Adaptive filters |
| BB-5915 | `echo_path_estimator_buffered` | Adaptive DSP | Adaptive filters |
| BB-5916 | `echo_path_estimator_clock_crossing` | Adaptive DSP | Adaptive filters |
| BB-5917 | `echo_path_estimator_error_detecting` | Adaptive DSP | Adaptive filters |
| BB-5918 | `echo_path_estimator_formally_instrumented` | Adaptive DSP | Adaptive filters |
| BB-5919 | `echo_path_estimator_low_power` | Adaptive DSP | Adaptive filters |
| BB-5920 | `echo_path_estimator_axi_stream` | Adaptive DSP | Adaptive filters |
| BB-5921 | `arbitrary_resampler_single_lane` | Multirate DSP | Resampling and channelization |
| BB-5922 | `arbitrary_resampler_multi_lane` | Multirate DSP | Resampling and channelization |
| BB-5923 | `arbitrary_resampler_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5924 | `arbitrary_resampler_deep_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5925 | `arbitrary_resampler_frame_aware` | Multirate DSP | Resampling and channelization |
| BB-5926 | `arbitrary_resampler_packet_aware` | Multirate DSP | Resampling and channelization |
| BB-5927 | `arbitrary_resampler_backpressure_capable` | Multirate DSP | Resampling and channelization |
| BB-5928 | `arbitrary_resampler_rate_adaptive` | Multirate DSP | Resampling and channelization |
| BB-5929 | `arbitrary_resampler_time_multiplexed` | Multirate DSP | Resampling and channelization |
| BB-5930 | `arbitrary_resampler_fully_parallel` | Multirate DSP | Resampling and channelization |
| BB-5931 | `arbitrary_resampler_buffered` | Multirate DSP | Resampling and channelization |
| BB-5932 | `arbitrary_resampler_clock_crossing` | Multirate DSP | Resampling and channelization |
| BB-5933 | `arbitrary_resampler_error_detecting` | Multirate DSP | Resampling and channelization |
| BB-5934 | `arbitrary_resampler_formally_instrumented` | Multirate DSP | Resampling and channelization |
| BB-5935 | `arbitrary_resampler_low_power` | Multirate DSP | Resampling and channelization |
| BB-5936 | `arbitrary_resampler_axi_stream` | Multirate DSP | Resampling and channelization |
| BB-5937 | `fractional_delay_filter_single_lane` | Multirate DSP | Resampling and channelization |
| BB-5938 | `fractional_delay_filter_multi_lane` | Multirate DSP | Resampling and channelization |
| BB-5939 | `fractional_delay_filter_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5940 | `fractional_delay_filter_deep_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5941 | `fractional_delay_filter_frame_aware` | Multirate DSP | Resampling and channelization |
| BB-5942 | `fractional_delay_filter_packet_aware` | Multirate DSP | Resampling and channelization |
| BB-5943 | `fractional_delay_filter_backpressure_capable` | Multirate DSP | Resampling and channelization |
| BB-5944 | `fractional_delay_filter_rate_adaptive` | Multirate DSP | Resampling and channelization |
| BB-5945 | `fractional_delay_filter_time_multiplexed` | Multirate DSP | Resampling and channelization |
| BB-5946 | `fractional_delay_filter_fully_parallel` | Multirate DSP | Resampling and channelization |
| BB-5947 | `fractional_delay_filter_buffered` | Multirate DSP | Resampling and channelization |
| BB-5948 | `fractional_delay_filter_clock_crossing` | Multirate DSP | Resampling and channelization |
| BB-5949 | `fractional_delay_filter_error_detecting` | Multirate DSP | Resampling and channelization |
| BB-5950 | `fractional_delay_filter_formally_instrumented` | Multirate DSP | Resampling and channelization |
| BB-5951 | `fractional_delay_filter_low_power` | Multirate DSP | Resampling and channelization |
| BB-5952 | `fractional_delay_filter_axi_stream` | Multirate DSP | Resampling and channelization |
| BB-5953 | `polyphase_channelizer_single_lane` | Multirate DSP | Resampling and channelization |
| BB-5954 | `polyphase_channelizer_multi_lane` | Multirate DSP | Resampling and channelization |
| BB-5955 | `polyphase_channelizer_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5956 | `polyphase_channelizer_deep_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5957 | `polyphase_channelizer_frame_aware` | Multirate DSP | Resampling and channelization |
| BB-5958 | `polyphase_channelizer_packet_aware` | Multirate DSP | Resampling and channelization |
| BB-5959 | `polyphase_channelizer_backpressure_capable` | Multirate DSP | Resampling and channelization |
| BB-5960 | `polyphase_channelizer_rate_adaptive` | Multirate DSP | Resampling and channelization |
| BB-5961 | `polyphase_channelizer_time_multiplexed` | Multirate DSP | Resampling and channelization |
| BB-5962 | `polyphase_channelizer_fully_parallel` | Multirate DSP | Resampling and channelization |
| BB-5963 | `polyphase_channelizer_buffered` | Multirate DSP | Resampling and channelization |
| BB-5964 | `polyphase_channelizer_clock_crossing` | Multirate DSP | Resampling and channelization |
| BB-5965 | `polyphase_channelizer_error_detecting` | Multirate DSP | Resampling and channelization |
| BB-5966 | `polyphase_channelizer_formally_instrumented` | Multirate DSP | Resampling and channelization |
| BB-5967 | `polyphase_channelizer_low_power` | Multirate DSP | Resampling and channelization |
| BB-5968 | `polyphase_channelizer_axi_stream` | Multirate DSP | Resampling and channelization |
| BB-5969 | `halfband_cascade_single_lane` | Multirate DSP | Resampling and channelization |
| BB-5970 | `halfband_cascade_multi_lane` | Multirate DSP | Resampling and channelization |
| BB-5971 | `halfband_cascade_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5972 | `halfband_cascade_deep_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5973 | `halfband_cascade_frame_aware` | Multirate DSP | Resampling and channelization |
| BB-5974 | `halfband_cascade_packet_aware` | Multirate DSP | Resampling and channelization |
| BB-5975 | `halfband_cascade_backpressure_capable` | Multirate DSP | Resampling and channelization |
| BB-5976 | `halfband_cascade_rate_adaptive` | Multirate DSP | Resampling and channelization |
| BB-5977 | `halfband_cascade_time_multiplexed` | Multirate DSP | Resampling and channelization |
| BB-5978 | `halfband_cascade_fully_parallel` | Multirate DSP | Resampling and channelization |
| BB-5979 | `halfband_cascade_buffered` | Multirate DSP | Resampling and channelization |
| BB-5980 | `halfband_cascade_clock_crossing` | Multirate DSP | Resampling and channelization |
| BB-5981 | `halfband_cascade_error_detecting` | Multirate DSP | Resampling and channelization |
| BB-5982 | `halfband_cascade_formally_instrumented` | Multirate DSP | Resampling and channelization |
| BB-5983 | `halfband_cascade_low_power` | Multirate DSP | Resampling and channelization |
| BB-5984 | `halfband_cascade_axi_stream` | Multirate DSP | Resampling and channelization |
| BB-5985 | `sample_rate_tracking_loop_single_lane` | Multirate DSP | Resampling and channelization |
| BB-5986 | `sample_rate_tracking_loop_multi_lane` | Multirate DSP | Resampling and channelization |
| BB-5987 | `sample_rate_tracking_loop_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5988 | `sample_rate_tracking_loop_deep_pipelined` | Multirate DSP | Resampling and channelization |
| BB-5989 | `sample_rate_tracking_loop_frame_aware` | Multirate DSP | Resampling and channelization |
| BB-5990 | `sample_rate_tracking_loop_packet_aware` | Multirate DSP | Resampling and channelization |
| BB-5991 | `sample_rate_tracking_loop_backpressure_capable` | Multirate DSP | Resampling and channelization |
| BB-5992 | `sample_rate_tracking_loop_rate_adaptive` | Multirate DSP | Resampling and channelization |
| BB-5993 | `sample_rate_tracking_loop_time_multiplexed` | Multirate DSP | Resampling and channelization |
| BB-5994 | `sample_rate_tracking_loop_fully_parallel` | Multirate DSP | Resampling and channelization |
| BB-5995 | `sample_rate_tracking_loop_buffered` | Multirate DSP | Resampling and channelization |
| BB-5996 | `sample_rate_tracking_loop_clock_crossing` | Multirate DSP | Resampling and channelization |
| BB-5997 | `sample_rate_tracking_loop_error_detecting` | Multirate DSP | Resampling and channelization |
| BB-5998 | `sample_rate_tracking_loop_formally_instrumented` | Multirate DSP | Resampling and channelization |
| BB-5999 | `sample_rate_tracking_loop_low_power` | Multirate DSP | Resampling and channelization |
| BB-6000 | `sample_rate_tracking_loop_axi_stream` | Multirate DSP | Resampling and channelization |
| BB-6001 | `chirp_z_transform_single_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6002 | `chirp_z_transform_multi_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6003 | `chirp_z_transform_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6004 | `chirp_z_transform_deep_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6005 | `chirp_z_transform_frame_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6006 | `chirp_z_transform_packet_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6007 | `chirp_z_transform_backpressure_capable` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6008 | `chirp_z_transform_rate_adaptive` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6009 | `chirp_z_transform_time_multiplexed` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6010 | `chirp_z_transform_fully_parallel` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6011 | `chirp_z_transform_buffered` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6012 | `chirp_z_transform_clock_crossing` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6013 | `chirp_z_transform_error_detecting` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6014 | `chirp_z_transform_formally_instrumented` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6015 | `chirp_z_transform_low_power` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6016 | `chirp_z_transform_axi_stream` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6017 | `constant_q_transform_single_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6018 | `constant_q_transform_multi_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6019 | `constant_q_transform_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6020 | `constant_q_transform_deep_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6021 | `constant_q_transform_frame_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6022 | `constant_q_transform_packet_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6023 | `constant_q_transform_backpressure_capable` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6024 | `constant_q_transform_rate_adaptive` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6025 | `constant_q_transform_time_multiplexed` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6026 | `constant_q_transform_fully_parallel` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6027 | `constant_q_transform_buffered` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6028 | `constant_q_transform_clock_crossing` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6029 | `constant_q_transform_error_detecting` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6030 | `constant_q_transform_formally_instrumented` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6031 | `constant_q_transform_low_power` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6032 | `constant_q_transform_axi_stream` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6033 | `mel_filterbank_engine_single_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6034 | `mel_filterbank_engine_multi_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6035 | `mel_filterbank_engine_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6036 | `mel_filterbank_engine_deep_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6037 | `mel_filterbank_engine_frame_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6038 | `mel_filterbank_engine_packet_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6039 | `mel_filterbank_engine_backpressure_capable` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6040 | `mel_filterbank_engine_rate_adaptive` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6041 | `mel_filterbank_engine_time_multiplexed` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6042 | `mel_filterbank_engine_fully_parallel` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6043 | `mel_filterbank_engine_buffered` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6044 | `mel_filterbank_engine_clock_crossing` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6045 | `mel_filterbank_engine_error_detecting` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6046 | `mel_filterbank_engine_formally_instrumented` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6047 | `mel_filterbank_engine_low_power` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6048 | `mel_filterbank_engine_axi_stream` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6049 | `cepstrum_engine_single_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6050 | `cepstrum_engine_multi_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6051 | `cepstrum_engine_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6052 | `cepstrum_engine_deep_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6053 | `cepstrum_engine_frame_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6054 | `cepstrum_engine_packet_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6055 | `cepstrum_engine_backpressure_capable` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6056 | `cepstrum_engine_rate_adaptive` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6057 | `cepstrum_engine_time_multiplexed` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6058 | `cepstrum_engine_fully_parallel` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6059 | `cepstrum_engine_buffered` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6060 | `cepstrum_engine_clock_crossing` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6061 | `cepstrum_engine_error_detecting` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6062 | `cepstrum_engine_formally_instrumented` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6063 | `cepstrum_engine_low_power` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6064 | `cepstrum_engine_axi_stream` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6065 | `spectral_kurtosis_estimator_single_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6066 | `spectral_kurtosis_estimator_multi_lane` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6067 | `spectral_kurtosis_estimator_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6068 | `spectral_kurtosis_estimator_deep_pipelined` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6069 | `spectral_kurtosis_estimator_frame_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6070 | `spectral_kurtosis_estimator_packet_aware` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6071 | `spectral_kurtosis_estimator_backpressure_capable` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6072 | `spectral_kurtosis_estimator_rate_adaptive` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6073 | `spectral_kurtosis_estimator_time_multiplexed` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6074 | `spectral_kurtosis_estimator_fully_parallel` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6075 | `spectral_kurtosis_estimator_buffered` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6076 | `spectral_kurtosis_estimator_clock_crossing` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6077 | `spectral_kurtosis_estimator_error_detecting` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6078 | `spectral_kurtosis_estimator_formally_instrumented` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6079 | `spectral_kurtosis_estimator_low_power` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6080 | `spectral_kurtosis_estimator_axi_stream` | Advanced Spectral DSP | Alternative spectral transforms |
| BB-6081 | `delay_and_sum_beamformer_combinational` | Beamforming | Array processing |
| BB-6082 | `delay_and_sum_beamformer_single_cycle` | Beamforming | Array processing |
| BB-6083 | `delay_and_sum_beamformer_shallow_pipeline` | Beamforming | Array processing |
| BB-6084 | `delay_and_sum_beamformer_deep_pipeline` | Beamforming | Array processing |
| BB-6085 | `delay_and_sum_beamformer_iterative` | Beamforming | Array processing |
| BB-6086 | `delay_and_sum_beamformer_digit_serial` | Beamforming | Array processing |
| BB-6087 | `delay_and_sum_beamformer_resource_shared` | Beamforming | Array processing |
| BB-6088 | `delay_and_sum_beamformer_fully_parallel` | Beamforming | Array processing |
| BB-6089 | `delay_and_sum_beamformer_vectorized` | Beamforming | Array processing |
| BB-6090 | `delay_and_sum_beamformer_streaming` | Beamforming | Array processing |
| BB-6091 | `delay_and_sum_beamformer_buffered_stream` | Beamforming | Array processing |
| BB-6092 | `delay_and_sum_beamformer_multi_channel` | Beamforming | Array processing |
| BB-6093 | `delay_and_sum_beamformer_programmable_precision` | Beamforming | Array processing |
| BB-6094 | `delay_and_sum_beamformer_saturating` | Beamforming | Array processing |
| BB-6095 | `delay_and_sum_beamformer_fault_detecting` | Beamforming | Array processing |
| BB-6096 | `delay_and_sum_beamformer_low_power` | Beamforming | Array processing |
| BB-6097 | `mvdr_beamformer_combinational` | Beamforming | Array processing |
| BB-6098 | `mvdr_beamformer_single_cycle` | Beamforming | Array processing |
| BB-6099 | `mvdr_beamformer_shallow_pipeline` | Beamforming | Array processing |
| BB-6100 | `mvdr_beamformer_deep_pipeline` | Beamforming | Array processing |
| BB-6101 | `mvdr_beamformer_iterative` | Beamforming | Array processing |
| BB-6102 | `mvdr_beamformer_digit_serial` | Beamforming | Array processing |
| BB-6103 | `mvdr_beamformer_resource_shared` | Beamforming | Array processing |
| BB-6104 | `mvdr_beamformer_fully_parallel` | Beamforming | Array processing |
| BB-6105 | `mvdr_beamformer_vectorized` | Beamforming | Array processing |
| BB-6106 | `mvdr_beamformer_streaming` | Beamforming | Array processing |
| BB-6107 | `mvdr_beamformer_buffered_stream` | Beamforming | Array processing |
| BB-6108 | `mvdr_beamformer_multi_channel` | Beamforming | Array processing |
| BB-6109 | `mvdr_beamformer_programmable_precision` | Beamforming | Array processing |
| BB-6110 | `mvdr_beamformer_saturating` | Beamforming | Array processing |
| BB-6111 | `mvdr_beamformer_fault_detecting` | Beamforming | Array processing |
| BB-6112 | `mvdr_beamformer_low_power` | Beamforming | Array processing |
| BB-6113 | `adaptive_null_steerer_combinational` | Beamforming | Array processing |
| BB-6114 | `adaptive_null_steerer_single_cycle` | Beamforming | Array processing |
| BB-6115 | `adaptive_null_steerer_shallow_pipeline` | Beamforming | Array processing |
| BB-6116 | `adaptive_null_steerer_deep_pipeline` | Beamforming | Array processing |
| BB-6117 | `adaptive_null_steerer_iterative` | Beamforming | Array processing |
| BB-6118 | `adaptive_null_steerer_digit_serial` | Beamforming | Array processing |
| BB-6119 | `adaptive_null_steerer_resource_shared` | Beamforming | Array processing |
| BB-6120 | `adaptive_null_steerer_fully_parallel` | Beamforming | Array processing |
| BB-6121 | `adaptive_null_steerer_vectorized` | Beamforming | Array processing |
| BB-6122 | `adaptive_null_steerer_streaming` | Beamforming | Array processing |
| BB-6123 | `adaptive_null_steerer_buffered_stream` | Beamforming | Array processing |
| BB-6124 | `adaptive_null_steerer_multi_channel` | Beamforming | Array processing |
| BB-6125 | `adaptive_null_steerer_programmable_precision` | Beamforming | Array processing |
| BB-6126 | `adaptive_null_steerer_saturating` | Beamforming | Array processing |
| BB-6127 | `adaptive_null_steerer_fault_detecting` | Beamforming | Array processing |
| BB-6128 | `adaptive_null_steerer_low_power` | Beamforming | Array processing |
| BB-6129 | `direction_of_arrival_estimator_combinational` | Beamforming | Array processing |
| BB-6130 | `direction_of_arrival_estimator_single_cycle` | Beamforming | Array processing |
| BB-6131 | `direction_of_arrival_estimator_shallow_pipeline` | Beamforming | Array processing |
| BB-6132 | `direction_of_arrival_estimator_deep_pipeline` | Beamforming | Array processing |
| BB-6133 | `direction_of_arrival_estimator_iterative` | Beamforming | Array processing |
| BB-6134 | `direction_of_arrival_estimator_digit_serial` | Beamforming | Array processing |
| BB-6135 | `direction_of_arrival_estimator_resource_shared` | Beamforming | Array processing |
| BB-6136 | `direction_of_arrival_estimator_fully_parallel` | Beamforming | Array processing |
| BB-6137 | `direction_of_arrival_estimator_vectorized` | Beamforming | Array processing |
| BB-6138 | `direction_of_arrival_estimator_streaming` | Beamforming | Array processing |
| BB-6139 | `direction_of_arrival_estimator_buffered_stream` | Beamforming | Array processing |
| BB-6140 | `direction_of_arrival_estimator_multi_channel` | Beamforming | Array processing |
| BB-6141 | `direction_of_arrival_estimator_programmable_precision` | Beamforming | Array processing |
| BB-6142 | `direction_of_arrival_estimator_saturating` | Beamforming | Array processing |
| BB-6143 | `direction_of_arrival_estimator_fault_detecting` | Beamforming | Array processing |
| BB-6144 | `direction_of_arrival_estimator_low_power` | Beamforming | Array processing |
| BB-6145 | `microphone_array_calibrator_combinational` | Beamforming | Array processing |
| BB-6146 | `microphone_array_calibrator_single_cycle` | Beamforming | Array processing |
| BB-6147 | `microphone_array_calibrator_shallow_pipeline` | Beamforming | Array processing |
| BB-6148 | `microphone_array_calibrator_deep_pipeline` | Beamforming | Array processing |
| BB-6149 | `microphone_array_calibrator_iterative` | Beamforming | Array processing |
| BB-6150 | `microphone_array_calibrator_digit_serial` | Beamforming | Array processing |
| BB-6151 | `microphone_array_calibrator_resource_shared` | Beamforming | Array processing |
| BB-6152 | `microphone_array_calibrator_fully_parallel` | Beamforming | Array processing |
| BB-6153 | `microphone_array_calibrator_vectorized` | Beamforming | Array processing |
| BB-6154 | `microphone_array_calibrator_streaming` | Beamforming | Array processing |
| BB-6155 | `microphone_array_calibrator_buffered_stream` | Beamforming | Array processing |
| BB-6156 | `microphone_array_calibrator_multi_channel` | Beamforming | Array processing |
| BB-6157 | `microphone_array_calibrator_programmable_precision` | Beamforming | Array processing |
| BB-6158 | `microphone_array_calibrator_saturating` | Beamforming | Array processing |
| BB-6159 | `microphone_array_calibrator_fault_detecting` | Beamforming | Array processing |
| BB-6160 | `microphone_array_calibrator_low_power` | Beamforming | Array processing |
| BB-6161 | `ldpc_encoder_single_lane` | Advanced Channel Coding | Modern FEC |
| BB-6162 | `ldpc_encoder_multi_lane` | Advanced Channel Coding | Modern FEC |
| BB-6163 | `ldpc_encoder_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6164 | `ldpc_encoder_deep_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6165 | `ldpc_encoder_frame_aware` | Advanced Channel Coding | Modern FEC |
| BB-6166 | `ldpc_encoder_packet_aware` | Advanced Channel Coding | Modern FEC |
| BB-6167 | `ldpc_encoder_backpressure_capable` | Advanced Channel Coding | Modern FEC |
| BB-6168 | `ldpc_encoder_rate_adaptive` | Advanced Channel Coding | Modern FEC |
| BB-6169 | `ldpc_encoder_time_multiplexed` | Advanced Channel Coding | Modern FEC |
| BB-6170 | `ldpc_encoder_fully_parallel` | Advanced Channel Coding | Modern FEC |
| BB-6171 | `ldpc_encoder_buffered` | Advanced Channel Coding | Modern FEC |
| BB-6172 | `ldpc_encoder_clock_crossing` | Advanced Channel Coding | Modern FEC |
| BB-6173 | `ldpc_encoder_error_detecting` | Advanced Channel Coding | Modern FEC |
| BB-6174 | `ldpc_encoder_formally_instrumented` | Advanced Channel Coding | Modern FEC |
| BB-6175 | `ldpc_encoder_low_power` | Advanced Channel Coding | Modern FEC |
| BB-6176 | `ldpc_encoder_axi_stream` | Advanced Channel Coding | Modern FEC |
| BB-6177 | `ldpc_decoder_single_lane` | Advanced Channel Coding | Modern FEC |
| BB-6178 | `ldpc_decoder_multi_lane` | Advanced Channel Coding | Modern FEC |
| BB-6179 | `ldpc_decoder_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6180 | `ldpc_decoder_deep_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6181 | `ldpc_decoder_frame_aware` | Advanced Channel Coding | Modern FEC |
| BB-6182 | `ldpc_decoder_packet_aware` | Advanced Channel Coding | Modern FEC |
| BB-6183 | `ldpc_decoder_backpressure_capable` | Advanced Channel Coding | Modern FEC |
| BB-6184 | `ldpc_decoder_rate_adaptive` | Advanced Channel Coding | Modern FEC |
| BB-6185 | `ldpc_decoder_time_multiplexed` | Advanced Channel Coding | Modern FEC |
| BB-6186 | `ldpc_decoder_fully_parallel` | Advanced Channel Coding | Modern FEC |
| BB-6187 | `ldpc_decoder_buffered` | Advanced Channel Coding | Modern FEC |
| BB-6188 | `ldpc_decoder_clock_crossing` | Advanced Channel Coding | Modern FEC |
| BB-6189 | `ldpc_decoder_error_detecting` | Advanced Channel Coding | Modern FEC |
| BB-6190 | `ldpc_decoder_formally_instrumented` | Advanced Channel Coding | Modern FEC |
| BB-6191 | `ldpc_decoder_low_power` | Advanced Channel Coding | Modern FEC |
| BB-6192 | `ldpc_decoder_axi_stream` | Advanced Channel Coding | Modern FEC |
| BB-6193 | `polar_encoder_single_lane` | Advanced Channel Coding | Modern FEC |
| BB-6194 | `polar_encoder_multi_lane` | Advanced Channel Coding | Modern FEC |
| BB-6195 | `polar_encoder_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6196 | `polar_encoder_deep_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6197 | `polar_encoder_frame_aware` | Advanced Channel Coding | Modern FEC |
| BB-6198 | `polar_encoder_packet_aware` | Advanced Channel Coding | Modern FEC |
| BB-6199 | `polar_encoder_backpressure_capable` | Advanced Channel Coding | Modern FEC |
| BB-6200 | `polar_encoder_rate_adaptive` | Advanced Channel Coding | Modern FEC |
| BB-6201 | `polar_encoder_time_multiplexed` | Advanced Channel Coding | Modern FEC |
| BB-6202 | `polar_encoder_fully_parallel` | Advanced Channel Coding | Modern FEC |
| BB-6203 | `polar_encoder_buffered` | Advanced Channel Coding | Modern FEC |
| BB-6204 | `polar_encoder_clock_crossing` | Advanced Channel Coding | Modern FEC |
| BB-6205 | `polar_encoder_error_detecting` | Advanced Channel Coding | Modern FEC |
| BB-6206 | `polar_encoder_formally_instrumented` | Advanced Channel Coding | Modern FEC |
| BB-6207 | `polar_encoder_low_power` | Advanced Channel Coding | Modern FEC |
| BB-6208 | `polar_encoder_axi_stream` | Advanced Channel Coding | Modern FEC |
| BB-6209 | `polar_decoder_single_lane` | Advanced Channel Coding | Modern FEC |
| BB-6210 | `polar_decoder_multi_lane` | Advanced Channel Coding | Modern FEC |
| BB-6211 | `polar_decoder_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6212 | `polar_decoder_deep_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6213 | `polar_decoder_frame_aware` | Advanced Channel Coding | Modern FEC |
| BB-6214 | `polar_decoder_packet_aware` | Advanced Channel Coding | Modern FEC |
| BB-6215 | `polar_decoder_backpressure_capable` | Advanced Channel Coding | Modern FEC |
| BB-6216 | `polar_decoder_rate_adaptive` | Advanced Channel Coding | Modern FEC |
| BB-6217 | `polar_decoder_time_multiplexed` | Advanced Channel Coding | Modern FEC |
| BB-6218 | `polar_decoder_fully_parallel` | Advanced Channel Coding | Modern FEC |
| BB-6219 | `polar_decoder_buffered` | Advanced Channel Coding | Modern FEC |
| BB-6220 | `polar_decoder_clock_crossing` | Advanced Channel Coding | Modern FEC |
| BB-6221 | `polar_decoder_error_detecting` | Advanced Channel Coding | Modern FEC |
| BB-6222 | `polar_decoder_formally_instrumented` | Advanced Channel Coding | Modern FEC |
| BB-6223 | `polar_decoder_low_power` | Advanced Channel Coding | Modern FEC |
| BB-6224 | `polar_decoder_axi_stream` | Advanced Channel Coding | Modern FEC |
| BB-6225 | `turbo_decoder_single_lane` | Advanced Channel Coding | Modern FEC |
| BB-6226 | `turbo_decoder_multi_lane` | Advanced Channel Coding | Modern FEC |
| BB-6227 | `turbo_decoder_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6228 | `turbo_decoder_deep_pipelined` | Advanced Channel Coding | Modern FEC |
| BB-6229 | `turbo_decoder_frame_aware` | Advanced Channel Coding | Modern FEC |
| BB-6230 | `turbo_decoder_packet_aware` | Advanced Channel Coding | Modern FEC |
| BB-6231 | `turbo_decoder_backpressure_capable` | Advanced Channel Coding | Modern FEC |
| BB-6232 | `turbo_decoder_rate_adaptive` | Advanced Channel Coding | Modern FEC |
| BB-6233 | `turbo_decoder_time_multiplexed` | Advanced Channel Coding | Modern FEC |
| BB-6234 | `turbo_decoder_fully_parallel` | Advanced Channel Coding | Modern FEC |
| BB-6235 | `turbo_decoder_buffered` | Advanced Channel Coding | Modern FEC |
| BB-6236 | `turbo_decoder_clock_crossing` | Advanced Channel Coding | Modern FEC |
| BB-6237 | `turbo_decoder_error_detecting` | Advanced Channel Coding | Modern FEC |
| BB-6238 | `turbo_decoder_formally_instrumented` | Advanced Channel Coding | Modern FEC |
| BB-6239 | `turbo_decoder_low_power` | Advanced Channel Coding | Modern FEC |
| BB-6240 | `turbo_decoder_axi_stream` | Advanced Channel Coding | Modern FEC |
| BB-6241 | `gardner_timing_detector_single_shot` | SDR Synchronization | Symbol and carrier tracking |
| BB-6242 | `gardner_timing_detector_continuous` | SDR Synchronization | Symbol and carrier tracking |
| BB-6243 | `gardner_timing_detector_microcoded` | SDR Synchronization | Symbol and carrier tracking |
| BB-6244 | `gardner_timing_detector_table_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6245 | `gardner_timing_detector_multi_channel` | SDR Synchronization | Symbol and carrier tracking |
| BB-6246 | `gardner_timing_detector_queued` | SDR Synchronization | Symbol and carrier tracking |
| BB-6247 | `gardner_timing_detector_priority_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6248 | `gardner_timing_detector_deadline_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6249 | `gardner_timing_detector_redundant` | SDR Synchronization | Symbol and carrier tracking |
| BB-6250 | `gardner_timing_detector_lockstep_checked` | SDR Synchronization | Symbol and carrier tracking |
| BB-6251 | `gardner_timing_detector_formally_instrumented` | SDR Synchronization | Symbol and carrier tracking |
| BB-6252 | `gardner_timing_detector_low_power` | SDR Synchronization | Symbol and carrier tracking |
| BB-6253 | `gardner_timing_detector_clock_crossing` | SDR Synchronization | Symbol and carrier tracking |
| BB-6254 | `gardner_timing_detector_software_configurable` | SDR Synchronization | Symbol and carrier tracking |
| BB-6255 | `gardner_timing_detector_event_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6256 | `gardner_timing_detector_fail_safe` | SDR Synchronization | Symbol and carrier tracking |
| BB-6257 | `mueller_muller_detector_single_shot` | SDR Synchronization | Symbol and carrier tracking |
| BB-6258 | `mueller_muller_detector_continuous` | SDR Synchronization | Symbol and carrier tracking |
| BB-6259 | `mueller_muller_detector_microcoded` | SDR Synchronization | Symbol and carrier tracking |
| BB-6260 | `mueller_muller_detector_table_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6261 | `mueller_muller_detector_multi_channel` | SDR Synchronization | Symbol and carrier tracking |
| BB-6262 | `mueller_muller_detector_queued` | SDR Synchronization | Symbol and carrier tracking |
| BB-6263 | `mueller_muller_detector_priority_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6264 | `mueller_muller_detector_deadline_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6265 | `mueller_muller_detector_redundant` | SDR Synchronization | Symbol and carrier tracking |
| BB-6266 | `mueller_muller_detector_lockstep_checked` | SDR Synchronization | Symbol and carrier tracking |
| BB-6267 | `mueller_muller_detector_formally_instrumented` | SDR Synchronization | Symbol and carrier tracking |
| BB-6268 | `mueller_muller_detector_low_power` | SDR Synchronization | Symbol and carrier tracking |
| BB-6269 | `mueller_muller_detector_clock_crossing` | SDR Synchronization | Symbol and carrier tracking |
| BB-6270 | `mueller_muller_detector_software_configurable` | SDR Synchronization | Symbol and carrier tracking |
| BB-6271 | `mueller_muller_detector_event_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6272 | `mueller_muller_detector_fail_safe` | SDR Synchronization | Symbol and carrier tracking |
| BB-6273 | `costas_loop_single_shot` | SDR Synchronization | Symbol and carrier tracking |
| BB-6274 | `costas_loop_continuous` | SDR Synchronization | Symbol and carrier tracking |
| BB-6275 | `costas_loop_microcoded` | SDR Synchronization | Symbol and carrier tracking |
| BB-6276 | `costas_loop_table_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6277 | `costas_loop_multi_channel` | SDR Synchronization | Symbol and carrier tracking |
| BB-6278 | `costas_loop_queued` | SDR Synchronization | Symbol and carrier tracking |
| BB-6279 | `costas_loop_priority_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6280 | `costas_loop_deadline_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6281 | `costas_loop_redundant` | SDR Synchronization | Symbol and carrier tracking |
| BB-6282 | `costas_loop_lockstep_checked` | SDR Synchronization | Symbol and carrier tracking |
| BB-6283 | `costas_loop_formally_instrumented` | SDR Synchronization | Symbol and carrier tracking |
| BB-6284 | `costas_loop_low_power` | SDR Synchronization | Symbol and carrier tracking |
| BB-6285 | `costas_loop_clock_crossing` | SDR Synchronization | Symbol and carrier tracking |
| BB-6286 | `costas_loop_software_configurable` | SDR Synchronization | Symbol and carrier tracking |
| BB-6287 | `costas_loop_event_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6288 | `costas_loop_fail_safe` | SDR Synchronization | Symbol and carrier tracking |
| BB-6289 | `carrier_frequency_estimator_single_shot` | SDR Synchronization | Symbol and carrier tracking |
| BB-6290 | `carrier_frequency_estimator_continuous` | SDR Synchronization | Symbol and carrier tracking |
| BB-6291 | `carrier_frequency_estimator_microcoded` | SDR Synchronization | Symbol and carrier tracking |
| BB-6292 | `carrier_frequency_estimator_table_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6293 | `carrier_frequency_estimator_multi_channel` | SDR Synchronization | Symbol and carrier tracking |
| BB-6294 | `carrier_frequency_estimator_queued` | SDR Synchronization | Symbol and carrier tracking |
| BB-6295 | `carrier_frequency_estimator_priority_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6296 | `carrier_frequency_estimator_deadline_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6297 | `carrier_frequency_estimator_redundant` | SDR Synchronization | Symbol and carrier tracking |
| BB-6298 | `carrier_frequency_estimator_lockstep_checked` | SDR Synchronization | Symbol and carrier tracking |
| BB-6299 | `carrier_frequency_estimator_formally_instrumented` | SDR Synchronization | Symbol and carrier tracking |
| BB-6300 | `carrier_frequency_estimator_low_power` | SDR Synchronization | Symbol and carrier tracking |
| BB-6301 | `carrier_frequency_estimator_clock_crossing` | SDR Synchronization | Symbol and carrier tracking |
| BB-6302 | `carrier_frequency_estimator_software_configurable` | SDR Synchronization | Symbol and carrier tracking |
| BB-6303 | `carrier_frequency_estimator_event_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6304 | `carrier_frequency_estimator_fail_safe` | SDR Synchronization | Symbol and carrier tracking |
| BB-6305 | `pilot_tracking_loop_single_shot` | SDR Synchronization | Symbol and carrier tracking |
| BB-6306 | `pilot_tracking_loop_continuous` | SDR Synchronization | Symbol and carrier tracking |
| BB-6307 | `pilot_tracking_loop_microcoded` | SDR Synchronization | Symbol and carrier tracking |
| BB-6308 | `pilot_tracking_loop_table_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6309 | `pilot_tracking_loop_multi_channel` | SDR Synchronization | Symbol and carrier tracking |
| BB-6310 | `pilot_tracking_loop_queued` | SDR Synchronization | Symbol and carrier tracking |
| BB-6311 | `pilot_tracking_loop_priority_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6312 | `pilot_tracking_loop_deadline_aware` | SDR Synchronization | Symbol and carrier tracking |
| BB-6313 | `pilot_tracking_loop_redundant` | SDR Synchronization | Symbol and carrier tracking |
| BB-6314 | `pilot_tracking_loop_lockstep_checked` | SDR Synchronization | Symbol and carrier tracking |
| BB-6315 | `pilot_tracking_loop_formally_instrumented` | SDR Synchronization | Symbol and carrier tracking |
| BB-6316 | `pilot_tracking_loop_low_power` | SDR Synchronization | Symbol and carrier tracking |
| BB-6317 | `pilot_tracking_loop_clock_crossing` | SDR Synchronization | Symbol and carrier tracking |
| BB-6318 | `pilot_tracking_loop_software_configurable` | SDR Synchronization | Symbol and carrier tracking |
| BB-6319 | `pilot_tracking_loop_event_driven` | SDR Synchronization | Symbol and carrier tracking |
| BB-6320 | `pilot_tracking_loop_fail_safe` | SDR Synchronization | Symbol and carrier tracking |
| BB-6321 | `bank_aware_memory_arbiter_single_port` | Memory Scheduling | Memory arbitration |
| BB-6322 | `bank_aware_memory_arbiter_dual_port` | Memory Scheduling | Memory arbitration |
| BB-6323 | `bank_aware_memory_arbiter_banked` | Memory Scheduling | Memory arbitration |
| BB-6324 | `bank_aware_memory_arbiter_interleaved` | Memory Scheduling | Memory arbitration |
| BB-6325 | `bank_aware_memory_arbiter_write_back` | Memory Scheduling | Memory arbitration |
| BB-6326 | `bank_aware_memory_arbiter_write_through` | Memory Scheduling | Memory arbitration |
| BB-6327 | `bank_aware_memory_arbiter_nonblocking` | Memory Scheduling | Memory arbitration |
| BB-6328 | `bank_aware_memory_arbiter_pipelined` | Memory Scheduling | Memory arbitration |
| BB-6329 | `bank_aware_memory_arbiter_burst_optimized` | Memory Scheduling | Memory arbitration |
| BB-6330 | `bank_aware_memory_arbiter_multi_channel` | Memory Scheduling | Memory arbitration |
| BB-6331 | `bank_aware_memory_arbiter_ecc_protected` | Memory Scheduling | Memory arbitration |
| BB-6332 | `bank_aware_memory_arbiter_scrubbed` | Memory Scheduling | Memory arbitration |
| BB-6333 | `bank_aware_memory_arbiter_clock_crossing` | Memory Scheduling | Memory arbitration |
| BB-6334 | `bank_aware_memory_arbiter_qos_aware` | Memory Scheduling | Memory arbitration |
| BB-6335 | `bank_aware_memory_arbiter_low_power` | Memory Scheduling | Memory arbitration |
| BB-6336 | `bank_aware_memory_arbiter_formally_instrumented` | Memory Scheduling | Memory arbitration |
| BB-6337 | `row_hit_scheduler_single_port` | Memory Scheduling | Memory arbitration |
| BB-6338 | `row_hit_scheduler_dual_port` | Memory Scheduling | Memory arbitration |
| BB-6339 | `row_hit_scheduler_banked` | Memory Scheduling | Memory arbitration |
| BB-6340 | `row_hit_scheduler_interleaved` | Memory Scheduling | Memory arbitration |
| BB-6341 | `row_hit_scheduler_write_back` | Memory Scheduling | Memory arbitration |
| BB-6342 | `row_hit_scheduler_write_through` | Memory Scheduling | Memory arbitration |
| BB-6343 | `row_hit_scheduler_nonblocking` | Memory Scheduling | Memory arbitration |
| BB-6344 | `row_hit_scheduler_pipelined` | Memory Scheduling | Memory arbitration |
| BB-6345 | `row_hit_scheduler_burst_optimized` | Memory Scheduling | Memory arbitration |
| BB-6346 | `row_hit_scheduler_multi_channel` | Memory Scheduling | Memory arbitration |
| BB-6347 | `row_hit_scheduler_ecc_protected` | Memory Scheduling | Memory arbitration |
| BB-6348 | `row_hit_scheduler_scrubbed` | Memory Scheduling | Memory arbitration |
| BB-6349 | `row_hit_scheduler_clock_crossing` | Memory Scheduling | Memory arbitration |
| BB-6350 | `row_hit_scheduler_qos_aware` | Memory Scheduling | Memory arbitration |
| BB-6351 | `row_hit_scheduler_low_power` | Memory Scheduling | Memory arbitration |
| BB-6352 | `row_hit_scheduler_formally_instrumented` | Memory Scheduling | Memory arbitration |
| BB-6353 | `memory_qos_controller_single_port` | Memory Scheduling | Memory arbitration |
| BB-6354 | `memory_qos_controller_dual_port` | Memory Scheduling | Memory arbitration |
| BB-6355 | `memory_qos_controller_banked` | Memory Scheduling | Memory arbitration |
| BB-6356 | `memory_qos_controller_interleaved` | Memory Scheduling | Memory arbitration |
| BB-6357 | `memory_qos_controller_write_back` | Memory Scheduling | Memory arbitration |
| BB-6358 | `memory_qos_controller_write_through` | Memory Scheduling | Memory arbitration |
| BB-6359 | `memory_qos_controller_nonblocking` | Memory Scheduling | Memory arbitration |
| BB-6360 | `memory_qos_controller_pipelined` | Memory Scheduling | Memory arbitration |
| BB-6361 | `memory_qos_controller_burst_optimized` | Memory Scheduling | Memory arbitration |
| BB-6362 | `memory_qos_controller_multi_channel` | Memory Scheduling | Memory arbitration |
| BB-6363 | `memory_qos_controller_ecc_protected` | Memory Scheduling | Memory arbitration |
| BB-6364 | `memory_qos_controller_scrubbed` | Memory Scheduling | Memory arbitration |
| BB-6365 | `memory_qos_controller_clock_crossing` | Memory Scheduling | Memory arbitration |
| BB-6366 | `memory_qos_controller_qos_aware` | Memory Scheduling | Memory arbitration |
| BB-6367 | `memory_qos_controller_low_power` | Memory Scheduling | Memory arbitration |
| BB-6368 | `memory_qos_controller_formally_instrumented` | Memory Scheduling | Memory arbitration |
| BB-6369 | `read_write_turnaround_optimizer_single_port` | Memory Scheduling | Memory arbitration |
| BB-6370 | `read_write_turnaround_optimizer_dual_port` | Memory Scheduling | Memory arbitration |
| BB-6371 | `read_write_turnaround_optimizer_banked` | Memory Scheduling | Memory arbitration |
| BB-6372 | `read_write_turnaround_optimizer_interleaved` | Memory Scheduling | Memory arbitration |
| BB-6373 | `read_write_turnaround_optimizer_write_back` | Memory Scheduling | Memory arbitration |
| BB-6374 | `read_write_turnaround_optimizer_write_through` | Memory Scheduling | Memory arbitration |
| BB-6375 | `read_write_turnaround_optimizer_nonblocking` | Memory Scheduling | Memory arbitration |
| BB-6376 | `read_write_turnaround_optimizer_pipelined` | Memory Scheduling | Memory arbitration |
| BB-6377 | `read_write_turnaround_optimizer_burst_optimized` | Memory Scheduling | Memory arbitration |
| BB-6378 | `read_write_turnaround_optimizer_multi_channel` | Memory Scheduling | Memory arbitration |
| BB-6379 | `read_write_turnaround_optimizer_ecc_protected` | Memory Scheduling | Memory arbitration |
| BB-6380 | `read_write_turnaround_optimizer_scrubbed` | Memory Scheduling | Memory arbitration |
| BB-6381 | `read_write_turnaround_optimizer_clock_crossing` | Memory Scheduling | Memory arbitration |
| BB-6382 | `read_write_turnaround_optimizer_qos_aware` | Memory Scheduling | Memory arbitration |
| BB-6383 | `read_write_turnaround_optimizer_low_power` | Memory Scheduling | Memory arbitration |
| BB-6384 | `read_write_turnaround_optimizer_formally_instrumented` | Memory Scheduling | Memory arbitration |
| BB-6385 | `memory_request_reorderer_single_port` | Memory Scheduling | Memory arbitration |
| BB-6386 | `memory_request_reorderer_dual_port` | Memory Scheduling | Memory arbitration |
| BB-6387 | `memory_request_reorderer_banked` | Memory Scheduling | Memory arbitration |
| BB-6388 | `memory_request_reorderer_interleaved` | Memory Scheduling | Memory arbitration |
| BB-6389 | `memory_request_reorderer_write_back` | Memory Scheduling | Memory arbitration |
| BB-6390 | `memory_request_reorderer_write_through` | Memory Scheduling | Memory arbitration |
| BB-6391 | `memory_request_reorderer_nonblocking` | Memory Scheduling | Memory arbitration |
| BB-6392 | `memory_request_reorderer_pipelined` | Memory Scheduling | Memory arbitration |
| BB-6393 | `memory_request_reorderer_burst_optimized` | Memory Scheduling | Memory arbitration |
| BB-6394 | `memory_request_reorderer_multi_channel` | Memory Scheduling | Memory arbitration |
| BB-6395 | `memory_request_reorderer_ecc_protected` | Memory Scheduling | Memory arbitration |
| BB-6396 | `memory_request_reorderer_scrubbed` | Memory Scheduling | Memory arbitration |
| BB-6397 | `memory_request_reorderer_clock_crossing` | Memory Scheduling | Memory arbitration |
| BB-6398 | `memory_request_reorderer_qos_aware` | Memory Scheduling | Memory arbitration |
| BB-6399 | `memory_request_reorderer_low_power` | Memory Scheduling | Memory arbitration |
| BB-6400 | `memory_request_reorderer_formally_instrumented` | Memory Scheduling | Memory arbitration |
| BB-6401 | `stride_prefetch_engine_single_port` | Memory Prefetch | Prefetch engines |
| BB-6402 | `stride_prefetch_engine_dual_port` | Memory Prefetch | Prefetch engines |
| BB-6403 | `stride_prefetch_engine_banked` | Memory Prefetch | Prefetch engines |
| BB-6404 | `stride_prefetch_engine_interleaved` | Memory Prefetch | Prefetch engines |
| BB-6405 | `stride_prefetch_engine_write_back` | Memory Prefetch | Prefetch engines |
| BB-6406 | `stride_prefetch_engine_write_through` | Memory Prefetch | Prefetch engines |
| BB-6407 | `stride_prefetch_engine_nonblocking` | Memory Prefetch | Prefetch engines |
| BB-6408 | `stride_prefetch_engine_pipelined` | Memory Prefetch | Prefetch engines |
| BB-6409 | `stride_prefetch_engine_burst_optimized` | Memory Prefetch | Prefetch engines |
| BB-6410 | `stride_prefetch_engine_multi_channel` | Memory Prefetch | Prefetch engines |
| BB-6411 | `stride_prefetch_engine_ecc_protected` | Memory Prefetch | Prefetch engines |
| BB-6412 | `stride_prefetch_engine_scrubbed` | Memory Prefetch | Prefetch engines |
| BB-6413 | `stride_prefetch_engine_clock_crossing` | Memory Prefetch | Prefetch engines |
| BB-6414 | `stride_prefetch_engine_qos_aware` | Memory Prefetch | Prefetch engines |
| BB-6415 | `stride_prefetch_engine_low_power` | Memory Prefetch | Prefetch engines |
| BB-6416 | `stride_prefetch_engine_formally_instrumented` | Memory Prefetch | Prefetch engines |
| BB-6417 | `delta_correlation_prefetcher_single_port` | Memory Prefetch | Prefetch engines |
| BB-6418 | `delta_correlation_prefetcher_dual_port` | Memory Prefetch | Prefetch engines |
| BB-6419 | `delta_correlation_prefetcher_banked` | Memory Prefetch | Prefetch engines |
| BB-6420 | `delta_correlation_prefetcher_interleaved` | Memory Prefetch | Prefetch engines |
| BB-6421 | `delta_correlation_prefetcher_write_back` | Memory Prefetch | Prefetch engines |
| BB-6422 | `delta_correlation_prefetcher_write_through` | Memory Prefetch | Prefetch engines |
| BB-6423 | `delta_correlation_prefetcher_nonblocking` | Memory Prefetch | Prefetch engines |
| BB-6424 | `delta_correlation_prefetcher_pipelined` | Memory Prefetch | Prefetch engines |
| BB-6425 | `delta_correlation_prefetcher_burst_optimized` | Memory Prefetch | Prefetch engines |
| BB-6426 | `delta_correlation_prefetcher_multi_channel` | Memory Prefetch | Prefetch engines |
| BB-6427 | `delta_correlation_prefetcher_ecc_protected` | Memory Prefetch | Prefetch engines |
| BB-6428 | `delta_correlation_prefetcher_scrubbed` | Memory Prefetch | Prefetch engines |
| BB-6429 | `delta_correlation_prefetcher_clock_crossing` | Memory Prefetch | Prefetch engines |
| BB-6430 | `delta_correlation_prefetcher_qos_aware` | Memory Prefetch | Prefetch engines |
| BB-6431 | `delta_correlation_prefetcher_low_power` | Memory Prefetch | Prefetch engines |
| BB-6432 | `delta_correlation_prefetcher_formally_instrumented` | Memory Prefetch | Prefetch engines |
| BB-6433 | `stream_buffer_prefetcher_single_port` | Memory Prefetch | Prefetch engines |
| BB-6434 | `stream_buffer_prefetcher_dual_port` | Memory Prefetch | Prefetch engines |
| BB-6435 | `stream_buffer_prefetcher_banked` | Memory Prefetch | Prefetch engines |
| BB-6436 | `stream_buffer_prefetcher_interleaved` | Memory Prefetch | Prefetch engines |
| BB-6437 | `stream_buffer_prefetcher_write_back` | Memory Prefetch | Prefetch engines |
| BB-6438 | `stream_buffer_prefetcher_write_through` | Memory Prefetch | Prefetch engines |
| BB-6439 | `stream_buffer_prefetcher_nonblocking` | Memory Prefetch | Prefetch engines |
| BB-6440 | `stream_buffer_prefetcher_pipelined` | Memory Prefetch | Prefetch engines |
| BB-6441 | `stream_buffer_prefetcher_burst_optimized` | Memory Prefetch | Prefetch engines |
| BB-6442 | `stream_buffer_prefetcher_multi_channel` | Memory Prefetch | Prefetch engines |
| BB-6443 | `stream_buffer_prefetcher_ecc_protected` | Memory Prefetch | Prefetch engines |
| BB-6444 | `stream_buffer_prefetcher_scrubbed` | Memory Prefetch | Prefetch engines |
| BB-6445 | `stream_buffer_prefetcher_clock_crossing` | Memory Prefetch | Prefetch engines |
| BB-6446 | `stream_buffer_prefetcher_qos_aware` | Memory Prefetch | Prefetch engines |
| BB-6447 | `stream_buffer_prefetcher_low_power` | Memory Prefetch | Prefetch engines |
| BB-6448 | `stream_buffer_prefetcher_formally_instrumented` | Memory Prefetch | Prefetch engines |
| BB-6449 | `spatial_region_prefetcher_single_port` | Memory Prefetch | Prefetch engines |
| BB-6450 | `spatial_region_prefetcher_dual_port` | Memory Prefetch | Prefetch engines |
| BB-6451 | `spatial_region_prefetcher_banked` | Memory Prefetch | Prefetch engines |
| BB-6452 | `spatial_region_prefetcher_interleaved` | Memory Prefetch | Prefetch engines |
| BB-6453 | `spatial_region_prefetcher_write_back` | Memory Prefetch | Prefetch engines |
| BB-6454 | `spatial_region_prefetcher_write_through` | Memory Prefetch | Prefetch engines |
| BB-6455 | `spatial_region_prefetcher_nonblocking` | Memory Prefetch | Prefetch engines |
| BB-6456 | `spatial_region_prefetcher_pipelined` | Memory Prefetch | Prefetch engines |
| BB-6457 | `spatial_region_prefetcher_burst_optimized` | Memory Prefetch | Prefetch engines |
| BB-6458 | `spatial_region_prefetcher_multi_channel` | Memory Prefetch | Prefetch engines |
| BB-6459 | `spatial_region_prefetcher_ecc_protected` | Memory Prefetch | Prefetch engines |
| BB-6460 | `spatial_region_prefetcher_scrubbed` | Memory Prefetch | Prefetch engines |
| BB-6461 | `spatial_region_prefetcher_clock_crossing` | Memory Prefetch | Prefetch engines |
| BB-6462 | `spatial_region_prefetcher_qos_aware` | Memory Prefetch | Prefetch engines |
| BB-6463 | `spatial_region_prefetcher_low_power` | Memory Prefetch | Prefetch engines |
| BB-6464 | `spatial_region_prefetcher_formally_instrumented` | Memory Prefetch | Prefetch engines |
| BB-6465 | `prefetch_accuracy_monitor_single_port` | Memory Prefetch | Prefetch engines |
| BB-6466 | `prefetch_accuracy_monitor_dual_port` | Memory Prefetch | Prefetch engines |
| BB-6467 | `prefetch_accuracy_monitor_banked` | Memory Prefetch | Prefetch engines |
| BB-6468 | `prefetch_accuracy_monitor_interleaved` | Memory Prefetch | Prefetch engines |
| BB-6469 | `prefetch_accuracy_monitor_write_back` | Memory Prefetch | Prefetch engines |
| BB-6470 | `prefetch_accuracy_monitor_write_through` | Memory Prefetch | Prefetch engines |
| BB-6471 | `prefetch_accuracy_monitor_nonblocking` | Memory Prefetch | Prefetch engines |
| BB-6472 | `prefetch_accuracy_monitor_pipelined` | Memory Prefetch | Prefetch engines |
| BB-6473 | `prefetch_accuracy_monitor_burst_optimized` | Memory Prefetch | Prefetch engines |
| BB-6474 | `prefetch_accuracy_monitor_multi_channel` | Memory Prefetch | Prefetch engines |
| BB-6475 | `prefetch_accuracy_monitor_ecc_protected` | Memory Prefetch | Prefetch engines |
| BB-6476 | `prefetch_accuracy_monitor_scrubbed` | Memory Prefetch | Prefetch engines |
| BB-6477 | `prefetch_accuracy_monitor_clock_crossing` | Memory Prefetch | Prefetch engines |
| BB-6478 | `prefetch_accuracy_monitor_qos_aware` | Memory Prefetch | Prefetch engines |
| BB-6479 | `prefetch_accuracy_monitor_low_power` | Memory Prefetch | Prefetch engines |
| BB-6480 | `prefetch_accuracy_monitor_formally_instrumented` | Memory Prefetch | Prefetch engines |
| BB-6481 | `nonblocking_cache_controller_single_port` | Advanced Cache | Cache organizations |
| BB-6482 | `nonblocking_cache_controller_dual_port` | Advanced Cache | Cache organizations |
| BB-6483 | `nonblocking_cache_controller_banked` | Advanced Cache | Cache organizations |
| BB-6484 | `nonblocking_cache_controller_interleaved` | Advanced Cache | Cache organizations |
| BB-6485 | `nonblocking_cache_controller_write_back` | Advanced Cache | Cache organizations |
| BB-6486 | `nonblocking_cache_controller_write_through` | Advanced Cache | Cache organizations |
| BB-6487 | `nonblocking_cache_controller_nonblocking` | Advanced Cache | Cache organizations |
| BB-6488 | `nonblocking_cache_controller_pipelined` | Advanced Cache | Cache organizations |
| BB-6489 | `nonblocking_cache_controller_burst_optimized` | Advanced Cache | Cache organizations |
| BB-6490 | `nonblocking_cache_controller_multi_channel` | Advanced Cache | Cache organizations |
| BB-6491 | `nonblocking_cache_controller_ecc_protected` | Advanced Cache | Cache organizations |
| BB-6492 | `nonblocking_cache_controller_scrubbed` | Advanced Cache | Cache organizations |
| BB-6493 | `nonblocking_cache_controller_clock_crossing` | Advanced Cache | Cache organizations |
| BB-6494 | `nonblocking_cache_controller_qos_aware` | Advanced Cache | Cache organizations |
| BB-6495 | `nonblocking_cache_controller_low_power` | Advanced Cache | Cache organizations |
| BB-6496 | `nonblocking_cache_controller_formally_instrumented` | Advanced Cache | Cache organizations |
| BB-6497 | `victim_cache_controller_single_port` | Advanced Cache | Cache organizations |
| BB-6498 | `victim_cache_controller_dual_port` | Advanced Cache | Cache organizations |
| BB-6499 | `victim_cache_controller_banked` | Advanced Cache | Cache organizations |
| BB-6500 | `victim_cache_controller_interleaved` | Advanced Cache | Cache organizations |
| BB-6501 | `victim_cache_controller_write_back` | Advanced Cache | Cache organizations |
| BB-6502 | `victim_cache_controller_write_through` | Advanced Cache | Cache organizations |
| BB-6503 | `victim_cache_controller_nonblocking` | Advanced Cache | Cache organizations |
| BB-6504 | `victim_cache_controller_pipelined` | Advanced Cache | Cache organizations |
| BB-6505 | `victim_cache_controller_burst_optimized` | Advanced Cache | Cache organizations |
| BB-6506 | `victim_cache_controller_multi_channel` | Advanced Cache | Cache organizations |
| BB-6507 | `victim_cache_controller_ecc_protected` | Advanced Cache | Cache organizations |
| BB-6508 | `victim_cache_controller_scrubbed` | Advanced Cache | Cache organizations |
| BB-6509 | `victim_cache_controller_clock_crossing` | Advanced Cache | Cache organizations |
| BB-6510 | `victim_cache_controller_qos_aware` | Advanced Cache | Cache organizations |
| BB-6511 | `victim_cache_controller_low_power` | Advanced Cache | Cache organizations |
| BB-6512 | `victim_cache_controller_formally_instrumented` | Advanced Cache | Cache organizations |
| BB-6513 | `sector_cache_controller_single_port` | Advanced Cache | Cache organizations |
| BB-6514 | `sector_cache_controller_dual_port` | Advanced Cache | Cache organizations |
| BB-6515 | `sector_cache_controller_banked` | Advanced Cache | Cache organizations |
| BB-6516 | `sector_cache_controller_interleaved` | Advanced Cache | Cache organizations |
| BB-6517 | `sector_cache_controller_write_back` | Advanced Cache | Cache organizations |
| BB-6518 | `sector_cache_controller_write_through` | Advanced Cache | Cache organizations |
| BB-6519 | `sector_cache_controller_nonblocking` | Advanced Cache | Cache organizations |
| BB-6520 | `sector_cache_controller_pipelined` | Advanced Cache | Cache organizations |
| BB-6521 | `sector_cache_controller_burst_optimized` | Advanced Cache | Cache organizations |
| BB-6522 | `sector_cache_controller_multi_channel` | Advanced Cache | Cache organizations |
| BB-6523 | `sector_cache_controller_ecc_protected` | Advanced Cache | Cache organizations |
| BB-6524 | `sector_cache_controller_scrubbed` | Advanced Cache | Cache organizations |
| BB-6525 | `sector_cache_controller_clock_crossing` | Advanced Cache | Cache organizations |
| BB-6526 | `sector_cache_controller_qos_aware` | Advanced Cache | Cache organizations |
| BB-6527 | `sector_cache_controller_low_power` | Advanced Cache | Cache organizations |
| BB-6528 | `sector_cache_controller_formally_instrumented` | Advanced Cache | Cache organizations |
| BB-6529 | `skewed_associative_cache_single_port` | Advanced Cache | Cache organizations |
| BB-6530 | `skewed_associative_cache_dual_port` | Advanced Cache | Cache organizations |
| BB-6531 | `skewed_associative_cache_banked` | Advanced Cache | Cache organizations |
| BB-6532 | `skewed_associative_cache_interleaved` | Advanced Cache | Cache organizations |
| BB-6533 | `skewed_associative_cache_write_back` | Advanced Cache | Cache organizations |
| BB-6534 | `skewed_associative_cache_write_through` | Advanced Cache | Cache organizations |
| BB-6535 | `skewed_associative_cache_nonblocking` | Advanced Cache | Cache organizations |
| BB-6536 | `skewed_associative_cache_pipelined` | Advanced Cache | Cache organizations |
| BB-6537 | `skewed_associative_cache_burst_optimized` | Advanced Cache | Cache organizations |
| BB-6538 | `skewed_associative_cache_multi_channel` | Advanced Cache | Cache organizations |
| BB-6539 | `skewed_associative_cache_ecc_protected` | Advanced Cache | Cache organizations |
| BB-6540 | `skewed_associative_cache_scrubbed` | Advanced Cache | Cache organizations |
| BB-6541 | `skewed_associative_cache_clock_crossing` | Advanced Cache | Cache organizations |
| BB-6542 | `skewed_associative_cache_qos_aware` | Advanced Cache | Cache organizations |
| BB-6543 | `skewed_associative_cache_low_power` | Advanced Cache | Cache organizations |
| BB-6544 | `skewed_associative_cache_formally_instrumented` | Advanced Cache | Cache organizations |
| BB-6545 | `cache_way_predictor_single_port` | Advanced Cache | Cache organizations |
| BB-6546 | `cache_way_predictor_dual_port` | Advanced Cache | Cache organizations |
| BB-6547 | `cache_way_predictor_banked` | Advanced Cache | Cache organizations |
| BB-6548 | `cache_way_predictor_interleaved` | Advanced Cache | Cache organizations |
| BB-6549 | `cache_way_predictor_write_back` | Advanced Cache | Cache organizations |
| BB-6550 | `cache_way_predictor_write_through` | Advanced Cache | Cache organizations |
| BB-6551 | `cache_way_predictor_nonblocking` | Advanced Cache | Cache organizations |
| BB-6552 | `cache_way_predictor_pipelined` | Advanced Cache | Cache organizations |
| BB-6553 | `cache_way_predictor_burst_optimized` | Advanced Cache | Cache organizations |
| BB-6554 | `cache_way_predictor_multi_channel` | Advanced Cache | Cache organizations |
| BB-6555 | `cache_way_predictor_ecc_protected` | Advanced Cache | Cache organizations |
| BB-6556 | `cache_way_predictor_scrubbed` | Advanced Cache | Cache organizations |
| BB-6557 | `cache_way_predictor_clock_crossing` | Advanced Cache | Cache organizations |
| BB-6558 | `cache_way_predictor_qos_aware` | Advanced Cache | Cache organizations |
| BB-6559 | `cache_way_predictor_low_power` | Advanced Cache | Cache organizations |
| BB-6560 | `cache_way_predictor_formally_instrumented` | Advanced Cache | Cache organizations |
| BB-6561 | `ddr_command_scheduler_single_port` | DRAM Controller | DRAM management |
| BB-6562 | `ddr_command_scheduler_dual_port` | DRAM Controller | DRAM management |
| BB-6563 | `ddr_command_scheduler_banked` | DRAM Controller | DRAM management |
| BB-6564 | `ddr_command_scheduler_interleaved` | DRAM Controller | DRAM management |
| BB-6565 | `ddr_command_scheduler_write_back` | DRAM Controller | DRAM management |
| BB-6566 | `ddr_command_scheduler_write_through` | DRAM Controller | DRAM management |
| BB-6567 | `ddr_command_scheduler_nonblocking` | DRAM Controller | DRAM management |
| BB-6568 | `ddr_command_scheduler_pipelined` | DRAM Controller | DRAM management |
| BB-6569 | `ddr_command_scheduler_burst_optimized` | DRAM Controller | DRAM management |
| BB-6570 | `ddr_command_scheduler_multi_channel` | DRAM Controller | DRAM management |
| BB-6571 | `ddr_command_scheduler_ecc_protected` | DRAM Controller | DRAM management |
| BB-6572 | `ddr_command_scheduler_scrubbed` | DRAM Controller | DRAM management |
| BB-6573 | `ddr_command_scheduler_clock_crossing` | DRAM Controller | DRAM management |
| BB-6574 | `ddr_command_scheduler_qos_aware` | DRAM Controller | DRAM management |
| BB-6575 | `ddr_command_scheduler_low_power` | DRAM Controller | DRAM management |
| BB-6576 | `ddr_command_scheduler_formally_instrumented` | DRAM Controller | DRAM management |
| BB-6577 | `dram_refresh_manager_single_port` | DRAM Controller | DRAM management |
| BB-6578 | `dram_refresh_manager_dual_port` | DRAM Controller | DRAM management |
| BB-6579 | `dram_refresh_manager_banked` | DRAM Controller | DRAM management |
| BB-6580 | `dram_refresh_manager_interleaved` | DRAM Controller | DRAM management |
| BB-6581 | `dram_refresh_manager_write_back` | DRAM Controller | DRAM management |
| BB-6582 | `dram_refresh_manager_write_through` | DRAM Controller | DRAM management |
| BB-6583 | `dram_refresh_manager_nonblocking` | DRAM Controller | DRAM management |
| BB-6584 | `dram_refresh_manager_pipelined` | DRAM Controller | DRAM management |
| BB-6585 | `dram_refresh_manager_burst_optimized` | DRAM Controller | DRAM management |
| BB-6586 | `dram_refresh_manager_multi_channel` | DRAM Controller | DRAM management |
| BB-6587 | `dram_refresh_manager_ecc_protected` | DRAM Controller | DRAM management |
| BB-6588 | `dram_refresh_manager_scrubbed` | DRAM Controller | DRAM management |
| BB-6589 | `dram_refresh_manager_clock_crossing` | DRAM Controller | DRAM management |
| BB-6590 | `dram_refresh_manager_qos_aware` | DRAM Controller | DRAM management |
| BB-6591 | `dram_refresh_manager_low_power` | DRAM Controller | DRAM management |
| BB-6592 | `dram_refresh_manager_formally_instrumented` | DRAM Controller | DRAM management |
| BB-6593 | `row_hammer_monitor_single_port` | DRAM Controller | DRAM management |
| BB-6594 | `row_hammer_monitor_dual_port` | DRAM Controller | DRAM management |
| BB-6595 | `row_hammer_monitor_banked` | DRAM Controller | DRAM management |
| BB-6596 | `row_hammer_monitor_interleaved` | DRAM Controller | DRAM management |
| BB-6597 | `row_hammer_monitor_write_back` | DRAM Controller | DRAM management |
| BB-6598 | `row_hammer_monitor_write_through` | DRAM Controller | DRAM management |
| BB-6599 | `row_hammer_monitor_nonblocking` | DRAM Controller | DRAM management |
| BB-6600 | `row_hammer_monitor_pipelined` | DRAM Controller | DRAM management |
| BB-6601 | `row_hammer_monitor_burst_optimized` | DRAM Controller | DRAM management |
| BB-6602 | `row_hammer_monitor_multi_channel` | DRAM Controller | DRAM management |
| BB-6603 | `row_hammer_monitor_ecc_protected` | DRAM Controller | DRAM management |
| BB-6604 | `row_hammer_monitor_scrubbed` | DRAM Controller | DRAM management |
| BB-6605 | `row_hammer_monitor_clock_crossing` | DRAM Controller | DRAM management |
| BB-6606 | `row_hammer_monitor_qos_aware` | DRAM Controller | DRAM management |
| BB-6607 | `row_hammer_monitor_low_power` | DRAM Controller | DRAM management |
| BB-6608 | `row_hammer_monitor_formally_instrumented` | DRAM Controller | DRAM management |
| BB-6609 | `dram_ecc_pipeline_single_port` | DRAM Controller | DRAM management |
| BB-6610 | `dram_ecc_pipeline_dual_port` | DRAM Controller | DRAM management |
| BB-6611 | `dram_ecc_pipeline_banked` | DRAM Controller | DRAM management |
| BB-6612 | `dram_ecc_pipeline_interleaved` | DRAM Controller | DRAM management |
| BB-6613 | `dram_ecc_pipeline_write_back` | DRAM Controller | DRAM management |
| BB-6614 | `dram_ecc_pipeline_write_through` | DRAM Controller | DRAM management |
| BB-6615 | `dram_ecc_pipeline_nonblocking` | DRAM Controller | DRAM management |
| BB-6616 | `dram_ecc_pipeline_pipelined` | DRAM Controller | DRAM management |
| BB-6617 | `dram_ecc_pipeline_burst_optimized` | DRAM Controller | DRAM management |
| BB-6618 | `dram_ecc_pipeline_multi_channel` | DRAM Controller | DRAM management |
| BB-6619 | `dram_ecc_pipeline_ecc_protected` | DRAM Controller | DRAM management |
| BB-6620 | `dram_ecc_pipeline_scrubbed` | DRAM Controller | DRAM management |
| BB-6621 | `dram_ecc_pipeline_clock_crossing` | DRAM Controller | DRAM management |
| BB-6622 | `dram_ecc_pipeline_qos_aware` | DRAM Controller | DRAM management |
| BB-6623 | `dram_ecc_pipeline_low_power` | DRAM Controller | DRAM management |
| BB-6624 | `dram_ecc_pipeline_formally_instrumented` | DRAM Controller | DRAM management |
| BB-6625 | `memory_training_sequencer_single_port` | DRAM Controller | DRAM management |
| BB-6626 | `memory_training_sequencer_dual_port` | DRAM Controller | DRAM management |
| BB-6627 | `memory_training_sequencer_banked` | DRAM Controller | DRAM management |
| BB-6628 | `memory_training_sequencer_interleaved` | DRAM Controller | DRAM management |
| BB-6629 | `memory_training_sequencer_write_back` | DRAM Controller | DRAM management |
| BB-6630 | `memory_training_sequencer_write_through` | DRAM Controller | DRAM management |
| BB-6631 | `memory_training_sequencer_nonblocking` | DRAM Controller | DRAM management |
| BB-6632 | `memory_training_sequencer_pipelined` | DRAM Controller | DRAM management |
| BB-6633 | `memory_training_sequencer_burst_optimized` | DRAM Controller | DRAM management |
| BB-6634 | `memory_training_sequencer_multi_channel` | DRAM Controller | DRAM management |
| BB-6635 | `memory_training_sequencer_ecc_protected` | DRAM Controller | DRAM management |
| BB-6636 | `memory_training_sequencer_scrubbed` | DRAM Controller | DRAM management |
| BB-6637 | `memory_training_sequencer_clock_crossing` | DRAM Controller | DRAM management |
| BB-6638 | `memory_training_sequencer_qos_aware` | DRAM Controller | DRAM management |
| BB-6639 | `memory_training_sequencer_low_power` | DRAM Controller | DRAM management |
| BB-6640 | `memory_training_sequencer_formally_instrumented` | DRAM Controller | DRAM management |
| BB-6641 | `hbm_pseudochannel_router_initiator` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6642 | `hbm_pseudochannel_router_target` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6643 | `hbm_pseudochannel_router_endpoint` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6644 | `hbm_pseudochannel_router_bridge` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6645 | `hbm_pseudochannel_router_router` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6646 | `hbm_pseudochannel_router_packetized` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6647 | `hbm_pseudochannel_router_buffered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6648 | `hbm_pseudochannel_router_dma_attached` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6649 | `hbm_pseudochannel_router_multi_channel` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6650 | `hbm_pseudochannel_router_qos_aware` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6651 | `hbm_pseudochannel_router_timestamped` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6652 | `hbm_pseudochannel_router_clock_crossing` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6653 | `hbm_pseudochannel_router_redundant` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6654 | `hbm_pseudochannel_router_security_filtered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6655 | `hbm_pseudochannel_router_protocol_monitor` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6656 | `hbm_pseudochannel_router_software_configurable` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6657 | `ddr_dfi_adapter_initiator` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6658 | `ddr_dfi_adapter_target` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6659 | `ddr_dfi_adapter_endpoint` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6660 | `ddr_dfi_adapter_bridge` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6661 | `ddr_dfi_adapter_router` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6662 | `ddr_dfi_adapter_packetized` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6663 | `ddr_dfi_adapter_buffered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6664 | `ddr_dfi_adapter_dma_attached` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6665 | `ddr_dfi_adapter_multi_channel` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6666 | `ddr_dfi_adapter_qos_aware` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6667 | `ddr_dfi_adapter_timestamped` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6668 | `ddr_dfi_adapter_clock_crossing` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6669 | `ddr_dfi_adapter_redundant` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6670 | `ddr_dfi_adapter_security_filtered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6671 | `ddr_dfi_adapter_protocol_monitor` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6672 | `ddr_dfi_adapter_software_configurable` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6673 | `write_leveling_controller_initiator` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6674 | `write_leveling_controller_target` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6675 | `write_leveling_controller_endpoint` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6676 | `write_leveling_controller_bridge` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6677 | `write_leveling_controller_router` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6678 | `write_leveling_controller_packetized` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6679 | `write_leveling_controller_buffered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6680 | `write_leveling_controller_dma_attached` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6681 | `write_leveling_controller_multi_channel` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6682 | `write_leveling_controller_qos_aware` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6683 | `write_leveling_controller_timestamped` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6684 | `write_leveling_controller_clock_crossing` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6685 | `write_leveling_controller_redundant` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6686 | `write_leveling_controller_security_filtered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6687 | `write_leveling_controller_protocol_monitor` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6688 | `write_leveling_controller_software_configurable` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6689 | `read_gate_training_controller_initiator` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6690 | `read_gate_training_controller_target` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6691 | `read_gate_training_controller_endpoint` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6692 | `read_gate_training_controller_bridge` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6693 | `read_gate_training_controller_router` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6694 | `read_gate_training_controller_packetized` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6695 | `read_gate_training_controller_buffered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6696 | `read_gate_training_controller_dma_attached` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6697 | `read_gate_training_controller_multi_channel` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6698 | `read_gate_training_controller_qos_aware` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6699 | `read_gate_training_controller_timestamped` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6700 | `read_gate_training_controller_clock_crossing` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6701 | `read_gate_training_controller_redundant` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6702 | `read_gate_training_controller_security_filtered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6703 | `read_gate_training_controller_protocol_monitor` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6704 | `read_gate_training_controller_software_configurable` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6705 | `per_bit_deskew_controller_initiator` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6706 | `per_bit_deskew_controller_target` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6707 | `per_bit_deskew_controller_endpoint` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6708 | `per_bit_deskew_controller_bridge` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6709 | `per_bit_deskew_controller_router` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6710 | `per_bit_deskew_controller_packetized` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6711 | `per_bit_deskew_controller_buffered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6712 | `per_bit_deskew_controller_dma_attached` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6713 | `per_bit_deskew_controller_multi_channel` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6714 | `per_bit_deskew_controller_qos_aware` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6715 | `per_bit_deskew_controller_timestamped` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6716 | `per_bit_deskew_controller_clock_crossing` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6717 | `per_bit_deskew_controller_redundant` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6718 | `per_bit_deskew_controller_security_filtered` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6719 | `per_bit_deskew_controller_protocol_monitor` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6720 | `per_bit_deskew_controller_software_configurable` | HBM and DDR Interface | Memory PHY adaptation |
| BB-6721 | `nand_flash_translation_layer_single_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6722 | `nand_flash_translation_layer_dual_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6723 | `nand_flash_translation_layer_banked` | Nonvolatile Memory | Emerging and flash memory |
| BB-6724 | `nand_flash_translation_layer_interleaved` | Nonvolatile Memory | Emerging and flash memory |
| BB-6725 | `nand_flash_translation_layer_write_back` | Nonvolatile Memory | Emerging and flash memory |
| BB-6726 | `nand_flash_translation_layer_write_through` | Nonvolatile Memory | Emerging and flash memory |
| BB-6727 | `nand_flash_translation_layer_nonblocking` | Nonvolatile Memory | Emerging and flash memory |
| BB-6728 | `nand_flash_translation_layer_pipelined` | Nonvolatile Memory | Emerging and flash memory |
| BB-6729 | `nand_flash_translation_layer_burst_optimized` | Nonvolatile Memory | Emerging and flash memory |
| BB-6730 | `nand_flash_translation_layer_multi_channel` | Nonvolatile Memory | Emerging and flash memory |
| BB-6731 | `nand_flash_translation_layer_ecc_protected` | Nonvolatile Memory | Emerging and flash memory |
| BB-6732 | `nand_flash_translation_layer_scrubbed` | Nonvolatile Memory | Emerging and flash memory |
| BB-6733 | `nand_flash_translation_layer_clock_crossing` | Nonvolatile Memory | Emerging and flash memory |
| BB-6734 | `nand_flash_translation_layer_qos_aware` | Nonvolatile Memory | Emerging and flash memory |
| BB-6735 | `nand_flash_translation_layer_low_power` | Nonvolatile Memory | Emerging and flash memory |
| BB-6736 | `nand_flash_translation_layer_formally_instrumented` | Nonvolatile Memory | Emerging and flash memory |
| BB-6737 | `nor_execute_in_place_cache_single_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6738 | `nor_execute_in_place_cache_dual_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6739 | `nor_execute_in_place_cache_banked` | Nonvolatile Memory | Emerging and flash memory |
| BB-6740 | `nor_execute_in_place_cache_interleaved` | Nonvolatile Memory | Emerging and flash memory |
| BB-6741 | `nor_execute_in_place_cache_write_back` | Nonvolatile Memory | Emerging and flash memory |
| BB-6742 | `nor_execute_in_place_cache_write_through` | Nonvolatile Memory | Emerging and flash memory |
| BB-6743 | `nor_execute_in_place_cache_nonblocking` | Nonvolatile Memory | Emerging and flash memory |
| BB-6744 | `nor_execute_in_place_cache_pipelined` | Nonvolatile Memory | Emerging and flash memory |
| BB-6745 | `nor_execute_in_place_cache_burst_optimized` | Nonvolatile Memory | Emerging and flash memory |
| BB-6746 | `nor_execute_in_place_cache_multi_channel` | Nonvolatile Memory | Emerging and flash memory |
| BB-6747 | `nor_execute_in_place_cache_ecc_protected` | Nonvolatile Memory | Emerging and flash memory |
| BB-6748 | `nor_execute_in_place_cache_scrubbed` | Nonvolatile Memory | Emerging and flash memory |
| BB-6749 | `nor_execute_in_place_cache_clock_crossing` | Nonvolatile Memory | Emerging and flash memory |
| BB-6750 | `nor_execute_in_place_cache_qos_aware` | Nonvolatile Memory | Emerging and flash memory |
| BB-6751 | `nor_execute_in_place_cache_low_power` | Nonvolatile Memory | Emerging and flash memory |
| BB-6752 | `nor_execute_in_place_cache_formally_instrumented` | Nonvolatile Memory | Emerging and flash memory |
| BB-6753 | `mram_controller_single_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6754 | `mram_controller_dual_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6755 | `mram_controller_banked` | Nonvolatile Memory | Emerging and flash memory |
| BB-6756 | `mram_controller_interleaved` | Nonvolatile Memory | Emerging and flash memory |
| BB-6757 | `mram_controller_write_back` | Nonvolatile Memory | Emerging and flash memory |
| BB-6758 | `mram_controller_write_through` | Nonvolatile Memory | Emerging and flash memory |
| BB-6759 | `mram_controller_nonblocking` | Nonvolatile Memory | Emerging and flash memory |
| BB-6760 | `mram_controller_pipelined` | Nonvolatile Memory | Emerging and flash memory |
| BB-6761 | `mram_controller_burst_optimized` | Nonvolatile Memory | Emerging and flash memory |
| BB-6762 | `mram_controller_multi_channel` | Nonvolatile Memory | Emerging and flash memory |
| BB-6763 | `mram_controller_ecc_protected` | Nonvolatile Memory | Emerging and flash memory |
| BB-6764 | `mram_controller_scrubbed` | Nonvolatile Memory | Emerging and flash memory |
| BB-6765 | `mram_controller_clock_crossing` | Nonvolatile Memory | Emerging and flash memory |
| BB-6766 | `mram_controller_qos_aware` | Nonvolatile Memory | Emerging and flash memory |
| BB-6767 | `mram_controller_low_power` | Nonvolatile Memory | Emerging and flash memory |
| BB-6768 | `mram_controller_formally_instrumented` | Nonvolatile Memory | Emerging and flash memory |
| BB-6769 | `fram_controller_single_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6770 | `fram_controller_dual_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6771 | `fram_controller_banked` | Nonvolatile Memory | Emerging and flash memory |
| BB-6772 | `fram_controller_interleaved` | Nonvolatile Memory | Emerging and flash memory |
| BB-6773 | `fram_controller_write_back` | Nonvolatile Memory | Emerging and flash memory |
| BB-6774 | `fram_controller_write_through` | Nonvolatile Memory | Emerging and flash memory |
| BB-6775 | `fram_controller_nonblocking` | Nonvolatile Memory | Emerging and flash memory |
| BB-6776 | `fram_controller_pipelined` | Nonvolatile Memory | Emerging and flash memory |
| BB-6777 | `fram_controller_burst_optimized` | Nonvolatile Memory | Emerging and flash memory |
| BB-6778 | `fram_controller_multi_channel` | Nonvolatile Memory | Emerging and flash memory |
| BB-6779 | `fram_controller_ecc_protected` | Nonvolatile Memory | Emerging and flash memory |
| BB-6780 | `fram_controller_scrubbed` | Nonvolatile Memory | Emerging and flash memory |
| BB-6781 | `fram_controller_clock_crossing` | Nonvolatile Memory | Emerging and flash memory |
| BB-6782 | `fram_controller_qos_aware` | Nonvolatile Memory | Emerging and flash memory |
| BB-6783 | `fram_controller_low_power` | Nonvolatile Memory | Emerging and flash memory |
| BB-6784 | `fram_controller_formally_instrumented` | Nonvolatile Memory | Emerging and flash memory |
| BB-6785 | `resistive_memory_controller_single_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6786 | `resistive_memory_controller_dual_port` | Nonvolatile Memory | Emerging and flash memory |
| BB-6787 | `resistive_memory_controller_banked` | Nonvolatile Memory | Emerging and flash memory |
| BB-6788 | `resistive_memory_controller_interleaved` | Nonvolatile Memory | Emerging and flash memory |
| BB-6789 | `resistive_memory_controller_write_back` | Nonvolatile Memory | Emerging and flash memory |
| BB-6790 | `resistive_memory_controller_write_through` | Nonvolatile Memory | Emerging and flash memory |
| BB-6791 | `resistive_memory_controller_nonblocking` | Nonvolatile Memory | Emerging and flash memory |
| BB-6792 | `resistive_memory_controller_pipelined` | Nonvolatile Memory | Emerging and flash memory |
| BB-6793 | `resistive_memory_controller_burst_optimized` | Nonvolatile Memory | Emerging and flash memory |
| BB-6794 | `resistive_memory_controller_multi_channel` | Nonvolatile Memory | Emerging and flash memory |
| BB-6795 | `resistive_memory_controller_ecc_protected` | Nonvolatile Memory | Emerging and flash memory |
| BB-6796 | `resistive_memory_controller_scrubbed` | Nonvolatile Memory | Emerging and flash memory |
| BB-6797 | `resistive_memory_controller_clock_crossing` | Nonvolatile Memory | Emerging and flash memory |
| BB-6798 | `resistive_memory_controller_qos_aware` | Nonvolatile Memory | Emerging and flash memory |
| BB-6799 | `resistive_memory_controller_low_power` | Nonvolatile Memory | Emerging and flash memory |
| BB-6800 | `resistive_memory_controller_formally_instrumented` | Nonvolatile Memory | Emerging and flash memory |
| BB-6801 | `axi_atomic_transaction_unit_initiator` | Advanced AXI | AXI services |
| BB-6802 | `axi_atomic_transaction_unit_target` | Advanced AXI | AXI services |
| BB-6803 | `axi_atomic_transaction_unit_endpoint` | Advanced AXI | AXI services |
| BB-6804 | `axi_atomic_transaction_unit_bridge` | Advanced AXI | AXI services |
| BB-6805 | `axi_atomic_transaction_unit_router` | Advanced AXI | AXI services |
| BB-6806 | `axi_atomic_transaction_unit_packetized` | Advanced AXI | AXI services |
| BB-6807 | `axi_atomic_transaction_unit_buffered` | Advanced AXI | AXI services |
| BB-6808 | `axi_atomic_transaction_unit_dma_attached` | Advanced AXI | AXI services |
| BB-6809 | `axi_atomic_transaction_unit_multi_channel` | Advanced AXI | AXI services |
| BB-6810 | `axi_atomic_transaction_unit_qos_aware` | Advanced AXI | AXI services |
| BB-6811 | `axi_atomic_transaction_unit_timestamped` | Advanced AXI | AXI services |
| BB-6812 | `axi_atomic_transaction_unit_clock_crossing` | Advanced AXI | AXI services |
| BB-6813 | `axi_atomic_transaction_unit_redundant` | Advanced AXI | AXI services |
| BB-6814 | `axi_atomic_transaction_unit_security_filtered` | Advanced AXI | AXI services |
| BB-6815 | `axi_atomic_transaction_unit_protocol_monitor` | Advanced AXI | AXI services |
| BB-6816 | `axi_atomic_transaction_unit_software_configurable` | Advanced AXI | AXI services |
| BB-6817 | `axi_cache_attribute_adapter_initiator` | Advanced AXI | AXI services |
| BB-6818 | `axi_cache_attribute_adapter_target` | Advanced AXI | AXI services |
| BB-6819 | `axi_cache_attribute_adapter_endpoint` | Advanced AXI | AXI services |
| BB-6820 | `axi_cache_attribute_adapter_bridge` | Advanced AXI | AXI services |
| BB-6821 | `axi_cache_attribute_adapter_router` | Advanced AXI | AXI services |
| BB-6822 | `axi_cache_attribute_adapter_packetized` | Advanced AXI | AXI services |
| BB-6823 | `axi_cache_attribute_adapter_buffered` | Advanced AXI | AXI services |
| BB-6824 | `axi_cache_attribute_adapter_dma_attached` | Advanced AXI | AXI services |
| BB-6825 | `axi_cache_attribute_adapter_multi_channel` | Advanced AXI | AXI services |
| BB-6826 | `axi_cache_attribute_adapter_qos_aware` | Advanced AXI | AXI services |
| BB-6827 | `axi_cache_attribute_adapter_timestamped` | Advanced AXI | AXI services |
| BB-6828 | `axi_cache_attribute_adapter_clock_crossing` | Advanced AXI | AXI services |
| BB-6829 | `axi_cache_attribute_adapter_redundant` | Advanced AXI | AXI services |
| BB-6830 | `axi_cache_attribute_adapter_security_filtered` | Advanced AXI | AXI services |
| BB-6831 | `axi_cache_attribute_adapter_protocol_monitor` | Advanced AXI | AXI services |
| BB-6832 | `axi_cache_attribute_adapter_software_configurable` | Advanced AXI | AXI services |
| BB-6833 | `axi_qos_regulator_initiator` | Advanced AXI | AXI services |
| BB-6834 | `axi_qos_regulator_target` | Advanced AXI | AXI services |
| BB-6835 | `axi_qos_regulator_endpoint` | Advanced AXI | AXI services |
| BB-6836 | `axi_qos_regulator_bridge` | Advanced AXI | AXI services |
| BB-6837 | `axi_qos_regulator_router` | Advanced AXI | AXI services |
| BB-6838 | `axi_qos_regulator_packetized` | Advanced AXI | AXI services |
| BB-6839 | `axi_qos_regulator_buffered` | Advanced AXI | AXI services |
| BB-6840 | `axi_qos_regulator_dma_attached` | Advanced AXI | AXI services |
| BB-6841 | `axi_qos_regulator_multi_channel` | Advanced AXI | AXI services |
| BB-6842 | `axi_qos_regulator_qos_aware` | Advanced AXI | AXI services |
| BB-6843 | `axi_qos_regulator_timestamped` | Advanced AXI | AXI services |
| BB-6844 | `axi_qos_regulator_clock_crossing` | Advanced AXI | AXI services |
| BB-6845 | `axi_qos_regulator_redundant` | Advanced AXI | AXI services |
| BB-6846 | `axi_qos_regulator_security_filtered` | Advanced AXI | AXI services |
| BB-6847 | `axi_qos_regulator_protocol_monitor` | Advanced AXI | AXI services |
| BB-6848 | `axi_qos_regulator_software_configurable` | Advanced AXI | AXI services |
| BB-6849 | `axi_firewall_initiator` | Advanced AXI | AXI services |
| BB-6850 | `axi_firewall_target` | Advanced AXI | AXI services |
| BB-6851 | `axi_firewall_endpoint` | Advanced AXI | AXI services |
| BB-6852 | `axi_firewall_bridge` | Advanced AXI | AXI services |
| BB-6853 | `axi_firewall_router` | Advanced AXI | AXI services |
| BB-6854 | `axi_firewall_packetized` | Advanced AXI | AXI services |
| BB-6855 | `axi_firewall_buffered` | Advanced AXI | AXI services |
| BB-6856 | `axi_firewall_dma_attached` | Advanced AXI | AXI services |
| BB-6857 | `axi_firewall_multi_channel` | Advanced AXI | AXI services |
| BB-6858 | `axi_firewall_qos_aware` | Advanced AXI | AXI services |
| BB-6859 | `axi_firewall_timestamped` | Advanced AXI | AXI services |
| BB-6860 | `axi_firewall_clock_crossing` | Advanced AXI | AXI services |
| BB-6861 | `axi_firewall_redundant` | Advanced AXI | AXI services |
| BB-6862 | `axi_firewall_security_filtered` | Advanced AXI | AXI services |
| BB-6863 | `axi_firewall_protocol_monitor` | Advanced AXI | AXI services |
| BB-6864 | `axi_firewall_software_configurable` | Advanced AXI | AXI services |
| BB-6865 | `axi_transaction_trace_initiator` | Advanced AXI | AXI services |
| BB-6866 | `axi_transaction_trace_target` | Advanced AXI | AXI services |
| BB-6867 | `axi_transaction_trace_endpoint` | Advanced AXI | AXI services |
| BB-6868 | `axi_transaction_trace_bridge` | Advanced AXI | AXI services |
| BB-6869 | `axi_transaction_trace_router` | Advanced AXI | AXI services |
| BB-6870 | `axi_transaction_trace_packetized` | Advanced AXI | AXI services |
| BB-6871 | `axi_transaction_trace_buffered` | Advanced AXI | AXI services |
| BB-6872 | `axi_transaction_trace_dma_attached` | Advanced AXI | AXI services |
| BB-6873 | `axi_transaction_trace_multi_channel` | Advanced AXI | AXI services |
| BB-6874 | `axi_transaction_trace_qos_aware` | Advanced AXI | AXI services |
| BB-6875 | `axi_transaction_trace_timestamped` | Advanced AXI | AXI services |
| BB-6876 | `axi_transaction_trace_clock_crossing` | Advanced AXI | AXI services |
| BB-6877 | `axi_transaction_trace_redundant` | Advanced AXI | AXI services |
| BB-6878 | `axi_transaction_trace_security_filtered` | Advanced AXI | AXI services |
| BB-6879 | `axi_transaction_trace_protocol_monitor` | Advanced AXI | AXI services |
| BB-6880 | `axi_transaction_trace_software_configurable` | Advanced AXI | AXI services |
| BB-6881 | `ace_snoop_controller_initiator` | Coherent AMBA | ACE and CHI |
| BB-6882 | `ace_snoop_controller_target` | Coherent AMBA | ACE and CHI |
| BB-6883 | `ace_snoop_controller_endpoint` | Coherent AMBA | ACE and CHI |
| BB-6884 | `ace_snoop_controller_bridge` | Coherent AMBA | ACE and CHI |
| BB-6885 | `ace_snoop_controller_router` | Coherent AMBA | ACE and CHI |
| BB-6886 | `ace_snoop_controller_packetized` | Coherent AMBA | ACE and CHI |
| BB-6887 | `ace_snoop_controller_buffered` | Coherent AMBA | ACE and CHI |
| BB-6888 | `ace_snoop_controller_dma_attached` | Coherent AMBA | ACE and CHI |
| BB-6889 | `ace_snoop_controller_multi_channel` | Coherent AMBA | ACE and CHI |
| BB-6890 | `ace_snoop_controller_qos_aware` | Coherent AMBA | ACE and CHI |
| BB-6891 | `ace_snoop_controller_timestamped` | Coherent AMBA | ACE and CHI |
| BB-6892 | `ace_snoop_controller_clock_crossing` | Coherent AMBA | ACE and CHI |
| BB-6893 | `ace_snoop_controller_redundant` | Coherent AMBA | ACE and CHI |
| BB-6894 | `ace_snoop_controller_security_filtered` | Coherent AMBA | ACE and CHI |
| BB-6895 | `ace_snoop_controller_protocol_monitor` | Coherent AMBA | ACE and CHI |
| BB-6896 | `ace_snoop_controller_software_configurable` | Coherent AMBA | ACE and CHI |
| BB-6897 | `ace_lite_bridge_initiator` | Coherent AMBA | ACE and CHI |
| BB-6898 | `ace_lite_bridge_target` | Coherent AMBA | ACE and CHI |
| BB-6899 | `ace_lite_bridge_endpoint` | Coherent AMBA | ACE and CHI |
| BB-6900 | `ace_lite_bridge_bridge` | Coherent AMBA | ACE and CHI |
| BB-6901 | `ace_lite_bridge_router` | Coherent AMBA | ACE and CHI |
| BB-6902 | `ace_lite_bridge_packetized` | Coherent AMBA | ACE and CHI |
| BB-6903 | `ace_lite_bridge_buffered` | Coherent AMBA | ACE and CHI |
| BB-6904 | `ace_lite_bridge_dma_attached` | Coherent AMBA | ACE and CHI |
| BB-6905 | `ace_lite_bridge_multi_channel` | Coherent AMBA | ACE and CHI |
| BB-6906 | `ace_lite_bridge_qos_aware` | Coherent AMBA | ACE and CHI |
| BB-6907 | `ace_lite_bridge_timestamped` | Coherent AMBA | ACE and CHI |
| BB-6908 | `ace_lite_bridge_clock_crossing` | Coherent AMBA | ACE and CHI |
| BB-6909 | `ace_lite_bridge_redundant` | Coherent AMBA | ACE and CHI |
| BB-6910 | `ace_lite_bridge_security_filtered` | Coherent AMBA | ACE and CHI |
| BB-6911 | `ace_lite_bridge_protocol_monitor` | Coherent AMBA | ACE and CHI |
| BB-6912 | `ace_lite_bridge_software_configurable` | Coherent AMBA | ACE and CHI |
| BB-6913 | `chi_request_node_initiator` | Coherent AMBA | ACE and CHI |
| BB-6914 | `chi_request_node_target` | Coherent AMBA | ACE and CHI |
| BB-6915 | `chi_request_node_endpoint` | Coherent AMBA | ACE and CHI |
| BB-6916 | `chi_request_node_bridge` | Coherent AMBA | ACE and CHI |
| BB-6917 | `chi_request_node_router` | Coherent AMBA | ACE and CHI |
| BB-6918 | `chi_request_node_packetized` | Coherent AMBA | ACE and CHI |
| BB-6919 | `chi_request_node_buffered` | Coherent AMBA | ACE and CHI |
| BB-6920 | `chi_request_node_dma_attached` | Coherent AMBA | ACE and CHI |
| BB-6921 | `chi_request_node_multi_channel` | Coherent AMBA | ACE and CHI |
| BB-6922 | `chi_request_node_qos_aware` | Coherent AMBA | ACE and CHI |
| BB-6923 | `chi_request_node_timestamped` | Coherent AMBA | ACE and CHI |
| BB-6924 | `chi_request_node_clock_crossing` | Coherent AMBA | ACE and CHI |
| BB-6925 | `chi_request_node_redundant` | Coherent AMBA | ACE and CHI |
| BB-6926 | `chi_request_node_security_filtered` | Coherent AMBA | ACE and CHI |
| BB-6927 | `chi_request_node_protocol_monitor` | Coherent AMBA | ACE and CHI |
| BB-6928 | `chi_request_node_software_configurable` | Coherent AMBA | ACE and CHI |
| BB-6929 | `chi_home_node_initiator` | Coherent AMBA | ACE and CHI |
| BB-6930 | `chi_home_node_target` | Coherent AMBA | ACE and CHI |
| BB-6931 | `chi_home_node_endpoint` | Coherent AMBA | ACE and CHI |
| BB-6932 | `chi_home_node_bridge` | Coherent AMBA | ACE and CHI |
| BB-6933 | `chi_home_node_router` | Coherent AMBA | ACE and CHI |
| BB-6934 | `chi_home_node_packetized` | Coherent AMBA | ACE and CHI |
| BB-6935 | `chi_home_node_buffered` | Coherent AMBA | ACE and CHI |
| BB-6936 | `chi_home_node_dma_attached` | Coherent AMBA | ACE and CHI |
| BB-6937 | `chi_home_node_multi_channel` | Coherent AMBA | ACE and CHI |
| BB-6938 | `chi_home_node_qos_aware` | Coherent AMBA | ACE and CHI |
| BB-6939 | `chi_home_node_timestamped` | Coherent AMBA | ACE and CHI |
| BB-6940 | `chi_home_node_clock_crossing` | Coherent AMBA | ACE and CHI |
| BB-6941 | `chi_home_node_redundant` | Coherent AMBA | ACE and CHI |
| BB-6942 | `chi_home_node_security_filtered` | Coherent AMBA | ACE and CHI |
| BB-6943 | `chi_home_node_protocol_monitor` | Coherent AMBA | ACE and CHI |
| BB-6944 | `chi_home_node_software_configurable` | Coherent AMBA | ACE and CHI |
| BB-6945 | `chi_snoop_filter_initiator` | Coherent AMBA | ACE and CHI |
| BB-6946 | `chi_snoop_filter_target` | Coherent AMBA | ACE and CHI |
| BB-6947 | `chi_snoop_filter_endpoint` | Coherent AMBA | ACE and CHI |
| BB-6948 | `chi_snoop_filter_bridge` | Coherent AMBA | ACE and CHI |
| BB-6949 | `chi_snoop_filter_router` | Coherent AMBA | ACE and CHI |
| BB-6950 | `chi_snoop_filter_packetized` | Coherent AMBA | ACE and CHI |
| BB-6951 | `chi_snoop_filter_buffered` | Coherent AMBA | ACE and CHI |
| BB-6952 | `chi_snoop_filter_dma_attached` | Coherent AMBA | ACE and CHI |
| BB-6953 | `chi_snoop_filter_multi_channel` | Coherent AMBA | ACE and CHI |
| BB-6954 | `chi_snoop_filter_qos_aware` | Coherent AMBA | ACE and CHI |
| BB-6955 | `chi_snoop_filter_timestamped` | Coherent AMBA | ACE and CHI |
| BB-6956 | `chi_snoop_filter_clock_crossing` | Coherent AMBA | ACE and CHI |
| BB-6957 | `chi_snoop_filter_redundant` | Coherent AMBA | ACE and CHI |
| BB-6958 | `chi_snoop_filter_security_filtered` | Coherent AMBA | ACE and CHI |
| BB-6959 | `chi_snoop_filter_protocol_monitor` | Coherent AMBA | ACE and CHI |
| BB-6960 | `chi_snoop_filter_software_configurable` | Coherent AMBA | ACE and CHI |
| BB-6961 | `adaptive_mesh_router_initiator` | Advanced NoC | Network-on-chip architectures |
| BB-6962 | `adaptive_mesh_router_target` | Advanced NoC | Network-on-chip architectures |
| BB-6963 | `adaptive_mesh_router_endpoint` | Advanced NoC | Network-on-chip architectures |
| BB-6964 | `adaptive_mesh_router_bridge` | Advanced NoC | Network-on-chip architectures |
| BB-6965 | `adaptive_mesh_router_router` | Advanced NoC | Network-on-chip architectures |
| BB-6966 | `adaptive_mesh_router_packetized` | Advanced NoC | Network-on-chip architectures |
| BB-6967 | `adaptive_mesh_router_buffered` | Advanced NoC | Network-on-chip architectures |
| BB-6968 | `adaptive_mesh_router_dma_attached` | Advanced NoC | Network-on-chip architectures |
| BB-6969 | `adaptive_mesh_router_multi_channel` | Advanced NoC | Network-on-chip architectures |
| BB-6970 | `adaptive_mesh_router_qos_aware` | Advanced NoC | Network-on-chip architectures |
| BB-6971 | `adaptive_mesh_router_timestamped` | Advanced NoC | Network-on-chip architectures |
| BB-6972 | `adaptive_mesh_router_clock_crossing` | Advanced NoC | Network-on-chip architectures |
| BB-6973 | `adaptive_mesh_router_redundant` | Advanced NoC | Network-on-chip architectures |
| BB-6974 | `adaptive_mesh_router_security_filtered` | Advanced NoC | Network-on-chip architectures |
| BB-6975 | `adaptive_mesh_router_protocol_monitor` | Advanced NoC | Network-on-chip architectures |
| BB-6976 | `adaptive_mesh_router_software_configurable` | Advanced NoC | Network-on-chip architectures |
| BB-6977 | `torus_router_initiator` | Advanced NoC | Network-on-chip architectures |
| BB-6978 | `torus_router_target` | Advanced NoC | Network-on-chip architectures |
| BB-6979 | `torus_router_endpoint` | Advanced NoC | Network-on-chip architectures |
| BB-6980 | `torus_router_bridge` | Advanced NoC | Network-on-chip architectures |
| BB-6981 | `torus_router_router` | Advanced NoC | Network-on-chip architectures |
| BB-6982 | `torus_router_packetized` | Advanced NoC | Network-on-chip architectures |
| BB-6983 | `torus_router_buffered` | Advanced NoC | Network-on-chip architectures |
| BB-6984 | `torus_router_dma_attached` | Advanced NoC | Network-on-chip architectures |
| BB-6985 | `torus_router_multi_channel` | Advanced NoC | Network-on-chip architectures |
| BB-6986 | `torus_router_qos_aware` | Advanced NoC | Network-on-chip architectures |
| BB-6987 | `torus_router_timestamped` | Advanced NoC | Network-on-chip architectures |
| BB-6988 | `torus_router_clock_crossing` | Advanced NoC | Network-on-chip architectures |
| BB-6989 | `torus_router_redundant` | Advanced NoC | Network-on-chip architectures |
| BB-6990 | `torus_router_security_filtered` | Advanced NoC | Network-on-chip architectures |
| BB-6991 | `torus_router_protocol_monitor` | Advanced NoC | Network-on-chip architectures |
| BB-6992 | `torus_router_software_configurable` | Advanced NoC | Network-on-chip architectures |
| BB-6993 | `hierarchical_noc_gateway_initiator` | Advanced NoC | Network-on-chip architectures |
| BB-6994 | `hierarchical_noc_gateway_target` | Advanced NoC | Network-on-chip architectures |
| BB-6995 | `hierarchical_noc_gateway_endpoint` | Advanced NoC | Network-on-chip architectures |
| BB-6996 | `hierarchical_noc_gateway_bridge` | Advanced NoC | Network-on-chip architectures |
| BB-6997 | `hierarchical_noc_gateway_router` | Advanced NoC | Network-on-chip architectures |
| BB-6998 | `hierarchical_noc_gateway_packetized` | Advanced NoC | Network-on-chip architectures |
| BB-6999 | `hierarchical_noc_gateway_buffered` | Advanced NoC | Network-on-chip architectures |
| BB-7000 | `hierarchical_noc_gateway_dma_attached` | Advanced NoC | Network-on-chip architectures |
| BB-7001 | `hierarchical_noc_gateway_multi_channel` | Advanced NoC | Network-on-chip architectures |
| BB-7002 | `hierarchical_noc_gateway_qos_aware` | Advanced NoC | Network-on-chip architectures |
| BB-7003 | `hierarchical_noc_gateway_timestamped` | Advanced NoC | Network-on-chip architectures |
| BB-7004 | `hierarchical_noc_gateway_clock_crossing` | Advanced NoC | Network-on-chip architectures |
| BB-7005 | `hierarchical_noc_gateway_redundant` | Advanced NoC | Network-on-chip architectures |
| BB-7006 | `hierarchical_noc_gateway_security_filtered` | Advanced NoC | Network-on-chip architectures |
| BB-7007 | `hierarchical_noc_gateway_protocol_monitor` | Advanced NoC | Network-on-chip architectures |
| BB-7008 | `hierarchical_noc_gateway_software_configurable` | Advanced NoC | Network-on-chip architectures |
| BB-7009 | `deadlock_avoidance_unit_initiator` | Advanced NoC | Network-on-chip architectures |
| BB-7010 | `deadlock_avoidance_unit_target` | Advanced NoC | Network-on-chip architectures |
| BB-7011 | `deadlock_avoidance_unit_endpoint` | Advanced NoC | Network-on-chip architectures |
| BB-7012 | `deadlock_avoidance_unit_bridge` | Advanced NoC | Network-on-chip architectures |
| BB-7013 | `deadlock_avoidance_unit_router` | Advanced NoC | Network-on-chip architectures |
| BB-7014 | `deadlock_avoidance_unit_packetized` | Advanced NoC | Network-on-chip architectures |
| BB-7015 | `deadlock_avoidance_unit_buffered` | Advanced NoC | Network-on-chip architectures |
| BB-7016 | `deadlock_avoidance_unit_dma_attached` | Advanced NoC | Network-on-chip architectures |
| BB-7017 | `deadlock_avoidance_unit_multi_channel` | Advanced NoC | Network-on-chip architectures |
| BB-7018 | `deadlock_avoidance_unit_qos_aware` | Advanced NoC | Network-on-chip architectures |
| BB-7019 | `deadlock_avoidance_unit_timestamped` | Advanced NoC | Network-on-chip architectures |
| BB-7020 | `deadlock_avoidance_unit_clock_crossing` | Advanced NoC | Network-on-chip architectures |
| BB-7021 | `deadlock_avoidance_unit_redundant` | Advanced NoC | Network-on-chip architectures |
| BB-7022 | `deadlock_avoidance_unit_security_filtered` | Advanced NoC | Network-on-chip architectures |
| BB-7023 | `deadlock_avoidance_unit_protocol_monitor` | Advanced NoC | Network-on-chip architectures |
| BB-7024 | `deadlock_avoidance_unit_software_configurable` | Advanced NoC | Network-on-chip architectures |
| BB-7025 | `noc_congestion_monitor_initiator` | Advanced NoC | Network-on-chip architectures |
| BB-7026 | `noc_congestion_monitor_target` | Advanced NoC | Network-on-chip architectures |
| BB-7027 | `noc_congestion_monitor_endpoint` | Advanced NoC | Network-on-chip architectures |
| BB-7028 | `noc_congestion_monitor_bridge` | Advanced NoC | Network-on-chip architectures |
| BB-7029 | `noc_congestion_monitor_router` | Advanced NoC | Network-on-chip architectures |
| BB-7030 | `noc_congestion_monitor_packetized` | Advanced NoC | Network-on-chip architectures |
| BB-7031 | `noc_congestion_monitor_buffered` | Advanced NoC | Network-on-chip architectures |
| BB-7032 | `noc_congestion_monitor_dma_attached` | Advanced NoC | Network-on-chip architectures |
| BB-7033 | `noc_congestion_monitor_multi_channel` | Advanced NoC | Network-on-chip architectures |
| BB-7034 | `noc_congestion_monitor_qos_aware` | Advanced NoC | Network-on-chip architectures |
| BB-7035 | `noc_congestion_monitor_timestamped` | Advanced NoC | Network-on-chip architectures |
| BB-7036 | `noc_congestion_monitor_clock_crossing` | Advanced NoC | Network-on-chip architectures |
| BB-7037 | `noc_congestion_monitor_redundant` | Advanced NoC | Network-on-chip architectures |
| BB-7038 | `noc_congestion_monitor_security_filtered` | Advanced NoC | Network-on-chip architectures |
| BB-7039 | `noc_congestion_monitor_protocol_monitor` | Advanced NoC | Network-on-chip architectures |
| BB-7040 | `noc_congestion_monitor_software_configurable` | Advanced NoC | Network-on-chip architectures |
| BB-7041 | `pcie_atomic_ops_engine_initiator` | Advanced PCI Express | PCIe optional services |
| BB-7042 | `pcie_atomic_ops_engine_target` | Advanced PCI Express | PCIe optional services |
| BB-7043 | `pcie_atomic_ops_engine_endpoint` | Advanced PCI Express | PCIe optional services |
| BB-7044 | `pcie_atomic_ops_engine_bridge` | Advanced PCI Express | PCIe optional services |
| BB-7045 | `pcie_atomic_ops_engine_router` | Advanced PCI Express | PCIe optional services |
| BB-7046 | `pcie_atomic_ops_engine_packetized` | Advanced PCI Express | PCIe optional services |
| BB-7047 | `pcie_atomic_ops_engine_buffered` | Advanced PCI Express | PCIe optional services |
| BB-7048 | `pcie_atomic_ops_engine_dma_attached` | Advanced PCI Express | PCIe optional services |
| BB-7049 | `pcie_atomic_ops_engine_multi_channel` | Advanced PCI Express | PCIe optional services |
| BB-7050 | `pcie_atomic_ops_engine_qos_aware` | Advanced PCI Express | PCIe optional services |
| BB-7051 | `pcie_atomic_ops_engine_timestamped` | Advanced PCI Express | PCIe optional services |
| BB-7052 | `pcie_atomic_ops_engine_clock_crossing` | Advanced PCI Express | PCIe optional services |
| BB-7053 | `pcie_atomic_ops_engine_redundant` | Advanced PCI Express | PCIe optional services |
| BB-7054 | `pcie_atomic_ops_engine_security_filtered` | Advanced PCI Express | PCIe optional services |
| BB-7055 | `pcie_atomic_ops_engine_protocol_monitor` | Advanced PCI Express | PCIe optional services |
| BB-7056 | `pcie_atomic_ops_engine_software_configurable` | Advanced PCI Express | PCIe optional services |
| BB-7057 | `pcie_ats_controller_initiator` | Advanced PCI Express | PCIe optional services |
| BB-7058 | `pcie_ats_controller_target` | Advanced PCI Express | PCIe optional services |
| BB-7059 | `pcie_ats_controller_endpoint` | Advanced PCI Express | PCIe optional services |
| BB-7060 | `pcie_ats_controller_bridge` | Advanced PCI Express | PCIe optional services |
| BB-7061 | `pcie_ats_controller_router` | Advanced PCI Express | PCIe optional services |
| BB-7062 | `pcie_ats_controller_packetized` | Advanced PCI Express | PCIe optional services |
| BB-7063 | `pcie_ats_controller_buffered` | Advanced PCI Express | PCIe optional services |
| BB-7064 | `pcie_ats_controller_dma_attached` | Advanced PCI Express | PCIe optional services |
| BB-7065 | `pcie_ats_controller_multi_channel` | Advanced PCI Express | PCIe optional services |
| BB-7066 | `pcie_ats_controller_qos_aware` | Advanced PCI Express | PCIe optional services |
| BB-7067 | `pcie_ats_controller_timestamped` | Advanced PCI Express | PCIe optional services |
| BB-7068 | `pcie_ats_controller_clock_crossing` | Advanced PCI Express | PCIe optional services |
| BB-7069 | `pcie_ats_controller_redundant` | Advanced PCI Express | PCIe optional services |
| BB-7070 | `pcie_ats_controller_security_filtered` | Advanced PCI Express | PCIe optional services |
| BB-7071 | `pcie_ats_controller_protocol_monitor` | Advanced PCI Express | PCIe optional services |
| BB-7072 | `pcie_ats_controller_software_configurable` | Advanced PCI Express | PCIe optional services |
| BB-7073 | `pcie_pri_controller_initiator` | Advanced PCI Express | PCIe optional services |
| BB-7074 | `pcie_pri_controller_target` | Advanced PCI Express | PCIe optional services |
| BB-7075 | `pcie_pri_controller_endpoint` | Advanced PCI Express | PCIe optional services |
| BB-7076 | `pcie_pri_controller_bridge` | Advanced PCI Express | PCIe optional services |
| BB-7077 | `pcie_pri_controller_router` | Advanced PCI Express | PCIe optional services |
| BB-7078 | `pcie_pri_controller_packetized` | Advanced PCI Express | PCIe optional services |
| BB-7079 | `pcie_pri_controller_buffered` | Advanced PCI Express | PCIe optional services |
| BB-7080 | `pcie_pri_controller_dma_attached` | Advanced PCI Express | PCIe optional services |
| BB-7081 | `pcie_pri_controller_multi_channel` | Advanced PCI Express | PCIe optional services |
| BB-7082 | `pcie_pri_controller_qos_aware` | Advanced PCI Express | PCIe optional services |
| BB-7083 | `pcie_pri_controller_timestamped` | Advanced PCI Express | PCIe optional services |
| BB-7084 | `pcie_pri_controller_clock_crossing` | Advanced PCI Express | PCIe optional services |
| BB-7085 | `pcie_pri_controller_redundant` | Advanced PCI Express | PCIe optional services |
| BB-7086 | `pcie_pri_controller_security_filtered` | Advanced PCI Express | PCIe optional services |
| BB-7087 | `pcie_pri_controller_protocol_monitor` | Advanced PCI Express | PCIe optional services |
| BB-7088 | `pcie_pri_controller_software_configurable` | Advanced PCI Express | PCIe optional services |
| BB-7089 | `pcie_sriov_vf_manager_initiator` | Advanced PCI Express | PCIe optional services |
| BB-7090 | `pcie_sriov_vf_manager_target` | Advanced PCI Express | PCIe optional services |
| BB-7091 | `pcie_sriov_vf_manager_endpoint` | Advanced PCI Express | PCIe optional services |
| BB-7092 | `pcie_sriov_vf_manager_bridge` | Advanced PCI Express | PCIe optional services |
| BB-7093 | `pcie_sriov_vf_manager_router` | Advanced PCI Express | PCIe optional services |
| BB-7094 | `pcie_sriov_vf_manager_packetized` | Advanced PCI Express | PCIe optional services |
| BB-7095 | `pcie_sriov_vf_manager_buffered` | Advanced PCI Express | PCIe optional services |
| BB-7096 | `pcie_sriov_vf_manager_dma_attached` | Advanced PCI Express | PCIe optional services |
| BB-7097 | `pcie_sriov_vf_manager_multi_channel` | Advanced PCI Express | PCIe optional services |
| BB-7098 | `pcie_sriov_vf_manager_qos_aware` | Advanced PCI Express | PCIe optional services |
| BB-7099 | `pcie_sriov_vf_manager_timestamped` | Advanced PCI Express | PCIe optional services |
| BB-7100 | `pcie_sriov_vf_manager_clock_crossing` | Advanced PCI Express | PCIe optional services |
| BB-7101 | `pcie_sriov_vf_manager_redundant` | Advanced PCI Express | PCIe optional services |
| BB-7102 | `pcie_sriov_vf_manager_security_filtered` | Advanced PCI Express | PCIe optional services |
| BB-7103 | `pcie_sriov_vf_manager_protocol_monitor` | Advanced PCI Express | PCIe optional services |
| BB-7104 | `pcie_sriov_vf_manager_software_configurable` | Advanced PCI Express | PCIe optional services |
| BB-7105 | `pcie_aer_manager_initiator` | Advanced PCI Express | PCIe optional services |
| BB-7106 | `pcie_aer_manager_target` | Advanced PCI Express | PCIe optional services |
| BB-7107 | `pcie_aer_manager_endpoint` | Advanced PCI Express | PCIe optional services |
| BB-7108 | `pcie_aer_manager_bridge` | Advanced PCI Express | PCIe optional services |
| BB-7109 | `pcie_aer_manager_router` | Advanced PCI Express | PCIe optional services |
| BB-7110 | `pcie_aer_manager_packetized` | Advanced PCI Express | PCIe optional services |
| BB-7111 | `pcie_aer_manager_buffered` | Advanced PCI Express | PCIe optional services |
| BB-7112 | `pcie_aer_manager_dma_attached` | Advanced PCI Express | PCIe optional services |
| BB-7113 | `pcie_aer_manager_multi_channel` | Advanced PCI Express | PCIe optional services |
| BB-7114 | `pcie_aer_manager_qos_aware` | Advanced PCI Express | PCIe optional services |
| BB-7115 | `pcie_aer_manager_timestamped` | Advanced PCI Express | PCIe optional services |
| BB-7116 | `pcie_aer_manager_clock_crossing` | Advanced PCI Express | PCIe optional services |
| BB-7117 | `pcie_aer_manager_redundant` | Advanced PCI Express | PCIe optional services |
| BB-7118 | `pcie_aer_manager_security_filtered` | Advanced PCI Express | PCIe optional services |
| BB-7119 | `pcie_aer_manager_protocol_monitor` | Advanced PCI Express | PCIe optional services |
| BB-7120 | `pcie_aer_manager_software_configurable` | Advanced PCI Express | PCIe optional services |
| BB-7121 | `cxl_io_protocol_engine_initiator` | Compute Express Link | CXL protocols |
| BB-7122 | `cxl_io_protocol_engine_target` | Compute Express Link | CXL protocols |
| BB-7123 | `cxl_io_protocol_engine_endpoint` | Compute Express Link | CXL protocols |
| BB-7124 | `cxl_io_protocol_engine_bridge` | Compute Express Link | CXL protocols |
| BB-7125 | `cxl_io_protocol_engine_router` | Compute Express Link | CXL protocols |
| BB-7126 | `cxl_io_protocol_engine_packetized` | Compute Express Link | CXL protocols |
| BB-7127 | `cxl_io_protocol_engine_buffered` | Compute Express Link | CXL protocols |
| BB-7128 | `cxl_io_protocol_engine_dma_attached` | Compute Express Link | CXL protocols |
| BB-7129 | `cxl_io_protocol_engine_multi_channel` | Compute Express Link | CXL protocols |
| BB-7130 | `cxl_io_protocol_engine_qos_aware` | Compute Express Link | CXL protocols |
| BB-7131 | `cxl_io_protocol_engine_timestamped` | Compute Express Link | CXL protocols |
| BB-7132 | `cxl_io_protocol_engine_clock_crossing` | Compute Express Link | CXL protocols |
| BB-7133 | `cxl_io_protocol_engine_redundant` | Compute Express Link | CXL protocols |
| BB-7134 | `cxl_io_protocol_engine_security_filtered` | Compute Express Link | CXL protocols |
| BB-7135 | `cxl_io_protocol_engine_protocol_monitor` | Compute Express Link | CXL protocols |
| BB-7136 | `cxl_io_protocol_engine_software_configurable` | Compute Express Link | CXL protocols |
| BB-7137 | `cxl_cache_agent_initiator` | Compute Express Link | CXL protocols |
| BB-7138 | `cxl_cache_agent_target` | Compute Express Link | CXL protocols |
| BB-7139 | `cxl_cache_agent_endpoint` | Compute Express Link | CXL protocols |
| BB-7140 | `cxl_cache_agent_bridge` | Compute Express Link | CXL protocols |
| BB-7141 | `cxl_cache_agent_router` | Compute Express Link | CXL protocols |
| BB-7142 | `cxl_cache_agent_packetized` | Compute Express Link | CXL protocols |
| BB-7143 | `cxl_cache_agent_buffered` | Compute Express Link | CXL protocols |
| BB-7144 | `cxl_cache_agent_dma_attached` | Compute Express Link | CXL protocols |
| BB-7145 | `cxl_cache_agent_multi_channel` | Compute Express Link | CXL protocols |
| BB-7146 | `cxl_cache_agent_qos_aware` | Compute Express Link | CXL protocols |
| BB-7147 | `cxl_cache_agent_timestamped` | Compute Express Link | CXL protocols |
| BB-7148 | `cxl_cache_agent_clock_crossing` | Compute Express Link | CXL protocols |
| BB-7149 | `cxl_cache_agent_redundant` | Compute Express Link | CXL protocols |
| BB-7150 | `cxl_cache_agent_security_filtered` | Compute Express Link | CXL protocols |
| BB-7151 | `cxl_cache_agent_protocol_monitor` | Compute Express Link | CXL protocols |
| BB-7152 | `cxl_cache_agent_software_configurable` | Compute Express Link | CXL protocols |
| BB-7153 | `cxl_memory_device_controller_initiator` | Compute Express Link | CXL protocols |
| BB-7154 | `cxl_memory_device_controller_target` | Compute Express Link | CXL protocols |
| BB-7155 | `cxl_memory_device_controller_endpoint` | Compute Express Link | CXL protocols |
| BB-7156 | `cxl_memory_device_controller_bridge` | Compute Express Link | CXL protocols |
| BB-7157 | `cxl_memory_device_controller_router` | Compute Express Link | CXL protocols |
| BB-7158 | `cxl_memory_device_controller_packetized` | Compute Express Link | CXL protocols |
| BB-7159 | `cxl_memory_device_controller_buffered` | Compute Express Link | CXL protocols |
| BB-7160 | `cxl_memory_device_controller_dma_attached` | Compute Express Link | CXL protocols |
| BB-7161 | `cxl_memory_device_controller_multi_channel` | Compute Express Link | CXL protocols |
| BB-7162 | `cxl_memory_device_controller_qos_aware` | Compute Express Link | CXL protocols |
| BB-7163 | `cxl_memory_device_controller_timestamped` | Compute Express Link | CXL protocols |
| BB-7164 | `cxl_memory_device_controller_clock_crossing` | Compute Express Link | CXL protocols |
| BB-7165 | `cxl_memory_device_controller_redundant` | Compute Express Link | CXL protocols |
| BB-7166 | `cxl_memory_device_controller_security_filtered` | Compute Express Link | CXL protocols |
| BB-7167 | `cxl_memory_device_controller_protocol_monitor` | Compute Express Link | CXL protocols |
| BB-7168 | `cxl_memory_device_controller_software_configurable` | Compute Express Link | CXL protocols |
| BB-7169 | `cxl_coherency_bridge_initiator` | Compute Express Link | CXL protocols |
| BB-7170 | `cxl_coherency_bridge_target` | Compute Express Link | CXL protocols |
| BB-7171 | `cxl_coherency_bridge_endpoint` | Compute Express Link | CXL protocols |
| BB-7172 | `cxl_coherency_bridge_bridge` | Compute Express Link | CXL protocols |
| BB-7173 | `cxl_coherency_bridge_router` | Compute Express Link | CXL protocols |
| BB-7174 | `cxl_coherency_bridge_packetized` | Compute Express Link | CXL protocols |
| BB-7175 | `cxl_coherency_bridge_buffered` | Compute Express Link | CXL protocols |
| BB-7176 | `cxl_coherency_bridge_dma_attached` | Compute Express Link | CXL protocols |
| BB-7177 | `cxl_coherency_bridge_multi_channel` | Compute Express Link | CXL protocols |
| BB-7178 | `cxl_coherency_bridge_qos_aware` | Compute Express Link | CXL protocols |
| BB-7179 | `cxl_coherency_bridge_timestamped` | Compute Express Link | CXL protocols |
| BB-7180 | `cxl_coherency_bridge_clock_crossing` | Compute Express Link | CXL protocols |
| BB-7181 | `cxl_coherency_bridge_redundant` | Compute Express Link | CXL protocols |
| BB-7182 | `cxl_coherency_bridge_security_filtered` | Compute Express Link | CXL protocols |
| BB-7183 | `cxl_coherency_bridge_protocol_monitor` | Compute Express Link | CXL protocols |
| BB-7184 | `cxl_coherency_bridge_software_configurable` | Compute Express Link | CXL protocols |
| BB-7185 | `cxl_ras_manager_initiator` | Compute Express Link | CXL protocols |
| BB-7186 | `cxl_ras_manager_target` | Compute Express Link | CXL protocols |
| BB-7187 | `cxl_ras_manager_endpoint` | Compute Express Link | CXL protocols |
| BB-7188 | `cxl_ras_manager_bridge` | Compute Express Link | CXL protocols |
| BB-7189 | `cxl_ras_manager_router` | Compute Express Link | CXL protocols |
| BB-7190 | `cxl_ras_manager_packetized` | Compute Express Link | CXL protocols |
| BB-7191 | `cxl_ras_manager_buffered` | Compute Express Link | CXL protocols |
| BB-7192 | `cxl_ras_manager_dma_attached` | Compute Express Link | CXL protocols |
| BB-7193 | `cxl_ras_manager_multi_channel` | Compute Express Link | CXL protocols |
| BB-7194 | `cxl_ras_manager_qos_aware` | Compute Express Link | CXL protocols |
| BB-7195 | `cxl_ras_manager_timestamped` | Compute Express Link | CXL protocols |
| BB-7196 | `cxl_ras_manager_clock_crossing` | Compute Express Link | CXL protocols |
| BB-7197 | `cxl_ras_manager_redundant` | Compute Express Link | CXL protocols |
| BB-7198 | `cxl_ras_manager_security_filtered` | Compute Express Link | CXL protocols |
| BB-7199 | `cxl_ras_manager_protocol_monitor` | Compute Express Link | CXL protocols |
| BB-7200 | `cxl_ras_manager_software_configurable` | Compute Express Link | CXL protocols |
| BB-7201 | `ethernet_25g_lane_mapper_initiator` | Advanced Ethernet | High-speed Ethernet services |
| BB-7202 | `ethernet_25g_lane_mapper_target` | Advanced Ethernet | High-speed Ethernet services |
| BB-7203 | `ethernet_25g_lane_mapper_endpoint` | Advanced Ethernet | High-speed Ethernet services |
| BB-7204 | `ethernet_25g_lane_mapper_bridge` | Advanced Ethernet | High-speed Ethernet services |
| BB-7205 | `ethernet_25g_lane_mapper_router` | Advanced Ethernet | High-speed Ethernet services |
| BB-7206 | `ethernet_25g_lane_mapper_packetized` | Advanced Ethernet | High-speed Ethernet services |
| BB-7207 | `ethernet_25g_lane_mapper_buffered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7208 | `ethernet_25g_lane_mapper_dma_attached` | Advanced Ethernet | High-speed Ethernet services |
| BB-7209 | `ethernet_25g_lane_mapper_multi_channel` | Advanced Ethernet | High-speed Ethernet services |
| BB-7210 | `ethernet_25g_lane_mapper_qos_aware` | Advanced Ethernet | High-speed Ethernet services |
| BB-7211 | `ethernet_25g_lane_mapper_timestamped` | Advanced Ethernet | High-speed Ethernet services |
| BB-7212 | `ethernet_25g_lane_mapper_clock_crossing` | Advanced Ethernet | High-speed Ethernet services |
| BB-7213 | `ethernet_25g_lane_mapper_redundant` | Advanced Ethernet | High-speed Ethernet services |
| BB-7214 | `ethernet_25g_lane_mapper_security_filtered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7215 | `ethernet_25g_lane_mapper_protocol_monitor` | Advanced Ethernet | High-speed Ethernet services |
| BB-7216 | `ethernet_25g_lane_mapper_software_configurable` | Advanced Ethernet | High-speed Ethernet services |
| BB-7217 | `ethernet_100g_pcs_lane_initiator` | Advanced Ethernet | High-speed Ethernet services |
| BB-7218 | `ethernet_100g_pcs_lane_target` | Advanced Ethernet | High-speed Ethernet services |
| BB-7219 | `ethernet_100g_pcs_lane_endpoint` | Advanced Ethernet | High-speed Ethernet services |
| BB-7220 | `ethernet_100g_pcs_lane_bridge` | Advanced Ethernet | High-speed Ethernet services |
| BB-7221 | `ethernet_100g_pcs_lane_router` | Advanced Ethernet | High-speed Ethernet services |
| BB-7222 | `ethernet_100g_pcs_lane_packetized` | Advanced Ethernet | High-speed Ethernet services |
| BB-7223 | `ethernet_100g_pcs_lane_buffered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7224 | `ethernet_100g_pcs_lane_dma_attached` | Advanced Ethernet | High-speed Ethernet services |
| BB-7225 | `ethernet_100g_pcs_lane_multi_channel` | Advanced Ethernet | High-speed Ethernet services |
| BB-7226 | `ethernet_100g_pcs_lane_qos_aware` | Advanced Ethernet | High-speed Ethernet services |
| BB-7227 | `ethernet_100g_pcs_lane_timestamped` | Advanced Ethernet | High-speed Ethernet services |
| BB-7228 | `ethernet_100g_pcs_lane_clock_crossing` | Advanced Ethernet | High-speed Ethernet services |
| BB-7229 | `ethernet_100g_pcs_lane_redundant` | Advanced Ethernet | High-speed Ethernet services |
| BB-7230 | `ethernet_100g_pcs_lane_security_filtered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7231 | `ethernet_100g_pcs_lane_protocol_monitor` | Advanced Ethernet | High-speed Ethernet services |
| BB-7232 | `ethernet_100g_pcs_lane_software_configurable` | Advanced Ethernet | High-speed Ethernet services |
| BB-7233 | `ethernet_fec_rs_engine_initiator` | Advanced Ethernet | High-speed Ethernet services |
| BB-7234 | `ethernet_fec_rs_engine_target` | Advanced Ethernet | High-speed Ethernet services |
| BB-7235 | `ethernet_fec_rs_engine_endpoint` | Advanced Ethernet | High-speed Ethernet services |
| BB-7236 | `ethernet_fec_rs_engine_bridge` | Advanced Ethernet | High-speed Ethernet services |
| BB-7237 | `ethernet_fec_rs_engine_router` | Advanced Ethernet | High-speed Ethernet services |
| BB-7238 | `ethernet_fec_rs_engine_packetized` | Advanced Ethernet | High-speed Ethernet services |
| BB-7239 | `ethernet_fec_rs_engine_buffered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7240 | `ethernet_fec_rs_engine_dma_attached` | Advanced Ethernet | High-speed Ethernet services |
| BB-7241 | `ethernet_fec_rs_engine_multi_channel` | Advanced Ethernet | High-speed Ethernet services |
| BB-7242 | `ethernet_fec_rs_engine_qos_aware` | Advanced Ethernet | High-speed Ethernet services |
| BB-7243 | `ethernet_fec_rs_engine_timestamped` | Advanced Ethernet | High-speed Ethernet services |
| BB-7244 | `ethernet_fec_rs_engine_clock_crossing` | Advanced Ethernet | High-speed Ethernet services |
| BB-7245 | `ethernet_fec_rs_engine_redundant` | Advanced Ethernet | High-speed Ethernet services |
| BB-7246 | `ethernet_fec_rs_engine_security_filtered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7247 | `ethernet_fec_rs_engine_protocol_monitor` | Advanced Ethernet | High-speed Ethernet services |
| BB-7248 | `ethernet_fec_rs_engine_software_configurable` | Advanced Ethernet | High-speed Ethernet services |
| BB-7249 | `ethernet_lpi_controller_initiator` | Advanced Ethernet | High-speed Ethernet services |
| BB-7250 | `ethernet_lpi_controller_target` | Advanced Ethernet | High-speed Ethernet services |
| BB-7251 | `ethernet_lpi_controller_endpoint` | Advanced Ethernet | High-speed Ethernet services |
| BB-7252 | `ethernet_lpi_controller_bridge` | Advanced Ethernet | High-speed Ethernet services |
| BB-7253 | `ethernet_lpi_controller_router` | Advanced Ethernet | High-speed Ethernet services |
| BB-7254 | `ethernet_lpi_controller_packetized` | Advanced Ethernet | High-speed Ethernet services |
| BB-7255 | `ethernet_lpi_controller_buffered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7256 | `ethernet_lpi_controller_dma_attached` | Advanced Ethernet | High-speed Ethernet services |
| BB-7257 | `ethernet_lpi_controller_multi_channel` | Advanced Ethernet | High-speed Ethernet services |
| BB-7258 | `ethernet_lpi_controller_qos_aware` | Advanced Ethernet | High-speed Ethernet services |
| BB-7259 | `ethernet_lpi_controller_timestamped` | Advanced Ethernet | High-speed Ethernet services |
| BB-7260 | `ethernet_lpi_controller_clock_crossing` | Advanced Ethernet | High-speed Ethernet services |
| BB-7261 | `ethernet_lpi_controller_redundant` | Advanced Ethernet | High-speed Ethernet services |
| BB-7262 | `ethernet_lpi_controller_security_filtered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7263 | `ethernet_lpi_controller_protocol_monitor` | Advanced Ethernet | High-speed Ethernet services |
| BB-7264 | `ethernet_lpi_controller_software_configurable` | Advanced Ethernet | High-speed Ethernet services |
| BB-7265 | `ethernet_macsec_adapter_initiator` | Advanced Ethernet | High-speed Ethernet services |
| BB-7266 | `ethernet_macsec_adapter_target` | Advanced Ethernet | High-speed Ethernet services |
| BB-7267 | `ethernet_macsec_adapter_endpoint` | Advanced Ethernet | High-speed Ethernet services |
| BB-7268 | `ethernet_macsec_adapter_bridge` | Advanced Ethernet | High-speed Ethernet services |
| BB-7269 | `ethernet_macsec_adapter_router` | Advanced Ethernet | High-speed Ethernet services |
| BB-7270 | `ethernet_macsec_adapter_packetized` | Advanced Ethernet | High-speed Ethernet services |
| BB-7271 | `ethernet_macsec_adapter_buffered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7272 | `ethernet_macsec_adapter_dma_attached` | Advanced Ethernet | High-speed Ethernet services |
| BB-7273 | `ethernet_macsec_adapter_multi_channel` | Advanced Ethernet | High-speed Ethernet services |
| BB-7274 | `ethernet_macsec_adapter_qos_aware` | Advanced Ethernet | High-speed Ethernet services |
| BB-7275 | `ethernet_macsec_adapter_timestamped` | Advanced Ethernet | High-speed Ethernet services |
| BB-7276 | `ethernet_macsec_adapter_clock_crossing` | Advanced Ethernet | High-speed Ethernet services |
| BB-7277 | `ethernet_macsec_adapter_redundant` | Advanced Ethernet | High-speed Ethernet services |
| BB-7278 | `ethernet_macsec_adapter_security_filtered` | Advanced Ethernet | High-speed Ethernet services |
| BB-7279 | `ethernet_macsec_adapter_protocol_monitor` | Advanced Ethernet | High-speed Ethernet services |
| BB-7280 | `ethernet_macsec_adapter_software_configurable` | Advanced Ethernet | High-speed Ethernet services |
| BB-7281 | `tcp_offload_engine_initiator` | TCP and IP | Transport and network offload |
| BB-7282 | `tcp_offload_engine_target` | TCP and IP | Transport and network offload |
| BB-7283 | `tcp_offload_engine_endpoint` | TCP and IP | Transport and network offload |
| BB-7284 | `tcp_offload_engine_bridge` | TCP and IP | Transport and network offload |
| BB-7285 | `tcp_offload_engine_router` | TCP and IP | Transport and network offload |
| BB-7286 | `tcp_offload_engine_packetized` | TCP and IP | Transport and network offload |
| BB-7287 | `tcp_offload_engine_buffered` | TCP and IP | Transport and network offload |
| BB-7288 | `tcp_offload_engine_dma_attached` | TCP and IP | Transport and network offload |
| BB-7289 | `tcp_offload_engine_multi_channel` | TCP and IP | Transport and network offload |
| BB-7290 | `tcp_offload_engine_qos_aware` | TCP and IP | Transport and network offload |
| BB-7291 | `tcp_offload_engine_timestamped` | TCP and IP | Transport and network offload |
| BB-7292 | `tcp_offload_engine_clock_crossing` | TCP and IP | Transport and network offload |
| BB-7293 | `tcp_offload_engine_redundant` | TCP and IP | Transport and network offload |
| BB-7294 | `tcp_offload_engine_security_filtered` | TCP and IP | Transport and network offload |
| BB-7295 | `tcp_offload_engine_protocol_monitor` | TCP and IP | Transport and network offload |
| BB-7296 | `tcp_offload_engine_software_configurable` | TCP and IP | Transport and network offload |
| BB-7297 | `tcp_retransmission_manager_initiator` | TCP and IP | Transport and network offload |
| BB-7298 | `tcp_retransmission_manager_target` | TCP and IP | Transport and network offload |
| BB-7299 | `tcp_retransmission_manager_endpoint` | TCP and IP | Transport and network offload |
| BB-7300 | `tcp_retransmission_manager_bridge` | TCP and IP | Transport and network offload |
| BB-7301 | `tcp_retransmission_manager_router` | TCP and IP | Transport and network offload |
| BB-7302 | `tcp_retransmission_manager_packetized` | TCP and IP | Transport and network offload |
| BB-7303 | `tcp_retransmission_manager_buffered` | TCP and IP | Transport and network offload |
| BB-7304 | `tcp_retransmission_manager_dma_attached` | TCP and IP | Transport and network offload |
| BB-7305 | `tcp_retransmission_manager_multi_channel` | TCP and IP | Transport and network offload |
| BB-7306 | `tcp_retransmission_manager_qos_aware` | TCP and IP | Transport and network offload |
| BB-7307 | `tcp_retransmission_manager_timestamped` | TCP and IP | Transport and network offload |
| BB-7308 | `tcp_retransmission_manager_clock_crossing` | TCP and IP | Transport and network offload |
| BB-7309 | `tcp_retransmission_manager_redundant` | TCP and IP | Transport and network offload |
| BB-7310 | `tcp_retransmission_manager_security_filtered` | TCP and IP | Transport and network offload |
| BB-7311 | `tcp_retransmission_manager_protocol_monitor` | TCP and IP | Transport and network offload |
| BB-7312 | `tcp_retransmission_manager_software_configurable` | TCP and IP | Transport and network offload |
| BB-7313 | `tcp_congestion_window_initiator` | TCP and IP | Transport and network offload |
| BB-7314 | `tcp_congestion_window_target` | TCP and IP | Transport and network offload |
| BB-7315 | `tcp_congestion_window_endpoint` | TCP and IP | Transport and network offload |
| BB-7316 | `tcp_congestion_window_bridge` | TCP and IP | Transport and network offload |
| BB-7317 | `tcp_congestion_window_router` | TCP and IP | Transport and network offload |
| BB-7318 | `tcp_congestion_window_packetized` | TCP and IP | Transport and network offload |
| BB-7319 | `tcp_congestion_window_buffered` | TCP and IP | Transport and network offload |
| BB-7320 | `tcp_congestion_window_dma_attached` | TCP and IP | Transport and network offload |
| BB-7321 | `tcp_congestion_window_multi_channel` | TCP and IP | Transport and network offload |
| BB-7322 | `tcp_congestion_window_qos_aware` | TCP and IP | Transport and network offload |
| BB-7323 | `tcp_congestion_window_timestamped` | TCP and IP | Transport and network offload |
| BB-7324 | `tcp_congestion_window_clock_crossing` | TCP and IP | Transport and network offload |
| BB-7325 | `tcp_congestion_window_redundant` | TCP and IP | Transport and network offload |
| BB-7326 | `tcp_congestion_window_security_filtered` | TCP and IP | Transport and network offload |
| BB-7327 | `tcp_congestion_window_protocol_monitor` | TCP and IP | Transport and network offload |
| BB-7328 | `tcp_congestion_window_software_configurable` | TCP and IP | Transport and network offload |
| BB-7329 | `ipv6_extension_parser_initiator` | TCP and IP | Transport and network offload |
| BB-7330 | `ipv6_extension_parser_target` | TCP and IP | Transport and network offload |
| BB-7331 | `ipv6_extension_parser_endpoint` | TCP and IP | Transport and network offload |
| BB-7332 | `ipv6_extension_parser_bridge` | TCP and IP | Transport and network offload |
| BB-7333 | `ipv6_extension_parser_router` | TCP and IP | Transport and network offload |
| BB-7334 | `ipv6_extension_parser_packetized` | TCP and IP | Transport and network offload |
| BB-7335 | `ipv6_extension_parser_buffered` | TCP and IP | Transport and network offload |
| BB-7336 | `ipv6_extension_parser_dma_attached` | TCP and IP | Transport and network offload |
| BB-7337 | `ipv6_extension_parser_multi_channel` | TCP and IP | Transport and network offload |
| BB-7338 | `ipv6_extension_parser_qos_aware` | TCP and IP | Transport and network offload |
| BB-7339 | `ipv6_extension_parser_timestamped` | TCP and IP | Transport and network offload |
| BB-7340 | `ipv6_extension_parser_clock_crossing` | TCP and IP | Transport and network offload |
| BB-7341 | `ipv6_extension_parser_redundant` | TCP and IP | Transport and network offload |
| BB-7342 | `ipv6_extension_parser_security_filtered` | TCP and IP | Transport and network offload |
| BB-7343 | `ipv6_extension_parser_protocol_monitor` | TCP and IP | Transport and network offload |
| BB-7344 | `ipv6_extension_parser_software_configurable` | TCP and IP | Transport and network offload |
| BB-7345 | `ip_fragment_reassembly_initiator` | TCP and IP | Transport and network offload |
| BB-7346 | `ip_fragment_reassembly_target` | TCP and IP | Transport and network offload |
| BB-7347 | `ip_fragment_reassembly_endpoint` | TCP and IP | Transport and network offload |
| BB-7348 | `ip_fragment_reassembly_bridge` | TCP and IP | Transport and network offload |
| BB-7349 | `ip_fragment_reassembly_router` | TCP and IP | Transport and network offload |
| BB-7350 | `ip_fragment_reassembly_packetized` | TCP and IP | Transport and network offload |
| BB-7351 | `ip_fragment_reassembly_buffered` | TCP and IP | Transport and network offload |
| BB-7352 | `ip_fragment_reassembly_dma_attached` | TCP and IP | Transport and network offload |
| BB-7353 | `ip_fragment_reassembly_multi_channel` | TCP and IP | Transport and network offload |
| BB-7354 | `ip_fragment_reassembly_qos_aware` | TCP and IP | Transport and network offload |
| BB-7355 | `ip_fragment_reassembly_timestamped` | TCP and IP | Transport and network offload |
| BB-7356 | `ip_fragment_reassembly_clock_crossing` | TCP and IP | Transport and network offload |
| BB-7357 | `ip_fragment_reassembly_redundant` | TCP and IP | Transport and network offload |
| BB-7358 | `ip_fragment_reassembly_security_filtered` | TCP and IP | Transport and network offload |
| BB-7359 | `ip_fragment_reassembly_protocol_monitor` | TCP and IP | Transport and network offload |
| BB-7360 | `ip_fragment_reassembly_software_configurable` | TCP and IP | Transport and network offload |
| BB-7361 | `ieee1588_timestamp_unit_initiator` | TSN and Precision Time | Deterministic Ethernet |
| BB-7362 | `ieee1588_timestamp_unit_target` | TSN and Precision Time | Deterministic Ethernet |
| BB-7363 | `ieee1588_timestamp_unit_endpoint` | TSN and Precision Time | Deterministic Ethernet |
| BB-7364 | `ieee1588_timestamp_unit_bridge` | TSN and Precision Time | Deterministic Ethernet |
| BB-7365 | `ieee1588_timestamp_unit_router` | TSN and Precision Time | Deterministic Ethernet |
| BB-7366 | `ieee1588_timestamp_unit_packetized` | TSN and Precision Time | Deterministic Ethernet |
| BB-7367 | `ieee1588_timestamp_unit_buffered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7368 | `ieee1588_timestamp_unit_dma_attached` | TSN and Precision Time | Deterministic Ethernet |
| BB-7369 | `ieee1588_timestamp_unit_multi_channel` | TSN and Precision Time | Deterministic Ethernet |
| BB-7370 | `ieee1588_timestamp_unit_qos_aware` | TSN and Precision Time | Deterministic Ethernet |
| BB-7371 | `ieee1588_timestamp_unit_timestamped` | TSN and Precision Time | Deterministic Ethernet |
| BB-7372 | `ieee1588_timestamp_unit_clock_crossing` | TSN and Precision Time | Deterministic Ethernet |
| BB-7373 | `ieee1588_timestamp_unit_redundant` | TSN and Precision Time | Deterministic Ethernet |
| BB-7374 | `ieee1588_timestamp_unit_security_filtered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7375 | `ieee1588_timestamp_unit_protocol_monitor` | TSN and Precision Time | Deterministic Ethernet |
| BB-7376 | `ieee1588_timestamp_unit_software_configurable` | TSN and Precision Time | Deterministic Ethernet |
| BB-7377 | `ptp_clock_servo_initiator` | TSN and Precision Time | Deterministic Ethernet |
| BB-7378 | `ptp_clock_servo_target` | TSN and Precision Time | Deterministic Ethernet |
| BB-7379 | `ptp_clock_servo_endpoint` | TSN and Precision Time | Deterministic Ethernet |
| BB-7380 | `ptp_clock_servo_bridge` | TSN and Precision Time | Deterministic Ethernet |
| BB-7381 | `ptp_clock_servo_router` | TSN and Precision Time | Deterministic Ethernet |
| BB-7382 | `ptp_clock_servo_packetized` | TSN and Precision Time | Deterministic Ethernet |
| BB-7383 | `ptp_clock_servo_buffered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7384 | `ptp_clock_servo_dma_attached` | TSN and Precision Time | Deterministic Ethernet |
| BB-7385 | `ptp_clock_servo_multi_channel` | TSN and Precision Time | Deterministic Ethernet |
| BB-7386 | `ptp_clock_servo_qos_aware` | TSN and Precision Time | Deterministic Ethernet |
| BB-7387 | `ptp_clock_servo_timestamped` | TSN and Precision Time | Deterministic Ethernet |
| BB-7388 | `ptp_clock_servo_clock_crossing` | TSN and Precision Time | Deterministic Ethernet |
| BB-7389 | `ptp_clock_servo_redundant` | TSN and Precision Time | Deterministic Ethernet |
| BB-7390 | `ptp_clock_servo_security_filtered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7391 | `ptp_clock_servo_protocol_monitor` | TSN and Precision Time | Deterministic Ethernet |
| BB-7392 | `ptp_clock_servo_software_configurable` | TSN and Precision Time | Deterministic Ethernet |
| BB-7393 | `time_aware_shaper_initiator` | TSN and Precision Time | Deterministic Ethernet |
| BB-7394 | `time_aware_shaper_target` | TSN and Precision Time | Deterministic Ethernet |
| BB-7395 | `time_aware_shaper_endpoint` | TSN and Precision Time | Deterministic Ethernet |
| BB-7396 | `time_aware_shaper_bridge` | TSN and Precision Time | Deterministic Ethernet |
| BB-7397 | `time_aware_shaper_router` | TSN and Precision Time | Deterministic Ethernet |
| BB-7398 | `time_aware_shaper_packetized` | TSN and Precision Time | Deterministic Ethernet |
| BB-7399 | `time_aware_shaper_buffered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7400 | `time_aware_shaper_dma_attached` | TSN and Precision Time | Deterministic Ethernet |
| BB-7401 | `time_aware_shaper_multi_channel` | TSN and Precision Time | Deterministic Ethernet |
| BB-7402 | `time_aware_shaper_qos_aware` | TSN and Precision Time | Deterministic Ethernet |
| BB-7403 | `time_aware_shaper_timestamped` | TSN and Precision Time | Deterministic Ethernet |
| BB-7404 | `time_aware_shaper_clock_crossing` | TSN and Precision Time | Deterministic Ethernet |
| BB-7405 | `time_aware_shaper_redundant` | TSN and Precision Time | Deterministic Ethernet |
| BB-7406 | `time_aware_shaper_security_filtered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7407 | `time_aware_shaper_protocol_monitor` | TSN and Precision Time | Deterministic Ethernet |
| BB-7408 | `time_aware_shaper_software_configurable` | TSN and Precision Time | Deterministic Ethernet |
| BB-7409 | `credit_based_shaper_initiator` | TSN and Precision Time | Deterministic Ethernet |
| BB-7410 | `credit_based_shaper_target` | TSN and Precision Time | Deterministic Ethernet |
| BB-7411 | `credit_based_shaper_endpoint` | TSN and Precision Time | Deterministic Ethernet |
| BB-7412 | `credit_based_shaper_bridge` | TSN and Precision Time | Deterministic Ethernet |
| BB-7413 | `credit_based_shaper_router` | TSN and Precision Time | Deterministic Ethernet |
| BB-7414 | `credit_based_shaper_packetized` | TSN and Precision Time | Deterministic Ethernet |
| BB-7415 | `credit_based_shaper_buffered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7416 | `credit_based_shaper_dma_attached` | TSN and Precision Time | Deterministic Ethernet |
| BB-7417 | `credit_based_shaper_multi_channel` | TSN and Precision Time | Deterministic Ethernet |
| BB-7418 | `credit_based_shaper_qos_aware` | TSN and Precision Time | Deterministic Ethernet |
| BB-7419 | `credit_based_shaper_timestamped` | TSN and Precision Time | Deterministic Ethernet |
| BB-7420 | `credit_based_shaper_clock_crossing` | TSN and Precision Time | Deterministic Ethernet |
| BB-7421 | `credit_based_shaper_redundant` | TSN and Precision Time | Deterministic Ethernet |
| BB-7422 | `credit_based_shaper_security_filtered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7423 | `credit_based_shaper_protocol_monitor` | TSN and Precision Time | Deterministic Ethernet |
| BB-7424 | `credit_based_shaper_software_configurable` | TSN and Precision Time | Deterministic Ethernet |
| BB-7425 | `frame_preemption_controller_initiator` | TSN and Precision Time | Deterministic Ethernet |
| BB-7426 | `frame_preemption_controller_target` | TSN and Precision Time | Deterministic Ethernet |
| BB-7427 | `frame_preemption_controller_endpoint` | TSN and Precision Time | Deterministic Ethernet |
| BB-7428 | `frame_preemption_controller_bridge` | TSN and Precision Time | Deterministic Ethernet |
| BB-7429 | `frame_preemption_controller_router` | TSN and Precision Time | Deterministic Ethernet |
| BB-7430 | `frame_preemption_controller_packetized` | TSN and Precision Time | Deterministic Ethernet |
| BB-7431 | `frame_preemption_controller_buffered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7432 | `frame_preemption_controller_dma_attached` | TSN and Precision Time | Deterministic Ethernet |
| BB-7433 | `frame_preemption_controller_multi_channel` | TSN and Precision Time | Deterministic Ethernet |
| BB-7434 | `frame_preemption_controller_qos_aware` | TSN and Precision Time | Deterministic Ethernet |
| BB-7435 | `frame_preemption_controller_timestamped` | TSN and Precision Time | Deterministic Ethernet |
| BB-7436 | `frame_preemption_controller_clock_crossing` | TSN and Precision Time | Deterministic Ethernet |
| BB-7437 | `frame_preemption_controller_redundant` | TSN and Precision Time | Deterministic Ethernet |
| BB-7438 | `frame_preemption_controller_security_filtered` | TSN and Precision Time | Deterministic Ethernet |
| BB-7439 | `frame_preemption_controller_protocol_monitor` | TSN and Precision Time | Deterministic Ethernet |
| BB-7440 | `frame_preemption_controller_software_configurable` | TSN and Precision Time | Deterministic Ethernet |
| BB-7441 | `usb3_link_training_initiator` | Advanced USB | USB3 USB4 and Type-C |
| BB-7442 | `usb3_link_training_target` | Advanced USB | USB3 USB4 and Type-C |
| BB-7443 | `usb3_link_training_endpoint` | Advanced USB | USB3 USB4 and Type-C |
| BB-7444 | `usb3_link_training_bridge` | Advanced USB | USB3 USB4 and Type-C |
| BB-7445 | `usb3_link_training_router` | Advanced USB | USB3 USB4 and Type-C |
| BB-7446 | `usb3_link_training_packetized` | Advanced USB | USB3 USB4 and Type-C |
| BB-7447 | `usb3_link_training_buffered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7448 | `usb3_link_training_dma_attached` | Advanced USB | USB3 USB4 and Type-C |
| BB-7449 | `usb3_link_training_multi_channel` | Advanced USB | USB3 USB4 and Type-C |
| BB-7450 | `usb3_link_training_qos_aware` | Advanced USB | USB3 USB4 and Type-C |
| BB-7451 | `usb3_link_training_timestamped` | Advanced USB | USB3 USB4 and Type-C |
| BB-7452 | `usb3_link_training_clock_crossing` | Advanced USB | USB3 USB4 and Type-C |
| BB-7453 | `usb3_link_training_redundant` | Advanced USB | USB3 USB4 and Type-C |
| BB-7454 | `usb3_link_training_security_filtered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7455 | `usb3_link_training_protocol_monitor` | Advanced USB | USB3 USB4 and Type-C |
| BB-7456 | `usb3_link_training_software_configurable` | Advanced USB | USB3 USB4 and Type-C |
| BB-7457 | `usb3_endpoint_scheduler_initiator` | Advanced USB | USB3 USB4 and Type-C |
| BB-7458 | `usb3_endpoint_scheduler_target` | Advanced USB | USB3 USB4 and Type-C |
| BB-7459 | `usb3_endpoint_scheduler_endpoint` | Advanced USB | USB3 USB4 and Type-C |
| BB-7460 | `usb3_endpoint_scheduler_bridge` | Advanced USB | USB3 USB4 and Type-C |
| BB-7461 | `usb3_endpoint_scheduler_router` | Advanced USB | USB3 USB4 and Type-C |
| BB-7462 | `usb3_endpoint_scheduler_packetized` | Advanced USB | USB3 USB4 and Type-C |
| BB-7463 | `usb3_endpoint_scheduler_buffered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7464 | `usb3_endpoint_scheduler_dma_attached` | Advanced USB | USB3 USB4 and Type-C |
| BB-7465 | `usb3_endpoint_scheduler_multi_channel` | Advanced USB | USB3 USB4 and Type-C |
| BB-7466 | `usb3_endpoint_scheduler_qos_aware` | Advanced USB | USB3 USB4 and Type-C |
| BB-7467 | `usb3_endpoint_scheduler_timestamped` | Advanced USB | USB3 USB4 and Type-C |
| BB-7468 | `usb3_endpoint_scheduler_clock_crossing` | Advanced USB | USB3 USB4 and Type-C |
| BB-7469 | `usb3_endpoint_scheduler_redundant` | Advanced USB | USB3 USB4 and Type-C |
| BB-7470 | `usb3_endpoint_scheduler_security_filtered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7471 | `usb3_endpoint_scheduler_protocol_monitor` | Advanced USB | USB3 USB4 and Type-C |
| BB-7472 | `usb3_endpoint_scheduler_software_configurable` | Advanced USB | USB3 USB4 and Type-C |
| BB-7473 | `usb4_tunnel_adapter_initiator` | Advanced USB | USB3 USB4 and Type-C |
| BB-7474 | `usb4_tunnel_adapter_target` | Advanced USB | USB3 USB4 and Type-C |
| BB-7475 | `usb4_tunnel_adapter_endpoint` | Advanced USB | USB3 USB4 and Type-C |
| BB-7476 | `usb4_tunnel_adapter_bridge` | Advanced USB | USB3 USB4 and Type-C |
| BB-7477 | `usb4_tunnel_adapter_router` | Advanced USB | USB3 USB4 and Type-C |
| BB-7478 | `usb4_tunnel_adapter_packetized` | Advanced USB | USB3 USB4 and Type-C |
| BB-7479 | `usb4_tunnel_adapter_buffered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7480 | `usb4_tunnel_adapter_dma_attached` | Advanced USB | USB3 USB4 and Type-C |
| BB-7481 | `usb4_tunnel_adapter_multi_channel` | Advanced USB | USB3 USB4 and Type-C |
| BB-7482 | `usb4_tunnel_adapter_qos_aware` | Advanced USB | USB3 USB4 and Type-C |
| BB-7483 | `usb4_tunnel_adapter_timestamped` | Advanced USB | USB3 USB4 and Type-C |
| BB-7484 | `usb4_tunnel_adapter_clock_crossing` | Advanced USB | USB3 USB4 and Type-C |
| BB-7485 | `usb4_tunnel_adapter_redundant` | Advanced USB | USB3 USB4 and Type-C |
| BB-7486 | `usb4_tunnel_adapter_security_filtered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7487 | `usb4_tunnel_adapter_protocol_monitor` | Advanced USB | USB3 USB4 and Type-C |
| BB-7488 | `usb4_tunnel_adapter_software_configurable` | Advanced USB | USB3 USB4 and Type-C |
| BB-7489 | `usb_typec_policy_engine_initiator` | Advanced USB | USB3 USB4 and Type-C |
| BB-7490 | `usb_typec_policy_engine_target` | Advanced USB | USB3 USB4 and Type-C |
| BB-7491 | `usb_typec_policy_engine_endpoint` | Advanced USB | USB3 USB4 and Type-C |
| BB-7492 | `usb_typec_policy_engine_bridge` | Advanced USB | USB3 USB4 and Type-C |
| BB-7493 | `usb_typec_policy_engine_router` | Advanced USB | USB3 USB4 and Type-C |
| BB-7494 | `usb_typec_policy_engine_packetized` | Advanced USB | USB3 USB4 and Type-C |
| BB-7495 | `usb_typec_policy_engine_buffered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7496 | `usb_typec_policy_engine_dma_attached` | Advanced USB | USB3 USB4 and Type-C |
| BB-7497 | `usb_typec_policy_engine_multi_channel` | Advanced USB | USB3 USB4 and Type-C |
| BB-7498 | `usb_typec_policy_engine_qos_aware` | Advanced USB | USB3 USB4 and Type-C |
| BB-7499 | `usb_typec_policy_engine_timestamped` | Advanced USB | USB3 USB4 and Type-C |
| BB-7500 | `usb_typec_policy_engine_clock_crossing` | Advanced USB | USB3 USB4 and Type-C |
| BB-7501 | `usb_typec_policy_engine_redundant` | Advanced USB | USB3 USB4 and Type-C |
| BB-7502 | `usb_typec_policy_engine_security_filtered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7503 | `usb_typec_policy_engine_protocol_monitor` | Advanced USB | USB3 USB4 and Type-C |
| BB-7504 | `usb_typec_policy_engine_software_configurable` | Advanced USB | USB3 USB4 and Type-C |
| BB-7505 | `usb_power_delivery_engine_initiator` | Advanced USB | USB3 USB4 and Type-C |
| BB-7506 | `usb_power_delivery_engine_target` | Advanced USB | USB3 USB4 and Type-C |
| BB-7507 | `usb_power_delivery_engine_endpoint` | Advanced USB | USB3 USB4 and Type-C |
| BB-7508 | `usb_power_delivery_engine_bridge` | Advanced USB | USB3 USB4 and Type-C |
| BB-7509 | `usb_power_delivery_engine_router` | Advanced USB | USB3 USB4 and Type-C |
| BB-7510 | `usb_power_delivery_engine_packetized` | Advanced USB | USB3 USB4 and Type-C |
| BB-7511 | `usb_power_delivery_engine_buffered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7512 | `usb_power_delivery_engine_dma_attached` | Advanced USB | USB3 USB4 and Type-C |
| BB-7513 | `usb_power_delivery_engine_multi_channel` | Advanced USB | USB3 USB4 and Type-C |
| BB-7514 | `usb_power_delivery_engine_qos_aware` | Advanced USB | USB3 USB4 and Type-C |
| BB-7515 | `usb_power_delivery_engine_timestamped` | Advanced USB | USB3 USB4 and Type-C |
| BB-7516 | `usb_power_delivery_engine_clock_crossing` | Advanced USB | USB3 USB4 and Type-C |
| BB-7517 | `usb_power_delivery_engine_redundant` | Advanced USB | USB3 USB4 and Type-C |
| BB-7518 | `usb_power_delivery_engine_security_filtered` | Advanced USB | USB3 USB4 and Type-C |
| BB-7519 | `usb_power_delivery_engine_protocol_monitor` | Advanced USB | USB3 USB4 and Type-C |
| BB-7520 | `usb_power_delivery_engine_software_configurable` | Advanced USB | USB3 USB4 and Type-C |
| BB-7521 | `sata_link_engine_initiator` | SATA and SAS | Storage serial protocols |
| BB-7522 | `sata_link_engine_target` | SATA and SAS | Storage serial protocols |
| BB-7523 | `sata_link_engine_endpoint` | SATA and SAS | Storage serial protocols |
| BB-7524 | `sata_link_engine_bridge` | SATA and SAS | Storage serial protocols |
| BB-7525 | `sata_link_engine_router` | SATA and SAS | Storage serial protocols |
| BB-7526 | `sata_link_engine_packetized` | SATA and SAS | Storage serial protocols |
| BB-7527 | `sata_link_engine_buffered` | SATA and SAS | Storage serial protocols |
| BB-7528 | `sata_link_engine_dma_attached` | SATA and SAS | Storage serial protocols |
| BB-7529 | `sata_link_engine_multi_channel` | SATA and SAS | Storage serial protocols |
| BB-7530 | `sata_link_engine_qos_aware` | SATA and SAS | Storage serial protocols |
| BB-7531 | `sata_link_engine_timestamped` | SATA and SAS | Storage serial protocols |
| BB-7532 | `sata_link_engine_clock_crossing` | SATA and SAS | Storage serial protocols |
| BB-7533 | `sata_link_engine_redundant` | SATA and SAS | Storage serial protocols |
| BB-7534 | `sata_link_engine_security_filtered` | SATA and SAS | Storage serial protocols |
| BB-7535 | `sata_link_engine_protocol_monitor` | SATA and SAS | Storage serial protocols |
| BB-7536 | `sata_link_engine_software_configurable` | SATA and SAS | Storage serial protocols |
| BB-7537 | `sata_fis_parser_initiator` | SATA and SAS | Storage serial protocols |
| BB-7538 | `sata_fis_parser_target` | SATA and SAS | Storage serial protocols |
| BB-7539 | `sata_fis_parser_endpoint` | SATA and SAS | Storage serial protocols |
| BB-7540 | `sata_fis_parser_bridge` | SATA and SAS | Storage serial protocols |
| BB-7541 | `sata_fis_parser_router` | SATA and SAS | Storage serial protocols |
| BB-7542 | `sata_fis_parser_packetized` | SATA and SAS | Storage serial protocols |
| BB-7543 | `sata_fis_parser_buffered` | SATA and SAS | Storage serial protocols |
| BB-7544 | `sata_fis_parser_dma_attached` | SATA and SAS | Storage serial protocols |
| BB-7545 | `sata_fis_parser_multi_channel` | SATA and SAS | Storage serial protocols |
| BB-7546 | `sata_fis_parser_qos_aware` | SATA and SAS | Storage serial protocols |
| BB-7547 | `sata_fis_parser_timestamped` | SATA and SAS | Storage serial protocols |
| BB-7548 | `sata_fis_parser_clock_crossing` | SATA and SAS | Storage serial protocols |
| BB-7549 | `sata_fis_parser_redundant` | SATA and SAS | Storage serial protocols |
| BB-7550 | `sata_fis_parser_security_filtered` | SATA and SAS | Storage serial protocols |
| BB-7551 | `sata_fis_parser_protocol_monitor` | SATA and SAS | Storage serial protocols |
| BB-7552 | `sata_fis_parser_software_configurable` | SATA and SAS | Storage serial protocols |
| BB-7553 | `sata_ncq_scheduler_initiator` | SATA and SAS | Storage serial protocols |
| BB-7554 | `sata_ncq_scheduler_target` | SATA and SAS | Storage serial protocols |
| BB-7555 | `sata_ncq_scheduler_endpoint` | SATA and SAS | Storage serial protocols |
| BB-7556 | `sata_ncq_scheduler_bridge` | SATA and SAS | Storage serial protocols |
| BB-7557 | `sata_ncq_scheduler_router` | SATA and SAS | Storage serial protocols |
| BB-7558 | `sata_ncq_scheduler_packetized` | SATA and SAS | Storage serial protocols |
| BB-7559 | `sata_ncq_scheduler_buffered` | SATA and SAS | Storage serial protocols |
| BB-7560 | `sata_ncq_scheduler_dma_attached` | SATA and SAS | Storage serial protocols |
| BB-7561 | `sata_ncq_scheduler_multi_channel` | SATA and SAS | Storage serial protocols |
| BB-7562 | `sata_ncq_scheduler_qos_aware` | SATA and SAS | Storage serial protocols |
| BB-7563 | `sata_ncq_scheduler_timestamped` | SATA and SAS | Storage serial protocols |
| BB-7564 | `sata_ncq_scheduler_clock_crossing` | SATA and SAS | Storage serial protocols |
| BB-7565 | `sata_ncq_scheduler_redundant` | SATA and SAS | Storage serial protocols |
| BB-7566 | `sata_ncq_scheduler_security_filtered` | SATA and SAS | Storage serial protocols |
| BB-7567 | `sata_ncq_scheduler_protocol_monitor` | SATA and SAS | Storage serial protocols |
| BB-7568 | `sata_ncq_scheduler_software_configurable` | SATA and SAS | Storage serial protocols |
| BB-7569 | `sas_ssp_engine_initiator` | SATA and SAS | Storage serial protocols |
| BB-7570 | `sas_ssp_engine_target` | SATA and SAS | Storage serial protocols |
| BB-7571 | `sas_ssp_engine_endpoint` | SATA and SAS | Storage serial protocols |
| BB-7572 | `sas_ssp_engine_bridge` | SATA and SAS | Storage serial protocols |
| BB-7573 | `sas_ssp_engine_router` | SATA and SAS | Storage serial protocols |
| BB-7574 | `sas_ssp_engine_packetized` | SATA and SAS | Storage serial protocols |
| BB-7575 | `sas_ssp_engine_buffered` | SATA and SAS | Storage serial protocols |
| BB-7576 | `sas_ssp_engine_dma_attached` | SATA and SAS | Storage serial protocols |
| BB-7577 | `sas_ssp_engine_multi_channel` | SATA and SAS | Storage serial protocols |
| BB-7578 | `sas_ssp_engine_qos_aware` | SATA and SAS | Storage serial protocols |
| BB-7579 | `sas_ssp_engine_timestamped` | SATA and SAS | Storage serial protocols |
| BB-7580 | `sas_ssp_engine_clock_crossing` | SATA and SAS | Storage serial protocols |
| BB-7581 | `sas_ssp_engine_redundant` | SATA and SAS | Storage serial protocols |
| BB-7582 | `sas_ssp_engine_security_filtered` | SATA and SAS | Storage serial protocols |
| BB-7583 | `sas_ssp_engine_protocol_monitor` | SATA and SAS | Storage serial protocols |
| BB-7584 | `sas_ssp_engine_software_configurable` | SATA and SAS | Storage serial protocols |
| BB-7585 | `storage_phy_oob_controller_initiator` | SATA and SAS | Storage serial protocols |
| BB-7586 | `storage_phy_oob_controller_target` | SATA and SAS | Storage serial protocols |
| BB-7587 | `storage_phy_oob_controller_endpoint` | SATA and SAS | Storage serial protocols |
| BB-7588 | `storage_phy_oob_controller_bridge` | SATA and SAS | Storage serial protocols |
| BB-7589 | `storage_phy_oob_controller_router` | SATA and SAS | Storage serial protocols |
| BB-7590 | `storage_phy_oob_controller_packetized` | SATA and SAS | Storage serial protocols |
| BB-7591 | `storage_phy_oob_controller_buffered` | SATA and SAS | Storage serial protocols |
| BB-7592 | `storage_phy_oob_controller_dma_attached` | SATA and SAS | Storage serial protocols |
| BB-7593 | `storage_phy_oob_controller_multi_channel` | SATA and SAS | Storage serial protocols |
| BB-7594 | `storage_phy_oob_controller_qos_aware` | SATA and SAS | Storage serial protocols |
| BB-7595 | `storage_phy_oob_controller_timestamped` | SATA and SAS | Storage serial protocols |
| BB-7596 | `storage_phy_oob_controller_clock_crossing` | SATA and SAS | Storage serial protocols |
| BB-7597 | `storage_phy_oob_controller_redundant` | SATA and SAS | Storage serial protocols |
| BB-7598 | `storage_phy_oob_controller_security_filtered` | SATA and SAS | Storage serial protocols |
| BB-7599 | `storage_phy_oob_controller_protocol_monitor` | SATA and SAS | Storage serial protocols |
| BB-7600 | `storage_phy_oob_controller_software_configurable` | SATA and SAS | Storage serial protocols |
| BB-7601 | `mipi_csi2_packet_decoder_initiator` | MIPI Interfaces | Camera and display serial links |
| BB-7602 | `mipi_csi2_packet_decoder_target` | MIPI Interfaces | Camera and display serial links |
| BB-7603 | `mipi_csi2_packet_decoder_endpoint` | MIPI Interfaces | Camera and display serial links |
| BB-7604 | `mipi_csi2_packet_decoder_bridge` | MIPI Interfaces | Camera and display serial links |
| BB-7605 | `mipi_csi2_packet_decoder_router` | MIPI Interfaces | Camera and display serial links |
| BB-7606 | `mipi_csi2_packet_decoder_packetized` | MIPI Interfaces | Camera and display serial links |
| BB-7607 | `mipi_csi2_packet_decoder_buffered` | MIPI Interfaces | Camera and display serial links |
| BB-7608 | `mipi_csi2_packet_decoder_dma_attached` | MIPI Interfaces | Camera and display serial links |
| BB-7609 | `mipi_csi2_packet_decoder_multi_channel` | MIPI Interfaces | Camera and display serial links |
| BB-7610 | `mipi_csi2_packet_decoder_qos_aware` | MIPI Interfaces | Camera and display serial links |
| BB-7611 | `mipi_csi2_packet_decoder_timestamped` | MIPI Interfaces | Camera and display serial links |
| BB-7612 | `mipi_csi2_packet_decoder_clock_crossing` | MIPI Interfaces | Camera and display serial links |
| BB-7613 | `mipi_csi2_packet_decoder_redundant` | MIPI Interfaces | Camera and display serial links |
| BB-7614 | `mipi_csi2_packet_decoder_security_filtered` | MIPI Interfaces | Camera and display serial links |
| BB-7615 | `mipi_csi2_packet_decoder_protocol_monitor` | MIPI Interfaces | Camera and display serial links |
| BB-7616 | `mipi_csi2_packet_decoder_software_configurable` | MIPI Interfaces | Camera and display serial links |
| BB-7617 | `mipi_csi2_ecc_checker_initiator` | MIPI Interfaces | Camera and display serial links |
| BB-7618 | `mipi_csi2_ecc_checker_target` | MIPI Interfaces | Camera and display serial links |
| BB-7619 | `mipi_csi2_ecc_checker_endpoint` | MIPI Interfaces | Camera and display serial links |
| BB-7620 | `mipi_csi2_ecc_checker_bridge` | MIPI Interfaces | Camera and display serial links |
| BB-7621 | `mipi_csi2_ecc_checker_router` | MIPI Interfaces | Camera and display serial links |
| BB-7622 | `mipi_csi2_ecc_checker_packetized` | MIPI Interfaces | Camera and display serial links |
| BB-7623 | `mipi_csi2_ecc_checker_buffered` | MIPI Interfaces | Camera and display serial links |
| BB-7624 | `mipi_csi2_ecc_checker_dma_attached` | MIPI Interfaces | Camera and display serial links |
| BB-7625 | `mipi_csi2_ecc_checker_multi_channel` | MIPI Interfaces | Camera and display serial links |
| BB-7626 | `mipi_csi2_ecc_checker_qos_aware` | MIPI Interfaces | Camera and display serial links |
| BB-7627 | `mipi_csi2_ecc_checker_timestamped` | MIPI Interfaces | Camera and display serial links |
| BB-7628 | `mipi_csi2_ecc_checker_clock_crossing` | MIPI Interfaces | Camera and display serial links |
| BB-7629 | `mipi_csi2_ecc_checker_redundant` | MIPI Interfaces | Camera and display serial links |
| BB-7630 | `mipi_csi2_ecc_checker_security_filtered` | MIPI Interfaces | Camera and display serial links |
| BB-7631 | `mipi_csi2_ecc_checker_protocol_monitor` | MIPI Interfaces | Camera and display serial links |
| BB-7632 | `mipi_csi2_ecc_checker_software_configurable` | MIPI Interfaces | Camera and display serial links |
| BB-7633 | `mipi_dsi_packet_generator_initiator` | MIPI Interfaces | Camera and display serial links |
| BB-7634 | `mipi_dsi_packet_generator_target` | MIPI Interfaces | Camera and display serial links |
| BB-7635 | `mipi_dsi_packet_generator_endpoint` | MIPI Interfaces | Camera and display serial links |
| BB-7636 | `mipi_dsi_packet_generator_bridge` | MIPI Interfaces | Camera and display serial links |
| BB-7637 | `mipi_dsi_packet_generator_router` | MIPI Interfaces | Camera and display serial links |
| BB-7638 | `mipi_dsi_packet_generator_packetized` | MIPI Interfaces | Camera and display serial links |
| BB-7639 | `mipi_dsi_packet_generator_buffered` | MIPI Interfaces | Camera and display serial links |
| BB-7640 | `mipi_dsi_packet_generator_dma_attached` | MIPI Interfaces | Camera and display serial links |
| BB-7641 | `mipi_dsi_packet_generator_multi_channel` | MIPI Interfaces | Camera and display serial links |
| BB-7642 | `mipi_dsi_packet_generator_qos_aware` | MIPI Interfaces | Camera and display serial links |
| BB-7643 | `mipi_dsi_packet_generator_timestamped` | MIPI Interfaces | Camera and display serial links |
| BB-7644 | `mipi_dsi_packet_generator_clock_crossing` | MIPI Interfaces | Camera and display serial links |
| BB-7645 | `mipi_dsi_packet_generator_redundant` | MIPI Interfaces | Camera and display serial links |
| BB-7646 | `mipi_dsi_packet_generator_security_filtered` | MIPI Interfaces | Camera and display serial links |
| BB-7647 | `mipi_dsi_packet_generator_protocol_monitor` | MIPI Interfaces | Camera and display serial links |
| BB-7648 | `mipi_dsi_packet_generator_software_configurable` | MIPI Interfaces | Camera and display serial links |
| BB-7649 | `mipi_cphy_symbol_decoder_initiator` | MIPI Interfaces | Camera and display serial links |
| BB-7650 | `mipi_cphy_symbol_decoder_target` | MIPI Interfaces | Camera and display serial links |
| BB-7651 | `mipi_cphy_symbol_decoder_endpoint` | MIPI Interfaces | Camera and display serial links |
| BB-7652 | `mipi_cphy_symbol_decoder_bridge` | MIPI Interfaces | Camera and display serial links |
| BB-7653 | `mipi_cphy_symbol_decoder_router` | MIPI Interfaces | Camera and display serial links |
| BB-7654 | `mipi_cphy_symbol_decoder_packetized` | MIPI Interfaces | Camera and display serial links |
| BB-7655 | `mipi_cphy_symbol_decoder_buffered` | MIPI Interfaces | Camera and display serial links |
| BB-7656 | `mipi_cphy_symbol_decoder_dma_attached` | MIPI Interfaces | Camera and display serial links |
| BB-7657 | `mipi_cphy_symbol_decoder_multi_channel` | MIPI Interfaces | Camera and display serial links |
| BB-7658 | `mipi_cphy_symbol_decoder_qos_aware` | MIPI Interfaces | Camera and display serial links |
| BB-7659 | `mipi_cphy_symbol_decoder_timestamped` | MIPI Interfaces | Camera and display serial links |
| BB-7660 | `mipi_cphy_symbol_decoder_clock_crossing` | MIPI Interfaces | Camera and display serial links |
| BB-7661 | `mipi_cphy_symbol_decoder_redundant` | MIPI Interfaces | Camera and display serial links |
| BB-7662 | `mipi_cphy_symbol_decoder_security_filtered` | MIPI Interfaces | Camera and display serial links |
| BB-7663 | `mipi_cphy_symbol_decoder_protocol_monitor` | MIPI Interfaces | Camera and display serial links |
| BB-7664 | `mipi_cphy_symbol_decoder_software_configurable` | MIPI Interfaces | Camera and display serial links |
| BB-7665 | `mipi_dphy_lane_controller_initiator` | MIPI Interfaces | Camera and display serial links |
| BB-7666 | `mipi_dphy_lane_controller_target` | MIPI Interfaces | Camera and display serial links |
| BB-7667 | `mipi_dphy_lane_controller_endpoint` | MIPI Interfaces | Camera and display serial links |
| BB-7668 | `mipi_dphy_lane_controller_bridge` | MIPI Interfaces | Camera and display serial links |
| BB-7669 | `mipi_dphy_lane_controller_router` | MIPI Interfaces | Camera and display serial links |
| BB-7670 | `mipi_dphy_lane_controller_packetized` | MIPI Interfaces | Camera and display serial links |
| BB-7671 | `mipi_dphy_lane_controller_buffered` | MIPI Interfaces | Camera and display serial links |
| BB-7672 | `mipi_dphy_lane_controller_dma_attached` | MIPI Interfaces | Camera and display serial links |
| BB-7673 | `mipi_dphy_lane_controller_multi_channel` | MIPI Interfaces | Camera and display serial links |
| BB-7674 | `mipi_dphy_lane_controller_qos_aware` | MIPI Interfaces | Camera and display serial links |
| BB-7675 | `mipi_dphy_lane_controller_timestamped` | MIPI Interfaces | Camera and display serial links |
| BB-7676 | `mipi_dphy_lane_controller_clock_crossing` | MIPI Interfaces | Camera and display serial links |
| BB-7677 | `mipi_dphy_lane_controller_redundant` | MIPI Interfaces | Camera and display serial links |
| BB-7678 | `mipi_dphy_lane_controller_security_filtered` | MIPI Interfaces | Camera and display serial links |
| BB-7679 | `mipi_dphy_lane_controller_protocol_monitor` | MIPI Interfaces | Camera and display serial links |
| BB-7680 | `mipi_dphy_lane_controller_software_configurable` | MIPI Interfaces | Camera and display serial links |
| BB-7681 | `jesd204b_transport_layer_initiator` | JESD204 Interfaces | Converter serial links |
| BB-7682 | `jesd204b_transport_layer_target` | JESD204 Interfaces | Converter serial links |
| BB-7683 | `jesd204b_transport_layer_endpoint` | JESD204 Interfaces | Converter serial links |
| BB-7684 | `jesd204b_transport_layer_bridge` | JESD204 Interfaces | Converter serial links |
| BB-7685 | `jesd204b_transport_layer_router` | JESD204 Interfaces | Converter serial links |
| BB-7686 | `jesd204b_transport_layer_packetized` | JESD204 Interfaces | Converter serial links |
| BB-7687 | `jesd204b_transport_layer_buffered` | JESD204 Interfaces | Converter serial links |
| BB-7688 | `jesd204b_transport_layer_dma_attached` | JESD204 Interfaces | Converter serial links |
| BB-7689 | `jesd204b_transport_layer_multi_channel` | JESD204 Interfaces | Converter serial links |
| BB-7690 | `jesd204b_transport_layer_qos_aware` | JESD204 Interfaces | Converter serial links |
| BB-7691 | `jesd204b_transport_layer_timestamped` | JESD204 Interfaces | Converter serial links |
| BB-7692 | `jesd204b_transport_layer_clock_crossing` | JESD204 Interfaces | Converter serial links |
| BB-7693 | `jesd204b_transport_layer_redundant` | JESD204 Interfaces | Converter serial links |
| BB-7694 | `jesd204b_transport_layer_security_filtered` | JESD204 Interfaces | Converter serial links |
| BB-7695 | `jesd204b_transport_layer_protocol_monitor` | JESD204 Interfaces | Converter serial links |
| BB-7696 | `jesd204b_transport_layer_software_configurable` | JESD204 Interfaces | Converter serial links |
| BB-7697 | `jesd204b_lane_alignment_initiator` | JESD204 Interfaces | Converter serial links |
| BB-7698 | `jesd204b_lane_alignment_target` | JESD204 Interfaces | Converter serial links |
| BB-7699 | `jesd204b_lane_alignment_endpoint` | JESD204 Interfaces | Converter serial links |
| BB-7700 | `jesd204b_lane_alignment_bridge` | JESD204 Interfaces | Converter serial links |
| BB-7701 | `jesd204b_lane_alignment_router` | JESD204 Interfaces | Converter serial links |
| BB-7702 | `jesd204b_lane_alignment_packetized` | JESD204 Interfaces | Converter serial links |
| BB-7703 | `jesd204b_lane_alignment_buffered` | JESD204 Interfaces | Converter serial links |
| BB-7704 | `jesd204b_lane_alignment_dma_attached` | JESD204 Interfaces | Converter serial links |
| BB-7705 | `jesd204b_lane_alignment_multi_channel` | JESD204 Interfaces | Converter serial links |
| BB-7706 | `jesd204b_lane_alignment_qos_aware` | JESD204 Interfaces | Converter serial links |
| BB-7707 | `jesd204b_lane_alignment_timestamped` | JESD204 Interfaces | Converter serial links |
| BB-7708 | `jesd204b_lane_alignment_clock_crossing` | JESD204 Interfaces | Converter serial links |
| BB-7709 | `jesd204b_lane_alignment_redundant` | JESD204 Interfaces | Converter serial links |
| BB-7710 | `jesd204b_lane_alignment_security_filtered` | JESD204 Interfaces | Converter serial links |
| BB-7711 | `jesd204b_lane_alignment_protocol_monitor` | JESD204 Interfaces | Converter serial links |
| BB-7712 | `jesd204b_lane_alignment_software_configurable` | JESD204 Interfaces | Converter serial links |
| BB-7713 | `jesd204c_64b66b_codec_initiator` | JESD204 Interfaces | Converter serial links |
| BB-7714 | `jesd204c_64b66b_codec_target` | JESD204 Interfaces | Converter serial links |
| BB-7715 | `jesd204c_64b66b_codec_endpoint` | JESD204 Interfaces | Converter serial links |
| BB-7716 | `jesd204c_64b66b_codec_bridge` | JESD204 Interfaces | Converter serial links |
| BB-7717 | `jesd204c_64b66b_codec_router` | JESD204 Interfaces | Converter serial links |
| BB-7718 | `jesd204c_64b66b_codec_packetized` | JESD204 Interfaces | Converter serial links |
| BB-7719 | `jesd204c_64b66b_codec_buffered` | JESD204 Interfaces | Converter serial links |
| BB-7720 | `jesd204c_64b66b_codec_dma_attached` | JESD204 Interfaces | Converter serial links |
| BB-7721 | `jesd204c_64b66b_codec_multi_channel` | JESD204 Interfaces | Converter serial links |
| BB-7722 | `jesd204c_64b66b_codec_qos_aware` | JESD204 Interfaces | Converter serial links |
| BB-7723 | `jesd204c_64b66b_codec_timestamped` | JESD204 Interfaces | Converter serial links |
| BB-7724 | `jesd204c_64b66b_codec_clock_crossing` | JESD204 Interfaces | Converter serial links |
| BB-7725 | `jesd204c_64b66b_codec_redundant` | JESD204 Interfaces | Converter serial links |
| BB-7726 | `jesd204c_64b66b_codec_security_filtered` | JESD204 Interfaces | Converter serial links |
| BB-7727 | `jesd204c_64b66b_codec_protocol_monitor` | JESD204 Interfaces | Converter serial links |
| BB-7728 | `jesd204c_64b66b_codec_software_configurable` | JESD204 Interfaces | Converter serial links |
| BB-7729 | `jesd204_sysref_monitor_initiator` | JESD204 Interfaces | Converter serial links |
| BB-7730 | `jesd204_sysref_monitor_target` | JESD204 Interfaces | Converter serial links |
| BB-7731 | `jesd204_sysref_monitor_endpoint` | JESD204 Interfaces | Converter serial links |
| BB-7732 | `jesd204_sysref_monitor_bridge` | JESD204 Interfaces | Converter serial links |
| BB-7733 | `jesd204_sysref_monitor_router` | JESD204 Interfaces | Converter serial links |
| BB-7734 | `jesd204_sysref_monitor_packetized` | JESD204 Interfaces | Converter serial links |
| BB-7735 | `jesd204_sysref_monitor_buffered` | JESD204 Interfaces | Converter serial links |
| BB-7736 | `jesd204_sysref_monitor_dma_attached` | JESD204 Interfaces | Converter serial links |
| BB-7737 | `jesd204_sysref_monitor_multi_channel` | JESD204 Interfaces | Converter serial links |
| BB-7738 | `jesd204_sysref_monitor_qos_aware` | JESD204 Interfaces | Converter serial links |
| BB-7739 | `jesd204_sysref_monitor_timestamped` | JESD204 Interfaces | Converter serial links |
| BB-7740 | `jesd204_sysref_monitor_clock_crossing` | JESD204 Interfaces | Converter serial links |
| BB-7741 | `jesd204_sysref_monitor_redundant` | JESD204 Interfaces | Converter serial links |
| BB-7742 | `jesd204_sysref_monitor_security_filtered` | JESD204 Interfaces | Converter serial links |
| BB-7743 | `jesd204_sysref_monitor_protocol_monitor` | JESD204 Interfaces | Converter serial links |
| BB-7744 | `jesd204_sysref_monitor_software_configurable` | JESD204 Interfaces | Converter serial links |
| BB-7745 | `jesd204_deterministic_latency_initiator` | JESD204 Interfaces | Converter serial links |
| BB-7746 | `jesd204_deterministic_latency_target` | JESD204 Interfaces | Converter serial links |
| BB-7747 | `jesd204_deterministic_latency_endpoint` | JESD204 Interfaces | Converter serial links |
| BB-7748 | `jesd204_deterministic_latency_bridge` | JESD204 Interfaces | Converter serial links |
| BB-7749 | `jesd204_deterministic_latency_router` | JESD204 Interfaces | Converter serial links |
| BB-7750 | `jesd204_deterministic_latency_packetized` | JESD204 Interfaces | Converter serial links |
| BB-7751 | `jesd204_deterministic_latency_buffered` | JESD204 Interfaces | Converter serial links |
| BB-7752 | `jesd204_deterministic_latency_dma_attached` | JESD204 Interfaces | Converter serial links |
| BB-7753 | `jesd204_deterministic_latency_multi_channel` | JESD204 Interfaces | Converter serial links |
| BB-7754 | `jesd204_deterministic_latency_qos_aware` | JESD204 Interfaces | Converter serial links |
| BB-7755 | `jesd204_deterministic_latency_timestamped` | JESD204 Interfaces | Converter serial links |
| BB-7756 | `jesd204_deterministic_latency_clock_crossing` | JESD204 Interfaces | Converter serial links |
| BB-7757 | `jesd204_deterministic_latency_redundant` | JESD204 Interfaces | Converter serial links |
| BB-7758 | `jesd204_deterministic_latency_security_filtered` | JESD204 Interfaces | Converter serial links |
| BB-7759 | `jesd204_deterministic_latency_protocol_monitor` | JESD204 Interfaces | Converter serial links |
| BB-7760 | `jesd204_deterministic_latency_software_configurable` | JESD204 Interfaces | Converter serial links |
| BB-7761 | `hdmi_frl_packetizer_initiator` | HDMI and DisplayPort | Modern display links |
| BB-7762 | `hdmi_frl_packetizer_target` | HDMI and DisplayPort | Modern display links |
| BB-7763 | `hdmi_frl_packetizer_endpoint` | HDMI and DisplayPort | Modern display links |
| BB-7764 | `hdmi_frl_packetizer_bridge` | HDMI and DisplayPort | Modern display links |
| BB-7765 | `hdmi_frl_packetizer_router` | HDMI and DisplayPort | Modern display links |
| BB-7766 | `hdmi_frl_packetizer_packetized` | HDMI and DisplayPort | Modern display links |
| BB-7767 | `hdmi_frl_packetizer_buffered` | HDMI and DisplayPort | Modern display links |
| BB-7768 | `hdmi_frl_packetizer_dma_attached` | HDMI and DisplayPort | Modern display links |
| BB-7769 | `hdmi_frl_packetizer_multi_channel` | HDMI and DisplayPort | Modern display links |
| BB-7770 | `hdmi_frl_packetizer_qos_aware` | HDMI and DisplayPort | Modern display links |
| BB-7771 | `hdmi_frl_packetizer_timestamped` | HDMI and DisplayPort | Modern display links |
| BB-7772 | `hdmi_frl_packetizer_clock_crossing` | HDMI and DisplayPort | Modern display links |
| BB-7773 | `hdmi_frl_packetizer_redundant` | HDMI and DisplayPort | Modern display links |
| BB-7774 | `hdmi_frl_packetizer_security_filtered` | HDMI and DisplayPort | Modern display links |
| BB-7775 | `hdmi_frl_packetizer_protocol_monitor` | HDMI and DisplayPort | Modern display links |
| BB-7776 | `hdmi_frl_packetizer_software_configurable` | HDMI and DisplayPort | Modern display links |
| BB-7777 | `hdmi_audio_packet_generator_initiator` | HDMI and DisplayPort | Modern display links |
| BB-7778 | `hdmi_audio_packet_generator_target` | HDMI and DisplayPort | Modern display links |
| BB-7779 | `hdmi_audio_packet_generator_endpoint` | HDMI and DisplayPort | Modern display links |
| BB-7780 | `hdmi_audio_packet_generator_bridge` | HDMI and DisplayPort | Modern display links |
| BB-7781 | `hdmi_audio_packet_generator_router` | HDMI and DisplayPort | Modern display links |
| BB-7782 | `hdmi_audio_packet_generator_packetized` | HDMI and DisplayPort | Modern display links |
| BB-7783 | `hdmi_audio_packet_generator_buffered` | HDMI and DisplayPort | Modern display links |
| BB-7784 | `hdmi_audio_packet_generator_dma_attached` | HDMI and DisplayPort | Modern display links |
| BB-7785 | `hdmi_audio_packet_generator_multi_channel` | HDMI and DisplayPort | Modern display links |
| BB-7786 | `hdmi_audio_packet_generator_qos_aware` | HDMI and DisplayPort | Modern display links |
| BB-7787 | `hdmi_audio_packet_generator_timestamped` | HDMI and DisplayPort | Modern display links |
| BB-7788 | `hdmi_audio_packet_generator_clock_crossing` | HDMI and DisplayPort | Modern display links |
| BB-7789 | `hdmi_audio_packet_generator_redundant` | HDMI and DisplayPort | Modern display links |
| BB-7790 | `hdmi_audio_packet_generator_security_filtered` | HDMI and DisplayPort | Modern display links |
| BB-7791 | `hdmi_audio_packet_generator_protocol_monitor` | HDMI and DisplayPort | Modern display links |
| BB-7792 | `hdmi_audio_packet_generator_software_configurable` | HDMI and DisplayPort | Modern display links |
| BB-7793 | `displayport_main_link_encoder_initiator` | HDMI and DisplayPort | Modern display links |
| BB-7794 | `displayport_main_link_encoder_target` | HDMI and DisplayPort | Modern display links |
| BB-7795 | `displayport_main_link_encoder_endpoint` | HDMI and DisplayPort | Modern display links |
| BB-7796 | `displayport_main_link_encoder_bridge` | HDMI and DisplayPort | Modern display links |
| BB-7797 | `displayport_main_link_encoder_router` | HDMI and DisplayPort | Modern display links |
| BB-7798 | `displayport_main_link_encoder_packetized` | HDMI and DisplayPort | Modern display links |
| BB-7799 | `displayport_main_link_encoder_buffered` | HDMI and DisplayPort | Modern display links |
| BB-7800 | `displayport_main_link_encoder_dma_attached` | HDMI and DisplayPort | Modern display links |
| BB-7801 | `displayport_main_link_encoder_multi_channel` | HDMI and DisplayPort | Modern display links |
| BB-7802 | `displayport_main_link_encoder_qos_aware` | HDMI and DisplayPort | Modern display links |
| BB-7803 | `displayport_main_link_encoder_timestamped` | HDMI and DisplayPort | Modern display links |
| BB-7804 | `displayport_main_link_encoder_clock_crossing` | HDMI and DisplayPort | Modern display links |
| BB-7805 | `displayport_main_link_encoder_redundant` | HDMI and DisplayPort | Modern display links |
| BB-7806 | `displayport_main_link_encoder_security_filtered` | HDMI and DisplayPort | Modern display links |
| BB-7807 | `displayport_main_link_encoder_protocol_monitor` | HDMI and DisplayPort | Modern display links |
| BB-7808 | `displayport_main_link_encoder_software_configurable` | HDMI and DisplayPort | Modern display links |
| BB-7809 | `displayport_aux_channel_initiator` | HDMI and DisplayPort | Modern display links |
| BB-7810 | `displayport_aux_channel_target` | HDMI and DisplayPort | Modern display links |
| BB-7811 | `displayport_aux_channel_endpoint` | HDMI and DisplayPort | Modern display links |
| BB-7812 | `displayport_aux_channel_bridge` | HDMI and DisplayPort | Modern display links |
| BB-7813 | `displayport_aux_channel_router` | HDMI and DisplayPort | Modern display links |
| BB-7814 | `displayport_aux_channel_packetized` | HDMI and DisplayPort | Modern display links |
| BB-7815 | `displayport_aux_channel_buffered` | HDMI and DisplayPort | Modern display links |
| BB-7816 | `displayport_aux_channel_dma_attached` | HDMI and DisplayPort | Modern display links |
| BB-7817 | `displayport_aux_channel_multi_channel` | HDMI and DisplayPort | Modern display links |
| BB-7818 | `displayport_aux_channel_qos_aware` | HDMI and DisplayPort | Modern display links |
| BB-7819 | `displayport_aux_channel_timestamped` | HDMI and DisplayPort | Modern display links |
| BB-7820 | `displayport_aux_channel_clock_crossing` | HDMI and DisplayPort | Modern display links |
| BB-7821 | `displayport_aux_channel_redundant` | HDMI and DisplayPort | Modern display links |
| BB-7822 | `displayport_aux_channel_security_filtered` | HDMI and DisplayPort | Modern display links |
| BB-7823 | `displayport_aux_channel_protocol_monitor` | HDMI and DisplayPort | Modern display links |
| BB-7824 | `displayport_aux_channel_software_configurable` | HDMI and DisplayPort | Modern display links |
| BB-7825 | `display_stream_compression_engine_initiator` | HDMI and DisplayPort | Modern display links |
| BB-7826 | `display_stream_compression_engine_target` | HDMI and DisplayPort | Modern display links |
| BB-7827 | `display_stream_compression_engine_endpoint` | HDMI and DisplayPort | Modern display links |
| BB-7828 | `display_stream_compression_engine_bridge` | HDMI and DisplayPort | Modern display links |
| BB-7829 | `display_stream_compression_engine_router` | HDMI and DisplayPort | Modern display links |
| BB-7830 | `display_stream_compression_engine_packetized` | HDMI and DisplayPort | Modern display links |
| BB-7831 | `display_stream_compression_engine_buffered` | HDMI and DisplayPort | Modern display links |
| BB-7832 | `display_stream_compression_engine_dma_attached` | HDMI and DisplayPort | Modern display links |
| BB-7833 | `display_stream_compression_engine_multi_channel` | HDMI and DisplayPort | Modern display links |
| BB-7834 | `display_stream_compression_engine_qos_aware` | HDMI and DisplayPort | Modern display links |
| BB-7835 | `display_stream_compression_engine_timestamped` | HDMI and DisplayPort | Modern display links |
| BB-7836 | `display_stream_compression_engine_clock_crossing` | HDMI and DisplayPort | Modern display links |
| BB-7837 | `display_stream_compression_engine_redundant` | HDMI and DisplayPort | Modern display links |
| BB-7838 | `display_stream_compression_engine_security_filtered` | HDMI and DisplayPort | Modern display links |
| BB-7839 | `display_stream_compression_engine_protocol_monitor` | HDMI and DisplayPort | Modern display links |
| BB-7840 | `display_stream_compression_engine_software_configurable` | HDMI and DisplayPort | Modern display links |
| BB-7841 | `temporal_noise_reduction_streaming` | Advanced Camera ISP | Computational camera processing |
| BB-7842 | `temporal_noise_reduction_framebuffer` | Advanced Camera ISP | Computational camera processing |
| BB-7843 | `temporal_noise_reduction_line_buffered` | Advanced Camera ISP | Computational camera processing |
| BB-7844 | `temporal_noise_reduction_tile_based` | Advanced Camera ISP | Computational camera processing |
| BB-7845 | `temporal_noise_reduction_multi_plane` | Advanced Camera ISP | Computational camera processing |
| BB-7846 | `temporal_noise_reduction_multi_channel` | Advanced Camera ISP | Computational camera processing |
| BB-7847 | `temporal_noise_reduction_fixed_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7848 | `temporal_noise_reduction_low_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7849 | `temporal_noise_reduction_high_throughput` | Advanced Camera ISP | Computational camera processing |
| BB-7850 | `temporal_noise_reduction_rate_adaptive` | Advanced Camera ISP | Computational camera processing |
| BB-7851 | `temporal_noise_reduction_clock_crossing` | Advanced Camera ISP | Computational camera processing |
| BB-7852 | `temporal_noise_reduction_metadata_aware` | Advanced Camera ISP | Computational camera processing |
| BB-7853 | `temporal_noise_reduction_error_resilient` | Advanced Camera ISP | Computational camera processing |
| BB-7854 | `temporal_noise_reduction_programmable` | Advanced Camera ISP | Computational camera processing |
| BB-7855 | `temporal_noise_reduction_low_power` | Advanced Camera ISP | Computational camera processing |
| BB-7856 | `temporal_noise_reduction_axi_stream` | Advanced Camera ISP | Computational camera processing |
| BB-7857 | `spatial_noise_reduction_streaming` | Advanced Camera ISP | Computational camera processing |
| BB-7858 | `spatial_noise_reduction_framebuffer` | Advanced Camera ISP | Computational camera processing |
| BB-7859 | `spatial_noise_reduction_line_buffered` | Advanced Camera ISP | Computational camera processing |
| BB-7860 | `spatial_noise_reduction_tile_based` | Advanced Camera ISP | Computational camera processing |
| BB-7861 | `spatial_noise_reduction_multi_plane` | Advanced Camera ISP | Computational camera processing |
| BB-7862 | `spatial_noise_reduction_multi_channel` | Advanced Camera ISP | Computational camera processing |
| BB-7863 | `spatial_noise_reduction_fixed_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7864 | `spatial_noise_reduction_low_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7865 | `spatial_noise_reduction_high_throughput` | Advanced Camera ISP | Computational camera processing |
| BB-7866 | `spatial_noise_reduction_rate_adaptive` | Advanced Camera ISP | Computational camera processing |
| BB-7867 | `spatial_noise_reduction_clock_crossing` | Advanced Camera ISP | Computational camera processing |
| BB-7868 | `spatial_noise_reduction_metadata_aware` | Advanced Camera ISP | Computational camera processing |
| BB-7869 | `spatial_noise_reduction_error_resilient` | Advanced Camera ISP | Computational camera processing |
| BB-7870 | `spatial_noise_reduction_programmable` | Advanced Camera ISP | Computational camera processing |
| BB-7871 | `spatial_noise_reduction_low_power` | Advanced Camera ISP | Computational camera processing |
| BB-7872 | `spatial_noise_reduction_axi_stream` | Advanced Camera ISP | Computational camera processing |
| BB-7873 | `hdr_merge_engine_streaming` | Advanced Camera ISP | Computational camera processing |
| BB-7874 | `hdr_merge_engine_framebuffer` | Advanced Camera ISP | Computational camera processing |
| BB-7875 | `hdr_merge_engine_line_buffered` | Advanced Camera ISP | Computational camera processing |
| BB-7876 | `hdr_merge_engine_tile_based` | Advanced Camera ISP | Computational camera processing |
| BB-7877 | `hdr_merge_engine_multi_plane` | Advanced Camera ISP | Computational camera processing |
| BB-7878 | `hdr_merge_engine_multi_channel` | Advanced Camera ISP | Computational camera processing |
| BB-7879 | `hdr_merge_engine_fixed_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7880 | `hdr_merge_engine_low_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7881 | `hdr_merge_engine_high_throughput` | Advanced Camera ISP | Computational camera processing |
| BB-7882 | `hdr_merge_engine_rate_adaptive` | Advanced Camera ISP | Computational camera processing |
| BB-7883 | `hdr_merge_engine_clock_crossing` | Advanced Camera ISP | Computational camera processing |
| BB-7884 | `hdr_merge_engine_metadata_aware` | Advanced Camera ISP | Computational camera processing |
| BB-7885 | `hdr_merge_engine_error_resilient` | Advanced Camera ISP | Computational camera processing |
| BB-7886 | `hdr_merge_engine_programmable` | Advanced Camera ISP | Computational camera processing |
| BB-7887 | `hdr_merge_engine_low_power` | Advanced Camera ISP | Computational camera processing |
| BB-7888 | `hdr_merge_engine_axi_stream` | Advanced Camera ISP | Computational camera processing |
| BB-7889 | `rolling_shutter_corrector_streaming` | Advanced Camera ISP | Computational camera processing |
| BB-7890 | `rolling_shutter_corrector_framebuffer` | Advanced Camera ISP | Computational camera processing |
| BB-7891 | `rolling_shutter_corrector_line_buffered` | Advanced Camera ISP | Computational camera processing |
| BB-7892 | `rolling_shutter_corrector_tile_based` | Advanced Camera ISP | Computational camera processing |
| BB-7893 | `rolling_shutter_corrector_multi_plane` | Advanced Camera ISP | Computational camera processing |
| BB-7894 | `rolling_shutter_corrector_multi_channel` | Advanced Camera ISP | Computational camera processing |
| BB-7895 | `rolling_shutter_corrector_fixed_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7896 | `rolling_shutter_corrector_low_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7897 | `rolling_shutter_corrector_high_throughput` | Advanced Camera ISP | Computational camera processing |
| BB-7898 | `rolling_shutter_corrector_rate_adaptive` | Advanced Camera ISP | Computational camera processing |
| BB-7899 | `rolling_shutter_corrector_clock_crossing` | Advanced Camera ISP | Computational camera processing |
| BB-7900 | `rolling_shutter_corrector_metadata_aware` | Advanced Camera ISP | Computational camera processing |
| BB-7901 | `rolling_shutter_corrector_error_resilient` | Advanced Camera ISP | Computational camera processing |
| BB-7902 | `rolling_shutter_corrector_programmable` | Advanced Camera ISP | Computational camera processing |
| BB-7903 | `rolling_shutter_corrector_low_power` | Advanced Camera ISP | Computational camera processing |
| BB-7904 | `rolling_shutter_corrector_axi_stream` | Advanced Camera ISP | Computational camera processing |
| BB-7905 | `chromatic_aberration_corrector_streaming` | Advanced Camera ISP | Computational camera processing |
| BB-7906 | `chromatic_aberration_corrector_framebuffer` | Advanced Camera ISP | Computational camera processing |
| BB-7907 | `chromatic_aberration_corrector_line_buffered` | Advanced Camera ISP | Computational camera processing |
| BB-7908 | `chromatic_aberration_corrector_tile_based` | Advanced Camera ISP | Computational camera processing |
| BB-7909 | `chromatic_aberration_corrector_multi_plane` | Advanced Camera ISP | Computational camera processing |
| BB-7910 | `chromatic_aberration_corrector_multi_channel` | Advanced Camera ISP | Computational camera processing |
| BB-7911 | `chromatic_aberration_corrector_fixed_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7912 | `chromatic_aberration_corrector_low_latency` | Advanced Camera ISP | Computational camera processing |
| BB-7913 | `chromatic_aberration_corrector_high_throughput` | Advanced Camera ISP | Computational camera processing |
| BB-7914 | `chromatic_aberration_corrector_rate_adaptive` | Advanced Camera ISP | Computational camera processing |
| BB-7915 | `chromatic_aberration_corrector_clock_crossing` | Advanced Camera ISP | Computational camera processing |
| BB-7916 | `chromatic_aberration_corrector_metadata_aware` | Advanced Camera ISP | Computational camera processing |
| BB-7917 | `chromatic_aberration_corrector_error_resilient` | Advanced Camera ISP | Computational camera processing |
| BB-7918 | `chromatic_aberration_corrector_programmable` | Advanced Camera ISP | Computational camera processing |
| BB-7919 | `chromatic_aberration_corrector_low_power` | Advanced Camera ISP | Computational camera processing |
| BB-7920 | `chromatic_aberration_corrector_axi_stream` | Advanced Camera ISP | Computational camera processing |
| BB-7921 | `h264_intra_predictor_streaming` | Video Codecs | Video compression primitives |
| BB-7922 | `h264_intra_predictor_framebuffer` | Video Codecs | Video compression primitives |
| BB-7923 | `h264_intra_predictor_line_buffered` | Video Codecs | Video compression primitives |
| BB-7924 | `h264_intra_predictor_tile_based` | Video Codecs | Video compression primitives |
| BB-7925 | `h264_intra_predictor_multi_plane` | Video Codecs | Video compression primitives |
| BB-7926 | `h264_intra_predictor_multi_channel` | Video Codecs | Video compression primitives |
| BB-7927 | `h264_intra_predictor_fixed_latency` | Video Codecs | Video compression primitives |
| BB-7928 | `h264_intra_predictor_low_latency` | Video Codecs | Video compression primitives |
| BB-7929 | `h264_intra_predictor_high_throughput` | Video Codecs | Video compression primitives |
| BB-7930 | `h264_intra_predictor_rate_adaptive` | Video Codecs | Video compression primitives |
| BB-7931 | `h264_intra_predictor_clock_crossing` | Video Codecs | Video compression primitives |
| BB-7932 | `h264_intra_predictor_metadata_aware` | Video Codecs | Video compression primitives |
| BB-7933 | `h264_intra_predictor_error_resilient` | Video Codecs | Video compression primitives |
| BB-7934 | `h264_intra_predictor_programmable` | Video Codecs | Video compression primitives |
| BB-7935 | `h264_intra_predictor_low_power` | Video Codecs | Video compression primitives |
| BB-7936 | `h264_intra_predictor_axi_stream` | Video Codecs | Video compression primitives |
| BB-7937 | `h264_deblocking_filter_streaming` | Video Codecs | Video compression primitives |
| BB-7938 | `h264_deblocking_filter_framebuffer` | Video Codecs | Video compression primitives |
| BB-7939 | `h264_deblocking_filter_line_buffered` | Video Codecs | Video compression primitives |
| BB-7940 | `h264_deblocking_filter_tile_based` | Video Codecs | Video compression primitives |
| BB-7941 | `h264_deblocking_filter_multi_plane` | Video Codecs | Video compression primitives |
| BB-7942 | `h264_deblocking_filter_multi_channel` | Video Codecs | Video compression primitives |
| BB-7943 | `h264_deblocking_filter_fixed_latency` | Video Codecs | Video compression primitives |
| BB-7944 | `h264_deblocking_filter_low_latency` | Video Codecs | Video compression primitives |
| BB-7945 | `h264_deblocking_filter_high_throughput` | Video Codecs | Video compression primitives |
| BB-7946 | `h264_deblocking_filter_rate_adaptive` | Video Codecs | Video compression primitives |
| BB-7947 | `h264_deblocking_filter_clock_crossing` | Video Codecs | Video compression primitives |
| BB-7948 | `h264_deblocking_filter_metadata_aware` | Video Codecs | Video compression primitives |
| BB-7949 | `h264_deblocking_filter_error_resilient` | Video Codecs | Video compression primitives |
| BB-7950 | `h264_deblocking_filter_programmable` | Video Codecs | Video compression primitives |
| BB-7951 | `h264_deblocking_filter_low_power` | Video Codecs | Video compression primitives |
| BB-7952 | `h264_deblocking_filter_axi_stream` | Video Codecs | Video compression primitives |
| BB-7953 | `hevc_transform_unit_streaming` | Video Codecs | Video compression primitives |
| BB-7954 | `hevc_transform_unit_framebuffer` | Video Codecs | Video compression primitives |
| BB-7955 | `hevc_transform_unit_line_buffered` | Video Codecs | Video compression primitives |
| BB-7956 | `hevc_transform_unit_tile_based` | Video Codecs | Video compression primitives |
| BB-7957 | `hevc_transform_unit_multi_plane` | Video Codecs | Video compression primitives |
| BB-7958 | `hevc_transform_unit_multi_channel` | Video Codecs | Video compression primitives |
| BB-7959 | `hevc_transform_unit_fixed_latency` | Video Codecs | Video compression primitives |
| BB-7960 | `hevc_transform_unit_low_latency` | Video Codecs | Video compression primitives |
| BB-7961 | `hevc_transform_unit_high_throughput` | Video Codecs | Video compression primitives |
| BB-7962 | `hevc_transform_unit_rate_adaptive` | Video Codecs | Video compression primitives |
| BB-7963 | `hevc_transform_unit_clock_crossing` | Video Codecs | Video compression primitives |
| BB-7964 | `hevc_transform_unit_metadata_aware` | Video Codecs | Video compression primitives |
| BB-7965 | `hevc_transform_unit_error_resilient` | Video Codecs | Video compression primitives |
| BB-7966 | `hevc_transform_unit_programmable` | Video Codecs | Video compression primitives |
| BB-7967 | `hevc_transform_unit_low_power` | Video Codecs | Video compression primitives |
| BB-7968 | `hevc_transform_unit_axi_stream` | Video Codecs | Video compression primitives |
| BB-7969 | `av1_cdef_filter_streaming` | Video Codecs | Video compression primitives |
| BB-7970 | `av1_cdef_filter_framebuffer` | Video Codecs | Video compression primitives |
| BB-7971 | `av1_cdef_filter_line_buffered` | Video Codecs | Video compression primitives |
| BB-7972 | `av1_cdef_filter_tile_based` | Video Codecs | Video compression primitives |
| BB-7973 | `av1_cdef_filter_multi_plane` | Video Codecs | Video compression primitives |
| BB-7974 | `av1_cdef_filter_multi_channel` | Video Codecs | Video compression primitives |
| BB-7975 | `av1_cdef_filter_fixed_latency` | Video Codecs | Video compression primitives |
| BB-7976 | `av1_cdef_filter_low_latency` | Video Codecs | Video compression primitives |
| BB-7977 | `av1_cdef_filter_high_throughput` | Video Codecs | Video compression primitives |
| BB-7978 | `av1_cdef_filter_rate_adaptive` | Video Codecs | Video compression primitives |
| BB-7979 | `av1_cdef_filter_clock_crossing` | Video Codecs | Video compression primitives |
| BB-7980 | `av1_cdef_filter_metadata_aware` | Video Codecs | Video compression primitives |
| BB-7981 | `av1_cdef_filter_error_resilient` | Video Codecs | Video compression primitives |
| BB-7982 | `av1_cdef_filter_programmable` | Video Codecs | Video compression primitives |
| BB-7983 | `av1_cdef_filter_low_power` | Video Codecs | Video compression primitives |
| BB-7984 | `av1_cdef_filter_axi_stream` | Video Codecs | Video compression primitives |
| BB-7985 | `motion_estimation_engine_streaming` | Video Codecs | Video compression primitives |
| BB-7986 | `motion_estimation_engine_framebuffer` | Video Codecs | Video compression primitives |
| BB-7987 | `motion_estimation_engine_line_buffered` | Video Codecs | Video compression primitives |
| BB-7988 | `motion_estimation_engine_tile_based` | Video Codecs | Video compression primitives |
| BB-7989 | `motion_estimation_engine_multi_plane` | Video Codecs | Video compression primitives |
| BB-7990 | `motion_estimation_engine_multi_channel` | Video Codecs | Video compression primitives |
| BB-7991 | `motion_estimation_engine_fixed_latency` | Video Codecs | Video compression primitives |
| BB-7992 | `motion_estimation_engine_low_latency` | Video Codecs | Video compression primitives |
| BB-7993 | `motion_estimation_engine_high_throughput` | Video Codecs | Video compression primitives |
| BB-7994 | `motion_estimation_engine_rate_adaptive` | Video Codecs | Video compression primitives |
| BB-7995 | `motion_estimation_engine_clock_crossing` | Video Codecs | Video compression primitives |
| BB-7996 | `motion_estimation_engine_metadata_aware` | Video Codecs | Video compression primitives |
| BB-7997 | `motion_estimation_engine_error_resilient` | Video Codecs | Video compression primitives |
| BB-7998 | `motion_estimation_engine_programmable` | Video Codecs | Video compression primitives |
| BB-7999 | `motion_estimation_engine_low_power` | Video Codecs | Video compression primitives |
| BB-8000 | `motion_estimation_engine_axi_stream` | Video Codecs | Video compression primitives |
| BB-8001 | `pcm_packetizer_single_lane` | Audio Codecs | Audio coding primitives |
| BB-8002 | `pcm_packetizer_multi_lane` | Audio Codecs | Audio coding primitives |
| BB-8003 | `pcm_packetizer_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8004 | `pcm_packetizer_deep_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8005 | `pcm_packetizer_frame_aware` | Audio Codecs | Audio coding primitives |
| BB-8006 | `pcm_packetizer_packet_aware` | Audio Codecs | Audio coding primitives |
| BB-8007 | `pcm_packetizer_backpressure_capable` | Audio Codecs | Audio coding primitives |
| BB-8008 | `pcm_packetizer_rate_adaptive` | Audio Codecs | Audio coding primitives |
| BB-8009 | `pcm_packetizer_time_multiplexed` | Audio Codecs | Audio coding primitives |
| BB-8010 | `pcm_packetizer_fully_parallel` | Audio Codecs | Audio coding primitives |
| BB-8011 | `pcm_packetizer_buffered` | Audio Codecs | Audio coding primitives |
| BB-8012 | `pcm_packetizer_clock_crossing` | Audio Codecs | Audio coding primitives |
| BB-8013 | `pcm_packetizer_error_detecting` | Audio Codecs | Audio coding primitives |
| BB-8014 | `pcm_packetizer_formally_instrumented` | Audio Codecs | Audio coding primitives |
| BB-8015 | `pcm_packetizer_low_power` | Audio Codecs | Audio coding primitives |
| BB-8016 | `pcm_packetizer_axi_stream` | Audio Codecs | Audio coding primitives |
| BB-8017 | `adpcm_encoder_single_lane` | Audio Codecs | Audio coding primitives |
| BB-8018 | `adpcm_encoder_multi_lane` | Audio Codecs | Audio coding primitives |
| BB-8019 | `adpcm_encoder_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8020 | `adpcm_encoder_deep_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8021 | `adpcm_encoder_frame_aware` | Audio Codecs | Audio coding primitives |
| BB-8022 | `adpcm_encoder_packet_aware` | Audio Codecs | Audio coding primitives |
| BB-8023 | `adpcm_encoder_backpressure_capable` | Audio Codecs | Audio coding primitives |
| BB-8024 | `adpcm_encoder_rate_adaptive` | Audio Codecs | Audio coding primitives |
| BB-8025 | `adpcm_encoder_time_multiplexed` | Audio Codecs | Audio coding primitives |
| BB-8026 | `adpcm_encoder_fully_parallel` | Audio Codecs | Audio coding primitives |
| BB-8027 | `adpcm_encoder_buffered` | Audio Codecs | Audio coding primitives |
| BB-8028 | `adpcm_encoder_clock_crossing` | Audio Codecs | Audio coding primitives |
| BB-8029 | `adpcm_encoder_error_detecting` | Audio Codecs | Audio coding primitives |
| BB-8030 | `adpcm_encoder_formally_instrumented` | Audio Codecs | Audio coding primitives |
| BB-8031 | `adpcm_encoder_low_power` | Audio Codecs | Audio coding primitives |
| BB-8032 | `adpcm_encoder_axi_stream` | Audio Codecs | Audio coding primitives |
| BB-8033 | `adpcm_decoder_single_lane` | Audio Codecs | Audio coding primitives |
| BB-8034 | `adpcm_decoder_multi_lane` | Audio Codecs | Audio coding primitives |
| BB-8035 | `adpcm_decoder_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8036 | `adpcm_decoder_deep_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8037 | `adpcm_decoder_frame_aware` | Audio Codecs | Audio coding primitives |
| BB-8038 | `adpcm_decoder_packet_aware` | Audio Codecs | Audio coding primitives |
| BB-8039 | `adpcm_decoder_backpressure_capable` | Audio Codecs | Audio coding primitives |
| BB-8040 | `adpcm_decoder_rate_adaptive` | Audio Codecs | Audio coding primitives |
| BB-8041 | `adpcm_decoder_time_multiplexed` | Audio Codecs | Audio coding primitives |
| BB-8042 | `adpcm_decoder_fully_parallel` | Audio Codecs | Audio coding primitives |
| BB-8043 | `adpcm_decoder_buffered` | Audio Codecs | Audio coding primitives |
| BB-8044 | `adpcm_decoder_clock_crossing` | Audio Codecs | Audio coding primitives |
| BB-8045 | `adpcm_decoder_error_detecting` | Audio Codecs | Audio coding primitives |
| BB-8046 | `adpcm_decoder_formally_instrumented` | Audio Codecs | Audio coding primitives |
| BB-8047 | `adpcm_decoder_low_power` | Audio Codecs | Audio coding primitives |
| BB-8048 | `adpcm_decoder_axi_stream` | Audio Codecs | Audio coding primitives |
| BB-8049 | `audio_mdct_engine_single_lane` | Audio Codecs | Audio coding primitives |
| BB-8050 | `audio_mdct_engine_multi_lane` | Audio Codecs | Audio coding primitives |
| BB-8051 | `audio_mdct_engine_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8052 | `audio_mdct_engine_deep_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8053 | `audio_mdct_engine_frame_aware` | Audio Codecs | Audio coding primitives |
| BB-8054 | `audio_mdct_engine_packet_aware` | Audio Codecs | Audio coding primitives |
| BB-8055 | `audio_mdct_engine_backpressure_capable` | Audio Codecs | Audio coding primitives |
| BB-8056 | `audio_mdct_engine_rate_adaptive` | Audio Codecs | Audio coding primitives |
| BB-8057 | `audio_mdct_engine_time_multiplexed` | Audio Codecs | Audio coding primitives |
| BB-8058 | `audio_mdct_engine_fully_parallel` | Audio Codecs | Audio coding primitives |
| BB-8059 | `audio_mdct_engine_buffered` | Audio Codecs | Audio coding primitives |
| BB-8060 | `audio_mdct_engine_clock_crossing` | Audio Codecs | Audio coding primitives |
| BB-8061 | `audio_mdct_engine_error_detecting` | Audio Codecs | Audio coding primitives |
| BB-8062 | `audio_mdct_engine_formally_instrumented` | Audio Codecs | Audio coding primitives |
| BB-8063 | `audio_mdct_engine_low_power` | Audio Codecs | Audio coding primitives |
| BB-8064 | `audio_mdct_engine_axi_stream` | Audio Codecs | Audio coding primitives |
| BB-8065 | `audio_imdct_engine_single_lane` | Audio Codecs | Audio coding primitives |
| BB-8066 | `audio_imdct_engine_multi_lane` | Audio Codecs | Audio coding primitives |
| BB-8067 | `audio_imdct_engine_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8068 | `audio_imdct_engine_deep_pipelined` | Audio Codecs | Audio coding primitives |
| BB-8069 | `audio_imdct_engine_frame_aware` | Audio Codecs | Audio coding primitives |
| BB-8070 | `audio_imdct_engine_packet_aware` | Audio Codecs | Audio coding primitives |
| BB-8071 | `audio_imdct_engine_backpressure_capable` | Audio Codecs | Audio coding primitives |
| BB-8072 | `audio_imdct_engine_rate_adaptive` | Audio Codecs | Audio coding primitives |
| BB-8073 | `audio_imdct_engine_time_multiplexed` | Audio Codecs | Audio coding primitives |
| BB-8074 | `audio_imdct_engine_fully_parallel` | Audio Codecs | Audio coding primitives |
| BB-8075 | `audio_imdct_engine_buffered` | Audio Codecs | Audio coding primitives |
| BB-8076 | `audio_imdct_engine_clock_crossing` | Audio Codecs | Audio coding primitives |
| BB-8077 | `audio_imdct_engine_error_detecting` | Audio Codecs | Audio coding primitives |
| BB-8078 | `audio_imdct_engine_formally_instrumented` | Audio Codecs | Audio coding primitives |
| BB-8079 | `audio_imdct_engine_low_power` | Audio Codecs | Audio coding primitives |
| BB-8080 | `audio_imdct_engine_axi_stream` | Audio Codecs | Audio coding primitives |
| BB-8081 | `parametric_equalizer_single_lane` | Audio Effects | Audio effects processing |
| BB-8082 | `parametric_equalizer_multi_lane` | Audio Effects | Audio effects processing |
| BB-8083 | `parametric_equalizer_pipelined` | Audio Effects | Audio effects processing |
| BB-8084 | `parametric_equalizer_deep_pipelined` | Audio Effects | Audio effects processing |
| BB-8085 | `parametric_equalizer_frame_aware` | Audio Effects | Audio effects processing |
| BB-8086 | `parametric_equalizer_packet_aware` | Audio Effects | Audio effects processing |
| BB-8087 | `parametric_equalizer_backpressure_capable` | Audio Effects | Audio effects processing |
| BB-8088 | `parametric_equalizer_rate_adaptive` | Audio Effects | Audio effects processing |
| BB-8089 | `parametric_equalizer_time_multiplexed` | Audio Effects | Audio effects processing |
| BB-8090 | `parametric_equalizer_fully_parallel` | Audio Effects | Audio effects processing |
| BB-8091 | `parametric_equalizer_buffered` | Audio Effects | Audio effects processing |
| BB-8092 | `parametric_equalizer_clock_crossing` | Audio Effects | Audio effects processing |
| BB-8093 | `parametric_equalizer_error_detecting` | Audio Effects | Audio effects processing |
| BB-8094 | `parametric_equalizer_formally_instrumented` | Audio Effects | Audio effects processing |
| BB-8095 | `parametric_equalizer_low_power` | Audio Effects | Audio effects processing |
| BB-8096 | `parametric_equalizer_axi_stream` | Audio Effects | Audio effects processing |
| BB-8097 | `multiband_compressor_single_lane` | Audio Effects | Audio effects processing |
| BB-8098 | `multiband_compressor_multi_lane` | Audio Effects | Audio effects processing |
| BB-8099 | `multiband_compressor_pipelined` | Audio Effects | Audio effects processing |
| BB-8100 | `multiband_compressor_deep_pipelined` | Audio Effects | Audio effects processing |
| BB-8101 | `multiband_compressor_frame_aware` | Audio Effects | Audio effects processing |
| BB-8102 | `multiband_compressor_packet_aware` | Audio Effects | Audio effects processing |
| BB-8103 | `multiband_compressor_backpressure_capable` | Audio Effects | Audio effects processing |
| BB-8104 | `multiband_compressor_rate_adaptive` | Audio Effects | Audio effects processing |
| BB-8105 | `multiband_compressor_time_multiplexed` | Audio Effects | Audio effects processing |
| BB-8106 | `multiband_compressor_fully_parallel` | Audio Effects | Audio effects processing |
| BB-8107 | `multiband_compressor_buffered` | Audio Effects | Audio effects processing |
| BB-8108 | `multiband_compressor_clock_crossing` | Audio Effects | Audio effects processing |
| BB-8109 | `multiband_compressor_error_detecting` | Audio Effects | Audio effects processing |
| BB-8110 | `multiband_compressor_formally_instrumented` | Audio Effects | Audio effects processing |
| BB-8111 | `multiband_compressor_low_power` | Audio Effects | Audio effects processing |
| BB-8112 | `multiband_compressor_axi_stream` | Audio Effects | Audio effects processing |
| BB-8113 | `reverberation_engine_single_lane` | Audio Effects | Audio effects processing |
| BB-8114 | `reverberation_engine_multi_lane` | Audio Effects | Audio effects processing |
| BB-8115 | `reverberation_engine_pipelined` | Audio Effects | Audio effects processing |
| BB-8116 | `reverberation_engine_deep_pipelined` | Audio Effects | Audio effects processing |
| BB-8117 | `reverberation_engine_frame_aware` | Audio Effects | Audio effects processing |
| BB-8118 | `reverberation_engine_packet_aware` | Audio Effects | Audio effects processing |
| BB-8119 | `reverberation_engine_backpressure_capable` | Audio Effects | Audio effects processing |
| BB-8120 | `reverberation_engine_rate_adaptive` | Audio Effects | Audio effects processing |
| BB-8121 | `reverberation_engine_time_multiplexed` | Audio Effects | Audio effects processing |
| BB-8122 | `reverberation_engine_fully_parallel` | Audio Effects | Audio effects processing |
| BB-8123 | `reverberation_engine_buffered` | Audio Effects | Audio effects processing |
| BB-8124 | `reverberation_engine_clock_crossing` | Audio Effects | Audio effects processing |
| BB-8125 | `reverberation_engine_error_detecting` | Audio Effects | Audio effects processing |
| BB-8126 | `reverberation_engine_formally_instrumented` | Audio Effects | Audio effects processing |
| BB-8127 | `reverberation_engine_low_power` | Audio Effects | Audio effects processing |
| BB-8128 | `reverberation_engine_axi_stream` | Audio Effects | Audio effects processing |
| BB-8129 | `chorus_effect_engine_single_lane` | Audio Effects | Audio effects processing |
| BB-8130 | `chorus_effect_engine_multi_lane` | Audio Effects | Audio effects processing |
| BB-8131 | `chorus_effect_engine_pipelined` | Audio Effects | Audio effects processing |
| BB-8132 | `chorus_effect_engine_deep_pipelined` | Audio Effects | Audio effects processing |
| BB-8133 | `chorus_effect_engine_frame_aware` | Audio Effects | Audio effects processing |
| BB-8134 | `chorus_effect_engine_packet_aware` | Audio Effects | Audio effects processing |
| BB-8135 | `chorus_effect_engine_backpressure_capable` | Audio Effects | Audio effects processing |
| BB-8136 | `chorus_effect_engine_rate_adaptive` | Audio Effects | Audio effects processing |
| BB-8137 | `chorus_effect_engine_time_multiplexed` | Audio Effects | Audio effects processing |
| BB-8138 | `chorus_effect_engine_fully_parallel` | Audio Effects | Audio effects processing |
| BB-8139 | `chorus_effect_engine_buffered` | Audio Effects | Audio effects processing |
| BB-8140 | `chorus_effect_engine_clock_crossing` | Audio Effects | Audio effects processing |
| BB-8141 | `chorus_effect_engine_error_detecting` | Audio Effects | Audio effects processing |
| BB-8142 | `chorus_effect_engine_formally_instrumented` | Audio Effects | Audio effects processing |
| BB-8143 | `chorus_effect_engine_low_power` | Audio Effects | Audio effects processing |
| BB-8144 | `chorus_effect_engine_axi_stream` | Audio Effects | Audio effects processing |
| BB-8145 | `pitch_shift_engine_single_lane` | Audio Effects | Audio effects processing |
| BB-8146 | `pitch_shift_engine_multi_lane` | Audio Effects | Audio effects processing |
| BB-8147 | `pitch_shift_engine_pipelined` | Audio Effects | Audio effects processing |
| BB-8148 | `pitch_shift_engine_deep_pipelined` | Audio Effects | Audio effects processing |
| BB-8149 | `pitch_shift_engine_frame_aware` | Audio Effects | Audio effects processing |
| BB-8150 | `pitch_shift_engine_packet_aware` | Audio Effects | Audio effects processing |
| BB-8151 | `pitch_shift_engine_backpressure_capable` | Audio Effects | Audio effects processing |
| BB-8152 | `pitch_shift_engine_rate_adaptive` | Audio Effects | Audio effects processing |
| BB-8153 | `pitch_shift_engine_time_multiplexed` | Audio Effects | Audio effects processing |
| BB-8154 | `pitch_shift_engine_fully_parallel` | Audio Effects | Audio effects processing |
| BB-8155 | `pitch_shift_engine_buffered` | Audio Effects | Audio effects processing |
| BB-8156 | `pitch_shift_engine_clock_crossing` | Audio Effects | Audio effects processing |
| BB-8157 | `pitch_shift_engine_error_detecting` | Audio Effects | Audio effects processing |
| BB-8158 | `pitch_shift_engine_formally_instrumented` | Audio Effects | Audio effects processing |
| BB-8159 | `pitch_shift_engine_low_power` | Audio Effects | Audio effects processing |
| BB-8160 | `pitch_shift_engine_axi_stream` | Audio Effects | Audio effects processing |
| BB-8161 | `sensorless_back_emf_observer_single_shot` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8162 | `sensorless_back_emf_observer_continuous` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8163 | `sensorless_back_emf_observer_microcoded` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8164 | `sensorless_back_emf_observer_table_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8165 | `sensorless_back_emf_observer_multi_channel` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8166 | `sensorless_back_emf_observer_queued` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8167 | `sensorless_back_emf_observer_priority_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8168 | `sensorless_back_emf_observer_deadline_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8169 | `sensorless_back_emf_observer_redundant` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8170 | `sensorless_back_emf_observer_lockstep_checked` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8171 | `sensorless_back_emf_observer_formally_instrumented` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8172 | `sensorless_back_emf_observer_low_power` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8173 | `sensorless_back_emf_observer_clock_crossing` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8174 | `sensorless_back_emf_observer_software_configurable` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8175 | `sensorless_back_emf_observer_event_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8176 | `sensorless_back_emf_observer_fail_safe` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8177 | `sliding_mode_observer_single_shot` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8178 | `sliding_mode_observer_continuous` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8179 | `sliding_mode_observer_microcoded` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8180 | `sliding_mode_observer_table_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8181 | `sliding_mode_observer_multi_channel` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8182 | `sliding_mode_observer_queued` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8183 | `sliding_mode_observer_priority_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8184 | `sliding_mode_observer_deadline_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8185 | `sliding_mode_observer_redundant` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8186 | `sliding_mode_observer_lockstep_checked` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8187 | `sliding_mode_observer_formally_instrumented` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8188 | `sliding_mode_observer_low_power` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8189 | `sliding_mode_observer_clock_crossing` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8190 | `sliding_mode_observer_software_configurable` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8191 | `sliding_mode_observer_event_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8192 | `sliding_mode_observer_fail_safe` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8193 | `field_weakening_controller_single_shot` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8194 | `field_weakening_controller_continuous` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8195 | `field_weakening_controller_microcoded` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8196 | `field_weakening_controller_table_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8197 | `field_weakening_controller_multi_channel` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8198 | `field_weakening_controller_queued` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8199 | `field_weakening_controller_priority_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8200 | `field_weakening_controller_deadline_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8201 | `field_weakening_controller_redundant` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8202 | `field_weakening_controller_lockstep_checked` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8203 | `field_weakening_controller_formally_instrumented` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8204 | `field_weakening_controller_low_power` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8205 | `field_weakening_controller_clock_crossing` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8206 | `field_weakening_controller_software_configurable` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8207 | `field_weakening_controller_event_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8208 | `field_weakening_controller_fail_safe` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8209 | `maximum_torque_per_ampere_single_shot` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8210 | `maximum_torque_per_ampere_continuous` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8211 | `maximum_torque_per_ampere_microcoded` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8212 | `maximum_torque_per_ampere_table_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8213 | `maximum_torque_per_ampere_multi_channel` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8214 | `maximum_torque_per_ampere_queued` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8215 | `maximum_torque_per_ampere_priority_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8216 | `maximum_torque_per_ampere_deadline_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8217 | `maximum_torque_per_ampere_redundant` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8218 | `maximum_torque_per_ampere_lockstep_checked` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8219 | `maximum_torque_per_ampere_formally_instrumented` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8220 | `maximum_torque_per_ampere_low_power` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8221 | `maximum_torque_per_ampere_clock_crossing` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8222 | `maximum_torque_per_ampere_software_configurable` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8223 | `maximum_torque_per_ampere_event_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8224 | `maximum_torque_per_ampere_fail_safe` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8225 | `motor_parameter_identifier_single_shot` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8226 | `motor_parameter_identifier_continuous` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8227 | `motor_parameter_identifier_microcoded` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8228 | `motor_parameter_identifier_table_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8229 | `motor_parameter_identifier_multi_channel` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8230 | `motor_parameter_identifier_queued` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8231 | `motor_parameter_identifier_priority_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8232 | `motor_parameter_identifier_deadline_aware` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8233 | `motor_parameter_identifier_redundant` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8234 | `motor_parameter_identifier_lockstep_checked` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8235 | `motor_parameter_identifier_formally_instrumented` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8236 | `motor_parameter_identifier_low_power` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8237 | `motor_parameter_identifier_clock_crossing` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8238 | `motor_parameter_identifier_software_configurable` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8239 | `motor_parameter_identifier_event_driven` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8240 | `motor_parameter_identifier_fail_safe` | Advanced Motor Control | Sensorless and optimal motor control |
| BB-8241 | `power_factor_correction_controller_single_shot` | Power Electronics | Power conversion control |
| BB-8242 | `power_factor_correction_controller_continuous` | Power Electronics | Power conversion control |
| BB-8243 | `power_factor_correction_controller_microcoded` | Power Electronics | Power conversion control |
| BB-8244 | `power_factor_correction_controller_table_driven` | Power Electronics | Power conversion control |
| BB-8245 | `power_factor_correction_controller_multi_channel` | Power Electronics | Power conversion control |
| BB-8246 | `power_factor_correction_controller_queued` | Power Electronics | Power conversion control |
| BB-8247 | `power_factor_correction_controller_priority_aware` | Power Electronics | Power conversion control |
| BB-8248 | `power_factor_correction_controller_deadline_aware` | Power Electronics | Power conversion control |
| BB-8249 | `power_factor_correction_controller_redundant` | Power Electronics | Power conversion control |
| BB-8250 | `power_factor_correction_controller_lockstep_checked` | Power Electronics | Power conversion control |
| BB-8251 | `power_factor_correction_controller_formally_instrumented` | Power Electronics | Power conversion control |
| BB-8252 | `power_factor_correction_controller_low_power` | Power Electronics | Power conversion control |
| BB-8253 | `power_factor_correction_controller_clock_crossing` | Power Electronics | Power conversion control |
| BB-8254 | `power_factor_correction_controller_software_configurable` | Power Electronics | Power conversion control |
| BB-8255 | `power_factor_correction_controller_event_driven` | Power Electronics | Power conversion control |
| BB-8256 | `power_factor_correction_controller_fail_safe` | Power Electronics | Power conversion control |
| BB-8257 | `resonant_converter_controller_single_shot` | Power Electronics | Power conversion control |
| BB-8258 | `resonant_converter_controller_continuous` | Power Electronics | Power conversion control |
| BB-8259 | `resonant_converter_controller_microcoded` | Power Electronics | Power conversion control |
| BB-8260 | `resonant_converter_controller_table_driven` | Power Electronics | Power conversion control |
| BB-8261 | `resonant_converter_controller_multi_channel` | Power Electronics | Power conversion control |
| BB-8262 | `resonant_converter_controller_queued` | Power Electronics | Power conversion control |
| BB-8263 | `resonant_converter_controller_priority_aware` | Power Electronics | Power conversion control |
| BB-8264 | `resonant_converter_controller_deadline_aware` | Power Electronics | Power conversion control |
| BB-8265 | `resonant_converter_controller_redundant` | Power Electronics | Power conversion control |
| BB-8266 | `resonant_converter_controller_lockstep_checked` | Power Electronics | Power conversion control |
| BB-8267 | `resonant_converter_controller_formally_instrumented` | Power Electronics | Power conversion control |
| BB-8268 | `resonant_converter_controller_low_power` | Power Electronics | Power conversion control |
| BB-8269 | `resonant_converter_controller_clock_crossing` | Power Electronics | Power conversion control |
| BB-8270 | `resonant_converter_controller_software_configurable` | Power Electronics | Power conversion control |
| BB-8271 | `resonant_converter_controller_event_driven` | Power Electronics | Power conversion control |
| BB-8272 | `resonant_converter_controller_fail_safe` | Power Electronics | Power conversion control |
| BB-8273 | `mppt_controller_single_shot` | Power Electronics | Power conversion control |
| BB-8274 | `mppt_controller_continuous` | Power Electronics | Power conversion control |
| BB-8275 | `mppt_controller_microcoded` | Power Electronics | Power conversion control |
| BB-8276 | `mppt_controller_table_driven` | Power Electronics | Power conversion control |
| BB-8277 | `mppt_controller_multi_channel` | Power Electronics | Power conversion control |
| BB-8278 | `mppt_controller_queued` | Power Electronics | Power conversion control |
| BB-8279 | `mppt_controller_priority_aware` | Power Electronics | Power conversion control |
| BB-8280 | `mppt_controller_deadline_aware` | Power Electronics | Power conversion control |
| BB-8281 | `mppt_controller_redundant` | Power Electronics | Power conversion control |
| BB-8282 | `mppt_controller_lockstep_checked` | Power Electronics | Power conversion control |
| BB-8283 | `mppt_controller_formally_instrumented` | Power Electronics | Power conversion control |
| BB-8284 | `mppt_controller_low_power` | Power Electronics | Power conversion control |
| BB-8285 | `mppt_controller_clock_crossing` | Power Electronics | Power conversion control |
| BB-8286 | `mppt_controller_software_configurable` | Power Electronics | Power conversion control |
| BB-8287 | `mppt_controller_event_driven` | Power Electronics | Power conversion control |
| BB-8288 | `mppt_controller_fail_safe` | Power Electronics | Power conversion control |
| BB-8289 | `battery_balancing_controller_single_shot` | Power Electronics | Power conversion control |
| BB-8290 | `battery_balancing_controller_continuous` | Power Electronics | Power conversion control |
| BB-8291 | `battery_balancing_controller_microcoded` | Power Electronics | Power conversion control |
| BB-8292 | `battery_balancing_controller_table_driven` | Power Electronics | Power conversion control |
| BB-8293 | `battery_balancing_controller_multi_channel` | Power Electronics | Power conversion control |
| BB-8294 | `battery_balancing_controller_queued` | Power Electronics | Power conversion control |
| BB-8295 | `battery_balancing_controller_priority_aware` | Power Electronics | Power conversion control |
| BB-8296 | `battery_balancing_controller_deadline_aware` | Power Electronics | Power conversion control |
| BB-8297 | `battery_balancing_controller_redundant` | Power Electronics | Power conversion control |
| BB-8298 | `battery_balancing_controller_lockstep_checked` | Power Electronics | Power conversion control |
| BB-8299 | `battery_balancing_controller_formally_instrumented` | Power Electronics | Power conversion control |
| BB-8300 | `battery_balancing_controller_low_power` | Power Electronics | Power conversion control |
| BB-8301 | `battery_balancing_controller_clock_crossing` | Power Electronics | Power conversion control |
| BB-8302 | `battery_balancing_controller_software_configurable` | Power Electronics | Power conversion control |
| BB-8303 | `battery_balancing_controller_event_driven` | Power Electronics | Power conversion control |
| BB-8304 | `battery_balancing_controller_fail_safe` | Power Electronics | Power conversion control |
| BB-8305 | `grid_sync_pll_single_shot` | Power Electronics | Power conversion control |
| BB-8306 | `grid_sync_pll_continuous` | Power Electronics | Power conversion control |
| BB-8307 | `grid_sync_pll_microcoded` | Power Electronics | Power conversion control |
| BB-8308 | `grid_sync_pll_table_driven` | Power Electronics | Power conversion control |
| BB-8309 | `grid_sync_pll_multi_channel` | Power Electronics | Power conversion control |
| BB-8310 | `grid_sync_pll_queued` | Power Electronics | Power conversion control |
| BB-8311 | `grid_sync_pll_priority_aware` | Power Electronics | Power conversion control |
| BB-8312 | `grid_sync_pll_deadline_aware` | Power Electronics | Power conversion control |
| BB-8313 | `grid_sync_pll_redundant` | Power Electronics | Power conversion control |
| BB-8314 | `grid_sync_pll_lockstep_checked` | Power Electronics | Power conversion control |
| BB-8315 | `grid_sync_pll_formally_instrumented` | Power Electronics | Power conversion control |
| BB-8316 | `grid_sync_pll_low_power` | Power Electronics | Power conversion control |
| BB-8317 | `grid_sync_pll_clock_crossing` | Power Electronics | Power conversion control |
| BB-8318 | `grid_sync_pll_software_configurable` | Power Electronics | Power conversion control |
| BB-8319 | `grid_sync_pll_event_driven` | Power Electronics | Power conversion control |
| BB-8320 | `grid_sync_pll_fail_safe` | Power Electronics | Power conversion control |
| BB-8321 | `occupancy_grid_updater_single_shot` | Robotics Navigation | Localization and planning |
| BB-8322 | `occupancy_grid_updater_continuous` | Robotics Navigation | Localization and planning |
| BB-8323 | `occupancy_grid_updater_microcoded` | Robotics Navigation | Localization and planning |
| BB-8324 | `occupancy_grid_updater_table_driven` | Robotics Navigation | Localization and planning |
| BB-8325 | `occupancy_grid_updater_multi_channel` | Robotics Navigation | Localization and planning |
| BB-8326 | `occupancy_grid_updater_queued` | Robotics Navigation | Localization and planning |
| BB-8327 | `occupancy_grid_updater_priority_aware` | Robotics Navigation | Localization and planning |
| BB-8328 | `occupancy_grid_updater_deadline_aware` | Robotics Navigation | Localization and planning |
| BB-8329 | `occupancy_grid_updater_redundant` | Robotics Navigation | Localization and planning |
| BB-8330 | `occupancy_grid_updater_lockstep_checked` | Robotics Navigation | Localization and planning |
| BB-8331 | `occupancy_grid_updater_formally_instrumented` | Robotics Navigation | Localization and planning |
| BB-8332 | `occupancy_grid_updater_low_power` | Robotics Navigation | Localization and planning |
| BB-8333 | `occupancy_grid_updater_clock_crossing` | Robotics Navigation | Localization and planning |
| BB-8334 | `occupancy_grid_updater_software_configurable` | Robotics Navigation | Localization and planning |
| BB-8335 | `occupancy_grid_updater_event_driven` | Robotics Navigation | Localization and planning |
| BB-8336 | `occupancy_grid_updater_fail_safe` | Robotics Navigation | Localization and planning |
| BB-8337 | `lidar_scan_matcher_single_shot` | Robotics Navigation | Localization and planning |
| BB-8338 | `lidar_scan_matcher_continuous` | Robotics Navigation | Localization and planning |
| BB-8339 | `lidar_scan_matcher_microcoded` | Robotics Navigation | Localization and planning |
| BB-8340 | `lidar_scan_matcher_table_driven` | Robotics Navigation | Localization and planning |
| BB-8341 | `lidar_scan_matcher_multi_channel` | Robotics Navigation | Localization and planning |
| BB-8342 | `lidar_scan_matcher_queued` | Robotics Navigation | Localization and planning |
| BB-8343 | `lidar_scan_matcher_priority_aware` | Robotics Navigation | Localization and planning |
| BB-8344 | `lidar_scan_matcher_deadline_aware` | Robotics Navigation | Localization and planning |
| BB-8345 | `lidar_scan_matcher_redundant` | Robotics Navigation | Localization and planning |
| BB-8346 | `lidar_scan_matcher_lockstep_checked` | Robotics Navigation | Localization and planning |
| BB-8347 | `lidar_scan_matcher_formally_instrumented` | Robotics Navigation | Localization and planning |
| BB-8348 | `lidar_scan_matcher_low_power` | Robotics Navigation | Localization and planning |
| BB-8349 | `lidar_scan_matcher_clock_crossing` | Robotics Navigation | Localization and planning |
| BB-8350 | `lidar_scan_matcher_software_configurable` | Robotics Navigation | Localization and planning |
| BB-8351 | `lidar_scan_matcher_event_driven` | Robotics Navigation | Localization and planning |
| BB-8352 | `lidar_scan_matcher_fail_safe` | Robotics Navigation | Localization and planning |
| BB-8353 | `particle_filter_localizer_single_shot` | Robotics Navigation | Localization and planning |
| BB-8354 | `particle_filter_localizer_continuous` | Robotics Navigation | Localization and planning |
| BB-8355 | `particle_filter_localizer_microcoded` | Robotics Navigation | Localization and planning |
| BB-8356 | `particle_filter_localizer_table_driven` | Robotics Navigation | Localization and planning |
| BB-8357 | `particle_filter_localizer_multi_channel` | Robotics Navigation | Localization and planning |
| BB-8358 | `particle_filter_localizer_queued` | Robotics Navigation | Localization and planning |
| BB-8359 | `particle_filter_localizer_priority_aware` | Robotics Navigation | Localization and planning |
| BB-8360 | `particle_filter_localizer_deadline_aware` | Robotics Navigation | Localization and planning |
| BB-8361 | `particle_filter_localizer_redundant` | Robotics Navigation | Localization and planning |
| BB-8362 | `particle_filter_localizer_lockstep_checked` | Robotics Navigation | Localization and planning |
| BB-8363 | `particle_filter_localizer_formally_instrumented` | Robotics Navigation | Localization and planning |
| BB-8364 | `particle_filter_localizer_low_power` | Robotics Navigation | Localization and planning |
| BB-8365 | `particle_filter_localizer_clock_crossing` | Robotics Navigation | Localization and planning |
| BB-8366 | `particle_filter_localizer_software_configurable` | Robotics Navigation | Localization and planning |
| BB-8367 | `particle_filter_localizer_event_driven` | Robotics Navigation | Localization and planning |
| BB-8368 | `particle_filter_localizer_fail_safe` | Robotics Navigation | Localization and planning |
| BB-8369 | `path_planning_accelerator_single_shot` | Robotics Navigation | Localization and planning |
| BB-8370 | `path_planning_accelerator_continuous` | Robotics Navigation | Localization and planning |
| BB-8371 | `path_planning_accelerator_microcoded` | Robotics Navigation | Localization and planning |
| BB-8372 | `path_planning_accelerator_table_driven` | Robotics Navigation | Localization and planning |
| BB-8373 | `path_planning_accelerator_multi_channel` | Robotics Navigation | Localization and planning |
| BB-8374 | `path_planning_accelerator_queued` | Robotics Navigation | Localization and planning |
| BB-8375 | `path_planning_accelerator_priority_aware` | Robotics Navigation | Localization and planning |
| BB-8376 | `path_planning_accelerator_deadline_aware` | Robotics Navigation | Localization and planning |
| BB-8377 | `path_planning_accelerator_redundant` | Robotics Navigation | Localization and planning |
| BB-8378 | `path_planning_accelerator_lockstep_checked` | Robotics Navigation | Localization and planning |
| BB-8379 | `path_planning_accelerator_formally_instrumented` | Robotics Navigation | Localization and planning |
| BB-8380 | `path_planning_accelerator_low_power` | Robotics Navigation | Localization and planning |
| BB-8381 | `path_planning_accelerator_clock_crossing` | Robotics Navigation | Localization and planning |
| BB-8382 | `path_planning_accelerator_software_configurable` | Robotics Navigation | Localization and planning |
| BB-8383 | `path_planning_accelerator_event_driven` | Robotics Navigation | Localization and planning |
| BB-8384 | `path_planning_accelerator_fail_safe` | Robotics Navigation | Localization and planning |
| BB-8385 | `obstacle_avoidance_controller_single_shot` | Robotics Navigation | Localization and planning |
| BB-8386 | `obstacle_avoidance_controller_continuous` | Robotics Navigation | Localization and planning |
| BB-8387 | `obstacle_avoidance_controller_microcoded` | Robotics Navigation | Localization and planning |
| BB-8388 | `obstacle_avoidance_controller_table_driven` | Robotics Navigation | Localization and planning |
| BB-8389 | `obstacle_avoidance_controller_multi_channel` | Robotics Navigation | Localization and planning |
| BB-8390 | `obstacle_avoidance_controller_queued` | Robotics Navigation | Localization and planning |
| BB-8391 | `obstacle_avoidance_controller_priority_aware` | Robotics Navigation | Localization and planning |
| BB-8392 | `obstacle_avoidance_controller_deadline_aware` | Robotics Navigation | Localization and planning |
| BB-8393 | `obstacle_avoidance_controller_redundant` | Robotics Navigation | Localization and planning |
| BB-8394 | `obstacle_avoidance_controller_lockstep_checked` | Robotics Navigation | Localization and planning |
| BB-8395 | `obstacle_avoidance_controller_formally_instrumented` | Robotics Navigation | Localization and planning |
| BB-8396 | `obstacle_avoidance_controller_low_power` | Robotics Navigation | Localization and planning |
| BB-8397 | `obstacle_avoidance_controller_clock_crossing` | Robotics Navigation | Localization and planning |
| BB-8398 | `obstacle_avoidance_controller_software_configurable` | Robotics Navigation | Localization and planning |
| BB-8399 | `obstacle_avoidance_controller_event_driven` | Robotics Navigation | Localization and planning |
| BB-8400 | `obstacle_avoidance_controller_fail_safe` | Robotics Navigation | Localization and planning |
| BB-8401 | `sigma_delta_adc_decimator_single_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8402 | `sigma_delta_adc_decimator_multi_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8403 | `sigma_delta_adc_decimator_oversampled` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8404 | `sigma_delta_adc_decimator_calibrated` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8405 | `sigma_delta_adc_decimator_filtered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8406 | `sigma_delta_adc_decimator_timestamped` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8407 | `sigma_delta_adc_decimator_triggered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8408 | `sigma_delta_adc_decimator_windowed` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8409 | `sigma_delta_adc_decimator_dma_streaming` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8410 | `sigma_delta_adc_decimator_clock_crossing` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8411 | `sigma_delta_adc_decimator_fault_detecting` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8412 | `sigma_delta_adc_decimator_redundant` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8413 | `sigma_delta_adc_decimator_low_noise` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8414 | `sigma_delta_adc_decimator_low_latency` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8415 | `sigma_delta_adc_decimator_programmable` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8416 | `sigma_delta_adc_decimator_self_test` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8417 | `sar_adc_controller_single_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8418 | `sar_adc_controller_multi_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8419 | `sar_adc_controller_oversampled` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8420 | `sar_adc_controller_calibrated` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8421 | `sar_adc_controller_filtered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8422 | `sar_adc_controller_timestamped` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8423 | `sar_adc_controller_triggered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8424 | `sar_adc_controller_windowed` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8425 | `sar_adc_controller_dma_streaming` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8426 | `sar_adc_controller_clock_crossing` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8427 | `sar_adc_controller_fault_detecting` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8428 | `sar_adc_controller_redundant` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8429 | `sar_adc_controller_low_noise` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8430 | `sar_adc_controller_low_latency` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8431 | `sar_adc_controller_programmable` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8432 | `sar_adc_controller_self_test` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8433 | `time_to_digital_converter_single_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8434 | `time_to_digital_converter_multi_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8435 | `time_to_digital_converter_oversampled` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8436 | `time_to_digital_converter_calibrated` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8437 | `time_to_digital_converter_filtered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8438 | `time_to_digital_converter_timestamped` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8439 | `time_to_digital_converter_triggered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8440 | `time_to_digital_converter_windowed` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8441 | `time_to_digital_converter_dma_streaming` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8442 | `time_to_digital_converter_clock_crossing` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8443 | `time_to_digital_converter_fault_detecting` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8444 | `time_to_digital_converter_redundant` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8445 | `time_to_digital_converter_low_noise` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8446 | `time_to_digital_converter_low_latency` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8447 | `time_to_digital_converter_programmable` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8448 | `time_to_digital_converter_self_test` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8449 | `capacitance_measurement_engine_single_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8450 | `capacitance_measurement_engine_multi_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8451 | `capacitance_measurement_engine_oversampled` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8452 | `capacitance_measurement_engine_calibrated` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8453 | `capacitance_measurement_engine_filtered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8454 | `capacitance_measurement_engine_timestamped` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8455 | `capacitance_measurement_engine_triggered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8456 | `capacitance_measurement_engine_windowed` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8457 | `capacitance_measurement_engine_dma_streaming` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8458 | `capacitance_measurement_engine_clock_crossing` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8459 | `capacitance_measurement_engine_fault_detecting` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8460 | `capacitance_measurement_engine_redundant` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8461 | `capacitance_measurement_engine_low_noise` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8462 | `capacitance_measurement_engine_low_latency` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8463 | `capacitance_measurement_engine_programmable` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8464 | `capacitance_measurement_engine_self_test` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8465 | `bridge_sensor_linearizer_single_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8466 | `bridge_sensor_linearizer_multi_channel` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8467 | `bridge_sensor_linearizer_oversampled` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8468 | `bridge_sensor_linearizer_calibrated` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8469 | `bridge_sensor_linearizer_filtered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8470 | `bridge_sensor_linearizer_timestamped` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8471 | `bridge_sensor_linearizer_triggered` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8472 | `bridge_sensor_linearizer_windowed` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8473 | `bridge_sensor_linearizer_dma_streaming` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8474 | `bridge_sensor_linearizer_clock_crossing` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8475 | `bridge_sensor_linearizer_fault_detecting` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8476 | `bridge_sensor_linearizer_redundant` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8477 | `bridge_sensor_linearizer_low_noise` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8478 | `bridge_sensor_linearizer_low_latency` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8479 | `bridge_sensor_linearizer_programmable` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8480 | `bridge_sensor_linearizer_self_test` | Advanced Sensor Interfaces | Precision sensor conversion |
| BB-8481 | `triggered_waveform_recorder_single_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8482 | `triggered_waveform_recorder_multi_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8483 | `triggered_waveform_recorder_oversampled` | Advanced Data Acquisition | Measurement instruments |
| BB-8484 | `triggered_waveform_recorder_calibrated` | Advanced Data Acquisition | Measurement instruments |
| BB-8485 | `triggered_waveform_recorder_filtered` | Advanced Data Acquisition | Measurement instruments |
| BB-8486 | `triggered_waveform_recorder_timestamped` | Advanced Data Acquisition | Measurement instruments |
| BB-8487 | `triggered_waveform_recorder_triggered` | Advanced Data Acquisition | Measurement instruments |
| BB-8488 | `triggered_waveform_recorder_windowed` | Advanced Data Acquisition | Measurement instruments |
| BB-8489 | `triggered_waveform_recorder_dma_streaming` | Advanced Data Acquisition | Measurement instruments |
| BB-8490 | `triggered_waveform_recorder_clock_crossing` | Advanced Data Acquisition | Measurement instruments |
| BB-8491 | `triggered_waveform_recorder_fault_detecting` | Advanced Data Acquisition | Measurement instruments |
| BB-8492 | `triggered_waveform_recorder_redundant` | Advanced Data Acquisition | Measurement instruments |
| BB-8493 | `triggered_waveform_recorder_low_noise` | Advanced Data Acquisition | Measurement instruments |
| BB-8494 | `triggered_waveform_recorder_low_latency` | Advanced Data Acquisition | Measurement instruments |
| BB-8495 | `triggered_waveform_recorder_programmable` | Advanced Data Acquisition | Measurement instruments |
| BB-8496 | `triggered_waveform_recorder_self_test` | Advanced Data Acquisition | Measurement instruments |
| BB-8497 | `multi_channel_sample_aligner_single_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8498 | `multi_channel_sample_aligner_multi_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8499 | `multi_channel_sample_aligner_oversampled` | Advanced Data Acquisition | Measurement instruments |
| BB-8500 | `multi_channel_sample_aligner_calibrated` | Advanced Data Acquisition | Measurement instruments |
| BB-8501 | `multi_channel_sample_aligner_filtered` | Advanced Data Acquisition | Measurement instruments |
| BB-8502 | `multi_channel_sample_aligner_timestamped` | Advanced Data Acquisition | Measurement instruments |
| BB-8503 | `multi_channel_sample_aligner_triggered` | Advanced Data Acquisition | Measurement instruments |
| BB-8504 | `multi_channel_sample_aligner_windowed` | Advanced Data Acquisition | Measurement instruments |
| BB-8505 | `multi_channel_sample_aligner_dma_streaming` | Advanced Data Acquisition | Measurement instruments |
| BB-8506 | `multi_channel_sample_aligner_clock_crossing` | Advanced Data Acquisition | Measurement instruments |
| BB-8507 | `multi_channel_sample_aligner_fault_detecting` | Advanced Data Acquisition | Measurement instruments |
| BB-8508 | `multi_channel_sample_aligner_redundant` | Advanced Data Acquisition | Measurement instruments |
| BB-8509 | `multi_channel_sample_aligner_low_noise` | Advanced Data Acquisition | Measurement instruments |
| BB-8510 | `multi_channel_sample_aligner_low_latency` | Advanced Data Acquisition | Measurement instruments |
| BB-8511 | `multi_channel_sample_aligner_programmable` | Advanced Data Acquisition | Measurement instruments |
| BB-8512 | `multi_channel_sample_aligner_self_test` | Advanced Data Acquisition | Measurement instruments |
| BB-8513 | `digital_lockin_amplifier_single_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8514 | `digital_lockin_amplifier_multi_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8515 | `digital_lockin_amplifier_oversampled` | Advanced Data Acquisition | Measurement instruments |
| BB-8516 | `digital_lockin_amplifier_calibrated` | Advanced Data Acquisition | Measurement instruments |
| BB-8517 | `digital_lockin_amplifier_filtered` | Advanced Data Acquisition | Measurement instruments |
| BB-8518 | `digital_lockin_amplifier_timestamped` | Advanced Data Acquisition | Measurement instruments |
| BB-8519 | `digital_lockin_amplifier_triggered` | Advanced Data Acquisition | Measurement instruments |
| BB-8520 | `digital_lockin_amplifier_windowed` | Advanced Data Acquisition | Measurement instruments |
| BB-8521 | `digital_lockin_amplifier_dma_streaming` | Advanced Data Acquisition | Measurement instruments |
| BB-8522 | `digital_lockin_amplifier_clock_crossing` | Advanced Data Acquisition | Measurement instruments |
| BB-8523 | `digital_lockin_amplifier_fault_detecting` | Advanced Data Acquisition | Measurement instruments |
| BB-8524 | `digital_lockin_amplifier_redundant` | Advanced Data Acquisition | Measurement instruments |
| BB-8525 | `digital_lockin_amplifier_low_noise` | Advanced Data Acquisition | Measurement instruments |
| BB-8526 | `digital_lockin_amplifier_low_latency` | Advanced Data Acquisition | Measurement instruments |
| BB-8527 | `digital_lockin_amplifier_programmable` | Advanced Data Acquisition | Measurement instruments |
| BB-8528 | `digital_lockin_amplifier_self_test` | Advanced Data Acquisition | Measurement instruments |
| BB-8529 | `oscilloscope_trigger_engine_single_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8530 | `oscilloscope_trigger_engine_multi_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8531 | `oscilloscope_trigger_engine_oversampled` | Advanced Data Acquisition | Measurement instruments |
| BB-8532 | `oscilloscope_trigger_engine_calibrated` | Advanced Data Acquisition | Measurement instruments |
| BB-8533 | `oscilloscope_trigger_engine_filtered` | Advanced Data Acquisition | Measurement instruments |
| BB-8534 | `oscilloscope_trigger_engine_timestamped` | Advanced Data Acquisition | Measurement instruments |
| BB-8535 | `oscilloscope_trigger_engine_triggered` | Advanced Data Acquisition | Measurement instruments |
| BB-8536 | `oscilloscope_trigger_engine_windowed` | Advanced Data Acquisition | Measurement instruments |
| BB-8537 | `oscilloscope_trigger_engine_dma_streaming` | Advanced Data Acquisition | Measurement instruments |
| BB-8538 | `oscilloscope_trigger_engine_clock_crossing` | Advanced Data Acquisition | Measurement instruments |
| BB-8539 | `oscilloscope_trigger_engine_fault_detecting` | Advanced Data Acquisition | Measurement instruments |
| BB-8540 | `oscilloscope_trigger_engine_redundant` | Advanced Data Acquisition | Measurement instruments |
| BB-8541 | `oscilloscope_trigger_engine_low_noise` | Advanced Data Acquisition | Measurement instruments |
| BB-8542 | `oscilloscope_trigger_engine_low_latency` | Advanced Data Acquisition | Measurement instruments |
| BB-8543 | `oscilloscope_trigger_engine_programmable` | Advanced Data Acquisition | Measurement instruments |
| BB-8544 | `oscilloscope_trigger_engine_self_test` | Advanced Data Acquisition | Measurement instruments |
| BB-8545 | `spectrum_analyzer_frontend_single_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8546 | `spectrum_analyzer_frontend_multi_channel` | Advanced Data Acquisition | Measurement instruments |
| BB-8547 | `spectrum_analyzer_frontend_oversampled` | Advanced Data Acquisition | Measurement instruments |
| BB-8548 | `spectrum_analyzer_frontend_calibrated` | Advanced Data Acquisition | Measurement instruments |
| BB-8549 | `spectrum_analyzer_frontend_filtered` | Advanced Data Acquisition | Measurement instruments |
| BB-8550 | `spectrum_analyzer_frontend_timestamped` | Advanced Data Acquisition | Measurement instruments |
| BB-8551 | `spectrum_analyzer_frontend_triggered` | Advanced Data Acquisition | Measurement instruments |
| BB-8552 | `spectrum_analyzer_frontend_windowed` | Advanced Data Acquisition | Measurement instruments |
| BB-8553 | `spectrum_analyzer_frontend_dma_streaming` | Advanced Data Acquisition | Measurement instruments |
| BB-8554 | `spectrum_analyzer_frontend_clock_crossing` | Advanced Data Acquisition | Measurement instruments |
| BB-8555 | `spectrum_analyzer_frontend_fault_detecting` | Advanced Data Acquisition | Measurement instruments |
| BB-8556 | `spectrum_analyzer_frontend_redundant` | Advanced Data Acquisition | Measurement instruments |
| BB-8557 | `spectrum_analyzer_frontend_low_noise` | Advanced Data Acquisition | Measurement instruments |
| BB-8558 | `spectrum_analyzer_frontend_low_latency` | Advanced Data Acquisition | Measurement instruments |
| BB-8559 | `spectrum_analyzer_frontend_programmable` | Advanced Data Acquisition | Measurement instruments |
| BB-8560 | `spectrum_analyzer_frontend_self_test` | Advanced Data Acquisition | Measurement instruments |
| BB-8561 | `ethercat_distributed_clock_initiator` | Industrial Ethernet | Deterministic industrial links |
| BB-8562 | `ethercat_distributed_clock_target` | Industrial Ethernet | Deterministic industrial links |
| BB-8563 | `ethercat_distributed_clock_endpoint` | Industrial Ethernet | Deterministic industrial links |
| BB-8564 | `ethercat_distributed_clock_bridge` | Industrial Ethernet | Deterministic industrial links |
| BB-8565 | `ethercat_distributed_clock_router` | Industrial Ethernet | Deterministic industrial links |
| BB-8566 | `ethercat_distributed_clock_packetized` | Industrial Ethernet | Deterministic industrial links |
| BB-8567 | `ethercat_distributed_clock_buffered` | Industrial Ethernet | Deterministic industrial links |
| BB-8568 | `ethercat_distributed_clock_dma_attached` | Industrial Ethernet | Deterministic industrial links |
| BB-8569 | `ethercat_distributed_clock_multi_channel` | Industrial Ethernet | Deterministic industrial links |
| BB-8570 | `ethercat_distributed_clock_qos_aware` | Industrial Ethernet | Deterministic industrial links |
| BB-8571 | `ethercat_distributed_clock_timestamped` | Industrial Ethernet | Deterministic industrial links |
| BB-8572 | `ethercat_distributed_clock_clock_crossing` | Industrial Ethernet | Deterministic industrial links |
| BB-8573 | `ethercat_distributed_clock_redundant` | Industrial Ethernet | Deterministic industrial links |
| BB-8574 | `ethercat_distributed_clock_security_filtered` | Industrial Ethernet | Deterministic industrial links |
| BB-8575 | `ethercat_distributed_clock_protocol_monitor` | Industrial Ethernet | Deterministic industrial links |
| BB-8576 | `ethercat_distributed_clock_software_configurable` | Industrial Ethernet | Deterministic industrial links |
| BB-8577 | `profinet_irt_scheduler_initiator` | Industrial Ethernet | Deterministic industrial links |
| BB-8578 | `profinet_irt_scheduler_target` | Industrial Ethernet | Deterministic industrial links |
| BB-8579 | `profinet_irt_scheduler_endpoint` | Industrial Ethernet | Deterministic industrial links |
| BB-8580 | `profinet_irt_scheduler_bridge` | Industrial Ethernet | Deterministic industrial links |
| BB-8581 | `profinet_irt_scheduler_router` | Industrial Ethernet | Deterministic industrial links |
| BB-8582 | `profinet_irt_scheduler_packetized` | Industrial Ethernet | Deterministic industrial links |
| BB-8583 | `profinet_irt_scheduler_buffered` | Industrial Ethernet | Deterministic industrial links |
| BB-8584 | `profinet_irt_scheduler_dma_attached` | Industrial Ethernet | Deterministic industrial links |
| BB-8585 | `profinet_irt_scheduler_multi_channel` | Industrial Ethernet | Deterministic industrial links |
| BB-8586 | `profinet_irt_scheduler_qos_aware` | Industrial Ethernet | Deterministic industrial links |
| BB-8587 | `profinet_irt_scheduler_timestamped` | Industrial Ethernet | Deterministic industrial links |
| BB-8588 | `profinet_irt_scheduler_clock_crossing` | Industrial Ethernet | Deterministic industrial links |
| BB-8589 | `profinet_irt_scheduler_redundant` | Industrial Ethernet | Deterministic industrial links |
| BB-8590 | `profinet_irt_scheduler_security_filtered` | Industrial Ethernet | Deterministic industrial links |
| BB-8591 | `profinet_irt_scheduler_protocol_monitor` | Industrial Ethernet | Deterministic industrial links |
| BB-8592 | `profinet_irt_scheduler_software_configurable` | Industrial Ethernet | Deterministic industrial links |
| BB-8593 | `ethernet_ip_cip_parser_initiator` | Industrial Ethernet | Deterministic industrial links |
| BB-8594 | `ethernet_ip_cip_parser_target` | Industrial Ethernet | Deterministic industrial links |
| BB-8595 | `ethernet_ip_cip_parser_endpoint` | Industrial Ethernet | Deterministic industrial links |
| BB-8596 | `ethernet_ip_cip_parser_bridge` | Industrial Ethernet | Deterministic industrial links |
| BB-8597 | `ethernet_ip_cip_parser_router` | Industrial Ethernet | Deterministic industrial links |
| BB-8598 | `ethernet_ip_cip_parser_packetized` | Industrial Ethernet | Deterministic industrial links |
| BB-8599 | `ethernet_ip_cip_parser_buffered` | Industrial Ethernet | Deterministic industrial links |
| BB-8600 | `ethernet_ip_cip_parser_dma_attached` | Industrial Ethernet | Deterministic industrial links |
| BB-8601 | `ethernet_ip_cip_parser_multi_channel` | Industrial Ethernet | Deterministic industrial links |
| BB-8602 | `ethernet_ip_cip_parser_qos_aware` | Industrial Ethernet | Deterministic industrial links |
| BB-8603 | `ethernet_ip_cip_parser_timestamped` | Industrial Ethernet | Deterministic industrial links |
| BB-8604 | `ethernet_ip_cip_parser_clock_crossing` | Industrial Ethernet | Deterministic industrial links |
| BB-8605 | `ethernet_ip_cip_parser_redundant` | Industrial Ethernet | Deterministic industrial links |
| BB-8606 | `ethernet_ip_cip_parser_security_filtered` | Industrial Ethernet | Deterministic industrial links |
| BB-8607 | `ethernet_ip_cip_parser_protocol_monitor` | Industrial Ethernet | Deterministic industrial links |
| BB-8608 | `ethernet_ip_cip_parser_software_configurable` | Industrial Ethernet | Deterministic industrial links |
| BB-8609 | `powerslink_cycle_manager_initiator` | Industrial Ethernet | Deterministic industrial links |
| BB-8610 | `powerslink_cycle_manager_target` | Industrial Ethernet | Deterministic industrial links |
| BB-8611 | `powerslink_cycle_manager_endpoint` | Industrial Ethernet | Deterministic industrial links |
| BB-8612 | `powerslink_cycle_manager_bridge` | Industrial Ethernet | Deterministic industrial links |
| BB-8613 | `powerslink_cycle_manager_router` | Industrial Ethernet | Deterministic industrial links |
| BB-8614 | `powerslink_cycle_manager_packetized` | Industrial Ethernet | Deterministic industrial links |
| BB-8615 | `powerslink_cycle_manager_buffered` | Industrial Ethernet | Deterministic industrial links |
| BB-8616 | `powerslink_cycle_manager_dma_attached` | Industrial Ethernet | Deterministic industrial links |
| BB-8617 | `powerslink_cycle_manager_multi_channel` | Industrial Ethernet | Deterministic industrial links |
| BB-8618 | `powerslink_cycle_manager_qos_aware` | Industrial Ethernet | Deterministic industrial links |
| BB-8619 | `powerslink_cycle_manager_timestamped` | Industrial Ethernet | Deterministic industrial links |
| BB-8620 | `powerslink_cycle_manager_clock_crossing` | Industrial Ethernet | Deterministic industrial links |
| BB-8621 | `powerslink_cycle_manager_redundant` | Industrial Ethernet | Deterministic industrial links |
| BB-8622 | `powerslink_cycle_manager_security_filtered` | Industrial Ethernet | Deterministic industrial links |
| BB-8623 | `powerslink_cycle_manager_protocol_monitor` | Industrial Ethernet | Deterministic industrial links |
| BB-8624 | `powerslink_cycle_manager_software_configurable` | Industrial Ethernet | Deterministic industrial links |
| BB-8625 | `sercos_cycle_controller_initiator` | Industrial Ethernet | Deterministic industrial links |
| BB-8626 | `sercos_cycle_controller_target` | Industrial Ethernet | Deterministic industrial links |
| BB-8627 | `sercos_cycle_controller_endpoint` | Industrial Ethernet | Deterministic industrial links |
| BB-8628 | `sercos_cycle_controller_bridge` | Industrial Ethernet | Deterministic industrial links |
| BB-8629 | `sercos_cycle_controller_router` | Industrial Ethernet | Deterministic industrial links |
| BB-8630 | `sercos_cycle_controller_packetized` | Industrial Ethernet | Deterministic industrial links |
| BB-8631 | `sercos_cycle_controller_buffered` | Industrial Ethernet | Deterministic industrial links |
| BB-8632 | `sercos_cycle_controller_dma_attached` | Industrial Ethernet | Deterministic industrial links |
| BB-8633 | `sercos_cycle_controller_multi_channel` | Industrial Ethernet | Deterministic industrial links |
| BB-8634 | `sercos_cycle_controller_qos_aware` | Industrial Ethernet | Deterministic industrial links |
| BB-8635 | `sercos_cycle_controller_timestamped` | Industrial Ethernet | Deterministic industrial links |
| BB-8636 | `sercos_cycle_controller_clock_crossing` | Industrial Ethernet | Deterministic industrial links |
| BB-8637 | `sercos_cycle_controller_redundant` | Industrial Ethernet | Deterministic industrial links |
| BB-8638 | `sercos_cycle_controller_security_filtered` | Industrial Ethernet | Deterministic industrial links |
| BB-8639 | `sercos_cycle_controller_protocol_monitor` | Industrial Ethernet | Deterministic industrial links |
| BB-8640 | `sercos_cycle_controller_software_configurable` | Industrial Ethernet | Deterministic industrial links |
| BB-8641 | `can_fd_controller_initiator` | Automotive Networks | Automotive serial and Ethernet |
| BB-8642 | `can_fd_controller_target` | Automotive Networks | Automotive serial and Ethernet |
| BB-8643 | `can_fd_controller_endpoint` | Automotive Networks | Automotive serial and Ethernet |
| BB-8644 | `can_fd_controller_bridge` | Automotive Networks | Automotive serial and Ethernet |
| BB-8645 | `can_fd_controller_router` | Automotive Networks | Automotive serial and Ethernet |
| BB-8646 | `can_fd_controller_packetized` | Automotive Networks | Automotive serial and Ethernet |
| BB-8647 | `can_fd_controller_buffered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8648 | `can_fd_controller_dma_attached` | Automotive Networks | Automotive serial and Ethernet |
| BB-8649 | `can_fd_controller_multi_channel` | Automotive Networks | Automotive serial and Ethernet |
| BB-8650 | `can_fd_controller_qos_aware` | Automotive Networks | Automotive serial and Ethernet |
| BB-8651 | `can_fd_controller_timestamped` | Automotive Networks | Automotive serial and Ethernet |
| BB-8652 | `can_fd_controller_clock_crossing` | Automotive Networks | Automotive serial and Ethernet |
| BB-8653 | `can_fd_controller_redundant` | Automotive Networks | Automotive serial and Ethernet |
| BB-8654 | `can_fd_controller_security_filtered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8655 | `can_fd_controller_protocol_monitor` | Automotive Networks | Automotive serial and Ethernet |
| BB-8656 | `can_fd_controller_software_configurable` | Automotive Networks | Automotive serial and Ethernet |
| BB-8657 | `can_xl_frame_engine_initiator` | Automotive Networks | Automotive serial and Ethernet |
| BB-8658 | `can_xl_frame_engine_target` | Automotive Networks | Automotive serial and Ethernet |
| BB-8659 | `can_xl_frame_engine_endpoint` | Automotive Networks | Automotive serial and Ethernet |
| BB-8660 | `can_xl_frame_engine_bridge` | Automotive Networks | Automotive serial and Ethernet |
| BB-8661 | `can_xl_frame_engine_router` | Automotive Networks | Automotive serial and Ethernet |
| BB-8662 | `can_xl_frame_engine_packetized` | Automotive Networks | Automotive serial and Ethernet |
| BB-8663 | `can_xl_frame_engine_buffered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8664 | `can_xl_frame_engine_dma_attached` | Automotive Networks | Automotive serial and Ethernet |
| BB-8665 | `can_xl_frame_engine_multi_channel` | Automotive Networks | Automotive serial and Ethernet |
| BB-8666 | `can_xl_frame_engine_qos_aware` | Automotive Networks | Automotive serial and Ethernet |
| BB-8667 | `can_xl_frame_engine_timestamped` | Automotive Networks | Automotive serial and Ethernet |
| BB-8668 | `can_xl_frame_engine_clock_crossing` | Automotive Networks | Automotive serial and Ethernet |
| BB-8669 | `can_xl_frame_engine_redundant` | Automotive Networks | Automotive serial and Ethernet |
| BB-8670 | `can_xl_frame_engine_security_filtered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8671 | `can_xl_frame_engine_protocol_monitor` | Automotive Networks | Automotive serial and Ethernet |
| BB-8672 | `can_xl_frame_engine_software_configurable` | Automotive Networks | Automotive serial and Ethernet |
| BB-8673 | `flexray_controller_initiator` | Automotive Networks | Automotive serial and Ethernet |
| BB-8674 | `flexray_controller_target` | Automotive Networks | Automotive serial and Ethernet |
| BB-8675 | `flexray_controller_endpoint` | Automotive Networks | Automotive serial and Ethernet |
| BB-8676 | `flexray_controller_bridge` | Automotive Networks | Automotive serial and Ethernet |
| BB-8677 | `flexray_controller_router` | Automotive Networks | Automotive serial and Ethernet |
| BB-8678 | `flexray_controller_packetized` | Automotive Networks | Automotive serial and Ethernet |
| BB-8679 | `flexray_controller_buffered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8680 | `flexray_controller_dma_attached` | Automotive Networks | Automotive serial and Ethernet |
| BB-8681 | `flexray_controller_multi_channel` | Automotive Networks | Automotive serial and Ethernet |
| BB-8682 | `flexray_controller_qos_aware` | Automotive Networks | Automotive serial and Ethernet |
| BB-8683 | `flexray_controller_timestamped` | Automotive Networks | Automotive serial and Ethernet |
| BB-8684 | `flexray_controller_clock_crossing` | Automotive Networks | Automotive serial and Ethernet |
| BB-8685 | `flexray_controller_redundant` | Automotive Networks | Automotive serial and Ethernet |
| BB-8686 | `flexray_controller_security_filtered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8687 | `flexray_controller_protocol_monitor` | Automotive Networks | Automotive serial and Ethernet |
| BB-8688 | `flexray_controller_software_configurable` | Automotive Networks | Automotive serial and Ethernet |
| BB-8689 | `automotive_ethernet_tsn_initiator` | Automotive Networks | Automotive serial and Ethernet |
| BB-8690 | `automotive_ethernet_tsn_target` | Automotive Networks | Automotive serial and Ethernet |
| BB-8691 | `automotive_ethernet_tsn_endpoint` | Automotive Networks | Automotive serial and Ethernet |
| BB-8692 | `automotive_ethernet_tsn_bridge` | Automotive Networks | Automotive serial and Ethernet |
| BB-8693 | `automotive_ethernet_tsn_router` | Automotive Networks | Automotive serial and Ethernet |
| BB-8694 | `automotive_ethernet_tsn_packetized` | Automotive Networks | Automotive serial and Ethernet |
| BB-8695 | `automotive_ethernet_tsn_buffered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8696 | `automotive_ethernet_tsn_dma_attached` | Automotive Networks | Automotive serial and Ethernet |
| BB-8697 | `automotive_ethernet_tsn_multi_channel` | Automotive Networks | Automotive serial and Ethernet |
| BB-8698 | `automotive_ethernet_tsn_qos_aware` | Automotive Networks | Automotive serial and Ethernet |
| BB-8699 | `automotive_ethernet_tsn_timestamped` | Automotive Networks | Automotive serial and Ethernet |
| BB-8700 | `automotive_ethernet_tsn_clock_crossing` | Automotive Networks | Automotive serial and Ethernet |
| BB-8701 | `automotive_ethernet_tsn_redundant` | Automotive Networks | Automotive serial and Ethernet |
| BB-8702 | `automotive_ethernet_tsn_security_filtered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8703 | `automotive_ethernet_tsn_protocol_monitor` | Automotive Networks | Automotive serial and Ethernet |
| BB-8704 | `automotive_ethernet_tsn_software_configurable` | Automotive Networks | Automotive serial and Ethernet |
| BB-8705 | `sent_sensor_decoder_initiator` | Automotive Networks | Automotive serial and Ethernet |
| BB-8706 | `sent_sensor_decoder_target` | Automotive Networks | Automotive serial and Ethernet |
| BB-8707 | `sent_sensor_decoder_endpoint` | Automotive Networks | Automotive serial and Ethernet |
| BB-8708 | `sent_sensor_decoder_bridge` | Automotive Networks | Automotive serial and Ethernet |
| BB-8709 | `sent_sensor_decoder_router` | Automotive Networks | Automotive serial and Ethernet |
| BB-8710 | `sent_sensor_decoder_packetized` | Automotive Networks | Automotive serial and Ethernet |
| BB-8711 | `sent_sensor_decoder_buffered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8712 | `sent_sensor_decoder_dma_attached` | Automotive Networks | Automotive serial and Ethernet |
| BB-8713 | `sent_sensor_decoder_multi_channel` | Automotive Networks | Automotive serial and Ethernet |
| BB-8714 | `sent_sensor_decoder_qos_aware` | Automotive Networks | Automotive serial and Ethernet |
| BB-8715 | `sent_sensor_decoder_timestamped` | Automotive Networks | Automotive serial and Ethernet |
| BB-8716 | `sent_sensor_decoder_clock_crossing` | Automotive Networks | Automotive serial and Ethernet |
| BB-8717 | `sent_sensor_decoder_redundant` | Automotive Networks | Automotive serial and Ethernet |
| BB-8718 | `sent_sensor_decoder_security_filtered` | Automotive Networks | Automotive serial and Ethernet |
| BB-8719 | `sent_sensor_decoder_protocol_monitor` | Automotive Networks | Automotive serial and Ethernet |
| BB-8720 | `sent_sensor_decoder_software_configurable` | Automotive Networks | Automotive serial and Ethernet |
| BB-8721 | `spacefibre_lane_engine_initiator` | Aerospace Protocols | Space and avionics communication |
| BB-8722 | `spacefibre_lane_engine_target` | Aerospace Protocols | Space and avionics communication |
| BB-8723 | `spacefibre_lane_engine_endpoint` | Aerospace Protocols | Space and avionics communication |
| BB-8724 | `spacefibre_lane_engine_bridge` | Aerospace Protocols | Space and avionics communication |
| BB-8725 | `spacefibre_lane_engine_router` | Aerospace Protocols | Space and avionics communication |
| BB-8726 | `spacefibre_lane_engine_packetized` | Aerospace Protocols | Space and avionics communication |
| BB-8727 | `spacefibre_lane_engine_buffered` | Aerospace Protocols | Space and avionics communication |
| BB-8728 | `spacefibre_lane_engine_dma_attached` | Aerospace Protocols | Space and avionics communication |
| BB-8729 | `spacefibre_lane_engine_multi_channel` | Aerospace Protocols | Space and avionics communication |
| BB-8730 | `spacefibre_lane_engine_qos_aware` | Aerospace Protocols | Space and avionics communication |
| BB-8731 | `spacefibre_lane_engine_timestamped` | Aerospace Protocols | Space and avionics communication |
| BB-8732 | `spacefibre_lane_engine_clock_crossing` | Aerospace Protocols | Space and avionics communication |
| BB-8733 | `spacefibre_lane_engine_redundant` | Aerospace Protocols | Space and avionics communication |
| BB-8734 | `spacefibre_lane_engine_security_filtered` | Aerospace Protocols | Space and avionics communication |
| BB-8735 | `spacefibre_lane_engine_protocol_monitor` | Aerospace Protocols | Space and avionics communication |
| BB-8736 | `spacefibre_lane_engine_software_configurable` | Aerospace Protocols | Space and avionics communication |
| BB-8737 | `ccsds_packet_framer_initiator` | Aerospace Protocols | Space and avionics communication |
| BB-8738 | `ccsds_packet_framer_target` | Aerospace Protocols | Space and avionics communication |
| BB-8739 | `ccsds_packet_framer_endpoint` | Aerospace Protocols | Space and avionics communication |
| BB-8740 | `ccsds_packet_framer_bridge` | Aerospace Protocols | Space and avionics communication |
| BB-8741 | `ccsds_packet_framer_router` | Aerospace Protocols | Space and avionics communication |
| BB-8742 | `ccsds_packet_framer_packetized` | Aerospace Protocols | Space and avionics communication |
| BB-8743 | `ccsds_packet_framer_buffered` | Aerospace Protocols | Space and avionics communication |
| BB-8744 | `ccsds_packet_framer_dma_attached` | Aerospace Protocols | Space and avionics communication |
| BB-8745 | `ccsds_packet_framer_multi_channel` | Aerospace Protocols | Space and avionics communication |
| BB-8746 | `ccsds_packet_framer_qos_aware` | Aerospace Protocols | Space and avionics communication |
| BB-8747 | `ccsds_packet_framer_timestamped` | Aerospace Protocols | Space and avionics communication |
| BB-8748 | `ccsds_packet_framer_clock_crossing` | Aerospace Protocols | Space and avionics communication |
| BB-8749 | `ccsds_packet_framer_redundant` | Aerospace Protocols | Space and avionics communication |
| BB-8750 | `ccsds_packet_framer_security_filtered` | Aerospace Protocols | Space and avionics communication |
| BB-8751 | `ccsds_packet_framer_protocol_monitor` | Aerospace Protocols | Space and avionics communication |
| BB-8752 | `ccsds_packet_framer_software_configurable` | Aerospace Protocols | Space and avionics communication |
| BB-8753 | `ccsds_ldpc_decoder_initiator` | Aerospace Protocols | Space and avionics communication |
| BB-8754 | `ccsds_ldpc_decoder_target` | Aerospace Protocols | Space and avionics communication |
| BB-8755 | `ccsds_ldpc_decoder_endpoint` | Aerospace Protocols | Space and avionics communication |
| BB-8756 | `ccsds_ldpc_decoder_bridge` | Aerospace Protocols | Space and avionics communication |
| BB-8757 | `ccsds_ldpc_decoder_router` | Aerospace Protocols | Space and avionics communication |
| BB-8758 | `ccsds_ldpc_decoder_packetized` | Aerospace Protocols | Space and avionics communication |
| BB-8759 | `ccsds_ldpc_decoder_buffered` | Aerospace Protocols | Space and avionics communication |
| BB-8760 | `ccsds_ldpc_decoder_dma_attached` | Aerospace Protocols | Space and avionics communication |
| BB-8761 | `ccsds_ldpc_decoder_multi_channel` | Aerospace Protocols | Space and avionics communication |
| BB-8762 | `ccsds_ldpc_decoder_qos_aware` | Aerospace Protocols | Space and avionics communication |
| BB-8763 | `ccsds_ldpc_decoder_timestamped` | Aerospace Protocols | Space and avionics communication |
| BB-8764 | `ccsds_ldpc_decoder_clock_crossing` | Aerospace Protocols | Space and avionics communication |
| BB-8765 | `ccsds_ldpc_decoder_redundant` | Aerospace Protocols | Space and avionics communication |
| BB-8766 | `ccsds_ldpc_decoder_security_filtered` | Aerospace Protocols | Space and avionics communication |
| BB-8767 | `ccsds_ldpc_decoder_protocol_monitor` | Aerospace Protocols | Space and avionics communication |
| BB-8768 | `ccsds_ldpc_decoder_software_configurable` | Aerospace Protocols | Space and avionics communication |
| BB-8769 | `arinc429_controller_initiator` | Aerospace Protocols | Space and avionics communication |
| BB-8770 | `arinc429_controller_target` | Aerospace Protocols | Space and avionics communication |
| BB-8771 | `arinc429_controller_endpoint` | Aerospace Protocols | Space and avionics communication |
| BB-8772 | `arinc429_controller_bridge` | Aerospace Protocols | Space and avionics communication |
| BB-8773 | `arinc429_controller_router` | Aerospace Protocols | Space and avionics communication |
| BB-8774 | `arinc429_controller_packetized` | Aerospace Protocols | Space and avionics communication |
| BB-8775 | `arinc429_controller_buffered` | Aerospace Protocols | Space and avionics communication |
| BB-8776 | `arinc429_controller_dma_attached` | Aerospace Protocols | Space and avionics communication |
| BB-8777 | `arinc429_controller_multi_channel` | Aerospace Protocols | Space and avionics communication |
| BB-8778 | `arinc429_controller_qos_aware` | Aerospace Protocols | Space and avionics communication |
| BB-8779 | `arinc429_controller_timestamped` | Aerospace Protocols | Space and avionics communication |
| BB-8780 | `arinc429_controller_clock_crossing` | Aerospace Protocols | Space and avionics communication |
| BB-8781 | `arinc429_controller_redundant` | Aerospace Protocols | Space and avionics communication |
| BB-8782 | `arinc429_controller_security_filtered` | Aerospace Protocols | Space and avionics communication |
| BB-8783 | `arinc429_controller_protocol_monitor` | Aerospace Protocols | Space and avionics communication |
| BB-8784 | `arinc429_controller_software_configurable` | Aerospace Protocols | Space and avionics communication |
| BB-8785 | `arinc664_virtual_link_initiator` | Aerospace Protocols | Space and avionics communication |
| BB-8786 | `arinc664_virtual_link_target` | Aerospace Protocols | Space and avionics communication |
| BB-8787 | `arinc664_virtual_link_endpoint` | Aerospace Protocols | Space and avionics communication |
| BB-8788 | `arinc664_virtual_link_bridge` | Aerospace Protocols | Space and avionics communication |
| BB-8789 | `arinc664_virtual_link_router` | Aerospace Protocols | Space and avionics communication |
| BB-8790 | `arinc664_virtual_link_packetized` | Aerospace Protocols | Space and avionics communication |
| BB-8791 | `arinc664_virtual_link_buffered` | Aerospace Protocols | Space and avionics communication |
| BB-8792 | `arinc664_virtual_link_dma_attached` | Aerospace Protocols | Space and avionics communication |
| BB-8793 | `arinc664_virtual_link_multi_channel` | Aerospace Protocols | Space and avionics communication |
| BB-8794 | `arinc664_virtual_link_qos_aware` | Aerospace Protocols | Space and avionics communication |
| BB-8795 | `arinc664_virtual_link_timestamped` | Aerospace Protocols | Space and avionics communication |
| BB-8796 | `arinc664_virtual_link_clock_crossing` | Aerospace Protocols | Space and avionics communication |
| BB-8797 | `arinc664_virtual_link_redundant` | Aerospace Protocols | Space and avionics communication |
| BB-8798 | `arinc664_virtual_link_security_filtered` | Aerospace Protocols | Space and avionics communication |
| BB-8799 | `arinc664_virtual_link_protocol_monitor` | Aerospace Protocols | Space and avionics communication |
| BB-8800 | `arinc664_virtual_link_software_configurable` | Aerospace Protocols | Space and avionics communication |
| BB-8801 | `aes_gcm_engine_iterative` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8802 | `aes_gcm_engine_round_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8803 | `aes_gcm_engine_fully_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8804 | `aes_gcm_engine_pipelined` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8805 | `aes_gcm_engine_streaming` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8806 | `aes_gcm_engine_multi_context` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8807 | `aes_gcm_engine_key_agile` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8808 | `aes_gcm_engine_masked` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8809 | `aes_gcm_engine_constant_time` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8810 | `aes_gcm_engine_fault_detecting` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8811 | `aes_gcm_engine_redundant` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8812 | `aes_gcm_engine_side_channel_hardened` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8813 | `aes_gcm_engine_low_area` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8814 | `aes_gcm_engine_high_throughput` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8815 | `aes_gcm_engine_dma_attached` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8816 | `aes_gcm_engine_formally_instrumented` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8817 | `aes_xts_engine_iterative` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8818 | `aes_xts_engine_round_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8819 | `aes_xts_engine_fully_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8820 | `aes_xts_engine_pipelined` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8821 | `aes_xts_engine_streaming` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8822 | `aes_xts_engine_multi_context` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8823 | `aes_xts_engine_key_agile` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8824 | `aes_xts_engine_masked` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8825 | `aes_xts_engine_constant_time` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8826 | `aes_xts_engine_fault_detecting` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8827 | `aes_xts_engine_redundant` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8828 | `aes_xts_engine_side_channel_hardened` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8829 | `aes_xts_engine_low_area` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8830 | `aes_xts_engine_high_throughput` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8831 | `aes_xts_engine_dma_attached` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8832 | `aes_xts_engine_formally_instrumented` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8833 | `chacha20_poly1305_engine_iterative` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8834 | `chacha20_poly1305_engine_round_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8835 | `chacha20_poly1305_engine_fully_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8836 | `chacha20_poly1305_engine_pipelined` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8837 | `chacha20_poly1305_engine_streaming` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8838 | `chacha20_poly1305_engine_multi_context` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8839 | `chacha20_poly1305_engine_key_agile` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8840 | `chacha20_poly1305_engine_masked` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8841 | `chacha20_poly1305_engine_constant_time` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8842 | `chacha20_poly1305_engine_fault_detecting` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8843 | `chacha20_poly1305_engine_redundant` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8844 | `chacha20_poly1305_engine_side_channel_hardened` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8845 | `chacha20_poly1305_engine_low_area` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8846 | `chacha20_poly1305_engine_high_throughput` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8847 | `chacha20_poly1305_engine_dma_attached` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8848 | `chacha20_poly1305_engine_formally_instrumented` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8849 | `ascon_aead_engine_iterative` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8850 | `ascon_aead_engine_round_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8851 | `ascon_aead_engine_fully_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8852 | `ascon_aead_engine_pipelined` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8853 | `ascon_aead_engine_streaming` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8854 | `ascon_aead_engine_multi_context` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8855 | `ascon_aead_engine_key_agile` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8856 | `ascon_aead_engine_masked` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8857 | `ascon_aead_engine_constant_time` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8858 | `ascon_aead_engine_fault_detecting` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8859 | `ascon_aead_engine_redundant` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8860 | `ascon_aead_engine_side_channel_hardened` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8861 | `ascon_aead_engine_low_area` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8862 | `ascon_aead_engine_high_throughput` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8863 | `ascon_aead_engine_dma_attached` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8864 | `ascon_aead_engine_formally_instrumented` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8865 | `key_wrap_engine_iterative` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8866 | `key_wrap_engine_round_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8867 | `key_wrap_engine_fully_unrolled` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8868 | `key_wrap_engine_pipelined` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8869 | `key_wrap_engine_streaming` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8870 | `key_wrap_engine_multi_context` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8871 | `key_wrap_engine_key_agile` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8872 | `key_wrap_engine_masked` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8873 | `key_wrap_engine_constant_time` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8874 | `key_wrap_engine_fault_detecting` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8875 | `key_wrap_engine_redundant` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8876 | `key_wrap_engine_side_channel_hardened` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8877 | `key_wrap_engine_low_area` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8878 | `key_wrap_engine_high_throughput` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8879 | `key_wrap_engine_dma_attached` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8880 | `key_wrap_engine_formally_instrumented` | Symmetric Cryptography | Authenticated encryption and key wrap |
| BB-8881 | `montgomery_multiplier_iterative` | Public Key Cryptography | Classical public-key operations |
| BB-8882 | `montgomery_multiplier_round_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8883 | `montgomery_multiplier_fully_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8884 | `montgomery_multiplier_pipelined` | Public Key Cryptography | Classical public-key operations |
| BB-8885 | `montgomery_multiplier_streaming` | Public Key Cryptography | Classical public-key operations |
| BB-8886 | `montgomery_multiplier_multi_context` | Public Key Cryptography | Classical public-key operations |
| BB-8887 | `montgomery_multiplier_key_agile` | Public Key Cryptography | Classical public-key operations |
| BB-8888 | `montgomery_multiplier_masked` | Public Key Cryptography | Classical public-key operations |
| BB-8889 | `montgomery_multiplier_constant_time` | Public Key Cryptography | Classical public-key operations |
| BB-8890 | `montgomery_multiplier_fault_detecting` | Public Key Cryptography | Classical public-key operations |
| BB-8891 | `montgomery_multiplier_redundant` | Public Key Cryptography | Classical public-key operations |
| BB-8892 | `montgomery_multiplier_side_channel_hardened` | Public Key Cryptography | Classical public-key operations |
| BB-8893 | `montgomery_multiplier_low_area` | Public Key Cryptography | Classical public-key operations |
| BB-8894 | `montgomery_multiplier_high_throughput` | Public Key Cryptography | Classical public-key operations |
| BB-8895 | `montgomery_multiplier_dma_attached` | Public Key Cryptography | Classical public-key operations |
| BB-8896 | `montgomery_multiplier_formally_instrumented` | Public Key Cryptography | Classical public-key operations |
| BB-8897 | `rsa_crt_engine_iterative` | Public Key Cryptography | Classical public-key operations |
| BB-8898 | `rsa_crt_engine_round_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8899 | `rsa_crt_engine_fully_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8900 | `rsa_crt_engine_pipelined` | Public Key Cryptography | Classical public-key operations |
| BB-8901 | `rsa_crt_engine_streaming` | Public Key Cryptography | Classical public-key operations |
| BB-8902 | `rsa_crt_engine_multi_context` | Public Key Cryptography | Classical public-key operations |
| BB-8903 | `rsa_crt_engine_key_agile` | Public Key Cryptography | Classical public-key operations |
| BB-8904 | `rsa_crt_engine_masked` | Public Key Cryptography | Classical public-key operations |
| BB-8905 | `rsa_crt_engine_constant_time` | Public Key Cryptography | Classical public-key operations |
| BB-8906 | `rsa_crt_engine_fault_detecting` | Public Key Cryptography | Classical public-key operations |
| BB-8907 | `rsa_crt_engine_redundant` | Public Key Cryptography | Classical public-key operations |
| BB-8908 | `rsa_crt_engine_side_channel_hardened` | Public Key Cryptography | Classical public-key operations |
| BB-8909 | `rsa_crt_engine_low_area` | Public Key Cryptography | Classical public-key operations |
| BB-8910 | `rsa_crt_engine_high_throughput` | Public Key Cryptography | Classical public-key operations |
| BB-8911 | `rsa_crt_engine_dma_attached` | Public Key Cryptography | Classical public-key operations |
| BB-8912 | `rsa_crt_engine_formally_instrumented` | Public Key Cryptography | Classical public-key operations |
| BB-8913 | `ecdsa_sign_engine_iterative` | Public Key Cryptography | Classical public-key operations |
| BB-8914 | `ecdsa_sign_engine_round_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8915 | `ecdsa_sign_engine_fully_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8916 | `ecdsa_sign_engine_pipelined` | Public Key Cryptography | Classical public-key operations |
| BB-8917 | `ecdsa_sign_engine_streaming` | Public Key Cryptography | Classical public-key operations |
| BB-8918 | `ecdsa_sign_engine_multi_context` | Public Key Cryptography | Classical public-key operations |
| BB-8919 | `ecdsa_sign_engine_key_agile` | Public Key Cryptography | Classical public-key operations |
| BB-8920 | `ecdsa_sign_engine_masked` | Public Key Cryptography | Classical public-key operations |
| BB-8921 | `ecdsa_sign_engine_constant_time` | Public Key Cryptography | Classical public-key operations |
| BB-8922 | `ecdsa_sign_engine_fault_detecting` | Public Key Cryptography | Classical public-key operations |
| BB-8923 | `ecdsa_sign_engine_redundant` | Public Key Cryptography | Classical public-key operations |
| BB-8924 | `ecdsa_sign_engine_side_channel_hardened` | Public Key Cryptography | Classical public-key operations |
| BB-8925 | `ecdsa_sign_engine_low_area` | Public Key Cryptography | Classical public-key operations |
| BB-8926 | `ecdsa_sign_engine_high_throughput` | Public Key Cryptography | Classical public-key operations |
| BB-8927 | `ecdsa_sign_engine_dma_attached` | Public Key Cryptography | Classical public-key operations |
| BB-8928 | `ecdsa_sign_engine_formally_instrumented` | Public Key Cryptography | Classical public-key operations |
| BB-8929 | `ecdsa_verify_engine_iterative` | Public Key Cryptography | Classical public-key operations |
| BB-8930 | `ecdsa_verify_engine_round_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8931 | `ecdsa_verify_engine_fully_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8932 | `ecdsa_verify_engine_pipelined` | Public Key Cryptography | Classical public-key operations |
| BB-8933 | `ecdsa_verify_engine_streaming` | Public Key Cryptography | Classical public-key operations |
| BB-8934 | `ecdsa_verify_engine_multi_context` | Public Key Cryptography | Classical public-key operations |
| BB-8935 | `ecdsa_verify_engine_key_agile` | Public Key Cryptography | Classical public-key operations |
| BB-8936 | `ecdsa_verify_engine_masked` | Public Key Cryptography | Classical public-key operations |
| BB-8937 | `ecdsa_verify_engine_constant_time` | Public Key Cryptography | Classical public-key operations |
| BB-8938 | `ecdsa_verify_engine_fault_detecting` | Public Key Cryptography | Classical public-key operations |
| BB-8939 | `ecdsa_verify_engine_redundant` | Public Key Cryptography | Classical public-key operations |
| BB-8940 | `ecdsa_verify_engine_side_channel_hardened` | Public Key Cryptography | Classical public-key operations |
| BB-8941 | `ecdsa_verify_engine_low_area` | Public Key Cryptography | Classical public-key operations |
| BB-8942 | `ecdsa_verify_engine_high_throughput` | Public Key Cryptography | Classical public-key operations |
| BB-8943 | `ecdsa_verify_engine_dma_attached` | Public Key Cryptography | Classical public-key operations |
| BB-8944 | `ecdsa_verify_engine_formally_instrumented` | Public Key Cryptography | Classical public-key operations |
| BB-8945 | `x25519_engine_iterative` | Public Key Cryptography | Classical public-key operations |
| BB-8946 | `x25519_engine_round_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8947 | `x25519_engine_fully_unrolled` | Public Key Cryptography | Classical public-key operations |
| BB-8948 | `x25519_engine_pipelined` | Public Key Cryptography | Classical public-key operations |
| BB-8949 | `x25519_engine_streaming` | Public Key Cryptography | Classical public-key operations |
| BB-8950 | `x25519_engine_multi_context` | Public Key Cryptography | Classical public-key operations |
| BB-8951 | `x25519_engine_key_agile` | Public Key Cryptography | Classical public-key operations |
| BB-8952 | `x25519_engine_masked` | Public Key Cryptography | Classical public-key operations |
| BB-8953 | `x25519_engine_constant_time` | Public Key Cryptography | Classical public-key operations |
| BB-8954 | `x25519_engine_fault_detecting` | Public Key Cryptography | Classical public-key operations |
| BB-8955 | `x25519_engine_redundant` | Public Key Cryptography | Classical public-key operations |
| BB-8956 | `x25519_engine_side_channel_hardened` | Public Key Cryptography | Classical public-key operations |
| BB-8957 | `x25519_engine_low_area` | Public Key Cryptography | Classical public-key operations |
| BB-8958 | `x25519_engine_high_throughput` | Public Key Cryptography | Classical public-key operations |
| BB-8959 | `x25519_engine_dma_attached` | Public Key Cryptography | Classical public-key operations |
| BB-8960 | `x25519_engine_formally_instrumented` | Public Key Cryptography | Classical public-key operations |
| BB-8961 | `kyber_ntt_engine_iterative` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8962 | `kyber_ntt_engine_round_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8963 | `kyber_ntt_engine_fully_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8964 | `kyber_ntt_engine_pipelined` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8965 | `kyber_ntt_engine_streaming` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8966 | `kyber_ntt_engine_multi_context` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8967 | `kyber_ntt_engine_key_agile` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8968 | `kyber_ntt_engine_masked` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8969 | `kyber_ntt_engine_constant_time` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8970 | `kyber_ntt_engine_fault_detecting` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8971 | `kyber_ntt_engine_redundant` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8972 | `kyber_ntt_engine_side_channel_hardened` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8973 | `kyber_ntt_engine_low_area` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8974 | `kyber_ntt_engine_high_throughput` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8975 | `kyber_ntt_engine_dma_attached` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8976 | `kyber_ntt_engine_formally_instrumented` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8977 | `dilithium_ntt_engine_iterative` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8978 | `dilithium_ntt_engine_round_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8979 | `dilithium_ntt_engine_fully_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8980 | `dilithium_ntt_engine_pipelined` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8981 | `dilithium_ntt_engine_streaming` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8982 | `dilithium_ntt_engine_multi_context` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8983 | `dilithium_ntt_engine_key_agile` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8984 | `dilithium_ntt_engine_masked` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8985 | `dilithium_ntt_engine_constant_time` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8986 | `dilithium_ntt_engine_fault_detecting` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8987 | `dilithium_ntt_engine_redundant` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8988 | `dilithium_ntt_engine_side_channel_hardened` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8989 | `dilithium_ntt_engine_low_area` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8990 | `dilithium_ntt_engine_high_throughput` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8991 | `dilithium_ntt_engine_dma_attached` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8992 | `dilithium_ntt_engine_formally_instrumented` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8993 | `polynomial_sampler_iterative` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8994 | `polynomial_sampler_round_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8995 | `polynomial_sampler_fully_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8996 | `polynomial_sampler_pipelined` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8997 | `polynomial_sampler_streaming` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8998 | `polynomial_sampler_multi_context` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-8999 | `polynomial_sampler_key_agile` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9000 | `polynomial_sampler_masked` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9001 | `polynomial_sampler_constant_time` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9002 | `polynomial_sampler_fault_detecting` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9003 | `polynomial_sampler_redundant` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9004 | `polynomial_sampler_side_channel_hardened` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9005 | `polynomial_sampler_low_area` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9006 | `polynomial_sampler_high_throughput` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9007 | `polynomial_sampler_dma_attached` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9008 | `polynomial_sampler_formally_instrumented` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9009 | `lattice_reconciliation_unit_iterative` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9010 | `lattice_reconciliation_unit_round_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9011 | `lattice_reconciliation_unit_fully_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9012 | `lattice_reconciliation_unit_pipelined` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9013 | `lattice_reconciliation_unit_streaming` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9014 | `lattice_reconciliation_unit_multi_context` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9015 | `lattice_reconciliation_unit_key_agile` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9016 | `lattice_reconciliation_unit_masked` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9017 | `lattice_reconciliation_unit_constant_time` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9018 | `lattice_reconciliation_unit_fault_detecting` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9019 | `lattice_reconciliation_unit_redundant` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9020 | `lattice_reconciliation_unit_side_channel_hardened` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9021 | `lattice_reconciliation_unit_low_area` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9022 | `lattice_reconciliation_unit_high_throughput` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9023 | `lattice_reconciliation_unit_dma_attached` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9024 | `lattice_reconciliation_unit_formally_instrumented` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9025 | `hash_based_signature_engine_iterative` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9026 | `hash_based_signature_engine_round_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9027 | `hash_based_signature_engine_fully_unrolled` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9028 | `hash_based_signature_engine_pipelined` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9029 | `hash_based_signature_engine_streaming` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9030 | `hash_based_signature_engine_multi_context` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9031 | `hash_based_signature_engine_key_agile` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9032 | `hash_based_signature_engine_masked` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9033 | `hash_based_signature_engine_constant_time` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9034 | `hash_based_signature_engine_fault_detecting` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9035 | `hash_based_signature_engine_redundant` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9036 | `hash_based_signature_engine_side_channel_hardened` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9037 | `hash_based_signature_engine_low_area` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9038 | `hash_based_signature_engine_high_throughput` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9039 | `hash_based_signature_engine_dma_attached` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9040 | `hash_based_signature_engine_formally_instrumented` | Post-Quantum Cryptography | Lattice and hash-based primitives |
| BB-9041 | `secure_boot_root_single_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9042 | `secure_boot_root_dual_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9043 | `secure_boot_root_triple_modular` | Secure SoC Infrastructure | Root of trust services |
| BB-9044 | `secure_boot_root_lockstep` | Secure SoC Infrastructure | Root of trust services |
| BB-9045 | `secure_boot_root_temporal_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9046 | `secure_boot_root_spatial_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9047 | `secure_boot_root_self_testing` | Secure SoC Infrastructure | Root of trust services |
| BB-9048 | `secure_boot_root_fault_injectable` | Secure SoC Infrastructure | Root of trust services |
| BB-9049 | `secure_boot_root_latent_fault_detecting` | Secure SoC Infrastructure | Root of trust services |
| BB-9050 | `secure_boot_root_fail_operational` | Secure SoC Infrastructure | Root of trust services |
| BB-9051 | `secure_boot_root_fail_safe` | Secure SoC Infrastructure | Root of trust services |
| BB-9052 | `secure_boot_root_diagnostic_coverage` | Secure SoC Infrastructure | Root of trust services |
| BB-9053 | `secure_boot_root_clock_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9054 | `secure_boot_root_power_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9055 | `secure_boot_root_formally_instrumented` | Secure SoC Infrastructure | Root of trust services |
| BB-9056 | `secure_boot_root_software_configurable` | Secure SoC Infrastructure | Root of trust services |
| BB-9057 | `measured_boot_engine_single_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9058 | `measured_boot_engine_dual_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9059 | `measured_boot_engine_triple_modular` | Secure SoC Infrastructure | Root of trust services |
| BB-9060 | `measured_boot_engine_lockstep` | Secure SoC Infrastructure | Root of trust services |
| BB-9061 | `measured_boot_engine_temporal_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9062 | `measured_boot_engine_spatial_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9063 | `measured_boot_engine_self_testing` | Secure SoC Infrastructure | Root of trust services |
| BB-9064 | `measured_boot_engine_fault_injectable` | Secure SoC Infrastructure | Root of trust services |
| BB-9065 | `measured_boot_engine_latent_fault_detecting` | Secure SoC Infrastructure | Root of trust services |
| BB-9066 | `measured_boot_engine_fail_operational` | Secure SoC Infrastructure | Root of trust services |
| BB-9067 | `measured_boot_engine_fail_safe` | Secure SoC Infrastructure | Root of trust services |
| BB-9068 | `measured_boot_engine_diagnostic_coverage` | Secure SoC Infrastructure | Root of trust services |
| BB-9069 | `measured_boot_engine_clock_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9070 | `measured_boot_engine_power_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9071 | `measured_boot_engine_formally_instrumented` | Secure SoC Infrastructure | Root of trust services |
| BB-9072 | `measured_boot_engine_software_configurable` | Secure SoC Infrastructure | Root of trust services |
| BB-9073 | `key_vault_controller_single_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9074 | `key_vault_controller_dual_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9075 | `key_vault_controller_triple_modular` | Secure SoC Infrastructure | Root of trust services |
| BB-9076 | `key_vault_controller_lockstep` | Secure SoC Infrastructure | Root of trust services |
| BB-9077 | `key_vault_controller_temporal_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9078 | `key_vault_controller_spatial_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9079 | `key_vault_controller_self_testing` | Secure SoC Infrastructure | Root of trust services |
| BB-9080 | `key_vault_controller_fault_injectable` | Secure SoC Infrastructure | Root of trust services |
| BB-9081 | `key_vault_controller_latent_fault_detecting` | Secure SoC Infrastructure | Root of trust services |
| BB-9082 | `key_vault_controller_fail_operational` | Secure SoC Infrastructure | Root of trust services |
| BB-9083 | `key_vault_controller_fail_safe` | Secure SoC Infrastructure | Root of trust services |
| BB-9084 | `key_vault_controller_diagnostic_coverage` | Secure SoC Infrastructure | Root of trust services |
| BB-9085 | `key_vault_controller_clock_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9086 | `key_vault_controller_power_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9087 | `key_vault_controller_formally_instrumented` | Secure SoC Infrastructure | Root of trust services |
| BB-9088 | `key_vault_controller_software_configurable` | Secure SoC Infrastructure | Root of trust services |
| BB-9089 | `anti_rollback_counter_single_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9090 | `anti_rollback_counter_dual_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9091 | `anti_rollback_counter_triple_modular` | Secure SoC Infrastructure | Root of trust services |
| BB-9092 | `anti_rollback_counter_lockstep` | Secure SoC Infrastructure | Root of trust services |
| BB-9093 | `anti_rollback_counter_temporal_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9094 | `anti_rollback_counter_spatial_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9095 | `anti_rollback_counter_self_testing` | Secure SoC Infrastructure | Root of trust services |
| BB-9096 | `anti_rollback_counter_fault_injectable` | Secure SoC Infrastructure | Root of trust services |
| BB-9097 | `anti_rollback_counter_latent_fault_detecting` | Secure SoC Infrastructure | Root of trust services |
| BB-9098 | `anti_rollback_counter_fail_operational` | Secure SoC Infrastructure | Root of trust services |
| BB-9099 | `anti_rollback_counter_fail_safe` | Secure SoC Infrastructure | Root of trust services |
| BB-9100 | `anti_rollback_counter_diagnostic_coverage` | Secure SoC Infrastructure | Root of trust services |
| BB-9101 | `anti_rollback_counter_clock_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9102 | `anti_rollback_counter_power_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9103 | `anti_rollback_counter_formally_instrumented` | Secure SoC Infrastructure | Root of trust services |
| BB-9104 | `anti_rollback_counter_software_configurable` | Secure SoC Infrastructure | Root of trust services |
| BB-9105 | `trusted_mailbox_single_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9106 | `trusted_mailbox_dual_channel` | Secure SoC Infrastructure | Root of trust services |
| BB-9107 | `trusted_mailbox_triple_modular` | Secure SoC Infrastructure | Root of trust services |
| BB-9108 | `trusted_mailbox_lockstep` | Secure SoC Infrastructure | Root of trust services |
| BB-9109 | `trusted_mailbox_temporal_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9110 | `trusted_mailbox_spatial_redundancy` | Secure SoC Infrastructure | Root of trust services |
| BB-9111 | `trusted_mailbox_self_testing` | Secure SoC Infrastructure | Root of trust services |
| BB-9112 | `trusted_mailbox_fault_injectable` | Secure SoC Infrastructure | Root of trust services |
| BB-9113 | `trusted_mailbox_latent_fault_detecting` | Secure SoC Infrastructure | Root of trust services |
| BB-9114 | `trusted_mailbox_fail_operational` | Secure SoC Infrastructure | Root of trust services |
| BB-9115 | `trusted_mailbox_fail_safe` | Secure SoC Infrastructure | Root of trust services |
| BB-9116 | `trusted_mailbox_diagnostic_coverage` | Secure SoC Infrastructure | Root of trust services |
| BB-9117 | `trusted_mailbox_clock_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9118 | `trusted_mailbox_power_monitored` | Secure SoC Infrastructure | Root of trust services |
| BB-9119 | `trusted_mailbox_formally_instrumented` | Secure SoC Infrastructure | Root of trust services |
| BB-9120 | `trusted_mailbox_software_configurable` | Secure SoC Infrastructure | Root of trust services |
| BB-9121 | `triple_modular_redundancy_manager_single_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9122 | `triple_modular_redundancy_manager_dual_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9123 | `triple_modular_redundancy_manager_triple_modular` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9124 | `triple_modular_redundancy_manager_lockstep` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9125 | `triple_modular_redundancy_manager_temporal_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9126 | `triple_modular_redundancy_manager_spatial_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9127 | `triple_modular_redundancy_manager_self_testing` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9128 | `triple_modular_redundancy_manager_fault_injectable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9129 | `triple_modular_redundancy_manager_latent_fault_detecting` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9130 | `triple_modular_redundancy_manager_fail_operational` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9131 | `triple_modular_redundancy_manager_fail_safe` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9132 | `triple_modular_redundancy_manager_diagnostic_coverage` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9133 | `triple_modular_redundancy_manager_clock_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9134 | `triple_modular_redundancy_manager_power_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9135 | `triple_modular_redundancy_manager_formally_instrumented` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9136 | `triple_modular_redundancy_manager_software_configurable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9137 | `dual_core_lockstep_monitor_single_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9138 | `dual_core_lockstep_monitor_dual_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9139 | `dual_core_lockstep_monitor_triple_modular` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9140 | `dual_core_lockstep_monitor_lockstep` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9141 | `dual_core_lockstep_monitor_temporal_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9142 | `dual_core_lockstep_monitor_spatial_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9143 | `dual_core_lockstep_monitor_self_testing` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9144 | `dual_core_lockstep_monitor_fault_injectable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9145 | `dual_core_lockstep_monitor_latent_fault_detecting` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9146 | `dual_core_lockstep_monitor_fail_operational` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9147 | `dual_core_lockstep_monitor_fail_safe` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9148 | `dual_core_lockstep_monitor_diagnostic_coverage` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9149 | `dual_core_lockstep_monitor_clock_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9150 | `dual_core_lockstep_monitor_power_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9151 | `dual_core_lockstep_monitor_formally_instrumented` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9152 | `dual_core_lockstep_monitor_software_configurable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9153 | `safety_island_controller_single_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9154 | `safety_island_controller_dual_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9155 | `safety_island_controller_triple_modular` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9156 | `safety_island_controller_lockstep` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9157 | `safety_island_controller_temporal_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9158 | `safety_island_controller_spatial_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9159 | `safety_island_controller_self_testing` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9160 | `safety_island_controller_fault_injectable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9161 | `safety_island_controller_latent_fault_detecting` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9162 | `safety_island_controller_fail_operational` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9163 | `safety_island_controller_fail_safe` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9164 | `safety_island_controller_diagnostic_coverage` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9165 | `safety_island_controller_clock_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9166 | `safety_island_controller_power_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9167 | `safety_island_controller_formally_instrumented` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9168 | `safety_island_controller_software_configurable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9169 | `diagnostic_test_sequencer_single_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9170 | `diagnostic_test_sequencer_dual_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9171 | `diagnostic_test_sequencer_triple_modular` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9172 | `diagnostic_test_sequencer_lockstep` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9173 | `diagnostic_test_sequencer_temporal_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9174 | `diagnostic_test_sequencer_spatial_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9175 | `diagnostic_test_sequencer_self_testing` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9176 | `diagnostic_test_sequencer_fault_injectable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9177 | `diagnostic_test_sequencer_latent_fault_detecting` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9178 | `diagnostic_test_sequencer_fail_operational` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9179 | `diagnostic_test_sequencer_fail_safe` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9180 | `diagnostic_test_sequencer_diagnostic_coverage` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9181 | `diagnostic_test_sequencer_clock_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9182 | `diagnostic_test_sequencer_power_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9183 | `diagnostic_test_sequencer_formally_instrumented` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9184 | `diagnostic_test_sequencer_software_configurable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9185 | `latent_fault_monitor_single_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9186 | `latent_fault_monitor_dual_channel` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9187 | `latent_fault_monitor_triple_modular` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9188 | `latent_fault_monitor_lockstep` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9189 | `latent_fault_monitor_temporal_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9190 | `latent_fault_monitor_spatial_redundancy` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9191 | `latent_fault_monitor_self_testing` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9192 | `latent_fault_monitor_fault_injectable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9193 | `latent_fault_monitor_latent_fault_detecting` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9194 | `latent_fault_monitor_fail_operational` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9195 | `latent_fault_monitor_fail_safe` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9196 | `latent_fault_monitor_diagnostic_coverage` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9197 | `latent_fault_monitor_clock_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9198 | `latent_fault_monitor_power_monitored` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9199 | `latent_fault_monitor_formally_instrumented` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9200 | `latent_fault_monitor_software_configurable` | Advanced Functional Safety | Redundancy and diagnostics |
| BB-9201 | `formal_assume_guarantee_wrapper_assertion_based` | Formal Verification | Formal harness components |
| BB-9202 | `formal_assume_guarantee_wrapper_transaction_level` | Formal Verification | Formal harness components |
| BB-9203 | `formal_assume_guarantee_wrapper_constrained_random` | Formal Verification | Formal harness components |
| BB-9204 | `formal_assume_guarantee_wrapper_coverage_driven` | Formal Verification | Formal harness components |
| BB-9205 | `formal_assume_guarantee_wrapper_scoreboard_based` | Formal Verification | Formal harness components |
| BB-9206 | `formal_assume_guarantee_wrapper_formal_friendly` | Formal Verification | Formal harness components |
| BB-9207 | `formal_assume_guarantee_wrapper_fault_injection` | Formal Verification | Formal harness components |
| BB-9208 | `formal_assume_guarantee_wrapper_boundary_focused` | Formal Verification | Formal harness components |
| BB-9209 | `formal_assume_guarantee_wrapper_stress_test` | Formal Verification | Formal harness components |
| BB-9210 | `formal_assume_guarantee_wrapper_latency_checking` | Formal Verification | Formal harness components |
| BB-9211 | `formal_assume_guarantee_wrapper_throughput_checking` | Formal Verification | Formal harness components |
| BB-9212 | `formal_assume_guarantee_wrapper_protocol_compliance` | Formal Verification | Formal harness components |
| BB-9213 | `formal_assume_guarantee_wrapper_reset_robustness` | Formal Verification | Formal harness components |
| BB-9214 | `formal_assume_guarantee_wrapper_clock_variation` | Formal Verification | Formal harness components |
| BB-9215 | `formal_assume_guarantee_wrapper_data_integrity` | Formal Verification | Formal harness components |
| BB-9216 | `formal_assume_guarantee_wrapper_regression_ready` | Formal Verification | Formal harness components |
| BB-9217 | `formal_liveness_monitor_assertion_based` | Formal Verification | Formal harness components |
| BB-9218 | `formal_liveness_monitor_transaction_level` | Formal Verification | Formal harness components |
| BB-9219 | `formal_liveness_monitor_constrained_random` | Formal Verification | Formal harness components |
| BB-9220 | `formal_liveness_monitor_coverage_driven` | Formal Verification | Formal harness components |
| BB-9221 | `formal_liveness_monitor_scoreboard_based` | Formal Verification | Formal harness components |
| BB-9222 | `formal_liveness_monitor_formal_friendly` | Formal Verification | Formal harness components |
| BB-9223 | `formal_liveness_monitor_fault_injection` | Formal Verification | Formal harness components |
| BB-9224 | `formal_liveness_monitor_boundary_focused` | Formal Verification | Formal harness components |
| BB-9225 | `formal_liveness_monitor_stress_test` | Formal Verification | Formal harness components |
| BB-9226 | `formal_liveness_monitor_latency_checking` | Formal Verification | Formal harness components |
| BB-9227 | `formal_liveness_monitor_throughput_checking` | Formal Verification | Formal harness components |
| BB-9228 | `formal_liveness_monitor_protocol_compliance` | Formal Verification | Formal harness components |
| BB-9229 | `formal_liveness_monitor_reset_robustness` | Formal Verification | Formal harness components |
| BB-9230 | `formal_liveness_monitor_clock_variation` | Formal Verification | Formal harness components |
| BB-9231 | `formal_liveness_monitor_data_integrity` | Formal Verification | Formal harness components |
| BB-9232 | `formal_liveness_monitor_regression_ready` | Formal Verification | Formal harness components |
| BB-9233 | `formal_equivalence_miter_assertion_based` | Formal Verification | Formal harness components |
| BB-9234 | `formal_equivalence_miter_transaction_level` | Formal Verification | Formal harness components |
| BB-9235 | `formal_equivalence_miter_constrained_random` | Formal Verification | Formal harness components |
| BB-9236 | `formal_equivalence_miter_coverage_driven` | Formal Verification | Formal harness components |
| BB-9237 | `formal_equivalence_miter_scoreboard_based` | Formal Verification | Formal harness components |
| BB-9238 | `formal_equivalence_miter_formal_friendly` | Formal Verification | Formal harness components |
| BB-9239 | `formal_equivalence_miter_fault_injection` | Formal Verification | Formal harness components |
| BB-9240 | `formal_equivalence_miter_boundary_focused` | Formal Verification | Formal harness components |
| BB-9241 | `formal_equivalence_miter_stress_test` | Formal Verification | Formal harness components |
| BB-9242 | `formal_equivalence_miter_latency_checking` | Formal Verification | Formal harness components |
| BB-9243 | `formal_equivalence_miter_throughput_checking` | Formal Verification | Formal harness components |
| BB-9244 | `formal_equivalence_miter_protocol_compliance` | Formal Verification | Formal harness components |
| BB-9245 | `formal_equivalence_miter_reset_robustness` | Formal Verification | Formal harness components |
| BB-9246 | `formal_equivalence_miter_clock_variation` | Formal Verification | Formal harness components |
| BB-9247 | `formal_equivalence_miter_data_integrity` | Formal Verification | Formal harness components |
| BB-9248 | `formal_equivalence_miter_regression_ready` | Formal Verification | Formal harness components |
| BB-9249 | `formal_cover_scenario_assertion_based` | Formal Verification | Formal harness components |
| BB-9250 | `formal_cover_scenario_transaction_level` | Formal Verification | Formal harness components |
| BB-9251 | `formal_cover_scenario_constrained_random` | Formal Verification | Formal harness components |
| BB-9252 | `formal_cover_scenario_coverage_driven` | Formal Verification | Formal harness components |
| BB-9253 | `formal_cover_scenario_scoreboard_based` | Formal Verification | Formal harness components |
| BB-9254 | `formal_cover_scenario_formal_friendly` | Formal Verification | Formal harness components |
| BB-9255 | `formal_cover_scenario_fault_injection` | Formal Verification | Formal harness components |
| BB-9256 | `formal_cover_scenario_boundary_focused` | Formal Verification | Formal harness components |
| BB-9257 | `formal_cover_scenario_stress_test` | Formal Verification | Formal harness components |
| BB-9258 | `formal_cover_scenario_latency_checking` | Formal Verification | Formal harness components |
| BB-9259 | `formal_cover_scenario_throughput_checking` | Formal Verification | Formal harness components |
| BB-9260 | `formal_cover_scenario_protocol_compliance` | Formal Verification | Formal harness components |
| BB-9261 | `formal_cover_scenario_reset_robustness` | Formal Verification | Formal harness components |
| BB-9262 | `formal_cover_scenario_clock_variation` | Formal Verification | Formal harness components |
| BB-9263 | `formal_cover_scenario_data_integrity` | Formal Verification | Formal harness components |
| BB-9264 | `formal_cover_scenario_regression_ready` | Formal Verification | Formal harness components |
| BB-9265 | `formal_induction_helper_assertion_based` | Formal Verification | Formal harness components |
| BB-9266 | `formal_induction_helper_transaction_level` | Formal Verification | Formal harness components |
| BB-9267 | `formal_induction_helper_constrained_random` | Formal Verification | Formal harness components |
| BB-9268 | `formal_induction_helper_coverage_driven` | Formal Verification | Formal harness components |
| BB-9269 | `formal_induction_helper_scoreboard_based` | Formal Verification | Formal harness components |
| BB-9270 | `formal_induction_helper_formal_friendly` | Formal Verification | Formal harness components |
| BB-9271 | `formal_induction_helper_fault_injection` | Formal Verification | Formal harness components |
| BB-9272 | `formal_induction_helper_boundary_focused` | Formal Verification | Formal harness components |
| BB-9273 | `formal_induction_helper_stress_test` | Formal Verification | Formal harness components |
| BB-9274 | `formal_induction_helper_latency_checking` | Formal Verification | Formal harness components |
| BB-9275 | `formal_induction_helper_throughput_checking` | Formal Verification | Formal harness components |
| BB-9276 | `formal_induction_helper_protocol_compliance` | Formal Verification | Formal harness components |
| BB-9277 | `formal_induction_helper_reset_robustness` | Formal Verification | Formal harness components |
| BB-9278 | `formal_induction_helper_clock_variation` | Formal Verification | Formal harness components |
| BB-9279 | `formal_induction_helper_data_integrity` | Formal Verification | Formal harness components |
| BB-9280 | `formal_induction_helper_regression_ready` | Formal Verification | Formal harness components |
| BB-9281 | `transaction_sequencer_bfm_assertion_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9282 | `transaction_sequencer_bfm_transaction_level` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9283 | `transaction_sequencer_bfm_constrained_random` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9284 | `transaction_sequencer_bfm_coverage_driven` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9285 | `transaction_sequencer_bfm_scoreboard_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9286 | `transaction_sequencer_bfm_formal_friendly` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9287 | `transaction_sequencer_bfm_fault_injection` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9288 | `transaction_sequencer_bfm_boundary_focused` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9289 | `transaction_sequencer_bfm_stress_test` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9290 | `transaction_sequencer_bfm_latency_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9291 | `transaction_sequencer_bfm_throughput_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9292 | `transaction_sequencer_bfm_protocol_compliance` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9293 | `transaction_sequencer_bfm_reset_robustness` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9294 | `transaction_sequencer_bfm_clock_variation` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9295 | `transaction_sequencer_bfm_data_integrity` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9296 | `transaction_sequencer_bfm_regression_ready` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9297 | `constrained_random_generator_assertion_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9298 | `constrained_random_generator_transaction_level` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9299 | `constrained_random_generator_constrained_random` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9300 | `constrained_random_generator_coverage_driven` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9301 | `constrained_random_generator_scoreboard_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9302 | `constrained_random_generator_formal_friendly` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9303 | `constrained_random_generator_fault_injection` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9304 | `constrained_random_generator_boundary_focused` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9305 | `constrained_random_generator_stress_test` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9306 | `constrained_random_generator_latency_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9307 | `constrained_random_generator_throughput_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9308 | `constrained_random_generator_protocol_compliance` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9309 | `constrained_random_generator_reset_robustness` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9310 | `constrained_random_generator_clock_variation` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9311 | `constrained_random_generator_data_integrity` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9312 | `constrained_random_generator_regression_ready` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9313 | `functional_coverage_database_assertion_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9314 | `functional_coverage_database_transaction_level` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9315 | `functional_coverage_database_constrained_random` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9316 | `functional_coverage_database_coverage_driven` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9317 | `functional_coverage_database_scoreboard_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9318 | `functional_coverage_database_formal_friendly` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9319 | `functional_coverage_database_fault_injection` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9320 | `functional_coverage_database_boundary_focused` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9321 | `functional_coverage_database_stress_test` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9322 | `functional_coverage_database_latency_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9323 | `functional_coverage_database_throughput_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9324 | `functional_coverage_database_protocol_compliance` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9325 | `functional_coverage_database_reset_robustness` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9326 | `functional_coverage_database_clock_variation` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9327 | `functional_coverage_database_data_integrity` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9328 | `functional_coverage_database_regression_ready` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9329 | `protocol_scoreboard_assertion_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9330 | `protocol_scoreboard_transaction_level` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9331 | `protocol_scoreboard_constrained_random` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9332 | `protocol_scoreboard_coverage_driven` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9333 | `protocol_scoreboard_scoreboard_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9334 | `protocol_scoreboard_formal_friendly` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9335 | `protocol_scoreboard_fault_injection` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9336 | `protocol_scoreboard_boundary_focused` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9337 | `protocol_scoreboard_stress_test` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9338 | `protocol_scoreboard_latency_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9339 | `protocol_scoreboard_throughput_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9340 | `protocol_scoreboard_protocol_compliance` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9341 | `protocol_scoreboard_reset_robustness` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9342 | `protocol_scoreboard_clock_variation` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9343 | `protocol_scoreboard_data_integrity` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9344 | `protocol_scoreboard_regression_ready` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9345 | `testbench_configuration_manager_assertion_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9346 | `testbench_configuration_manager_transaction_level` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9347 | `testbench_configuration_manager_constrained_random` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9348 | `testbench_configuration_manager_coverage_driven` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9349 | `testbench_configuration_manager_scoreboard_based` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9350 | `testbench_configuration_manager_formal_friendly` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9351 | `testbench_configuration_manager_fault_injection` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9352 | `testbench_configuration_manager_boundary_focused` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9353 | `testbench_configuration_manager_stress_test` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9354 | `testbench_configuration_manager_latency_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9355 | `testbench_configuration_manager_throughput_checking` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9356 | `testbench_configuration_manager_protocol_compliance` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9357 | `testbench_configuration_manager_reset_robustness` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9358 | `testbench_configuration_manager_clock_variation` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9359 | `testbench_configuration_manager_data_integrity` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9360 | `testbench_configuration_manager_regression_ready` | VHDL Verification Components | Reusable verification infrastructure |
| BB-9361 | `memory_bist_controller_assertion_based` | DFT and BIST | Design-for-test logic |
| BB-9362 | `memory_bist_controller_transaction_level` | DFT and BIST | Design-for-test logic |
| BB-9363 | `memory_bist_controller_constrained_random` | DFT and BIST | Design-for-test logic |
| BB-9364 | `memory_bist_controller_coverage_driven` | DFT and BIST | Design-for-test logic |
| BB-9365 | `memory_bist_controller_scoreboard_based` | DFT and BIST | Design-for-test logic |
| BB-9366 | `memory_bist_controller_formal_friendly` | DFT and BIST | Design-for-test logic |
| BB-9367 | `memory_bist_controller_fault_injection` | DFT and BIST | Design-for-test logic |
| BB-9368 | `memory_bist_controller_boundary_focused` | DFT and BIST | Design-for-test logic |
| BB-9369 | `memory_bist_controller_stress_test` | DFT and BIST | Design-for-test logic |
| BB-9370 | `memory_bist_controller_latency_checking` | DFT and BIST | Design-for-test logic |
| BB-9371 | `memory_bist_controller_throughput_checking` | DFT and BIST | Design-for-test logic |
| BB-9372 | `memory_bist_controller_protocol_compliance` | DFT and BIST | Design-for-test logic |
| BB-9373 | `memory_bist_controller_reset_robustness` | DFT and BIST | Design-for-test logic |
| BB-9374 | `memory_bist_controller_clock_variation` | DFT and BIST | Design-for-test logic |
| BB-9375 | `memory_bist_controller_data_integrity` | DFT and BIST | Design-for-test logic |
| BB-9376 | `memory_bist_controller_regression_ready` | DFT and BIST | Design-for-test logic |
| BB-9377 | `logic_bist_controller_assertion_based` | DFT and BIST | Design-for-test logic |
| BB-9378 | `logic_bist_controller_transaction_level` | DFT and BIST | Design-for-test logic |
| BB-9379 | `logic_bist_controller_constrained_random` | DFT and BIST | Design-for-test logic |
| BB-9380 | `logic_bist_controller_coverage_driven` | DFT and BIST | Design-for-test logic |
| BB-9381 | `logic_bist_controller_scoreboard_based` | DFT and BIST | Design-for-test logic |
| BB-9382 | `logic_bist_controller_formal_friendly` | DFT and BIST | Design-for-test logic |
| BB-9383 | `logic_bist_controller_fault_injection` | DFT and BIST | Design-for-test logic |
| BB-9384 | `logic_bist_controller_boundary_focused` | DFT and BIST | Design-for-test logic |
| BB-9385 | `logic_bist_controller_stress_test` | DFT and BIST | Design-for-test logic |
| BB-9386 | `logic_bist_controller_latency_checking` | DFT and BIST | Design-for-test logic |
| BB-9387 | `logic_bist_controller_throughput_checking` | DFT and BIST | Design-for-test logic |
| BB-9388 | `logic_bist_controller_protocol_compliance` | DFT and BIST | Design-for-test logic |
| BB-9389 | `logic_bist_controller_reset_robustness` | DFT and BIST | Design-for-test logic |
| BB-9390 | `logic_bist_controller_clock_variation` | DFT and BIST | Design-for-test logic |
| BB-9391 | `logic_bist_controller_data_integrity` | DFT and BIST | Design-for-test logic |
| BB-9392 | `logic_bist_controller_regression_ready` | DFT and BIST | Design-for-test logic |
| BB-9393 | `scan_chain_controller_assertion_based` | DFT and BIST | Design-for-test logic |
| BB-9394 | `scan_chain_controller_transaction_level` | DFT and BIST | Design-for-test logic |
| BB-9395 | `scan_chain_controller_constrained_random` | DFT and BIST | Design-for-test logic |
| BB-9396 | `scan_chain_controller_coverage_driven` | DFT and BIST | Design-for-test logic |
| BB-9397 | `scan_chain_controller_scoreboard_based` | DFT and BIST | Design-for-test logic |
| BB-9398 | `scan_chain_controller_formal_friendly` | DFT and BIST | Design-for-test logic |
| BB-9399 | `scan_chain_controller_fault_injection` | DFT and BIST | Design-for-test logic |
| BB-9400 | `scan_chain_controller_boundary_focused` | DFT and BIST | Design-for-test logic |
| BB-9401 | `scan_chain_controller_stress_test` | DFT and BIST | Design-for-test logic |
| BB-9402 | `scan_chain_controller_latency_checking` | DFT and BIST | Design-for-test logic |
| BB-9403 | `scan_chain_controller_throughput_checking` | DFT and BIST | Design-for-test logic |
| BB-9404 | `scan_chain_controller_protocol_compliance` | DFT and BIST | Design-for-test logic |
| BB-9405 | `scan_chain_controller_reset_robustness` | DFT and BIST | Design-for-test logic |
| BB-9406 | `scan_chain_controller_clock_variation` | DFT and BIST | Design-for-test logic |
| BB-9407 | `scan_chain_controller_data_integrity` | DFT and BIST | Design-for-test logic |
| BB-9408 | `scan_chain_controller_regression_ready` | DFT and BIST | Design-for-test logic |
| BB-9409 | `boundary_scan_tap_assertion_based` | DFT and BIST | Design-for-test logic |
| BB-9410 | `boundary_scan_tap_transaction_level` | DFT and BIST | Design-for-test logic |
| BB-9411 | `boundary_scan_tap_constrained_random` | DFT and BIST | Design-for-test logic |
| BB-9412 | `boundary_scan_tap_coverage_driven` | DFT and BIST | Design-for-test logic |
| BB-9413 | `boundary_scan_tap_scoreboard_based` | DFT and BIST | Design-for-test logic |
| BB-9414 | `boundary_scan_tap_formal_friendly` | DFT and BIST | Design-for-test logic |
| BB-9415 | `boundary_scan_tap_fault_injection` | DFT and BIST | Design-for-test logic |
| BB-9416 | `boundary_scan_tap_boundary_focused` | DFT and BIST | Design-for-test logic |
| BB-9417 | `boundary_scan_tap_stress_test` | DFT and BIST | Design-for-test logic |
| BB-9418 | `boundary_scan_tap_latency_checking` | DFT and BIST | Design-for-test logic |
| BB-9419 | `boundary_scan_tap_throughput_checking` | DFT and BIST | Design-for-test logic |
| BB-9420 | `boundary_scan_tap_protocol_compliance` | DFT and BIST | Design-for-test logic |
| BB-9421 | `boundary_scan_tap_reset_robustness` | DFT and BIST | Design-for-test logic |
| BB-9422 | `boundary_scan_tap_clock_variation` | DFT and BIST | Design-for-test logic |
| BB-9423 | `boundary_scan_tap_data_integrity` | DFT and BIST | Design-for-test logic |
| BB-9424 | `boundary_scan_tap_regression_ready` | DFT and BIST | Design-for-test logic |
| BB-9425 | `at_speed_test_controller_assertion_based` | DFT and BIST | Design-for-test logic |
| BB-9426 | `at_speed_test_controller_transaction_level` | DFT and BIST | Design-for-test logic |
| BB-9427 | `at_speed_test_controller_constrained_random` | DFT and BIST | Design-for-test logic |
| BB-9428 | `at_speed_test_controller_coverage_driven` | DFT and BIST | Design-for-test logic |
| BB-9429 | `at_speed_test_controller_scoreboard_based` | DFT and BIST | Design-for-test logic |
| BB-9430 | `at_speed_test_controller_formal_friendly` | DFT and BIST | Design-for-test logic |
| BB-9431 | `at_speed_test_controller_fault_injection` | DFT and BIST | Design-for-test logic |
| BB-9432 | `at_speed_test_controller_boundary_focused` | DFT and BIST | Design-for-test logic |
| BB-9433 | `at_speed_test_controller_stress_test` | DFT and BIST | Design-for-test logic |
| BB-9434 | `at_speed_test_controller_latency_checking` | DFT and BIST | Design-for-test logic |
| BB-9435 | `at_speed_test_controller_throughput_checking` | DFT and BIST | Design-for-test logic |
| BB-9436 | `at_speed_test_controller_protocol_compliance` | DFT and BIST | Design-for-test logic |
| BB-9437 | `at_speed_test_controller_reset_robustness` | DFT and BIST | Design-for-test logic |
| BB-9438 | `at_speed_test_controller_clock_variation` | DFT and BIST | Design-for-test logic |
| BB-9439 | `at_speed_test_controller_data_integrity` | DFT and BIST | Design-for-test logic |
| BB-9440 | `at_speed_test_controller_regression_ready` | DFT and BIST | Design-for-test logic |
| BB-9441 | `instruction_trace_encoder_assertion_based` | Debug and Trace | On-chip observability |
| BB-9442 | `instruction_trace_encoder_transaction_level` | Debug and Trace | On-chip observability |
| BB-9443 | `instruction_trace_encoder_constrained_random` | Debug and Trace | On-chip observability |
| BB-9444 | `instruction_trace_encoder_coverage_driven` | Debug and Trace | On-chip observability |
| BB-9445 | `instruction_trace_encoder_scoreboard_based` | Debug and Trace | On-chip observability |
| BB-9446 | `instruction_trace_encoder_formal_friendly` | Debug and Trace | On-chip observability |
| BB-9447 | `instruction_trace_encoder_fault_injection` | Debug and Trace | On-chip observability |
| BB-9448 | `instruction_trace_encoder_boundary_focused` | Debug and Trace | On-chip observability |
| BB-9449 | `instruction_trace_encoder_stress_test` | Debug and Trace | On-chip observability |
| BB-9450 | `instruction_trace_encoder_latency_checking` | Debug and Trace | On-chip observability |
| BB-9451 | `instruction_trace_encoder_throughput_checking` | Debug and Trace | On-chip observability |
| BB-9452 | `instruction_trace_encoder_protocol_compliance` | Debug and Trace | On-chip observability |
| BB-9453 | `instruction_trace_encoder_reset_robustness` | Debug and Trace | On-chip observability |
| BB-9454 | `instruction_trace_encoder_clock_variation` | Debug and Trace | On-chip observability |
| BB-9455 | `instruction_trace_encoder_data_integrity` | Debug and Trace | On-chip observability |
| BB-9456 | `instruction_trace_encoder_regression_ready` | Debug and Trace | On-chip observability |
| BB-9457 | `data_trace_compressor_assertion_based` | Debug and Trace | On-chip observability |
| BB-9458 | `data_trace_compressor_transaction_level` | Debug and Trace | On-chip observability |
| BB-9459 | `data_trace_compressor_constrained_random` | Debug and Trace | On-chip observability |
| BB-9460 | `data_trace_compressor_coverage_driven` | Debug and Trace | On-chip observability |
| BB-9461 | `data_trace_compressor_scoreboard_based` | Debug and Trace | On-chip observability |
| BB-9462 | `data_trace_compressor_formal_friendly` | Debug and Trace | On-chip observability |
| BB-9463 | `data_trace_compressor_fault_injection` | Debug and Trace | On-chip observability |
| BB-9464 | `data_trace_compressor_boundary_focused` | Debug and Trace | On-chip observability |
| BB-9465 | `data_trace_compressor_stress_test` | Debug and Trace | On-chip observability |
| BB-9466 | `data_trace_compressor_latency_checking` | Debug and Trace | On-chip observability |
| BB-9467 | `data_trace_compressor_throughput_checking` | Debug and Trace | On-chip observability |
| BB-9468 | `data_trace_compressor_protocol_compliance` | Debug and Trace | On-chip observability |
| BB-9469 | `data_trace_compressor_reset_robustness` | Debug and Trace | On-chip observability |
| BB-9470 | `data_trace_compressor_clock_variation` | Debug and Trace | On-chip observability |
| BB-9471 | `data_trace_compressor_data_integrity` | Debug and Trace | On-chip observability |
| BB-9472 | `data_trace_compressor_regression_ready` | Debug and Trace | On-chip observability |
| BB-9473 | `trigger_matrix_assertion_based` | Debug and Trace | On-chip observability |
| BB-9474 | `trigger_matrix_transaction_level` | Debug and Trace | On-chip observability |
| BB-9475 | `trigger_matrix_constrained_random` | Debug and Trace | On-chip observability |
| BB-9476 | `trigger_matrix_coverage_driven` | Debug and Trace | On-chip observability |
| BB-9477 | `trigger_matrix_scoreboard_based` | Debug and Trace | On-chip observability |
| BB-9478 | `trigger_matrix_formal_friendly` | Debug and Trace | On-chip observability |
| BB-9479 | `trigger_matrix_fault_injection` | Debug and Trace | On-chip observability |
| BB-9480 | `trigger_matrix_boundary_focused` | Debug and Trace | On-chip observability |
| BB-9481 | `trigger_matrix_stress_test` | Debug and Trace | On-chip observability |
| BB-9482 | `trigger_matrix_latency_checking` | Debug and Trace | On-chip observability |
| BB-9483 | `trigger_matrix_throughput_checking` | Debug and Trace | On-chip observability |
| BB-9484 | `trigger_matrix_protocol_compliance` | Debug and Trace | On-chip observability |
| BB-9485 | `trigger_matrix_reset_robustness` | Debug and Trace | On-chip observability |
| BB-9486 | `trigger_matrix_clock_variation` | Debug and Trace | On-chip observability |
| BB-9487 | `trigger_matrix_data_integrity` | Debug and Trace | On-chip observability |
| BB-9488 | `trigger_matrix_regression_ready` | Debug and Trace | On-chip observability |
| BB-9489 | `embedded_logic_analyzer_assertion_based` | Debug and Trace | On-chip observability |
| BB-9490 | `embedded_logic_analyzer_transaction_level` | Debug and Trace | On-chip observability |
| BB-9491 | `embedded_logic_analyzer_constrained_random` | Debug and Trace | On-chip observability |
| BB-9492 | `embedded_logic_analyzer_coverage_driven` | Debug and Trace | On-chip observability |
| BB-9493 | `embedded_logic_analyzer_scoreboard_based` | Debug and Trace | On-chip observability |
| BB-9494 | `embedded_logic_analyzer_formal_friendly` | Debug and Trace | On-chip observability |
| BB-9495 | `embedded_logic_analyzer_fault_injection` | Debug and Trace | On-chip observability |
| BB-9496 | `embedded_logic_analyzer_boundary_focused` | Debug and Trace | On-chip observability |
| BB-9497 | `embedded_logic_analyzer_stress_test` | Debug and Trace | On-chip observability |
| BB-9498 | `embedded_logic_analyzer_latency_checking` | Debug and Trace | On-chip observability |
| BB-9499 | `embedded_logic_analyzer_throughput_checking` | Debug and Trace | On-chip observability |
| BB-9500 | `embedded_logic_analyzer_protocol_compliance` | Debug and Trace | On-chip observability |
| BB-9501 | `embedded_logic_analyzer_reset_robustness` | Debug and Trace | On-chip observability |
| BB-9502 | `embedded_logic_analyzer_clock_variation` | Debug and Trace | On-chip observability |
| BB-9503 | `embedded_logic_analyzer_data_integrity` | Debug and Trace | On-chip observability |
| BB-9504 | `embedded_logic_analyzer_regression_ready` | Debug and Trace | On-chip observability |
| BB-9505 | `performance_monitoring_unit_assertion_based` | Debug and Trace | On-chip observability |
| BB-9506 | `performance_monitoring_unit_transaction_level` | Debug and Trace | On-chip observability |
| BB-9507 | `performance_monitoring_unit_constrained_random` | Debug and Trace | On-chip observability |
| BB-9508 | `performance_monitoring_unit_coverage_driven` | Debug and Trace | On-chip observability |
| BB-9509 | `performance_monitoring_unit_scoreboard_based` | Debug and Trace | On-chip observability |
| BB-9510 | `performance_monitoring_unit_formal_friendly` | Debug and Trace | On-chip observability |
| BB-9511 | `performance_monitoring_unit_fault_injection` | Debug and Trace | On-chip observability |
| BB-9512 | `performance_monitoring_unit_boundary_focused` | Debug and Trace | On-chip observability |
| BB-9513 | `performance_monitoring_unit_stress_test` | Debug and Trace | On-chip observability |
| BB-9514 | `performance_monitoring_unit_latency_checking` | Debug and Trace | On-chip observability |
| BB-9515 | `performance_monitoring_unit_throughput_checking` | Debug and Trace | On-chip observability |
| BB-9516 | `performance_monitoring_unit_protocol_compliance` | Debug and Trace | On-chip observability |
| BB-9517 | `performance_monitoring_unit_reset_robustness` | Debug and Trace | On-chip observability |
| BB-9518 | `performance_monitoring_unit_clock_variation` | Debug and Trace | On-chip observability |
| BB-9519 | `performance_monitoring_unit_data_integrity` | Debug and Trace | On-chip observability |
| BB-9520 | `performance_monitoring_unit_regression_ready` | Debug and Trace | On-chip observability |
| BB-9521 | `lz4_compressor_single_lane` | Advanced Compression | Lossless compression |
| BB-9522 | `lz4_compressor_multi_lane` | Advanced Compression | Lossless compression |
| BB-9523 | `lz4_compressor_pipelined` | Advanced Compression | Lossless compression |
| BB-9524 | `lz4_compressor_deep_pipelined` | Advanced Compression | Lossless compression |
| BB-9525 | `lz4_compressor_frame_aware` | Advanced Compression | Lossless compression |
| BB-9526 | `lz4_compressor_packet_aware` | Advanced Compression | Lossless compression |
| BB-9527 | `lz4_compressor_backpressure_capable` | Advanced Compression | Lossless compression |
| BB-9528 | `lz4_compressor_rate_adaptive` | Advanced Compression | Lossless compression |
| BB-9529 | `lz4_compressor_time_multiplexed` | Advanced Compression | Lossless compression |
| BB-9530 | `lz4_compressor_fully_parallel` | Advanced Compression | Lossless compression |
| BB-9531 | `lz4_compressor_buffered` | Advanced Compression | Lossless compression |
| BB-9532 | `lz4_compressor_clock_crossing` | Advanced Compression | Lossless compression |
| BB-9533 | `lz4_compressor_error_detecting` | Advanced Compression | Lossless compression |
| BB-9534 | `lz4_compressor_formally_instrumented` | Advanced Compression | Lossless compression |
| BB-9535 | `lz4_compressor_low_power` | Advanced Compression | Lossless compression |
| BB-9536 | `lz4_compressor_axi_stream` | Advanced Compression | Lossless compression |
| BB-9537 | `lz4_decompressor_single_lane` | Advanced Compression | Lossless compression |
| BB-9538 | `lz4_decompressor_multi_lane` | Advanced Compression | Lossless compression |
| BB-9539 | `lz4_decompressor_pipelined` | Advanced Compression | Lossless compression |
| BB-9540 | `lz4_decompressor_deep_pipelined` | Advanced Compression | Lossless compression |
| BB-9541 | `lz4_decompressor_frame_aware` | Advanced Compression | Lossless compression |
| BB-9542 | `lz4_decompressor_packet_aware` | Advanced Compression | Lossless compression |
| BB-9543 | `lz4_decompressor_backpressure_capable` | Advanced Compression | Lossless compression |
| BB-9544 | `lz4_decompressor_rate_adaptive` | Advanced Compression | Lossless compression |
| BB-9545 | `lz4_decompressor_time_multiplexed` | Advanced Compression | Lossless compression |
| BB-9546 | `lz4_decompressor_fully_parallel` | Advanced Compression | Lossless compression |
| BB-9547 | `lz4_decompressor_buffered` | Advanced Compression | Lossless compression |
| BB-9548 | `lz4_decompressor_clock_crossing` | Advanced Compression | Lossless compression |
| BB-9549 | `lz4_decompressor_error_detecting` | Advanced Compression | Lossless compression |
| BB-9550 | `lz4_decompressor_formally_instrumented` | Advanced Compression | Lossless compression |
| BB-9551 | `lz4_decompressor_low_power` | Advanced Compression | Lossless compression |
| BB-9552 | `lz4_decompressor_axi_stream` | Advanced Compression | Lossless compression |
| BB-9553 | `deflate_engine_single_lane` | Advanced Compression | Lossless compression |
| BB-9554 | `deflate_engine_multi_lane` | Advanced Compression | Lossless compression |
| BB-9555 | `deflate_engine_pipelined` | Advanced Compression | Lossless compression |
| BB-9556 | `deflate_engine_deep_pipelined` | Advanced Compression | Lossless compression |
| BB-9557 | `deflate_engine_frame_aware` | Advanced Compression | Lossless compression |
| BB-9558 | `deflate_engine_packet_aware` | Advanced Compression | Lossless compression |
| BB-9559 | `deflate_engine_backpressure_capable` | Advanced Compression | Lossless compression |
| BB-9560 | `deflate_engine_rate_adaptive` | Advanced Compression | Lossless compression |
| BB-9561 | `deflate_engine_time_multiplexed` | Advanced Compression | Lossless compression |
| BB-9562 | `deflate_engine_fully_parallel` | Advanced Compression | Lossless compression |
| BB-9563 | `deflate_engine_buffered` | Advanced Compression | Lossless compression |
| BB-9564 | `deflate_engine_clock_crossing` | Advanced Compression | Lossless compression |
| BB-9565 | `deflate_engine_error_detecting` | Advanced Compression | Lossless compression |
| BB-9566 | `deflate_engine_formally_instrumented` | Advanced Compression | Lossless compression |
| BB-9567 | `deflate_engine_low_power` | Advanced Compression | Lossless compression |
| BB-9568 | `deflate_engine_axi_stream` | Advanced Compression | Lossless compression |
| BB-9569 | `zstd_literal_encoder_single_lane` | Advanced Compression | Lossless compression |
| BB-9570 | `zstd_literal_encoder_multi_lane` | Advanced Compression | Lossless compression |
| BB-9571 | `zstd_literal_encoder_pipelined` | Advanced Compression | Lossless compression |
| BB-9572 | `zstd_literal_encoder_deep_pipelined` | Advanced Compression | Lossless compression |
| BB-9573 | `zstd_literal_encoder_frame_aware` | Advanced Compression | Lossless compression |
| BB-9574 | `zstd_literal_encoder_packet_aware` | Advanced Compression | Lossless compression |
| BB-9575 | `zstd_literal_encoder_backpressure_capable` | Advanced Compression | Lossless compression |
| BB-9576 | `zstd_literal_encoder_rate_adaptive` | Advanced Compression | Lossless compression |
| BB-9577 | `zstd_literal_encoder_time_multiplexed` | Advanced Compression | Lossless compression |
| BB-9578 | `zstd_literal_encoder_fully_parallel` | Advanced Compression | Lossless compression |
| BB-9579 | `zstd_literal_encoder_buffered` | Advanced Compression | Lossless compression |
| BB-9580 | `zstd_literal_encoder_clock_crossing` | Advanced Compression | Lossless compression |
| BB-9581 | `zstd_literal_encoder_error_detecting` | Advanced Compression | Lossless compression |
| BB-9582 | `zstd_literal_encoder_formally_instrumented` | Advanced Compression | Lossless compression |
| BB-9583 | `zstd_literal_encoder_low_power` | Advanced Compression | Lossless compression |
| BB-9584 | `zstd_literal_encoder_axi_stream` | Advanced Compression | Lossless compression |
| BB-9585 | `arithmetic_coder_single_lane` | Advanced Compression | Lossless compression |
| BB-9586 | `arithmetic_coder_multi_lane` | Advanced Compression | Lossless compression |
| BB-9587 | `arithmetic_coder_pipelined` | Advanced Compression | Lossless compression |
| BB-9588 | `arithmetic_coder_deep_pipelined` | Advanced Compression | Lossless compression |
| BB-9589 | `arithmetic_coder_frame_aware` | Advanced Compression | Lossless compression |
| BB-9590 | `arithmetic_coder_packet_aware` | Advanced Compression | Lossless compression |
| BB-9591 | `arithmetic_coder_backpressure_capable` | Advanced Compression | Lossless compression |
| BB-9592 | `arithmetic_coder_rate_adaptive` | Advanced Compression | Lossless compression |
| BB-9593 | `arithmetic_coder_time_multiplexed` | Advanced Compression | Lossless compression |
| BB-9594 | `arithmetic_coder_fully_parallel` | Advanced Compression | Lossless compression |
| BB-9595 | `arithmetic_coder_buffered` | Advanced Compression | Lossless compression |
| BB-9596 | `arithmetic_coder_clock_crossing` | Advanced Compression | Lossless compression |
| BB-9597 | `arithmetic_coder_error_detecting` | Advanced Compression | Lossless compression |
| BB-9598 | `arithmetic_coder_formally_instrumented` | Advanced Compression | Lossless compression |
| BB-9599 | `arithmetic_coder_low_power` | Advanced Compression | Lossless compression |
| BB-9600 | `arithmetic_coder_axi_stream` | Advanced Compression | Lossless compression |
| BB-9601 | `nvme_submission_queue_single_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9602 | `nvme_submission_queue_dual_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9603 | `nvme_submission_queue_banked` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9604 | `nvme_submission_queue_interleaved` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9605 | `nvme_submission_queue_write_back` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9606 | `nvme_submission_queue_write_through` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9607 | `nvme_submission_queue_nonblocking` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9608 | `nvme_submission_queue_pipelined` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9609 | `nvme_submission_queue_burst_optimized` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9610 | `nvme_submission_queue_multi_channel` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9611 | `nvme_submission_queue_ecc_protected` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9612 | `nvme_submission_queue_scrubbed` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9613 | `nvme_submission_queue_clock_crossing` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9614 | `nvme_submission_queue_qos_aware` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9615 | `nvme_submission_queue_low_power` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9616 | `nvme_submission_queue_formally_instrumented` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9617 | `nvme_completion_queue_single_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9618 | `nvme_completion_queue_dual_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9619 | `nvme_completion_queue_banked` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9620 | `nvme_completion_queue_interleaved` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9621 | `nvme_completion_queue_write_back` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9622 | `nvme_completion_queue_write_through` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9623 | `nvme_completion_queue_nonblocking` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9624 | `nvme_completion_queue_pipelined` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9625 | `nvme_completion_queue_burst_optimized` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9626 | `nvme_completion_queue_multi_channel` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9627 | `nvme_completion_queue_ecc_protected` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9628 | `nvme_completion_queue_scrubbed` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9629 | `nvme_completion_queue_clock_crossing` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9630 | `nvme_completion_queue_qos_aware` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9631 | `nvme_completion_queue_low_power` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9632 | `nvme_completion_queue_formally_instrumented` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9633 | `raid_xor_engine_single_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9634 | `raid_xor_engine_dual_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9635 | `raid_xor_engine_banked` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9636 | `raid_xor_engine_interleaved` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9637 | `raid_xor_engine_write_back` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9638 | `raid_xor_engine_write_through` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9639 | `raid_xor_engine_nonblocking` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9640 | `raid_xor_engine_pipelined` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9641 | `raid_xor_engine_burst_optimized` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9642 | `raid_xor_engine_multi_channel` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9643 | `raid_xor_engine_ecc_protected` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9644 | `raid_xor_engine_scrubbed` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9645 | `raid_xor_engine_clock_crossing` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9646 | `raid_xor_engine_qos_aware` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9647 | `raid_xor_engine_low_power` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9648 | `raid_xor_engine_formally_instrumented` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9649 | `raid_rebuild_controller_single_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9650 | `raid_rebuild_controller_dual_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9651 | `raid_rebuild_controller_banked` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9652 | `raid_rebuild_controller_interleaved` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9653 | `raid_rebuild_controller_write_back` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9654 | `raid_rebuild_controller_write_through` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9655 | `raid_rebuild_controller_nonblocking` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9656 | `raid_rebuild_controller_pipelined` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9657 | `raid_rebuild_controller_burst_optimized` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9658 | `raid_rebuild_controller_multi_channel` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9659 | `raid_rebuild_controller_ecc_protected` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9660 | `raid_rebuild_controller_scrubbed` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9661 | `raid_rebuild_controller_clock_crossing` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9662 | `raid_rebuild_controller_qos_aware` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9663 | `raid_rebuild_controller_low_power` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9664 | `raid_rebuild_controller_formally_instrumented` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9665 | `zoned_storage_manager_single_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9666 | `zoned_storage_manager_dual_port` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9667 | `zoned_storage_manager_banked` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9668 | `zoned_storage_manager_interleaved` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9669 | `zoned_storage_manager_write_back` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9670 | `zoned_storage_manager_write_through` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9671 | `zoned_storage_manager_nonblocking` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9672 | `zoned_storage_manager_pipelined` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9673 | `zoned_storage_manager_burst_optimized` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9674 | `zoned_storage_manager_multi_channel` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9675 | `zoned_storage_manager_ecc_protected` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9676 | `zoned_storage_manager_scrubbed` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9677 | `zoned_storage_manager_clock_crossing` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9678 | `zoned_storage_manager_qos_aware` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9679 | `zoned_storage_manager_low_power` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9680 | `zoned_storage_manager_formally_instrumented` | Advanced Storage | NVMe RAID and zoned storage |
| BB-9681 | `regex_dfa_engine_single_lane` | Database and Search | Search and database acceleration |
| BB-9682 | `regex_dfa_engine_multi_lane` | Database and Search | Search and database acceleration |
| BB-9683 | `regex_dfa_engine_pipelined` | Database and Search | Search and database acceleration |
| BB-9684 | `regex_dfa_engine_deep_pipelined` | Database and Search | Search and database acceleration |
| BB-9685 | `regex_dfa_engine_frame_aware` | Database and Search | Search and database acceleration |
| BB-9686 | `regex_dfa_engine_packet_aware` | Database and Search | Search and database acceleration |
| BB-9687 | `regex_dfa_engine_backpressure_capable` | Database and Search | Search and database acceleration |
| BB-9688 | `regex_dfa_engine_rate_adaptive` | Database and Search | Search and database acceleration |
| BB-9689 | `regex_dfa_engine_time_multiplexed` | Database and Search | Search and database acceleration |
| BB-9690 | `regex_dfa_engine_fully_parallel` | Database and Search | Search and database acceleration |
| BB-9691 | `regex_dfa_engine_buffered` | Database and Search | Search and database acceleration |
| BB-9692 | `regex_dfa_engine_clock_crossing` | Database and Search | Search and database acceleration |
| BB-9693 | `regex_dfa_engine_error_detecting` | Database and Search | Search and database acceleration |
| BB-9694 | `regex_dfa_engine_formally_instrumented` | Database and Search | Search and database acceleration |
| BB-9695 | `regex_dfa_engine_low_power` | Database and Search | Search and database acceleration |
| BB-9696 | `regex_dfa_engine_axi_stream` | Database and Search | Search and database acceleration |
| BB-9697 | `aho_corasick_matcher_single_lane` | Database and Search | Search and database acceleration |
| BB-9698 | `aho_corasick_matcher_multi_lane` | Database and Search | Search and database acceleration |
| BB-9699 | `aho_corasick_matcher_pipelined` | Database and Search | Search and database acceleration |
| BB-9700 | `aho_corasick_matcher_deep_pipelined` | Database and Search | Search and database acceleration |
| BB-9701 | `aho_corasick_matcher_frame_aware` | Database and Search | Search and database acceleration |
| BB-9702 | `aho_corasick_matcher_packet_aware` | Database and Search | Search and database acceleration |
| BB-9703 | `aho_corasick_matcher_backpressure_capable` | Database and Search | Search and database acceleration |
| BB-9704 | `aho_corasick_matcher_rate_adaptive` | Database and Search | Search and database acceleration |
| BB-9705 | `aho_corasick_matcher_time_multiplexed` | Database and Search | Search and database acceleration |
| BB-9706 | `aho_corasick_matcher_fully_parallel` | Database and Search | Search and database acceleration |
| BB-9707 | `aho_corasick_matcher_buffered` | Database and Search | Search and database acceleration |
| BB-9708 | `aho_corasick_matcher_clock_crossing` | Database and Search | Search and database acceleration |
| BB-9709 | `aho_corasick_matcher_error_detecting` | Database and Search | Search and database acceleration |
| BB-9710 | `aho_corasick_matcher_formally_instrumented` | Database and Search | Search and database acceleration |
| BB-9711 | `aho_corasick_matcher_low_power` | Database and Search | Search and database acceleration |
| BB-9712 | `aho_corasick_matcher_axi_stream` | Database and Search | Search and database acceleration |
| BB-9713 | `bloom_filter_bank_single_lane` | Database and Search | Search and database acceleration |
| BB-9714 | `bloom_filter_bank_multi_lane` | Database and Search | Search and database acceleration |
| BB-9715 | `bloom_filter_bank_pipelined` | Database and Search | Search and database acceleration |
| BB-9716 | `bloom_filter_bank_deep_pipelined` | Database and Search | Search and database acceleration |
| BB-9717 | `bloom_filter_bank_frame_aware` | Database and Search | Search and database acceleration |
| BB-9718 | `bloom_filter_bank_packet_aware` | Database and Search | Search and database acceleration |
| BB-9719 | `bloom_filter_bank_backpressure_capable` | Database and Search | Search and database acceleration |
| BB-9720 | `bloom_filter_bank_rate_adaptive` | Database and Search | Search and database acceleration |
| BB-9721 | `bloom_filter_bank_time_multiplexed` | Database and Search | Search and database acceleration |
| BB-9722 | `bloom_filter_bank_fully_parallel` | Database and Search | Search and database acceleration |
| BB-9723 | `bloom_filter_bank_buffered` | Database and Search | Search and database acceleration |
| BB-9724 | `bloom_filter_bank_clock_crossing` | Database and Search | Search and database acceleration |
| BB-9725 | `bloom_filter_bank_error_detecting` | Database and Search | Search and database acceleration |
| BB-9726 | `bloom_filter_bank_formally_instrumented` | Database and Search | Search and database acceleration |
| BB-9727 | `bloom_filter_bank_low_power` | Database and Search | Search and database acceleration |
| BB-9728 | `bloom_filter_bank_axi_stream` | Database and Search | Search and database acceleration |
| BB-9729 | `hash_join_accelerator_single_lane` | Database and Search | Search and database acceleration |
| BB-9730 | `hash_join_accelerator_multi_lane` | Database and Search | Search and database acceleration |
| BB-9731 | `hash_join_accelerator_pipelined` | Database and Search | Search and database acceleration |
| BB-9732 | `hash_join_accelerator_deep_pipelined` | Database and Search | Search and database acceleration |
| BB-9733 | `hash_join_accelerator_frame_aware` | Database and Search | Search and database acceleration |
| BB-9734 | `hash_join_accelerator_packet_aware` | Database and Search | Search and database acceleration |
| BB-9735 | `hash_join_accelerator_backpressure_capable` | Database and Search | Search and database acceleration |
| BB-9736 | `hash_join_accelerator_rate_adaptive` | Database and Search | Search and database acceleration |
| BB-9737 | `hash_join_accelerator_time_multiplexed` | Database and Search | Search and database acceleration |
| BB-9738 | `hash_join_accelerator_fully_parallel` | Database and Search | Search and database acceleration |
| BB-9739 | `hash_join_accelerator_buffered` | Database and Search | Search and database acceleration |
| BB-9740 | `hash_join_accelerator_clock_crossing` | Database and Search | Search and database acceleration |
| BB-9741 | `hash_join_accelerator_error_detecting` | Database and Search | Search and database acceleration |
| BB-9742 | `hash_join_accelerator_formally_instrumented` | Database and Search | Search and database acceleration |
| BB-9743 | `hash_join_accelerator_low_power` | Database and Search | Search and database acceleration |
| BB-9744 | `hash_join_accelerator_axi_stream` | Database and Search | Search and database acceleration |
| BB-9745 | `database_sort_engine_single_lane` | Database and Search | Search and database acceleration |
| BB-9746 | `database_sort_engine_multi_lane` | Database and Search | Search and database acceleration |
| BB-9747 | `database_sort_engine_pipelined` | Database and Search | Search and database acceleration |
| BB-9748 | `database_sort_engine_deep_pipelined` | Database and Search | Search and database acceleration |
| BB-9749 | `database_sort_engine_frame_aware` | Database and Search | Search and database acceleration |
| BB-9750 | `database_sort_engine_packet_aware` | Database and Search | Search and database acceleration |
| BB-9751 | `database_sort_engine_backpressure_capable` | Database and Search | Search and database acceleration |
| BB-9752 | `database_sort_engine_rate_adaptive` | Database and Search | Search and database acceleration |
| BB-9753 | `database_sort_engine_time_multiplexed` | Database and Search | Search and database acceleration |
| BB-9754 | `database_sort_engine_fully_parallel` | Database and Search | Search and database acceleration |
| BB-9755 | `database_sort_engine_buffered` | Database and Search | Search and database acceleration |
| BB-9756 | `database_sort_engine_clock_crossing` | Database and Search | Search and database acceleration |
| BB-9757 | `database_sort_engine_error_detecting` | Database and Search | Search and database acceleration |
| BB-9758 | `database_sort_engine_formally_instrumented` | Database and Search | Search and database acceleration |
| BB-9759 | `database_sort_engine_low_power` | Database and Search | Search and database acceleration |
| BB-9760 | `database_sort_engine_axi_stream` | Database and Search | Search and database acceleration |
| BB-9761 | `sparse_cholesky_engine_combinational` | Scientific HPC | Scientific kernels |
| BB-9762 | `sparse_cholesky_engine_single_cycle` | Scientific HPC | Scientific kernels |
| BB-9763 | `sparse_cholesky_engine_shallow_pipeline` | Scientific HPC | Scientific kernels |
| BB-9764 | `sparse_cholesky_engine_deep_pipeline` | Scientific HPC | Scientific kernels |
| BB-9765 | `sparse_cholesky_engine_iterative` | Scientific HPC | Scientific kernels |
| BB-9766 | `sparse_cholesky_engine_digit_serial` | Scientific HPC | Scientific kernels |
| BB-9767 | `sparse_cholesky_engine_resource_shared` | Scientific HPC | Scientific kernels |
| BB-9768 | `sparse_cholesky_engine_fully_parallel` | Scientific HPC | Scientific kernels |
| BB-9769 | `sparse_cholesky_engine_vectorized` | Scientific HPC | Scientific kernels |
| BB-9770 | `sparse_cholesky_engine_streaming` | Scientific HPC | Scientific kernels |
| BB-9771 | `sparse_cholesky_engine_buffered_stream` | Scientific HPC | Scientific kernels |
| BB-9772 | `sparse_cholesky_engine_multi_channel` | Scientific HPC | Scientific kernels |
| BB-9773 | `sparse_cholesky_engine_programmable_precision` | Scientific HPC | Scientific kernels |
| BB-9774 | `sparse_cholesky_engine_saturating` | Scientific HPC | Scientific kernels |
| BB-9775 | `sparse_cholesky_engine_fault_detecting` | Scientific HPC | Scientific kernels |
| BB-9776 | `sparse_cholesky_engine_low_power` | Scientific HPC | Scientific kernels |
| BB-9777 | `conjugate_gradient_engine_combinational` | Scientific HPC | Scientific kernels |
| BB-9778 | `conjugate_gradient_engine_single_cycle` | Scientific HPC | Scientific kernels |
| BB-9779 | `conjugate_gradient_engine_shallow_pipeline` | Scientific HPC | Scientific kernels |
| BB-9780 | `conjugate_gradient_engine_deep_pipeline` | Scientific HPC | Scientific kernels |
| BB-9781 | `conjugate_gradient_engine_iterative` | Scientific HPC | Scientific kernels |
| BB-9782 | `conjugate_gradient_engine_digit_serial` | Scientific HPC | Scientific kernels |
| BB-9783 | `conjugate_gradient_engine_resource_shared` | Scientific HPC | Scientific kernels |
| BB-9784 | `conjugate_gradient_engine_fully_parallel` | Scientific HPC | Scientific kernels |
| BB-9785 | `conjugate_gradient_engine_vectorized` | Scientific HPC | Scientific kernels |
| BB-9786 | `conjugate_gradient_engine_streaming` | Scientific HPC | Scientific kernels |
| BB-9787 | `conjugate_gradient_engine_buffered_stream` | Scientific HPC | Scientific kernels |
| BB-9788 | `conjugate_gradient_engine_multi_channel` | Scientific HPC | Scientific kernels |
| BB-9789 | `conjugate_gradient_engine_programmable_precision` | Scientific HPC | Scientific kernels |
| BB-9790 | `conjugate_gradient_engine_saturating` | Scientific HPC | Scientific kernels |
| BB-9791 | `conjugate_gradient_engine_fault_detecting` | Scientific HPC | Scientific kernels |
| BB-9792 | `conjugate_gradient_engine_low_power` | Scientific HPC | Scientific kernels |
| BB-9793 | `finite_element_assembler_combinational` | Scientific HPC | Scientific kernels |
| BB-9794 | `finite_element_assembler_single_cycle` | Scientific HPC | Scientific kernels |
| BB-9795 | `finite_element_assembler_shallow_pipeline` | Scientific HPC | Scientific kernels |
| BB-9796 | `finite_element_assembler_deep_pipeline` | Scientific HPC | Scientific kernels |
| BB-9797 | `finite_element_assembler_iterative` | Scientific HPC | Scientific kernels |
| BB-9798 | `finite_element_assembler_digit_serial` | Scientific HPC | Scientific kernels |
| BB-9799 | `finite_element_assembler_resource_shared` | Scientific HPC | Scientific kernels |
| BB-9800 | `finite_element_assembler_fully_parallel` | Scientific HPC | Scientific kernels |
| BB-9801 | `finite_element_assembler_vectorized` | Scientific HPC | Scientific kernels |
| BB-9802 | `finite_element_assembler_streaming` | Scientific HPC | Scientific kernels |
| BB-9803 | `finite_element_assembler_buffered_stream` | Scientific HPC | Scientific kernels |
| BB-9804 | `finite_element_assembler_multi_channel` | Scientific HPC | Scientific kernels |
| BB-9805 | `finite_element_assembler_programmable_precision` | Scientific HPC | Scientific kernels |
| BB-9806 | `finite_element_assembler_saturating` | Scientific HPC | Scientific kernels |
| BB-9807 | `finite_element_assembler_fault_detecting` | Scientific HPC | Scientific kernels |
| BB-9808 | `finite_element_assembler_low_power` | Scientific HPC | Scientific kernels |
| BB-9809 | `stencil_compute_array_combinational` | Scientific HPC | Scientific kernels |
| BB-9810 | `stencil_compute_array_single_cycle` | Scientific HPC | Scientific kernels |
| BB-9811 | `stencil_compute_array_shallow_pipeline` | Scientific HPC | Scientific kernels |
| BB-9812 | `stencil_compute_array_deep_pipeline` | Scientific HPC | Scientific kernels |
| BB-9813 | `stencil_compute_array_iterative` | Scientific HPC | Scientific kernels |
| BB-9814 | `stencil_compute_array_digit_serial` | Scientific HPC | Scientific kernels |
| BB-9815 | `stencil_compute_array_resource_shared` | Scientific HPC | Scientific kernels |
| BB-9816 | `stencil_compute_array_fully_parallel` | Scientific HPC | Scientific kernels |
| BB-9817 | `stencil_compute_array_vectorized` | Scientific HPC | Scientific kernels |
| BB-9818 | `stencil_compute_array_streaming` | Scientific HPC | Scientific kernels |
| BB-9819 | `stencil_compute_array_buffered_stream` | Scientific HPC | Scientific kernels |
| BB-9820 | `stencil_compute_array_multi_channel` | Scientific HPC | Scientific kernels |
| BB-9821 | `stencil_compute_array_programmable_precision` | Scientific HPC | Scientific kernels |
| BB-9822 | `stencil_compute_array_saturating` | Scientific HPC | Scientific kernels |
| BB-9823 | `stencil_compute_array_fault_detecting` | Scientific HPC | Scientific kernels |
| BB-9824 | `stencil_compute_array_low_power` | Scientific HPC | Scientific kernels |
| BB-9825 | `particle_interaction_engine_combinational` | Scientific HPC | Scientific kernels |
| BB-9826 | `particle_interaction_engine_single_cycle` | Scientific HPC | Scientific kernels |
| BB-9827 | `particle_interaction_engine_shallow_pipeline` | Scientific HPC | Scientific kernels |
| BB-9828 | `particle_interaction_engine_deep_pipeline` | Scientific HPC | Scientific kernels |
| BB-9829 | `particle_interaction_engine_iterative` | Scientific HPC | Scientific kernels |
| BB-9830 | `particle_interaction_engine_digit_serial` | Scientific HPC | Scientific kernels |
| BB-9831 | `particle_interaction_engine_resource_shared` | Scientific HPC | Scientific kernels |
| BB-9832 | `particle_interaction_engine_fully_parallel` | Scientific HPC | Scientific kernels |
| BB-9833 | `particle_interaction_engine_vectorized` | Scientific HPC | Scientific kernels |
| BB-9834 | `particle_interaction_engine_streaming` | Scientific HPC | Scientific kernels |
| BB-9835 | `particle_interaction_engine_buffered_stream` | Scientific HPC | Scientific kernels |
| BB-9836 | `particle_interaction_engine_multi_channel` | Scientific HPC | Scientific kernels |
| BB-9837 | `particle_interaction_engine_programmable_precision` | Scientific HPC | Scientific kernels |
| BB-9838 | `particle_interaction_engine_saturating` | Scientific HPC | Scientific kernels |
| BB-9839 | `particle_interaction_engine_fault_detecting` | Scientific HPC | Scientific kernels |
| BB-9840 | `particle_interaction_engine_low_power` | Scientific HPC | Scientific kernels |
| BB-9841 | `qubit_pulse_sequencer_single_shot` | Quantum Control | Qubit control electronics |
| BB-9842 | `qubit_pulse_sequencer_continuous` | Quantum Control | Qubit control electronics |
| BB-9843 | `qubit_pulse_sequencer_microcoded` | Quantum Control | Qubit control electronics |
| BB-9844 | `qubit_pulse_sequencer_table_driven` | Quantum Control | Qubit control electronics |
| BB-9845 | `qubit_pulse_sequencer_multi_channel` | Quantum Control | Qubit control electronics |
| BB-9846 | `qubit_pulse_sequencer_queued` | Quantum Control | Qubit control electronics |
| BB-9847 | `qubit_pulse_sequencer_priority_aware` | Quantum Control | Qubit control electronics |
| BB-9848 | `qubit_pulse_sequencer_deadline_aware` | Quantum Control | Qubit control electronics |
| BB-9849 | `qubit_pulse_sequencer_redundant` | Quantum Control | Qubit control electronics |
| BB-9850 | `qubit_pulse_sequencer_lockstep_checked` | Quantum Control | Qubit control electronics |
| BB-9851 | `qubit_pulse_sequencer_formally_instrumented` | Quantum Control | Qubit control electronics |
| BB-9852 | `qubit_pulse_sequencer_low_power` | Quantum Control | Qubit control electronics |
| BB-9853 | `qubit_pulse_sequencer_clock_crossing` | Quantum Control | Qubit control electronics |
| BB-9854 | `qubit_pulse_sequencer_software_configurable` | Quantum Control | Qubit control electronics |
| BB-9855 | `qubit_pulse_sequencer_event_driven` | Quantum Control | Qubit control electronics |
| BB-9856 | `qubit_pulse_sequencer_fail_safe` | Quantum Control | Qubit control electronics |
| BB-9857 | `waveform_envelope_generator_single_shot` | Quantum Control | Qubit control electronics |
| BB-9858 | `waveform_envelope_generator_continuous` | Quantum Control | Qubit control electronics |
| BB-9859 | `waveform_envelope_generator_microcoded` | Quantum Control | Qubit control electronics |
| BB-9860 | `waveform_envelope_generator_table_driven` | Quantum Control | Qubit control electronics |
| BB-9861 | `waveform_envelope_generator_multi_channel` | Quantum Control | Qubit control electronics |
| BB-9862 | `waveform_envelope_generator_queued` | Quantum Control | Qubit control electronics |
| BB-9863 | `waveform_envelope_generator_priority_aware` | Quantum Control | Qubit control electronics |
| BB-9864 | `waveform_envelope_generator_deadline_aware` | Quantum Control | Qubit control electronics |
| BB-9865 | `waveform_envelope_generator_redundant` | Quantum Control | Qubit control electronics |
| BB-9866 | `waveform_envelope_generator_lockstep_checked` | Quantum Control | Qubit control electronics |
| BB-9867 | `waveform_envelope_generator_formally_instrumented` | Quantum Control | Qubit control electronics |
| BB-9868 | `waveform_envelope_generator_low_power` | Quantum Control | Qubit control electronics |
| BB-9869 | `waveform_envelope_generator_clock_crossing` | Quantum Control | Qubit control electronics |
| BB-9870 | `waveform_envelope_generator_software_configurable` | Quantum Control | Qubit control electronics |
| BB-9871 | `waveform_envelope_generator_event_driven` | Quantum Control | Qubit control electronics |
| BB-9872 | `waveform_envelope_generator_fail_safe` | Quantum Control | Qubit control electronics |
| BB-9873 | `iq_calibration_engine_single_shot` | Quantum Control | Qubit control electronics |
| BB-9874 | `iq_calibration_engine_continuous` | Quantum Control | Qubit control electronics |
| BB-9875 | `iq_calibration_engine_microcoded` | Quantum Control | Qubit control electronics |
| BB-9876 | `iq_calibration_engine_table_driven` | Quantum Control | Qubit control electronics |
| BB-9877 | `iq_calibration_engine_multi_channel` | Quantum Control | Qubit control electronics |
| BB-9878 | `iq_calibration_engine_queued` | Quantum Control | Qubit control electronics |
| BB-9879 | `iq_calibration_engine_priority_aware` | Quantum Control | Qubit control electronics |
| BB-9880 | `iq_calibration_engine_deadline_aware` | Quantum Control | Qubit control electronics |
| BB-9881 | `iq_calibration_engine_redundant` | Quantum Control | Qubit control electronics |
| BB-9882 | `iq_calibration_engine_lockstep_checked` | Quantum Control | Qubit control electronics |
| BB-9883 | `iq_calibration_engine_formally_instrumented` | Quantum Control | Qubit control electronics |
| BB-9884 | `iq_calibration_engine_low_power` | Quantum Control | Qubit control electronics |
| BB-9885 | `iq_calibration_engine_clock_crossing` | Quantum Control | Qubit control electronics |
| BB-9886 | `iq_calibration_engine_software_configurable` | Quantum Control | Qubit control electronics |
| BB-9887 | `iq_calibration_engine_event_driven` | Quantum Control | Qubit control electronics |
| BB-9888 | `iq_calibration_engine_fail_safe` | Quantum Control | Qubit control electronics |
| BB-9889 | `measurement_discriminator_single_shot` | Quantum Control | Qubit control electronics |
| BB-9890 | `measurement_discriminator_continuous` | Quantum Control | Qubit control electronics |
| BB-9891 | `measurement_discriminator_microcoded` | Quantum Control | Qubit control electronics |
| BB-9892 | `measurement_discriminator_table_driven` | Quantum Control | Qubit control electronics |
| BB-9893 | `measurement_discriminator_multi_channel` | Quantum Control | Qubit control electronics |
| BB-9894 | `measurement_discriminator_queued` | Quantum Control | Qubit control electronics |
| BB-9895 | `measurement_discriminator_priority_aware` | Quantum Control | Qubit control electronics |
| BB-9896 | `measurement_discriminator_deadline_aware` | Quantum Control | Qubit control electronics |
| BB-9897 | `measurement_discriminator_redundant` | Quantum Control | Qubit control electronics |
| BB-9898 | `measurement_discriminator_lockstep_checked` | Quantum Control | Qubit control electronics |
| BB-9899 | `measurement_discriminator_formally_instrumented` | Quantum Control | Qubit control electronics |
| BB-9900 | `measurement_discriminator_low_power` | Quantum Control | Qubit control electronics |
| BB-9901 | `measurement_discriminator_clock_crossing` | Quantum Control | Qubit control electronics |
| BB-9902 | `measurement_discriminator_software_configurable` | Quantum Control | Qubit control electronics |
| BB-9903 | `measurement_discriminator_event_driven` | Quantum Control | Qubit control electronics |
| BB-9904 | `measurement_discriminator_fail_safe` | Quantum Control | Qubit control electronics |
| BB-9905 | `feedback_latency_controller_single_shot` | Quantum Control | Qubit control electronics |
| BB-9906 | `feedback_latency_controller_continuous` | Quantum Control | Qubit control electronics |
| BB-9907 | `feedback_latency_controller_microcoded` | Quantum Control | Qubit control electronics |
| BB-9908 | `feedback_latency_controller_table_driven` | Quantum Control | Qubit control electronics |
| BB-9909 | `feedback_latency_controller_multi_channel` | Quantum Control | Qubit control electronics |
| BB-9910 | `feedback_latency_controller_queued` | Quantum Control | Qubit control electronics |
| BB-9911 | `feedback_latency_controller_priority_aware` | Quantum Control | Qubit control electronics |
| BB-9912 | `feedback_latency_controller_deadline_aware` | Quantum Control | Qubit control electronics |
| BB-9913 | `feedback_latency_controller_redundant` | Quantum Control | Qubit control electronics |
| BB-9914 | `feedback_latency_controller_lockstep_checked` | Quantum Control | Qubit control electronics |
| BB-9915 | `feedback_latency_controller_formally_instrumented` | Quantum Control | Qubit control electronics |
| BB-9916 | `feedback_latency_controller_low_power` | Quantum Control | Qubit control electronics |
| BB-9917 | `feedback_latency_controller_clock_crossing` | Quantum Control | Qubit control electronics |
| BB-9918 | `feedback_latency_controller_software_configurable` | Quantum Control | Qubit control electronics |
| BB-9919 | `feedback_latency_controller_event_driven` | Quantum Control | Qubit control electronics |
| BB-9920 | `feedback_latency_controller_fail_safe` | Quantum Control | Qubit control electronics |
| BB-9921 | `dynamic_function_exchange_manager_single_shot` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9922 | `dynamic_function_exchange_manager_continuous` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9923 | `dynamic_function_exchange_manager_microcoded` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9924 | `dynamic_function_exchange_manager_table_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9925 | `dynamic_function_exchange_manager_multi_channel` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9926 | `dynamic_function_exchange_manager_queued` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9927 | `dynamic_function_exchange_manager_priority_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9928 | `dynamic_function_exchange_manager_deadline_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9929 | `dynamic_function_exchange_manager_redundant` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9930 | `dynamic_function_exchange_manager_lockstep_checked` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9931 | `dynamic_function_exchange_manager_formally_instrumented` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9932 | `dynamic_function_exchange_manager_low_power` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9933 | `dynamic_function_exchange_manager_clock_crossing` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9934 | `dynamic_function_exchange_manager_software_configurable` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9935 | `dynamic_function_exchange_manager_event_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9936 | `dynamic_function_exchange_manager_fail_safe` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9937 | `partial_bitstream_authenticator_single_shot` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9938 | `partial_bitstream_authenticator_continuous` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9939 | `partial_bitstream_authenticator_microcoded` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9940 | `partial_bitstream_authenticator_table_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9941 | `partial_bitstream_authenticator_multi_channel` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9942 | `partial_bitstream_authenticator_queued` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9943 | `partial_bitstream_authenticator_priority_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9944 | `partial_bitstream_authenticator_deadline_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9945 | `partial_bitstream_authenticator_redundant` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9946 | `partial_bitstream_authenticator_lockstep_checked` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9947 | `partial_bitstream_authenticator_formally_instrumented` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9948 | `partial_bitstream_authenticator_low_power` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9949 | `partial_bitstream_authenticator_clock_crossing` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9950 | `partial_bitstream_authenticator_software_configurable` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9951 | `partial_bitstream_authenticator_event_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9952 | `partial_bitstream_authenticator_fail_safe` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9953 | `clock_frequency_governor_single_shot` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9954 | `clock_frequency_governor_continuous` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9955 | `clock_frequency_governor_microcoded` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9956 | `clock_frequency_governor_table_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9957 | `clock_frequency_governor_multi_channel` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9958 | `clock_frequency_governor_queued` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9959 | `clock_frequency_governor_priority_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9960 | `clock_frequency_governor_deadline_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9961 | `clock_frequency_governor_redundant` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9962 | `clock_frequency_governor_lockstep_checked` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9963 | `clock_frequency_governor_formally_instrumented` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9964 | `clock_frequency_governor_low_power` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9965 | `clock_frequency_governor_clock_crossing` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9966 | `clock_frequency_governor_software_configurable` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9967 | `clock_frequency_governor_event_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9968 | `clock_frequency_governor_fail_safe` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9969 | `power_domain_sequencer_single_shot` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9970 | `power_domain_sequencer_continuous` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9971 | `power_domain_sequencer_microcoded` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9972 | `power_domain_sequencer_table_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9973 | `power_domain_sequencer_multi_channel` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9974 | `power_domain_sequencer_queued` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9975 | `power_domain_sequencer_priority_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9976 | `power_domain_sequencer_deadline_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9977 | `power_domain_sequencer_redundant` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9978 | `power_domain_sequencer_lockstep_checked` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9979 | `power_domain_sequencer_formally_instrumented` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9980 | `power_domain_sequencer_low_power` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9981 | `power_domain_sequencer_clock_crossing` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9982 | `power_domain_sequencer_software_configurable` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9983 | `power_domain_sequencer_event_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9984 | `power_domain_sequencer_fail_safe` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9985 | `adaptive_voltage_controller_single_shot` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9986 | `adaptive_voltage_controller_continuous` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9987 | `adaptive_voltage_controller_microcoded` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9988 | `adaptive_voltage_controller_table_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9989 | `adaptive_voltage_controller_multi_channel` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9990 | `adaptive_voltage_controller_queued` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9991 | `adaptive_voltage_controller_priority_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9992 | `adaptive_voltage_controller_deadline_aware` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9993 | `adaptive_voltage_controller_redundant` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9994 | `adaptive_voltage_controller_lockstep_checked` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9995 | `adaptive_voltage_controller_formally_instrumented` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9996 | `adaptive_voltage_controller_low_power` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9997 | `adaptive_voltage_controller_clock_crossing` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9998 | `adaptive_voltage_controller_software_configurable` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-9999 | `adaptive_voltage_controller_event_driven` | Reconfiguration and Power | Runtime adaptation and power management |
| BB-10000 | `adaptive_voltage_controller_fail_safe` | Reconfiguration and Power | Runtime adaptation and power management |
