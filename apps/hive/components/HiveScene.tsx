'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { MutableRefObject, useMemo, useRef } from 'react'
import { CATEGORY_COLOURS, HiveCategory } from '@/lib/hive-data'

export type SceneNode = {
  id: string
  label: string
  category: HiveCategory
  priority: number
  size?: number
  amount?: number
}

type HiveSceneProps = {
  nodes: SceneNode[]
  selectedId?: string
  onSelect?: (id: string) => void
  motion?: 'off' | 'reduced' | 'normal'
  mode?: 'attention' | 'radar' | 'money'
  centreLabel?: string
  scrollProgress?: MutableRefObject<number>
}

const vertexShader = `
uniform float uTime;
uniform float uMotion;
uniform float uSeed;
varying vec3 vNormal;
varying vec3 vPos;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPos = position;

  float waveA = sin(position.y * 3.6 + uTime * .42 + uSeed) * .035;
  float waveB = sin(position.x * 5.2 - uTime * .31 + uSeed * 1.7) * .022;
  float waveC = sin((position.x + position.z) * 4.1 + uTime * .25) * .018;
  vec3 displaced = position + normal * (waveA + waveB + waveC) * uMotion;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`

const fragmentShader = `
uniform vec3 uColour;
uniform float uSelected;
varying vec3 vNormal;
varying vec3 vPos;

float hash(vec3 p) {
  p = fract(p * .3183099 + vec3(.1,.7,.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  float fresnel = pow(1.0 - abs(vNormal.z), 2.2);
  float grain = hash(floor(vPos * 15.0)) * .12;
  vec3 base = uColour * (.68 + grain);
  vec3 edge = mix(base, vec3(1.0), .32 + uSelected * .28);
  vec3 colour = mix(base, edge, fresnel);
  float alpha = .82 + fresnel * .14;
  gl_FragColor = vec4(colour, alpha);
}
`

function seededAngle(index: number) {
  return index * 2.399963229728653
}

function nodePosition(node: SceneNode, index: number, mode: HiveSceneProps['mode']) {
  const angle = seededAngle(index)
  const ring = mode === 'money'
    ? Math.max(1, node.priority + 1)
    : Math.max(.8, node.priority + 1)
  const radius = mode === 'radar'
    ? 1.25 + ring * .82
    : .85 + ring * .72

  return new THREE.Vector3(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius * .76,
    Math.sin(angle * 1.7) * .5,
  )
}

function Bubble({
  node,
  index,
  selected,
  onSelect,
  motion,
  mode,
}: {
  node: SceneNode
  index: number
  selected: boolean
  onSelect?: (id: string) => void
  motion: HiveSceneProps['motion']
  mode: HiveSceneProps['mode']
}) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const seed = index * .83 + 1.3
  const position = useMemo(() => nodePosition(node, index, mode), [node, index, mode])
  const colour = useMemo(() => new THREE.Color(CATEGORY_COLOURS[node.category]), [node.category])
  const baseScale = (node.size ?? 1) * (selected ? 1.15 : 1)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMotion: { value: motion === 'off' ? 0 : motion === 'reduced' ? .28 : .72 },
    uSeed: { value: seed },
    uColour: { value: colour },
    uSelected: { value: selected ? 1 : 0 },
  }), [colour, motion, seed, selected])

  useFrame((state, delta) => {
    if (material.current && motion !== 'off') {
      material.current.uniforms.uTime.value += delta
      material.current.uniforms.uMotion.value = motion === 'reduced' ? .28 : .72
    }
    if (mesh.current && motion === 'normal') {
      mesh.current.rotation.y += delta * .035
      mesh.current.rotation.x += delta * .02
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={mesh}
        scale={baseScale}
        onClick={(event) => {
          event.stopPropagation()
          onSelect?.(node.id)
        }}
      >
        <icosahedronGeometry args={[.58, 5]} />
        <shaderMaterial
          ref={material}
          transparent
          depthWrite={false}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <mesh
        scale={baseScale * 1.34}
        onClick={(event) => {
          event.stopPropagation()
          onSelect?.(node.id)
        }}
      >
        <sphereGeometry args={[.58, 20, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Orbits({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        const radius = 1.38 + index * .78
        const points = Array.from({ length: 96 }).map((__, pointIndex) => {
          const a = (pointIndex / 95) * Math.PI * 2
          return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius * .76, -.35)
        })
        return (
          <Line
            key={radius}
            points={points}
            color="#545377"
            transparent
            opacity={.2}
            lineWidth={.7}
          />
        )
      })}
    </>
  )
}

function Connections({ nodes, mode }: { nodes: SceneNode[]; mode: HiveSceneProps['mode'] }) {
  const lines = useMemo(() => {
    return nodes
      .map((node, index) => {
        if (index === 0 || index % 2 === 0) return null
        const a = nodePosition(node, index, mode)
        const prior = nodes[index - 1]
        const b = nodePosition(prior, index - 1, mode)
        return { id: node.id, points: [a, b] }
      })
      .filter(Boolean) as { id: string; points: THREE.Vector3[] }[]
  }, [nodes, mode])

  return (
    <>
      {lines.map((line) => (
        <Line
          key={line.id}
          points={line.points}
          color="#9CA0AB"
          transparent
          opacity={.18}
          lineWidth={.65}
        />
      ))}
    </>
  )
}

function Scene({
  nodes,
  selectedId,
  onSelect,
  motion = 'reduced',
  mode = 'attention',
  scrollProgress,
}: HiveSceneProps) {
  const root = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  useFrame(() => {
    if (!root.current) return

    const progress = scrollProgress?.current ?? 0
    const motionFactor = motion === 'off' ? 0 : motion === 'reduced' ? .35 : 1
    const targetX = pointer.y * .12 * motionFactor + progress * .08 * motionFactor
    const targetY = pointer.x * .18 * motionFactor + progress * .22 * motionFactor
    const targetZ = progress * .42 * motionFactor

    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, targetX, .045)
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, targetY, .045)
    root.current.position.z = THREE.MathUtils.lerp(root.current.position.z, targetZ, .04)
  })

  return (
    <>
      <ambientLight intensity={.52} />
      <directionalLight position={[4, 6, 7]} intensity={1.05} color="#d9d5ff" />
      <pointLight position={[-4, -2, 4]} intensity={2.2} distance={12} color="#823DDB" />
      <pointLight position={[5, 3, 3]} intensity={1.7} distance={11} color="#E653B7" />
      <group ref={root}>
        <Orbits count={mode === 'money' ? 5 : 4} />
        <Connections nodes={nodes} mode={mode} />
        <Sparkles count={54} scale={[10, 8, 4]} size={1} speed={motion === 'off' ? 0 : .15} opacity={.14} color="#9CA0AB" />
        {nodes.map((node, index) => (
          <Bubble
            key={node.id}
            node={node}
            index={index}
            selected={node.id === selectedId}
            onSelect={onSelect}
            motion={motion}
            mode={mode}
          />
        ))}
        <mesh position={[0, 0, .2]} scale={1.15}>
          <icosahedronGeometry args={[.6, 5]} />
          <meshPhysicalMaterial
            color="#786d73"
            roughness={.72}
            metalness={.05}
            clearcoat={.55}
            clearcoatRoughness={.34}
            emissive="#2a2530"
            emissiveIntensity={.28}
          />
        </mesh>
      </group>
    </>
  )
}

export default function HiveScene(props: HiveSceneProps) {
  return (
    <div className="hive-scene" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 9.1], fov: 48 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene {...props} />
      </Canvas>
      <div className="hive-scene-centre">
        <span>YOU</span>
        <small>{props.centreLabel ?? 'more focus · less friction'}</small>
      </div>
    </div>
  )
}
