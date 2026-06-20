#include "teaching_cpu.h"

#include <stdio.h>

#include "../programs/arithmetic_selfcheck.h"
#include "../programs/led_uart_demo.h"

static void run_program(const char *name, const uint16_t *program) {
    teaching_cpu_t cpu;
    uint32_t steps = 0;
    teaching_cpu_status_t status;

    teaching_cpu_init(&cpu);
    teaching_cpu_load_program(&cpu, program, TEACHING_CPU_PROGRAM_WORDS);
    status = teaching_cpu_run(&cpu, 1000u, &steps);

    printf("program=%s status=%s steps=%u pc=0x%02X led=0x%02X zf=%u uart=\"%s\"\n",
           name,
           teaching_cpu_status_string(status),
           (unsigned)steps,
           cpu.pc,
           cpu.led_reg,
           (unsigned)cpu.zf,
           cpu.uart_log);
}

int main(void) {
    run_program("arithmetic_selfcheck", arithmetic_selfcheck_program);
    run_program("led_uart_demo", led_uart_demo_program);
    return 0;
}
