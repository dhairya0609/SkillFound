// Validates the JSON-Schema subset we send to Gemini. Unknown properties are
// dropped and arrays longer than maxItems are trimmed; anything else that
// doesn't match is reported so the caller can reject the response.
export const validate = (schema, value, path = "$") => {
  const fail = (msg) => ({ ok: false, error: `${path}: ${msg}` });

  if (value === null || value === undefined) return fail("missing");

  switch (schema.type) {
    case "object": {
      if (typeof value !== "object" || Array.isArray(value)) return fail("expected object");
      const out = {};
      for (const key of schema.required || []) {
        if (value[key] === undefined || value[key] === null) return fail(`missing required "${key}"`);
      }
      for (const [key, sub] of Object.entries(schema.properties || {})) {
        if (value[key] === undefined || value[key] === null) continue;
        const res = validate(sub, value[key], `${path}.${key}`);
        if (!res.ok) return res;
        out[key] = res.value;
      }
      return { ok: true, value: out };
    }
    case "array": {
      if (!Array.isArray(value)) return fail("expected array");
      const items = schema.maxItems ? value.slice(0, schema.maxItems) : value;
      if (schema.minItems && items.length < schema.minItems) return fail(`expected at least ${schema.minItems} items`);
      const out = [];
      for (let i = 0; i < items.length; i += 1) {
        const res = validate(schema.items || {}, items[i], `${path}[${i}]`);
        if (!res.ok) return res;
        out.push(res.value);
      }
      return { ok: true, value: out };
    }
    case "string":
      if (typeof value !== "string") return fail("expected string");
      if (schema.enum && !schema.enum.includes(value)) return fail(`"${value.slice(0, 20)}" not in enum`);
      return { ok: true, value };
    case "integer":
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) return fail(`expected ${schema.type}`);
      if (schema.type === "integer" && !Number.isInteger(value)) return fail("expected integer");
      if (schema.minimum !== undefined && value < schema.minimum) return fail(`below minimum ${schema.minimum}`);
      if (schema.maximum !== undefined && value > schema.maximum) return fail(`above maximum ${schema.maximum}`);
      return { ok: true, value };
    }
    case "boolean":
      if (typeof value !== "boolean") return fail("expected boolean");
      return { ok: true, value };
    default:
      return { ok: true, value };
  }
};
