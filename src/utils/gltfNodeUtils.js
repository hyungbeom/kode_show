/**
 * glTF / gltfjsx 노드 이름에 제어문자가 붙은 경우(예: \\u0008 + Mill_Wing)
 * drei's useGraph(nodes) 키가 `nodes.Mill_Wing` 과 맞지 않을 때 사용합니다.
 */
export function resolveSceneNode(nodes, logicalName) {
  if (!nodes || !logicalName) return null
  if (nodes[logicalName]) return nodes[logicalName]
  const want = String(logicalName).replace(/[\u0000-\u001F\u007F]/g, '')
  for (const key of Object.keys(nodes)) {
    if (key.replace(/[\u0000-\u001F\u007F]/g, '') === want) return nodes[key]
  }
  return null
}
