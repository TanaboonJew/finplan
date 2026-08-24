export function assertFiniteNumber(value: number, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number, got ${String(value)}`);
  }
  return value;
}

export function assertNonNegative(value: number, name: string): number {
  assertFiniteNumber(value, name);
  if (value < 0) {
    throw new RangeError(`${name} must be non-negative, got ${value}`);
  }
  return value;
}

export function assertPositive(value: number, name: string): number {
  assertFiniteNumber(value, name);
  if (value <= 0) {
    throw new RangeError(`${name} must be positive, got ${value}`);
  }
  return value;
}

export function assertNonNegativeInteger(value: number, name: string): number {
  assertNonNegative(value, name);
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be an integer, got ${value}`);
  }
  return value;
}

export function assertPositiveInteger(value: number, name: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer, got ${String(value)}`);
  }
  return value;
}

export function assertRate(value: number, name: string): number {
  assertFiniteNumber(value, name);
  if (value < 0 || value >= 1) {
    throw new RangeError(
      `${name} must be a rate between 0 (inclusive) and 1 (exclusive), got ${value}`
    );
  }
  return value;
}
