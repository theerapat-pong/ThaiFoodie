/* eslint-disable react/no-unknown-property */
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshPhysicalMaterial } from 'three'
import { easing } from 'maath'

// This is the simplest possible version to ensure something renders.
export default function FluidGlass() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ alpha: true }}>
      <GlassSphere />
    </Canvas>
  )
}

function GlassSphere() {
  const ref = useRef()
  
  // This hook runs on every frame, creating the animation
  useFrame((state, delta) => {
    // Animate the sphere to follow the mouse pointer
    easing.damp3(
      ref.current.position, // The object to move
      [state.pointer.x * 2.5, state.pointer.y * 2.5, 0], // Target position
      0.15, // Damping factor
      delta // Time delta
    )
  })

  return (
    <mesh ref={ref}>
      {/* A built-in sphere shape, requires no external files */}
      <sphereGeometry args={[0.7, 64, 64]} />
      
      {/* A simpler, more robust glass-like material */}
      <meshPhysicalMaterial 
        roughness={0.1}
        transmission={1.0}
        thickness={1.5}
        ior={1.5}
        color="#ffffff"
      />
    </mesh>
  )
}