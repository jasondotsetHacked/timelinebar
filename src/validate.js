import Ajv from 'ajv';
import { scheduleSchema, punchSchema, backupSchema } from './schema.js';

const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addSchema(scheduleSchema).addSchema(punchSchema).addSchema(backupSchema);

const vSchedule = ajv.getSchema('Schedule') || ajv.compile(scheduleSchema);
const vPunch = ajv.getSchema('Punch') || ajv.compile(punchSchema);
const vBackup = ajv.getSchema('Backup') || ajv.compile(backupSchema);

function formatErrors(errors) {
  try {
    return (errors || []).map((e) => `${e.instancePath || e.schemaPath}: ${e.message}`).join('; ');
  } catch {
    return 'Validation failed';
  }
}

export function validateSchedule(obj) {
  const data = { ...obj, name: String(obj?.name ?? '').trim() };
  const ok = vSchedule(data);
  return { valid: !!ok, errors: ok ? null : vSchedule.errors };
}

export function assertSchedule(obj) {
  const { valid, errors } = validateSchedule(obj);
  if (!valid) {
    const msg = formatErrors(errors);
    const err = new Error(`ValidationError: Schedule invalid — ${msg}`);
    err.name = 'ValidationError';
    err.details = errors;
    throw err;
  }
}

export function validatePunch(obj) {
  const ok = vPunch(obj);
  return { valid: !!ok, errors: ok ? null : vPunch.errors };
}

export function validateBackup(obj) {
  try {
    const ok = vBackup(obj);
    return { valid: !!ok, errors: ok ? null : vBackup.errors };
  } catch (err) {
    return { valid: false, errors: [{ message: err?.message || 'Backup validation error' }] };
  }
}
