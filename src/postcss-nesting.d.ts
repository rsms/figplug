declare module 'postcss-nesting' {

  interface ProcessOptions {
    /**
     * The path of the CSS source file. You should always set "from", because it is
     * used in source map generation and syntax error messages.
     */
    from?: string;
    /**
     * The path where you'll put the output CSS file. You should always set "to"
     * to generate correct source maps.
     */
    to?: string;
    /**
     * Function to generate AST by string.
     */
    parser?: Parser;
    /**
     * Class to generate string by AST.
     */
    stringifier?: Stringifier;
    /**
     * Object with parse and stringify.
     */
    syntax?: Syntax;
    /**
     * Source map options
     */
    map?: SourceMapOptions | boolean;
  }

  interface PluginOptions {
    [k:string] :any
  }

  function process(
    css :string,
    processOptions? :ProcessOptions,
    pluginOptions? :PluginOptions
  ) :Promise<string>
}
