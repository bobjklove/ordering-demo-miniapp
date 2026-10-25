export class DemoError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "DemoError";
    this.code = code;
  }
}

export function fail(code: string): never {
  throw new DemoError(code);
}
