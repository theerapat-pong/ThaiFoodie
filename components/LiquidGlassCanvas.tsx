// File: src/components/LiquidGlassCanvas.tsx
// อธิบาย: คอมโพเนนต์นี้รับผิดชอบการตั้งค่า Three.js และ react-three-fiber ทั้งหมด
// มันจะ import shader จากไฟล์ก่อนหน้าและจัดการ logic ของแอนิเมชัน

"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders/liquidGlass';

// Helper function for linear interpolation
const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;

// คอมโพเนนต์ย่อยที่จัดการซีน 3D
const LiquidGlassScene = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothedMousePos = useRef({ x: 0.5, y: 0.5 });

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0.0 },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_intensity: { value: 0.0 },
    }),
    []
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value += delta;

      smoothedMousePos.current.x = lerp(smoothedMousePos.current.x, mousePos.current.x, 0.05);
      smoothedMousePos.current.y = lerp(smoothedMousePos.current.y, mousePos.current.y, 0.05);
      
      materialRef.current.uniforms.u_mouse.value.x = smoothedMousePos.current.x;
      materialRef.current.uniforms.u_mouse.value.y = smoothedMousePos.current.y;
      
      const intensity = Math.sqrt(
        Math.pow(mousePos.current.x - smoothedMousePos.current.x, 2) +
        Math.pow(mousePos.current.y - smoothedMousePos.current.y, 2)
      );
       materialRef.current.uniforms.u_intensity.value = lerp(materialRef.current.uniforms.u_intensity.value, intensity * 5.0, 0.1);
    }
  });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      mousePos.current = { 
        x: event.clientX / window.innerWidth, 
        y: 1.0 - event.clientY / window.innerHeight 
      };
    };

    const handleResize = () => {
      if (materialRef.current) {
          materialRef.current.uniforms.u_resolution.value.x = window.innerWidth;
          materialRef.current.uniforms.u_resolution.value.y = window.innerHeight;
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('resize', handleResize);
    // เรียกใช้ handleResize ครั้งแรกเพื่อให้ค่าถูกต้อง
    handleResize();
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        key={Date.now()} // ใช้ key เพื่อบังคับให้ re-mount เมื่อ shader เปลี่ยน
      />
    </mesh>
  );
};

// คอมโพเนนต์หลักที่ export ออกไป
export default function LiquidGlassCanvas() {
    return (
        <div className="absolute top-0 left-0 w-full h-full z-0">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <LiquidGlassScene />
            </Canvas>
        </div>
    );
}
