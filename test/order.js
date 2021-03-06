import test from "ava"
import compareFixtures from "./helpers/compare-fixtures"

test(`should order nested imports correctly`, (t) => {
  var first = true
  var path = require("path")

  return compareFixtures(t, "order", {
    path: "test/fixtures/imports",
    resolve: (id) =>
       new Promise((resolve, reject) => {
         var doResolve = () => resolve(path.resolve("test/fixtures/imports", id))

         if (first) {
          // Delay the first import so the second gets loaded first
           setTimeout(doResolve, 100)
           first = false
         }
         else {
           doResolve()
         }
       })

  })
})
