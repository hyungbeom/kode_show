import React, { useRef, useMemo, useEffect, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 벚꽃 바람 + 꽃잎 — 송풍은 월드 고정 축(forward)으로만 전진.
 * root에 회전을 주지 않아 팬 rotateY와 좌표계가 묶이지 않음.
 */
function SakuraWindInner({ fan, clonedScene, windCount, petalCount, dirYawDeg = 0, dirPitchDeg = 0 }) {
  const rootRef = useRef(null)
  const windRef = useRef(null)
  const petalRef = useRef(null)
  const box = useRef(new THREE.Box3())
  const size = useRef(new THREE.Vector3())
  const qTemp = useRef(new THREE.Quaternion())
  const euler = useRef(new THREE.Euler())
  const basisReady = useRef(false)
  /** 자동 추정된 송풍 방향 (dirYawDeg/dirPitchDeg는 이 벡터 기준 추가 회전) */
  const baseForward = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const up = useRef(new THREE.Vector3())
  const pitchAxis = useRef(new THREE.Vector3())
  const worldUp = useRef(new THREE.Vector3(0, 1, 0))
  const fanPos = useRef(new THREE.Vector3())
  const cornerProj = useRef(new THREE.Vector3())
  const yAxis = useRef(new THREE.Vector3(0, 1, 0))

  const windGeo = useMemo(() => new THREE.CapsuleGeometry(0.35, 2.2, 6, 12), [])
  const windMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#e8f8ff',
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  )

  const petalGeo = useMemo(() => new THREE.CircleGeometry(0.25, 6), [])
  const petalMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ff8fb3',
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    []
  )

  const windParticles = useMemo(() => {
    return Array.from({ length: windCount }).map(() => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, Math.random() * 28),
      speed: 0.15 + Math.random() * 0.1,
      offset: Math.random() * Math.PI * 2,
      life: 0.4 + Math.random() * 0.55,
    }))
  }, [windCount])

  const petals = useMemo(() => {
    return Array.from({ length: petalCount }).map(() => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, Math.random() * 28),
      speed: 0.08 + Math.random() * 0.05,
      rot: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      rotSpeed: new THREE.Vector3(Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1),
      offset: Math.random() * Math.PI * 2,
      life: 0.4 + Math.random() * 0.55,
    }))
  }, [petalCount])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    return () => {
      windGeo.dispose()
      windMat.dispose()
      petalGeo.dispose()
      petalMat.dispose()
    }
  }, [windGeo, windMat, petalGeo, petalMat])

  useLayoutEffect(() => {
    const init = (mesh, n) => {
      if (!mesh) return
      dummy.position.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      for (let i = 0; i < n; i++) {
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    init(windRef.current, windCount)
    init(petalRef.current, petalCount)
  }, [windCount, petalCount, dummy])

  useFrame((state, delta) => {
    const root = rootRef.current
    const wMesh = windRef.current
    const pMesh = petalRef.current
    if (!root || !wMesh || !pMesh || !fan) return

    const time = state.clock.getElapsedTime()

    if (clonedScene) clonedScene.updateMatrixWorld(true)
    fan.updateWorldMatrix(true, true)

    if (!basisReady.current) {
      const parent = fan.parent
      const q = qTemp.current
      if (parent && parent !== clonedScene && parent.type !== 'Scene') {
        parent.updateWorldMatrix(true)
        parent.getWorldQuaternion(q)
      } else {
        fan.getWorldQuaternion(q)
        euler.current.setFromQuaternion(q, 'YXZ')
        euler.current.y = 0
        q.setFromEuler(euler.current)
      }
      baseForward.current.set(0, 0, 1).applyQuaternion(q).normalize()
      basisReady.current = true
    }

    const wUp = worldUp.current
    const pAx = pitchAxis.current
    const yawRad = THREE.MathUtils.degToRad(dirYawDeg)
    const pitchRad = THREE.MathUtils.degToRad(dirPitchDeg)

    const fw = forward.current
    fw.copy(baseForward.current)
    fw.applyAxisAngle(wUp, yawRad)
    pAx.crossVectors(wUp, fw)
    if (pAx.lengthSq() < 1e-8) pAx.set(1, 0, 0)
    else pAx.normalize()
    fw.applyAxisAngle(pAx, pitchRad)
    fw.normalize()

    const rh = right.current
    rh.crossVectors(wUp, fw)
    if (rh.lengthSq() < 1e-8) rh.set(1, 0, 0)
    else rh.normalize()
    const uw = up.current
    uw.crossVectors(fw, rh).normalize()

    box.current.setFromObject(fan)
    let s = 8
    /** 송풍 축(fw)에 수직인 면에 AABB 꼭짓점을 투영한 최대 거리 ≈ 단면 반경 (터빈 지름에 맞춤) */
    let lateralHalf = 4
    if (!box.current.isEmpty()) {
      box.current.getSize(size.current)
      const sx = size.current.x
      const sy = size.current.y
      const sz = size.current.z
      s = Math.max(sx, sy, sz, 0.001)
      const hx = sx * 0.5
      const hy = sy * 0.5
      const hz = sz * 0.5
      const cp = cornerProj.current
      let maxR = 0
      for (let i = 0; i < 8; i++) {
        cp.set(i & 1 ? hx : -hx, i & 2 ? hy : -hy, i & 4 ? hz : -hz)
        cp.projectOnPlane(fw)
        maxR = Math.max(maxR, cp.length())
      }
      lateralHalf = Math.max(maxR * 0.92, s * 0.12)
    }
    const sf = Math.max(s / 18, 1.2)
    const zStart = Math.max(s * 0.32, 3.5)

    fan.getWorldPosition(fanPos.current)
    root.position.copy(fanPos.current).addScaledVector(fw, zStart)
    root.quaternion.identity()

    const maxZ = 52 * sf
    const windSpeedScale = 58 * sf
    const petalSpeedScale = 34 * sf
    const grav = 0.04 * sf

    windParticles.forEach((p, wi) => {
      p.pos.z += p.speed * delta * windSpeedScale
      p.life -= delta * 0.28

      if (p.life <= 0 || p.pos.z > maxZ) {
        const a = Math.random() * Math.PI * 2
        const r = lateralHalf * Math.sqrt(Math.random())
        p.pos.set(r * Math.cos(a), r * Math.sin(a), Math.random() * maxZ * 0.25)
        p.life = 0.55 + Math.random() * 0.45
      }

      const wob = Math.max(0.12, lateralHalf * 0.07)
      const waveR = Math.sin(time * 2.2 + p.offset) * wob
      const waveU = Math.sin(time * 1.7 + p.offset * 1.3) * wob * 0.5

      dummy.position.copy(fw).multiplyScalar(p.pos.z)
      dummy.position.addScaledVector(rh, p.pos.x + waveR)
      dummy.position.addScaledVector(uw, p.pos.y + waveU)

      const vis = Math.max(0.35, p.life)
      dummy.quaternion.setFromUnitVectors(yAxis.current, fw)
      dummy.scale.set(vis * 0.45 * sf, vis * 4.2 * sf, vis * 0.45 * sf)
      dummy.updateMatrix()
      wMesh.setMatrixAt(wi, dummy.matrix)
    })
    wMesh.instanceMatrix.needsUpdate = true

    petals.forEach((p, i) => {
      p.pos.z += p.speed * delta * petalSpeedScale
      p.life -= delta * 0.32

      if (p.life <= 0 || p.pos.z > maxZ) {
        const a = Math.random() * Math.PI * 2
        const r = lateralHalf * 1.08 * Math.sqrt(Math.random())
        p.pos.set(r * Math.cos(a), r * Math.sin(a), Math.random() * maxZ * 0.2)
        p.life = 0.55 + Math.random() * 0.45
      }

      const waveR = Math.sin(time * 2 + p.offset) * Math.max(0.15, lateralHalf * 0.1)

      dummy.position.copy(fw).multiplyScalar(p.pos.z)
      dummy.position.addScaledVector(rh, p.pos.x + waveR)
      dummy.position.addScaledVector(uw, p.pos.y)
      dummy.position.y -= delta * grav

      p.rot.x += p.rotSpeed.x * delta * 60
      p.rot.y += p.rotSpeed.y * delta * 60
      p.rot.z += p.rotSpeed.z * delta * 60

      dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z)
      const psc = Math.max(0.3, p.life) * 0.85 * sf
      dummy.scale.set(psc, psc, psc)
      dummy.updateMatrix()
      pMesh.setMatrixAt(i, dummy.matrix)
    })
    pMesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={rootRef}>
      <instancedMesh
        ref={windRef}
        args={[windGeo, windMat, windCount]}
        frustumCulled={false}
        renderOrder={9}
      />
      <instancedMesh
        ref={petalRef}
        args={[petalGeo, petalMat, petalCount]}
        frustumCulled={false}
        renderOrder={10}
      />
    </group>
  )
}

export function SakuraWind({ fan, clonedScene, windCount = 15, petalCount = 40, dirYawDeg = 0, dirPitchDeg = 0 }) {
  if (!fan) return null
  return (
    <SakuraWindInner
      fan={fan}
      clonedScene={clonedScene}
      windCount={windCount}
      petalCount={petalCount}
      dirYawDeg={dirYawDeg}
      dirPitchDeg={dirPitchDeg}
    />
  )
}
