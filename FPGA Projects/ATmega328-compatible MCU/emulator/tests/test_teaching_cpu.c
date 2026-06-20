#include "teaching_cpu.h"

#include <stdio.h>
#include <string.h>

#include "../programs/arithmetic_selfcheck.h"
#include "../programs/led_uart_demo.h"

static int expect_true(int condition, const char *message) {
    if (!condition) {
        fprintf(stderr, "FAIL: %s\n", message);
        return 1;
    }
    return 0;
}

int main(void) {
    teaching_cpu_t cpu;
    uint32_t steps = 0;
    int failures = 0;

    teaching_cpu_init(&cpu);
    teaching_cpu_load_program(&cpu, arithmetic_selfcheck_program, TEACHING_CPU_PROGRAM_WORDS);
    failures += expect_true(teaching_cpu_run(&cpu, 1000u, &steps) == TEACHING_CPU_STATUS_HALTED, "arithmetic program should halt");
    failures += expect_true(cpu.led_reg == 0xA5u, "arithmetic program should drive LED 0xA5");
    failures += expect_true(cpu.data[0x20] == 0x11u, "arithmetic program should store 0x11 at RAM[0x20]");

    teaching_cpu_init(&cpu);
    teaching_cpu_load_program(&cpu, led_uart_demo_program, TEACHING_CPU_PROGRAM_WORDS);
    failures += expect_true(teaching_cpu_run(&cpu, 1000u, &steps) == TEACHING_CPU_STATUS_HALTED, "uart demo should halt");
    failures += expect_true(cpu.led_reg == 0x5Au, "uart demo should drive LED 0x5A");
    failures += expect_true(strcmp(cpu.uart_log, "HI\n") == 0, "uart demo should emit HI newline");

    if (failures == 0) {
        puts("All emulator tests passed.");
    }

    return failures == 0 ? 0 : 1;
}
