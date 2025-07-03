/* eslint-disable react/no-unknown-property */
import * as THREE from 'three'
import { useRef, useState, useEffect, memo } from 'react'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { useFBO, useGLTF, MeshTransmissionMaterial } from '@react-three/drei'
import { easing } from 'maath'

// --- Main Component (Simplified for background usage) ---
export default function FluidGlass({
  lensProps = {},
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 15 }}
      gl={{ alpha: true }} // Key setting for transparent background
    >
      <Lens modeProps={lensProps} />
    </Canvas>
  )
}

// --- Wrapper for the 3D Model ---
const ModeWrapper = memo(function ModeWrapper({
  children,
  glb,
  geometryKey,
  modeProps = {},
  ...props
}) {
  const ref = useRef()
  const { nodes } = useGLTF(glb)
  const buffer = useFBO()
  const { viewport: vp } = useThree()
  const [scene] = useState(() => new THREE.Scene())

  useFrame((state, delta) => {
    const { gl, viewport, pointer, camera } = state
    const v = viewport.getCurrentViewport(camera, [0, 0, 15])

    // Animate lens to follow the mouse pointer
    easing.damp3(ref.current.position, [(pointer.x * v.width) / 2, (pointer.y * v.height) / 2, 15], 0.15, delta)

    // Render the main scene into the buffer (texture)
    gl.setRenderTarget(buffer)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
  })

  const {
    scale,
    ior,
    thickness,
    anisotropy,
    chromaticAberration,
    ...extraMat
  } = modeProps

  return (
    <>
      {createPortal(children, scene)}
      
      {/* This plane catches the background content */}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent />
      </mesh>
      
      {/* This is the actual glass lens model */}
      <mesh
        ref={ref}
        scale={scale ?? 0.25}
        geometry={nodes[geometryKey]?.geometry}
        {...props}
      >
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior ?? 1.15}
          thickness={thickness ?? 5}
          anisotropy={anisotropy ?? 0.01}
          chromaticAberration={chromaticAberration ?? 0.1}
          {...extraMat}
        />
      </mesh>
    </>
  )
})

// --- Lens Component (The only mode we need) ---
function Lens({ modeProps, ...p }) {
  return (
    <ModeWrapper
      glb="/assets/3d/lens.glb" // Requires this file in /public/assets/3d/
      geometryKey="Cylinder"   // This key might need to change depending on your .glb file's structure
      modeProps={modeProps}
      {...p}
    />
  )
}