/** @internal */
export interface SourceSyntaxErrorOptions extends ErrorOptions {
  source?: string;
  index?: number;
}

/** @internal */
export interface SourceSyntaxError {
  source?: string;
  index?: number;
}

export class VimRegExpSyntaxError extends SyntaxError implements SourceSyntaxError {
  static {
    this.prototype.name = "VimRegExpSyntaxError";
  }
  source?: string;
  index?: number;
  constructor(message?: string, options: SourceSyntaxErrorOptions = {}) {
    const { source, index, ...rest } = options;
    const at = index !== undefined ? `:${index}` : "";
    const src = source ? `: /${source}/${at}` : "";
    const suffix = message ? `: ${message}` : "";
    message = `Invalid Vim regular expression${src}${suffix}`;
    super(message, rest);
    this.source = source;
    this.index = index;
  }
}

/** @internal */
export class UnsupportedSyntaxError extends VimRegExpSyntaxError {
  constructor(syntax: string, options: SourceSyntaxErrorOptions = {}) {
    super(`Unsupported syntax: ${syntax}`, options);
  }
}

export class CharClassSyntaxError extends SyntaxError implements SourceSyntaxError {
  static {
    this.prototype.name = "CharClassSyntaxError";
  }
  source?: string;
  index?: number;
  constructor(message?: string, options: SourceSyntaxErrorOptions = {}) {
    const { source, index, ...rest } = options;
    const at = index !== undefined ? `:${index}` : "";
    const src = source ? `: "${source}"${at}` : "";
    const suffix = message ? `: ${message}` : "";
    message = `Invalid Vim option format${src}${suffix}`;
    super(message, rest);
    this.source = source;
    this.index = index;
  }
}
