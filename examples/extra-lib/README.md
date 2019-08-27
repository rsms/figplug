Demonstrates including libraries in plugins.

A library is code included in the global scope of the plugin.

Libraries come in two forms:

1. JavaScript with optional type definitions
2. Pure type definitions

Libraries which are purely type definitions are useful in cases where you want to declare
global types but require no implementation.

Libraries with implementation code in JavaScript simply have their JS code added to the
beginning of the output product code, and are included and adjusted for in sourcemaps.
The order of library code in the output product is determined by:

- order of `-lib` flags, followed by
- order of `figplug.libs` in a manifest file

Example: Consider the following manifest:

```json
{ "api": "1.0.0",
  "name": "extra-lib",
  "main": "plugin.ts",
  "figplug": {
    "libs": ["libtwo", "libthree"]
  }
}
```

And the following invocation to `build`:

```txt
figplug build -lib=libone
```

This would produce a plugin.js file with the following code:

1. figplug built-in helpers, like `assert`
2. code of libone
3. code of libtwo
4. code of libthree
5. code of plugin.ts

A Library with JavaScript code may also include a `.d.ts` TypeScript definition file,
which when exists is provided as global definitions (a "lib" in TypeScript terminology.)
