# MLX-LM Training Plan

The long-term local fine-tuning path targets adapter training on Apple Silicon through MLX-LM.

## Planned Flow

1. Export accepted dataset release.
2. Validate train/validation/holdout split.
3. Launch local MLX-LM LoRA job.
4. Register checkpoint metadata.
5. Evaluate checkpoint against benchmark suite.
6. Promote only if it beats the configured baseline.

## Current Status

Training endpoints currently expose planned/not-yet-active status. No training subprocess is launched in this foundation pass.
