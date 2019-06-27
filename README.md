# figplug

Figma plugin helper.

- Simplify creation of plugins
- Simplify compiling of plugins
- Yields plugins with efficient code that loads fast
- TypeScript
- Supports React out of the box

Install: `npm install -g figplug`

Examples:

```sh
# create a plugin
figplug init -ui my-plugin
# build a plugin
figplug build -w my-plugin
# Your plugin is now available in "my-plugin/build".
# -w makes figbuild watch your source files for changes
# and rebuild your plugin automatically.
```


### init

Initialize Figma plugins in directories provided as `<dir>`, or the current directory.

```
Usage: bin/figplug.g init [<dir> ...]
options:
  -ui                Generate UI written in TypeScript & HTML
  -html              Generate UI written purely in HTML
  -react             Generate UI written in React
  -f, -force         Overwrite or replace existing files
  -name=<name>       Name of plugin. Defaults to directory name.
  -srcdir=<dirname>  Where to put source files, relative to <dir>. Defaults to "."
  -v, -verbose       Print additional information to stdout
  -debug             Print a lot of information to stdout. Implies -v
  -version           Print figplug version information
```

### build

Builds Figma plugins.

```
Usage: bin/figplug.g build [options] [<path> ...]
<path>  Path to a plugin directory or a manifest file. Defaults to ".".
options:
  -w             Watch sources for changes and rebuild incrementally
  -g             Generate debug code (assertions and DEBUG branches).
  -O             Generate optimized code.
  -clean         Force rebuilding of everything, ignoring cache. Implied with -O.
  -nomin         Do not minify or mangle optimized code when -O is enabled.
  -o=<dir>,
  -output=<dir>  Write output to directory. Defaults to ./build
  -v, -verbose   Print additional information to stdout
  -debug         Print a lot of information to stdout. Implies -v
  -version       Print figplug version information
```
