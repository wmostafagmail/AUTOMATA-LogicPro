export const bootstrapImplementations = [
  {
    "capability": "uart_rx",
    "facadeId": "uart_rx_basic",
    "entityName": "uart_rx_basic",
    "sourceEntity": "uart_rx",
    "sourcePath": "rtl/blocks/communication/uart_rx.vhd",
    "implementationTier": "qualified-source-wrapper",
    "behavioralContractIds": [
      "uart_rx-basic-v1"
    ]
  },
  {
    "capability": "uart_tx",
    "facadeId": "uart_tx_basic",
    "entityName": "uart_tx_basic",
    "sourceEntity": "uart_tx",
    "sourcePath": "rtl/blocks/communication/uart_tx.vhd",
    "implementationTier": "qualified-source-wrapper",
    "behavioralContractIds": [
      "uart_tx-basic-v1"
    ]
  },
  {
    "capability": "program_counter",
    "facadeId": "program_counter_basic",
    "entityName": "program_counter_basic",
    "sourceEntity": "program_counter",
    "sourcePath": "rtl/blocks/cpu_and_soc/program_counter.vhd",
    "implementationTier": "qualified-source-wrapper",
    "behavioralContractIds": [
      "program_counter-basic-v1"
    ]
  },
  {
    "capability": "program_counter",
    "facadeId": "program_counter_stallable",
    "entityName": "program_counter_stallable",
    "sourceEntity": "program_counter",
    "sourcePath": "rtl/blocks/cpu_and_soc/program_counter.vhd",
    "implementationTier": "qualified-source-wrapper",
    "behavioralContractIds": [
      "program_counter-basic-v1"
    ]
  },
  {
    "capability": "program_counter",
    "facadeId": "program_counter_redirectable",
    "entityName": "program_counter_redirectable",
    "sourceEntity": "program_counter",
    "sourcePath": "rtl/blocks/cpu_and_soc/program_counter.vhd",
    "implementationTier": "qualified-source-wrapper",
    "behavioralContractIds": [
      "program_counter-basic-v1"
    ]
  },
  {
    "capability": "program_counter",
    "facadeId": "program_counter_full",
    "entityName": "program_counter_full",
    "sourceEntity": "program_counter",
    "sourcePath": "rtl/blocks/cpu_and_soc/program_counter.vhd",
    "implementationTier": "qualified-source-wrapper",
    "behavioralContractIds": [
      "program_counter-basic-v1"
    ]
  },
  {
    "capability": "sync_fifo",
    "facadeId": "sync_fifo_basic",
    "entityName": "sync_fifo_basic",
    "sourceEntity": "sync_fifo",
    "sourcePath": "rtl/blocks/memory/sync_fifo.vhd",
    "implementationTier": "qualified-source-wrapper",
    "behavioralContractIds": [
      "sync_fifo-basic-v1"
    ]
  },
  {
    "capability": "async_fifo",
    "facadeId": "async_fifo_basic",
    "entityName": "async_fifo_basic",
    "sourceEntity": "async_fifo",
    "sourcePath": "rtl/blocks/memory/async_fifo.vhd",
    "implementationTier": "qualified-source-wrapper",
    "behavioralContractIds": [
      "async_fifo-basic-v1"
    ]
  },
  {
    "capability": "video_timing",
    "facadeId": "video_timing_640x480",
    "entityName": "video_timing_640x480",
    "sourceEntity": "vga_timing_generator",
    "sourcePath": "rtl/blocks/video_and_audio/vga_timing_generator.vhd",
    "implementationTier": "qualified-source-wrapper",
    "behavioralContractIds": [
      "video_timing-basic-v1"
    ]
  },
  {
    "capability": "generic_counter",
    "facadeId": "generic_counter_basic",
    "entityName": "generic_counter_basic",
    "sourceEntity": "generic_counter_basic",
    "sourcePath": "rtl/facades/counter_timer/generic_counter_basic.vhd",
    "implementationTier": "bootstrap-canonical-core",
    "behavioralContractIds": [
      "generic_counter-basic-v1"
    ]
  },
  {
    "capability": "timer",
    "facadeId": "timer_periodic",
    "entityName": "timer_periodic",
    "sourceEntity": "timer_periodic",
    "sourcePath": "rtl/facades/counter_timer/timer_periodic.vhd",
    "implementationTier": "bootstrap-canonical-core",
    "behavioralContractIds": [
      "timer-basic-v1"
    ]
  }
] as const;
