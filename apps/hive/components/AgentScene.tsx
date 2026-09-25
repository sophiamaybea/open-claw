'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Line, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'

type Point = [number, number, number]

type RouteSpec = {
  colour: string
  points: Point[]
  radius: number
  phase: number
}

type CellSpec = {
  colour: string
  position: Point
  radius: number
  seed: number
}

const ROUTES: RouteSpec[] = [
  {
    colour: '#ff5267',
    radius: 0.19,
    phase: 0.04,
    points: [[-3.15, 2.42, -0.18], [-2.2, 2.42, -0.12], [-2.2, 1.34, -0.08], [-1.22, 1.34, 0], [-1.22, 0.36, 0.04], [-2.56, 0.36, -0.03], [-2.56, -0.54, -0.1]],
  },
  {
    colour: '#f6d75d',
    radius: 0.18,
    phase: 0.31,
    points: [[0.02, 2.64, -0.18], [1.08, 2.64, -0.1], [1.08, 1.58, -0.05], [2.74, 1.58, 0.02], [2.74, 0.48, 0.06], [2.24, 0.48, 0.02]],
  },
  {
    colour: '#4c92ff',
    radius: 0.2,
    phase: 0.52,
    points: [[-1.54, 0.96, 0.08], [-0.42, 0.96, 0.12], [-0.42, 0.12, 0.18], [1.18, 0.12, 0.2], [1.18, -0.5, 0.15], [0.42, -0.5, 0.12]],
  },
  {
    colour: '#82ca73',
    radius: 0.21,
    phase: 0.68,
    points: [[-0.72, -0.42, -0.04], [0.12, -0.42, 0.02], [0.12, -1.02, 0.08], [1.82, -1.02, 0.12], [1.82, -1.72, 0.08], [2.78, -1.72, 0]],
  },
  {
    colour: '#c79af4',
    radius: 0.17,
    phase: 0.81,
    points: [[-2.98, -1.38, -0.2], [-1.84, -1.38, -0.12], [-1.84, -2.18, -0.04], [-0.36, -2.18, 0.03], [-0.36, -2.72, -0.02], [0.38, -2.72, -0.08]],
  },
  {
    colour: '#ff8a3d',
    radius: 0.2,
    phase: 0.93,
    points: [[0.72, -1.62, 0.05], [1.42, -1.62, 0.1], [1.42, -2.48, 0.08], [2.82, -2.48, -0.02], [2.82, -2.92, -0.12]],
  },
]

const CELLS: CellSpec[] = [
  { colour: '#ff694f', position: [-1.62, 1.55, 0.4], radius: 0.44, seed: 1.2 },
  { colour: '#a8c93b', position: [0.24, 2.04, 0.37], radius: 0.52, seed: 2.8 },
  { colour: '#2f70dc', position: [2.31, 2.24, 0.42], radius: 0.47, seed: 4.3 },
  { colour: '#8041a8', position: [0.24, 0.48, 0.61], radius: 0.5, seed: 5.7 },
  { colour: '#2678dc', position: [-2.05, -0.72, 0.42], radius: 0.57, seed: 7.1 },
  { colour: '#ff5c2c', position: [0.75, -1.16, 0.56], radius: 0.54, seed: 8.6 },
  { colour: '#d43758', position: [2.34, -1.82, 0.54], radius: 0.55, seed: 10.1 },
  { colour: '#93b72f', position: [-1.36, -2.04, 0.46], radius: 0.43, seed: 11.8 },
]

const WIRES: Point[][] = [
  [[-3.12, 1.02, 0.42], [-2.78, 1.02, 0.46], [-2.78, 1.58, 0.46], [-2.08, 1.58, 0.46]],
  [[-1.18, 1.56, 0.44], [-0.75, 1.56, 0.46], [-0.75, 2.08, 0.43], [-0.31, 2.08, 0.43]],
  [[0.76, 2.08, 0.43], [1.48, 2.08, 0.47], [1.48, 2.43, 0.47], [1.86, 2.43, 0.44]],
  [[0.71, 0.46, 0.66], [1.42, 0.46, 0.54], [1.42, 0.82, 0.5], [2.18, 0.82, 0.48]],
  [[-1.55, -0.72, 0.48], [-0.84, -0.72, 0.52], [-0.84, -1.12, 0.53], [0.19, -1.12, 0.57]],
  [[1.3, -1.18, 0.6], [1.72, -1.18, 0.6], [1.72, -1.82, 0.58], [1.83, -1.82, 0.58]],
  [[-0.92, -2.04, 0.5], [-0.38, -2.04, 0.52], [-0.38, -1.58, 0.54], [0.19, -1.58, 0.56]],
  [[2.43, 1.78, 0.47], [2.43, 1.18, 0.48], [3.13, 1.18, 0.43], [3.13, -0.12, 0.38]],
]

const SMALL_NODES: CellSpec[] = [
  { colour: '#fb4564', position: [-2.82, 1.02, 0.5], radius: 0.11, seed: 2 },
  { colour: '#6bd8ce', position: [1.49, 2.43, 0.51], radius: 0.1, seed: 3 },
  { colour: '#ff3b52', position: [1.42, 0.82, 0.56], radius: 0.12, seed: 4 },
  { colour: '#f58e32', position: [-0.84, -1.12, 0.58], radius: 0.1, seed: 5 },
  { colour: '#ed3c78', position: [-0.38, -1.58, 0.59], radius: 0.13, seed: 6 },
  { colour: '#78c9bc', position: [3.13, -0.12, 0.44], radius: 0.12, seed: 7 },
]

const pigmentVertex = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const pigmentFragment = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform float uHover;
  uniform vec3 uColour;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32 + uSeed);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float radius = length(p);
    float angle = atan(p.y, p.x);
    float motion = uTime * 0.055;
    float cloud = fbm(p * 3.2 + vec2(uSeed, -uSeed) + motion);
    float tendrils = sin(angle * 15.0 + cloud * 10.0 + uSeed * 2.0 - motion * 2.0);
    float bloomEdge = 0.48 + (cloud - 0.5) * 0.24 + tendrils * 0.035;
    float bloom = 1.0 - smoothstep(bloomEdge, bloomEdge + 0.1, radius);
    float veins = pow(max(0.0, tendrils), 13.0) * smoothstep(0.82, 0.12, radius);
    float core = 1.0 - smoothstep(0.04, 0.24, radius + cloud * 0.05);
    float cells = step(0.86, noise(floor((p + 1.0) * 18.0) + uSeed));
    cells *= smoothstep(0.82, 0.16, radius) * 0.42;

    vec3 deepColour = mix(uColour, vec3(0.018, 0.012, 0.025), 0.82);
    vec3 colour = mix(uColour, deepColour, core * 0.88 + veins * 0.44);
    colour += uColour * cloud * 0.18;
    float alpha = (bloom * 0.72 + veins * 0.52 + core * 0.85 + cells) * smoothstep(1.0, 0.78, radius);
    alpha *= 0.88 + uHover * 0.12;
    gl_FragColor = vec4(colour, alpha);
  }
`

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

function roundedCurve(points: Point[], radius = 0.2) {
  const vectors = points.map((point) => new THREE.Vector3(...point))
  const path = new THREE.CurvePath<THREE.Vector3>()
  let cursor = vectors[0].clone()

  for (let index = 1; index < vectors.length - 1; index += 1) {
    const previous = vectors[index - 1]
    const corner = vectors[index]
    const next = vectors[index + 1]
    const incoming = previous.clone().sub(corner).normalize()
    const outgoing = next.clone().sub(corner).normalize()
    const cornerRadius = Math.min(radius, corner.distanceTo(previous) * 0.28, corner.distanceTo(next) * 0.28)
    const entry = corner.clone().add(incoming.multiplyScalar(cornerRadius))
    const exit = corner.clone().add(outgoing.multiplyScalar(cornerRadius))

    path.add(new THREE.LineCurve3(cursor, entry))
    path.add(new THREE.QuadraticBezierCurve3(entry, corner, exit))
    cursor = exit
  }

  path.add(new THREE.LineCurve3(cursor, vectors[vectors.length - 1]))
  return path
}

function ResinRoute({ colour, points, radius, phase, reducedMotion }: RouteSpec & { reducedMotion: boolean }) {
  const signal = useRef<THREE.Mesh>(null!)
  const material = useRef<THREE.MeshPhysicalMaterial>(null!)
  const [hovered, setHovered] = useState(false)
  const curve = useMemo(() => roundedCurve(points, 0.22), [points])
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 92, radius, 16, false), [curve, radius])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, delta) => {
    const progress = reducedMotion ? phase : (state.clock.elapsedTime * 0.045 + phase) % 1
    signal.current.position.copy(curve.getPointAt(progress))
    const target = hovered ? 0.22 : 0.045
    material.current.emissiveIntensity = THREE.MathUtils.damp(material.current.emissiveIntensity, target, 6, delta)
  })

  return (
    <group>
      <mesh
        geometry={geometry}
        castShadow
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <meshPhysicalMaterial
          ref={material}
          color={colour}
          emissive={colour}
          emissiveIntensity={0.045}
          roughness={0.09}
          metalness={0}
          transmission={0.66}
          transparent
          opacity={0.84}
          thickness={0.64}
          ior={1.28}
          attenuationColor={colour}
          attenuationDistance={1.6}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>
      <mesh ref={signal} scale={hovered ? 1.22 : 1} renderOrder={5}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color="#fffdf5" emissive={colour} emissiveIntensity={3.5} roughness={0.08} />
      </mesh>
    </group>
  )
}

function Pigment({ colour, seed, hovered, reducedMotion }: { colour: string; seed: number; hovered: boolean; reducedMotion: boolean }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: pigmentVertex,
    fragmentShader: pigmentFragment,
    uniforms: {
      uTime: { value: seed * 4 },
      uSeed: { value: seed },
      uHover: { value: 0 },
      uColour: { value: new THREE.Color(colour) },
    },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }), [colour, seed])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state, delta) => {
    if (!reducedMotion) material.uniforms.uTime.value = state.clock.elapsedTime + seed * 4
    material.uniforms.uHover.value = THREE.MathUtils.damp(material.uniforms.uHover.value, hovered ? 1 : 0, 7, delta)
  })

  return (
    <mesh position={[0, 0, 0.055]} renderOrder={4}>
      <circleGeometry args={[0.79, 72]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function PetriCell({ colour, position, radius, seed, reducedMotion }: CellSpec & { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const scale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    const target = hovered ? 1.1 : 1
    scale.setScalar(target)
    group.current.scale.lerp(scale, 1 - Math.exp(-delta * 7))
    if (!reducedMotion) group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.22 + seed) * 0.016
  })

  return (
    <group
      ref={group}
      position={position}
      scale={radius}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0, -0.03]}>
        <circleGeometry args={[0.96, 72]} />
        <meshPhysicalMaterial color={colour} transparent opacity={0.11} roughness={0.3} depthWrite={false} />
      </mesh>
      <Pigment colour={colour} seed={seed} hovered={hovered} reducedMotion={reducedMotion} />
      <mesh scale={[1, 1, 0.27]} renderOrder={6}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshPhysicalMaterial
          color="#fffdf8"
          roughness={0.055}
          metalness={0}
          transmission={0.9}
          transparent
          opacity={0.34}
          thickness={0.52}
          ior={1.32}
          clearcoat={1}
          clearcoatRoughness={0.04}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.24]}>
        <sphereGeometry args={[0.105, 20, 20]} />
        <meshStandardMaterial color="#121514" metalness={0.84} roughness={0.13} emissive={colour} emissiveIntensity={hovered ? 0.8 : 0.28} />
      </mesh>
      <mesh position={[0, 0, 0.2]}>
        <torusGeometry args={[1.01, 0.022, 10, 80]} />
        <meshStandardMaterial color="#f8f1e6" metalness={0.82} roughness={0.15} />
      </mesh>
    </group>
  )
}

function SmallNode({ colour, position, radius }: CellSpec) {
  return (
    <group position={position} scale={radius}>
      <mesh scale={[1, 1, 0.62]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshPhysicalMaterial color={colour} roughness={0.08} transmission={0.58} transparent opacity={0.86} thickness={0.8} ior={1.25} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0.64]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#171817" metalness={0.9} roughness={0.12} />
      </mesh>
    </group>
  )
}

function WirePath({ points, index, reducedMotion }: { points: Point[]; index: number; reducedMotion: boolean }) {
  const pulse = useRef<THREE.Mesh>(null!)
  const curve = useMemo(() => roundedCurve(points, 0.09), [points])
  const linePoints = useMemo(() => curve.getPoints(44), [curve])

  useFrame((state) => {
    const progress = reducedMotion ? index / WIRES.length : (state.clock.elapsedTime * 0.075 + index * 0.17) % 1
    pulse.current.position.copy(curve.getPointAt(progress))
  })

  return (
    <group>
      <Line points={linePoints} color="#181a18" lineWidth={0.72} transparent opacity={0.72} />
      {points.slice(1, -1).map((point, pointIndex) => (
        <mesh key={pointIndex} position={point}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#d8d4c9" metalness={1} roughness={0.12} />
        </mesh>
      ))}
      <mesh ref={pulse} renderOrder={8}>
        <sphereGeometry args={[0.042, 12, 12]} />
        <meshBasicMaterial color={index % 2 ? '#ff4f70' : '#d8ff55'} />
      </mesh>
    </group>
  )
}

function Clamp({ position, direction = 'vertical' }: { position: Point; direction?: 'vertical' | 'horizontal' }) {
  const dimensions: [number, number, number] = direction === 'vertical' ? [0.052, 0.52, 0.29] : [0.52, 0.052, 0.29]
  return (
    <group position={position}>
      {[-0.09, 0, 0.09].map((offset) => (
        <RoundedBox
          key={offset}
          args={dimensions}
          radius={0.018}
          smoothness={3}
          position={direction === 'vertical' ? [offset, 0, 0] : [0, offset, 0]}
        >
          <meshStandardMaterial color="#111412" metalness={0.58} roughness={0.2} />
        </RoundedBox>
      ))}
    </group>
  )
}

function CableBundle() {
  const offsets = [-0.09, -0.03, 0.03, 0.09]
  return (
    <group>
      {offsets.map((offset) => (
        <Line
          key={offset}
          points={[[1.65, -0.33 + offset, 0.34], [2.18, -0.33 + offset, 0.34], [2.18, -0.92 + offset, 0.34], [2.78, -0.92 + offset, 0.34]]}
          color="#111412"
          lineWidth={0.72}
          transparent
          opacity={0.78}
        />
      ))}
      <Clamp position={[1.69, -0.33, 0.38]} direction="vertical" />
      <Clamp position={[2.75, -0.92, 0.38]} direction="vertical" />
    </group>
  )
}

function Relief({ reducedMotion }: { reducedMotion: boolean }) {
  const rig = useRef<THREE.Group>(null!)

  useFrame((state, delta) => {
    const x = reducedMotion ? 0 : -state.pointer.y * 0.045
    const y = reducedMotion ? 0 : state.pointer.x * 0.075
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, x, 4.5, delta)
    rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, y, 4.5, delta)
  })

  return (
    <group ref={rig} position={[0.05, 0.02, 0]} rotation={[-0.025, -0.035, -0.018]} scale={0.94}>
      <mesh position={[0, 0, -0.48]}>
        <planeGeometry args={[7.2, 6.5]} />
        <meshStandardMaterial color="#eeece3" roughness={0.96} transparent opacity={0.18} />
      </mesh>

      {ROUTES.map((route) => <ResinRoute key={route.colour} {...route} reducedMotion={reducedMotion} />)}
      {WIRES.map((points, index) => <WirePath key={index} points={points} index={index} reducedMotion={reducedMotion} />)}
      <CableBundle />
      {CELLS.map((cell) => <PetriCell key={cell.seed} {...cell} reducedMotion={reducedMotion} />)}
      {SMALL_NODES.map((node) => <SmallNode key={node.seed} {...node} />)}

      <Clamp position={[-2.56, -0.49, 0.08]} direction="horizontal" />
      <Clamp position={[1.08, 1.62, 0.12]} direction="horizontal" />
      <Clamp position={[-1.83, -1.4, 0.1]} direction="vertical" />
      <Clamp position={[1.42, -2.43, 0.2]} direction="horizontal" />

      {[
        [-3.08, -0.18, 0.25], [-2.78, -2.62, 0.19], [-0.62, 2.58, 0.2],
        [2.98, 0.83, 0.25], [2.62, -2.86, 0.16], [0.1, -2.85, 0.14],
      ].map((position, index) => (
        <mesh key={index} position={position as Point}>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshStandardMaterial color="#d8d4c9" metalness={1} roughness={0.09} />
        </mesh>
      ))}
    </group>
  )
}

export default function AgentScene() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="scene-wrap cellular-scene" aria-hidden="true">
      <div className="scene-fallback" />
      <Canvas
        camera={{ position: [0, 0, 8.35], fov: 42 }}
        dpr={[1, 1.55]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        performance={{ min: 0.6 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.08
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
      >
        <ambientLight intensity={1.35} />
        <hemisphereLight args={['#fffdf5', '#b7b3aa', 1.35]} />
        <directionalLight position={[-4, 5, 7]} intensity={4.2} color="#fff8e7" />
        <directionalLight position={[5, -2, 4]} intensity={2.1} color="#b9dcff" />
        <pointLight position={[-2.5, 1.5, 3]} intensity={15} distance={8} color="#ff9fa9" />
        <pointLight position={[2.5, -1.5, 3]} intensity={13} distance={8} color="#d8ff55" />
        <Relief reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
