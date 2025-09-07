// JSON Schemas for app entities

export const scheduleSchema = {
  $id: 'Schedule',
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    name: { type: 'string', minLength: 1, maxLength: 200 },
  },
  required: ['name'],
};

export const punchSchema = {
  $id: 'Punch',
  type: 'object',
  additionalProperties: true,
  properties: {
    id: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    start: { type: 'integer', minimum: 0, maximum: 1440 },
    end: { type: 'integer', minimum: 0, maximum: 1440 },
    bucket: { type: 'string' },
    note: { type: 'string' },
    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    scheduleId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  },
  required: ['start', 'end', 'date'],
};

export const schemas = { scheduleSchema, punchSchema };

