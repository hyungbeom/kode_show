/**
 * glTF/GLB 노드의 로컬·월드 변환 출력 (Three.js 파서).
 * 사용: node scripts/print-glb-node-transform.mjs [경로] [노드이름]
 * 예: node scripts/print-glb-node-transform.mjs public/models/world.glb CH_Microscope
 */
globalThis.self ??= globalThis

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const glbPath = path.resolve(root, process.argv[2] ?? 'public/models/world.glb')
const nodeName = process.argv[3] ?? 'CH_Microscope'

if (!fs.existsSync(glbPath)) {
  console.error('파일 없음:', glbPath)
  process.exit(1)
}

const buf = fs.readFileSync(glbPath)
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)

const loader = new GLTFLoader()
loader.parse(
  ab,
  path.dirname(glbPath) + path.sep,
  (gltf) => {
    const scene = gltf.scene
    scene.updateMatrixWorld(true)

    let obj = scene.getObjectByName(nodeName)
    if (!obj) {
      scene.traverse((c) => {
        if (!obj && c.name.replace(/[\u0000-\u001F\u007F]/g, '') === nodeName) obj = c
      })
    }
    if (!obj) {
      console.error('노드를 찾을 수 없음:', nodeName)
      process.exit(1)
    }

    const wp = new THREE.Vector3()
    const wq = new THREE.Quaternion()
    const ws = new THREE.Vector3()
    obj.matrixWorld.decompose(wp, wq, ws)

    const euler = new THREE.Euler().setFromQuaternion(wq, 'YXZ')

    console.log(JSON.stringify({ glb: glbPath, node: nodeName }, null, 0))
    console.log('\n--- 로컬 (부모 대비, Three.js units = glTF) ---')
    console.log('position:', obj.position.x, obj.position.y, obj.position.z)
    console.log(
      'rotation (rad XYZ YXZ):',
      obj.rotation.x,
      obj.rotation.y,
      obj.rotation.z,
    )
    console.log('scale:', obj.scale.x, obj.scale.y, obj.scale.z)

    console.log('\n--- 월드 (씬 루트 기준, GLB 로드 직후) ---')
    console.log('world position:', wp.x, wp.y, wp.z)
    console.log('world quaternion:', wq.x, wq.y, wq.z, wq.w)
    console.log('world euler (rad, YXZ):', euler.x, euler.y, euler.z)
    console.log('world scale:', ws.x, ws.y, ws.z)

    const chain = []
    for (let o = obj; o; o = o.parent) {
      chain.push(o.name || `(unnamed ${o.type})`)
    }
    console.log('\n부모 체인 (자식→루트):', chain.join(' ← '))

    const box = new THREE.Box3().setFromObject(obj)
    const bc = new THREE.Vector3()
    const be = new THREE.Vector3()
    if (!box.isEmpty()) {
      box.getCenter(bc)
      box.getSize(be)
      console.log('\n--- 서브트리 AABB (WorldModel / 맵 줌과 동일한 기준) ---')
      console.log('bbox center (world):', bc.x, bc.y, bc.z)
      console.log('bbox size:', be.x, be.y, be.z)
    } else {
      console.log('\n(서브트리 AABB 비어 있음 — 지오메트리 없는 Empty일 수 있음)')
    }
  },
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
