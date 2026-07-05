export const LOCAL_LLM_JSON_GENERATION_SKILL_NAME = 'local-llm-json-generation';

export const LOCAL_LLM_JSON_GENERATION_CONTRACT = `## JSON Generation Skill
Apply the ${LOCAL_LLM_JSON_GENERATION_SKILL_NAME} skill for this task.

Strict JSON rules:
- Output only strict JSON.
- Do not output Markdown fences, comments, explanations, or surrounding prose.
- Use double quotes for every object key and every string value.
- Do not use trailing commas.
- Do not use undefined, NaN, Infinity, None, True, or False.
- Use only true, false, and null where applicable.
- Follow the required schema exactly.
- Do not add fields that are not requested by the schema.
- Prefer compact, deterministic key ordering and stable machine-friendly identifiers.
- Prefer JSON-safe file bodies in "content_lines" arrays instead of large escaped multiline strings.

Validation target:
- The output must be parseable by JSON.parse.
- The output must be compatible with python3 -m json.tool.
- The output must be compatible with jq empty.
`;
