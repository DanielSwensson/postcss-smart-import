import valueParser from "postcss-value-parser"

var stringify = valueParser.stringify

export default function parseStatements(result, styles)
{
  var statements = []
  var nodes = []

  styles.each((node) =>
  {
    var stmt
    if (node.type === "atrule" && node.name === "import")
      stmt = parseImport(result, node)

    if (stmt)
    {
      if (nodes.length > 0)
      {
        statements.push({
          type: "nodes",
          nodes: nodes
        })

        nodes = []
      }

      statements.push(stmt)
    }
    else
    {
      nodes.push(node)
    }
  })

  if (nodes.length > 0)
  {
    statements.push({
      type: "nodes",
      nodes: nodes
    })
  }

  return statements
}

function parseImport(result, atRule)
{
  var prev = atRule.prev()
  while (prev && prev.type === "comment") {
    prev = prev.prev()
  }

  if (prev)
  {
    if (prev.type !== "atrule" || (prev.name !== "import" && prev.name !== "charset"))
    {
      return result.warn(
        "@import must precede all other statements (besides @charset)",
        { node: atRule }
      )
    }
  }

  if (atRule.nodes)
  {
    return result.warn(
      "It looks like you didn't end your @import statement correctly. Child nodes are attached to it.",
      { node: atRule }
    )
  }

  var params = valueParser(atRule.params).nodes
  var stmt = {
    type: "import",
    node: atRule
  }

  if (
    params.length === 0 ||
    (
      params[0].type !== "string" ||
      !params[0].value
    ) &&
    (
      params[0].type !== "function" ||
      params[0].value !== "url" ||
      params[0].nodes.length === 0 ||
      !params[0].nodes[0].value
    )
  ) {
    return result.warn(
      "Unable to find uri in '" + atRule.toString() + "'",
      { node: atRule }
    )
  }

  if (params[0].type === "string")
    stmt.uri = params[0].value
  else
    stmt.uri = params[0].nodes[0].value

  stmt.fullUri = stringify(params[0])

  return stmt
}
