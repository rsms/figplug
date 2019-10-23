
export type Subs = ArrayLike<[string|RegExp, string|((match:string)=>string)]>

// sub substitutes one or more strings in text.
//
// subs should be an array of lookups (left) and replacements (right).
// The lookup can be a string or a regular expression.
//
// If the lookup is a string, it will be matched when found in between word
// boundaries (\b in RegExp.)
//
// If the lookup is a RegExp object, it will be matched as-is. flags are ignored.
//
// If the replacement is a function, it is called with the matching string and
// its return value is used as the replacement.
//
// Substitutions are exclusive and does not affect each other.
// I.e. replacing the follwing in the text "foo bar baz" ...
// subs = [
//   ["foo", "bar"],
//   ["bar", "lol"],
// ]
// Yields "bar lol baz" (rather than "lol lol baz").
// In other words, one replacement does not affect the match of another.
//
export function sub(text :string, subs :Subs) :string {
  // since we are performing multiple substitutions on the same text, we need to
  // avoid one substitution matching on a previous subs. result.
  //
  // For instance, let's say we have this input text:
  //    foo bar baz
  // And we want to make the following substitutions:
  //    foo => bar
  //    bar => lol
  // The result we expect is this:
  //    bar lol baz
  // However, if we simply apply each substitution in order, we get this:
  // The result we expect is this:
  //    lol lol baz
  // Note the extra lol at the beginning.
  //
  // So, to work around this situation, we build one regexp with OR groups
  // and perform one replacement, making use of the efficient regular expressions
  // engines of modern JS runtimes.
  //
  let re = ""
  for (let i = 0; i < subs.length; i++) {
    let m = subs[i][0]
    if (i > 0) {
      re += "|"
    }
    re += m instanceof RegExp ? `(${m.source})` : "(\\b" + escapeRegExp(m) + "\\b)"
  }
  return text.replace(new RegExp(re, "gm"), (s, ...matches) => {
    // find sub based on group position in matches
    for (let i = 0; i < subs.length; i++) {
      let m = matches[i]
      if (m !== undefined) {
        let repl = subs[i][1]
        return repl instanceof Function ? repl(m) : repl
      }
    }
    return s
  })
}


// escapeRegExp takes some string and returns a version that is suitable as
// vanilla representation of `s` in a RegExp call.
//
function escapeRegExp(s :string) :string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
