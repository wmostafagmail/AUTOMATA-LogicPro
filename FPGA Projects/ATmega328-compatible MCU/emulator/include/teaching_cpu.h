#ifndef TEACHING_CPU_H
#define TEACHING_CPU_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

enum {
    TEACHING_CPU_PROGRAM_WORDS = 256,
    TEACHING_CPU_DATA_BYTES = 256,
    TEACHING_CPU_REGISTER_COUNT = 8,
    TEACHING_CPU_UART_BUFFER_CAPACITY = 256
};

enum {
    TEACHING_CPU_LED_ADDR = 0xF0,
    TEACHING_CPU_UART_TX_ADDR = 0xF1,
    TEACHING_CPU_UART_STATUS_ADDR = 0xF2,
    TEACHING_CPU_MMIO_BASE_ADDR = 0xF0
};

typedef enum teaching_cpu_status {
    TEACHING_CPU_STATUS_OK = 0,
    TEACHING_CPU_STATUS_HALTED,
    TEACHING_CPU_STATUS_ILLEGAL_INSTRUCTION,
    TEACHING_CPU_STATUS_UART_OVERFLOW
} teaching_cpu_status_t;

struct teaching_cpu;

typedef void (*teaching_cpu_led_write_cb)(struct teaching_cpu *cpu, uint8_t value, void *user_data);
typedef void (*teaching_cpu_uart_write_cb)(struct teaching_cpu *cpu, uint8_t value, void *user_data);

typedef struct teaching_cpu_hooks {
    teaching_cpu_led_write_cb on_led_write;
    teaching_cpu_uart_write_cb on_uart_write;
    void *user_data;
} teaching_cpu_hooks_t;

typedef struct teaching_cpu {
    uint16_t program[TEACHING_CPU_PROGRAM_WORDS];
    uint8_t data[TEACHING_CPU_DATA_BYTES];
    uint8_t regs[TEACHING_CPU_REGISTER_COUNT];
    uint8_t pc;
    uint8_t zf;
    uint8_t cf;
    uint8_t halted;
    uint8_t led_reg;
    uint8_t uart_busy;
    teaching_cpu_status_t last_status;
    char uart_log[TEACHING_CPU_UART_BUFFER_CAPACITY];
    size_t uart_log_len;
    teaching_cpu_hooks_t hooks;
} teaching_cpu_t;

void teaching_cpu_init(teaching_cpu_t *cpu);
void teaching_cpu_reset(teaching_cpu_t *cpu);
void teaching_cpu_set_hooks(teaching_cpu_t *cpu, const teaching_cpu_hooks_t *hooks);
void teaching_cpu_load_program(teaching_cpu_t *cpu, const uint16_t *program_words, size_t word_count);
teaching_cpu_status_t teaching_cpu_step(teaching_cpu_t *cpu);
teaching_cpu_status_t teaching_cpu_run(teaching_cpu_t *cpu, uint32_t max_steps, uint32_t *steps_executed);
const char *teaching_cpu_status_string(teaching_cpu_status_t status);

#ifdef __cplusplus
}
#endif

#endif
