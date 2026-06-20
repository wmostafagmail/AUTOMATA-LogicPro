#include "../../include/teaching_cpu.h"
#include "../../programs/led_uart_demo.h"

static teaching_cpu_t cpu;

static void on_led_write(struct teaching_cpu *cpu_ptr, uint8_t value, void *user_data) {
  (void)cpu_ptr;
  (void)user_data;

#if defined(LED_BUILTIN)
  digitalWrite(LED_BUILTIN, (value & 0x01u) ? HIGH : LOW);
#endif

  Serial.print("LED register = 0x");
  if (value < 16) {
    Serial.print('0');
  }
  Serial.println(value, HEX);
}

static void on_uart_write(struct teaching_cpu *cpu_ptr, uint8_t value, void *user_data) {
  (void)cpu_ptr;
  (void)user_data;
  Serial.write(value);
}

void setup() {
  Serial.begin(115200);
#if defined(LED_BUILTIN)
  pinMode(LED_BUILTIN, OUTPUT);
#endif

  teaching_cpu_init(&cpu);
  teaching_cpu_load_program(&cpu, led_uart_demo_program, TEACHING_CPU_PROGRAM_WORDS);

  teaching_cpu_hooks_t hooks = {
    .on_led_write = on_led_write,
    .on_uart_write = on_uart_write,
    .user_data = nullptr,
  };
  teaching_cpu_set_hooks(&cpu, &hooks);

  uint32_t steps = 0;
  teaching_cpu_status_t status = teaching_cpu_run(&cpu, 1000u, &steps);

  Serial.print("\nCPU status: ");
  Serial.println(teaching_cpu_status_string(status));
  Serial.print("Steps: ");
  Serial.println(steps);
  Serial.print("LED final value: 0x");
  if (cpu.led_reg < 16) {
    Serial.print('0');
  }
  Serial.println(cpu.led_reg, HEX);
}

void loop() {
}
