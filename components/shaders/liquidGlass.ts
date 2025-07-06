// File: src/components/shaders/liquidGlass.ts
// อธิบาย: ไฟล์นี้เก็บโค้ด GLSL สำหรับ Vertex และ Fragment Shader
// ซึ่งเป็นหัวใจของเอฟเฟกต์แอนิเมชัน การแยกออกมาทำให้ไฟล์คอมโพเนนต์หลักสะอาดขึ้น

export const vertexShader = `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  // การตั้งค่าพื้นฐาน
  precision highp float;
  
  // ตัวแปรที่รับมาจาก React component
  uniform vec2 u_mouse;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_intensity;

  // ตัวแปรที่ส่งมาจาก Vertex Shader
  varying vec2 v_uv;

  // ฟังก์ชันสร้าง Noise แบบสุ่ม
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // ฟังก์ชันสร้าง Noise ที่มีความต่อเนื่อง (Simplex Noise)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // ฟังก์ชันหลักที่สร้างเอฟเฟกต์
  void main() {
    vec2 uv = (v_uv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;

    float noise = snoise(vec3(uv * 1.5, u_time * 0.2));
    
    vec2 mouse_uv = (u_mouse - 0.5) * 2.0;
    mouse_uv.x *= u_resolution.x / u_resolution.y;
    float mouse_dist = length(uv - mouse_uv);
    float mouse_effect = smoothstep(0.3, 0.0, mouse_dist);
    
    noise += mouse_effect * u_intensity * 0.5;

    float waves = snoise(vec3(uv * 3.0 + noise, u_time * 0.3));
    
    float combined = noise * 0.4 + waves * 0.6;

    vec3 col1 = vec3(0.0, 0.1, 0.3);
    vec3 col2 = vec3(0.5, 0.1, 0.4);
    vec3 col3 = vec3(1.0, 0.5, 0.2);
    
    vec3 final_color = mix(col1, col2, smoothstep(0.0, 0.5, combined));
    final_color = mix(final_color, col3, smoothstep(0.4, 0.8, combined));

    float specular = smoothstep(0.6, 0.7, abs(waves - noise));
    final_color += specular * 0.4;
    final_color -= mouse_dist * 0.2;

    gl_FragColor = vec4(final_color, 1.0);
  }
`;
