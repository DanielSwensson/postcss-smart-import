import test from "ava"
import path from "path"
import { readFileSync } from "fs"
import postcss from "postcss"
import atImport from "../src"
import compareFixtures from "./helpers/compare-fixtures"

test("should import stylsheets", (t) =>
   compareFixtures(t, "simple")
)

test("should not import a stylsheet twice", (t) =>
   compareFixtures(t, "no-duplicate")
)

test("should be able to import a stylsheet twice", (t) =>
   compareFixtures(t, "duplicates", {
     skipDuplicates: false,
   })
)

test("should import stylsheets with same content", (t) =>
   compareFixtures(t, "same")
)

test("should ignore & adjust external import", (t) =>
   compareFixtures(t, "ignore")
)

test("should not fail with only one absolute import", (t) =>
{
  var base = "@import url(http://)"
  return postcss()
    .use(atImport())
    .process(base)
    .then((result) =>
    {
      t.is(result.warnings().length, 0)
      t.is(result.css, base)
    })
})

test("should not fail with absolute and local import", (t) =>
   postcss()
    .use(atImport())
    .process("@import url('http://');\n@import 'test/fixtures/imports/foo.css';")
    .then((result) =>
    {
      t.is(result.css, "@import url('http://');\nfoo{}")
    })
)

test("should output readable trace", (t) =>
{
  var file = "test/fixtures/imports/import-missing.css"
  return postcss()
    .use(atImport())
    .process(readFileSync(file), { from: file })
    .then((result) =>
    {
      t.is(
        result.warnings()[0].text,

        /* eslint-disable max-len */
        "Failed to find 'missing-file.css'\n    in [ \n        " + path.resolve("test/fixtures/imports") + "\n    ]"

        /* eslint-enabme max-len */
      )
    })
})

test("should contain a correct sourcemap", (t) =>

   postcss()
    .use(atImport())
    .process(readFileSync("test/sourcemap/in.css"), {
      from: "test/sourcemap/in.css",
      to: null,
      map: {
        inline: false,
      },
    })
    .then((result) =>
    {
      t.is(
        result.map.toString(),
        readFileSync("test/sourcemap/out.css.map", "utf8").trim()
      )
    })
)

test("inlined @import should keep PostCSS AST references clean", (t) =>

   postcss()
    .use(atImport())
    .process("@import 'fixtures/imports/foo.css';\nbar{}")
    .then((result) =>
    {
      result.root.nodes.forEach((node) =>
      {
        t.is(result.root, node.parent)
      })
    })
)

test("should work with empty files", (t) =>

   compareFixtures(t, "empty-and-useless", {
     path: "test/fixtures/imports",
   }, null, [
     path.resolve("test/fixtures/imports/empty.css") + " is empty",
   ])
)

test("should work with no styles without throwing an error", (t) =>

   postcss()
    .use(atImport())
    .process("")
    .then((result) =>
    {
      t.is(result.warnings().length, 0)
    })
)
