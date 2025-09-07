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

export const scheduleViewSchema = {
  $id: 'ScheduleView',
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    name: { type: 'string', minLength: 1, maxLength: 200 },
    scheduleIds: {
      type: 'array',
      items: { type: 'integer' },
    },
  },
  required: ['name', 'scheduleIds'],
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

export const schemas = { scheduleSchema, scheduleViewSchema, punchSchema };

// Backup file schema (v2 and v3). v3 adds schedules array.
export const backupSchema = {
  $id: 'Backup',
  type: 'object',
  additionalProperties: true,
  properties: {
    app: { type: 'string' },
    kind: { type: 'string' },
    version: { type: 'integer', minimum: 2 },
    exportedAt: { type: 'string' },
    count: { type: 'integer' },
    punches: {
      type: 'array',
      items: punchSchema,
    },
    buckets: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        properties: {
          name: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
    schedules: {
      type: 'array',
      items: scheduleSchema,
    },
    scheduleViews: {
      type: 'array',
      items: scheduleViewSchema,
    },
  },
  required: ['punches'],
};
