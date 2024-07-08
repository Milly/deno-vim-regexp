/**
 * Optional parameters for {@linkcode SourceSyntaxError}.
 */
export interface SourceSyntaxErrorOptions extends ErrorOptions {
  source?: string;
  index?: number;
}

/**
 * The error with source string and error position.
 */
export interface SourceSyntaxError {
  /**
   * Source string.
   */
  source?: string;
  /**
   * Error position.
   */
  index?: number;
}

/**
 * Represents the error to create a `VimRegExp` with a syntactically invalid pattern.
 */
export class VimRegExpSyntaxError extends SyntaxError implements SourceSyntaxError {
  static {
    this.prototype.name = "VimRegExpSyntaxError";
  }
  source?: string;
  index?: number;
  /**
   * Creates a new `VimRegExpSyntaxError` object.
   */
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

/**
 * Represents the error when an invalid Vim's `isfname` option pattern was specified.
 */
export class CharClassSyntaxError extends SyntaxError implements SourceSyntaxError {
  static {
    this.prototype.name = "CharClassSyntaxError";
  }
  source?: string;
  index?: number;
  /**
   * Creates a new `CharClassSyntaxError` object.
   */
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
