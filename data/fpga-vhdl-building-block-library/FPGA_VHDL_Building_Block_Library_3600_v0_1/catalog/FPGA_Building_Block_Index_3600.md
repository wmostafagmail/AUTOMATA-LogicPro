# FPGA Building Block Index — 3,600 Blocks

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
