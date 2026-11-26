import { macroParams } from "/src/services/macros/arrange.ts";
import { gcodeMacroParamDefault } from "/src/util/gcode-macro-params.ts";
export function macroFields(gcode) {
  return macroParams(gcode).params.map((name) => {
    const reference = new RegExp(`params\\.${name}\\b(.*)`, "i").exec(gcode);
    const tail = reference?.[1] ?? "";
    const optional = new RegExp(`params\\.${name}\\s*(?:\\|\\s*default\\(|is\\s+defined)|['"]${name}['"]\\s+in\\s+params`, "i").test(gcode);
    return { name, optional, defaultValue: /^\s*\|\s*default\(/i.test(tail) ? gcodeMacroParamDefault(tail) : "" };
  });
}
export function macroCommand(name, fields, values) {
  if (!/^[A-Z_][A-Z0-9_]*$/i.test(name) || fields.length > 32) return null;
  const parts = [name];
  for (const field of fields) {
    const value = values[field.name] ?? "";
    if (!value) {
      if (!field.optional) return null;
      continue;
    }
    if (!/^[A-Z0-9_.:+/-]{1,128}$/i.test(value) || /^(?:nan|[+-]?infinity)$/i.test(value)) return null;
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) && !Number.isFinite(Number(value))) return null;
    parts.push(`${field.name}=${value}`);
  }
  return parts.join(" ");
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZhbHVlcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBtYWNyb1BhcmFtcyB9IGZyb20gJy4vYXJyYW5nZSdcbmltcG9ydCB7IGdjb2RlTWFjcm9QYXJhbURlZmF1bHQgfSBmcm9tICdAL3V0aWwvZ2NvZGUtbWFjcm8tcGFyYW1zJ1xuXG5leHBvcnQgaW50ZXJmYWNlIE1hY3JvRmllbGQgeyBuYW1lOiBzdHJpbmc7IG9wdGlvbmFsOiBib29sZWFuOyBkZWZhdWx0VmFsdWU6IHN0cmluZyB9XG5cbi8qKiBEZWZhdWx0cyBhcmUgaGludHMgb25seS4gRW1wdHkgb3B0aW9uYWwgZmllbGRzIHN0YXkgb3V0IG9mIHRoZSBjb21tYW5kLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hY3JvRmllbGRzIChnY29kZTogc3RyaW5nKTogTWFjcm9GaWVsZFtdIHtcbiAgcmV0dXJuIG1hY3JvUGFyYW1zKGdjb2RlKS5wYXJhbXMubWFwKG5hbWUgPT4ge1xuICAgIGNvbnN0IHJlZmVyZW5jZSA9IG5ldyBSZWdFeHAoYHBhcmFtc1xcXFwuJHtuYW1lfVxcXFxiKC4qKWAsICdpJykuZXhlYyhnY29kZSlcbiAgICBjb25zdCB0YWlsID0gcmVmZXJlbmNlPy5bMV0gPz8gJydcbiAgICBjb25zdCBvcHRpb25hbCA9IG5ldyBSZWdFeHAoYHBhcmFtc1xcXFwuJHtuYW1lfVxcXFxzKig/OlxcXFx8XFxcXHMqZGVmYXVsdFxcXFwofGlzXFxcXHMrZGVmaW5lZCl8WydcIl0ke25hbWV9WydcIl1cXFxccytpblxcXFxzK3BhcmFtc2AsICdpJykudGVzdChnY29kZSlcbiAgICByZXR1cm4geyBuYW1lLCBvcHRpb25hbCwgZGVmYXVsdFZhbHVlOiAvXlxccypcXHxcXHMqZGVmYXVsdFxcKC9pLnRlc3QodGFpbCkgPyBnY29kZU1hY3JvUGFyYW1EZWZhdWx0KHRhaWwpIDogJycgfVxuICB9KVxufVxuXG4vKiogS2xpcHBlciBleHRlbmRlZCBwYXJhbWV0ZXJzIGFyZSB0b2tlbnMuIFJlZnVzZSBzeW50YXggcmF0aGVyIHRoYW4gZXNjYXBpbmcgYSBzZWNvbmQgY29tbWFuZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWNyb0NvbW1hbmQgKG5hbWU6IHN0cmluZywgZmllbGRzOiBNYWNyb0ZpZWxkW10sIHZhbHVlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIS9eW0EtWl9dW0EtWjAtOV9dKiQvaS50ZXN0KG5hbWUpIHx8IGZpZWxkcy5sZW5ndGggPiAzMikgcmV0dXJuIG51bGxcbiAgY29uc3QgcGFydHMgPSBbbmFtZV1cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHZhbHVlc1tmaWVsZC5uYW1lXSA/PyAnJ1xuICAgIGlmICghdmFsdWUpIHsgaWYgKCFmaWVsZC5vcHRpb25hbCkgcmV0dXJuIG51bGw7IGNvbnRpbnVlIH1cbiAgICBpZiAoIS9eW0EtWjAtOV8uOisvLV17MSwxMjh9JC9pLnRlc3QodmFsdWUpIHx8IC9eKD86bmFufFsrLV0/aW5maW5pdHkpJC9pLnRlc3QodmFsdWUpKSByZXR1cm4gbnVsbFxuICAgIGlmICgvXlsrLV0/KD86XFxkKyg/OlxcLlxcZCopP3xcXC5cXGQrKSg/OmVbKy1dP1xcZCspPyQvaS50ZXN0KHZhbHVlKSAmJiAhTnVtYmVyLmlzRmluaXRlKE51bWJlcih2YWx1ZSkpKSByZXR1cm4gbnVsbFxuICAgIHBhcnRzLnB1c2goYCR7ZmllbGQubmFtZX09JHt2YWx1ZX1gKVxuICB9XG4gIHJldHVybiBwYXJ0cy5qb2luKCcgJylcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxtQkFBbUI7QUFDNUIsU0FBUyw4QkFBOEI7QUFLaEMsZ0JBQVMsWUFBYSxPQUE2QjtBQUN4RCxTQUFPLFlBQVksS0FBSyxFQUFFLE9BQU8sSUFBSSxVQUFRO0FBQzNDLFVBQU0sWUFBWSxJQUFJLE9BQU8sWUFBWSxJQUFJLFdBQVcsR0FBRyxFQUFFLEtBQUssS0FBSztBQUN2RSxVQUFNLE9BQU8sWUFBWSxDQUFDLEtBQUs7QUFDL0IsVUFBTSxXQUFXLElBQUksT0FBTyxZQUFZLElBQUksK0NBQStDLElBQUksd0JBQXdCLEdBQUcsRUFBRSxLQUFLLEtBQUs7QUFDdEksV0FBTyxFQUFFLE1BQU0sVUFBVSxjQUFjLHNCQUFzQixLQUFLLElBQUksSUFBSSx1QkFBdUIsSUFBSSxJQUFJLEdBQUc7QUFBQSxFQUM5RyxDQUFDO0FBQ0g7QUFHTyxnQkFBUyxhQUFjLE1BQWMsUUFBc0IsUUFBK0M7QUFDL0csTUFBSSxDQUFDLHNCQUFzQixLQUFLLElBQUksS0FBSyxPQUFPLFNBQVMsR0FBSSxRQUFPO0FBQ3BFLFFBQU0sUUFBUSxDQUFDLElBQUk7QUFDbkIsYUFBVyxTQUFTLFFBQVE7QUFDMUIsVUFBTSxRQUFRLE9BQU8sTUFBTSxJQUFJLEtBQUs7QUFDcEMsUUFBSSxDQUFDLE9BQU87QUFBRSxVQUFJLENBQUMsTUFBTSxTQUFVLFFBQU87QUFBTTtBQUFBLElBQVM7QUFDekQsUUFBSSxDQUFDLDJCQUEyQixLQUFLLEtBQUssS0FBSywyQkFBMkIsS0FBSyxLQUFLLEVBQUcsUUFBTztBQUM5RixRQUFJLGdEQUFnRCxLQUFLLEtBQUssS0FBSyxDQUFDLE9BQU8sU0FBUyxPQUFPLEtBQUssQ0FBQyxFQUFHLFFBQU87QUFDM0csVUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQUEsRUFDckM7QUFDQSxTQUFPLE1BQU0sS0FBSyxHQUFHO0FBQ3ZCOyIsIm5hbWVzIjpbXX0=