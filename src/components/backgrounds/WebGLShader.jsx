import { useEffect, useRef } from "react";

export default function WebGLShader({ primaryColor = "#7C3AED", secondaryColor = "#0A2540" }) {
  const canvasRef = useRef(null);

  // Helper to convert hex to RGB normalized (0.0 to 1.0)
  const getNormalizedColor = (hex) => {
    const defaultColor = [0.48, 0.24, 0.98]; // Purple default
    if (!hex || typeof hex !== "string") return defaultColor;
    const match = hex.replace(/^#/, "").match(/.{2}/g);
    if (!match) return defaultColor;
    return match.map((x) => parseInt(x, 16) / 255.0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported, falling back to 2D context");
      return;
    }

    // Vertex shader source
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        vUv.y = 1.0 - vUv.y; // Flip Y
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader source: Renders sophisticated intelligence mesh grid
    const fsSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uColor1;
      uniform vec3 uColor2;

      // Simple hash function
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      // Jitter grid cell point
      vec2 getPoint(vec2 id, float time) {
        float h = hash(id);
        float speed = 0.5 + h * 0.5;
        float angle = h * 6.283 + time * speed * 0.8;
        return id + 0.5 + vec2(cos(angle), sin(angle)) * 0.28;
      }

      // Compute line segment distance
      float lineSegDist(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0);
        return length(pa - ba*h);
      }

      void main() {
        vec2 p = gl_FragCoord.xy / uResolution.xy;
        // Aspect ratio correction
        float aspect = uResolution.x / uResolution.y;
        vec2 uv = (p - 0.5) * vec2(aspect, 1.0) * 12.0;

        // Interaction coordinates
        vec2 mouseUv = (uMouse - 0.5) * vec2(aspect, 1.0) * 12.0;

        float time = uTime * 0.25;
        vec2 gridId = floor(uv);
        
        float finalDist = 1.0;
        float connections = 0.0;
        
        // Loop through 3x3 neighboring cells in the grid to draw constellation
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 id = gridId + offset;
            vec2 nodePos = getPoint(id, time);

            // Attract/Repel by mouse position (representing human intelligence)
            float dMouse = distance(nodePos, mouseUv);
            if (dMouse < 3.0) {
              nodePos += normalize(nodePos - mouseUv) * (3.0 - dMouse) * 0.15;
            }

            // Draw line to other grid neighbors
            for (int ny = -1; ny <= 1; ny++) {
              for (int nx = -1; nx <= 1; nx++) {
                if (nx == 0 && ny == 0) continue;
                vec2 nOffset = vec2(float(nx), float(ny));
                vec2 neighborId = id + nOffset;
                vec2 neighborPos = getPoint(neighborId, time);
                
                // Add mouse repulsion to neighbor
                float dMouseN = distance(neighborPos, mouseUv);
                if (dMouseN < 3.0) {
                  neighborPos += normalize(neighborPos - mouseUv) * (3.0 - dMouseN) * 0.15;
                }

                // Line connection distance
                float lDist = lineSegDist(uv, nodePos, neighborPos);
                float lineLen = distance(nodePos, neighborPos);
                
                // Only connect if within range (creating constellation synapses)
                if (lineLen < 2.0) {
                  float lineStrength = smoothstep(0.008, 0.0, lDist) * (1.0 - lineLen / 2.0);
                  connections += lineStrength * 0.45;
                }
              }
            }
            
            float dist = length(uv - nodePos);
            finalDist = min(finalDist, dist);
          }
        }
        
        // Node cores (synapses)
        float nodes = smoothstep(0.12, 0.0, finalDist) * 0.85;
        float nodeGlow = smoothstep(0.52, 0.0, finalDist) * 0.5;

        // Background soft ambient color tint
        float bgGlow = 1.0 - length(p - vec2(0.5, 0.5)) * 0.65;
        bgGlow = max(0.0, bgGlow) * 0.06;

        // Rotated complementary color for extra color depth
        vec3 uColor3 = vec3(uColor1.z, uColor1.x, uColor1.y);

        // Multicolored flow mix over screen space and time
        vec3 baseColor = mix(uColor1, uColor2, vUv.x + 0.3 * sin(uTime * 0.5 + vUv.y * 3.0));
        baseColor = mix(baseColor, uColor3, 0.35 * cos(uTime * 0.3 - vUv.x * 1.5));

        // Boost vibrancy and add rich colorful ambient lights
        baseColor = baseColor * 1.4 + vec3(0.02, 0.05, 0.12) * (1.0 - length(vUv - 0.5));

        // bgGlow now contributes to color so it renders as a colored tint, not transparent black
        vec3 col = baseColor * (nodes * 2.1 + nodeGlow * 1.6 + connections * 1.4 + bgGlow * 3.5);

        // Higher alpha for nodes so they read clearly on light backgrounds
        float alpha = nodes * 1.0 + connections * 0.65 + nodeGlow * 0.5 + bgGlow * 2.2;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
      }
    `;

    // Helper: compile shader
    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error: ", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error: ", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Setup full-screen quad vertices
    const vertices = new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLoc = gl.getUniformLocation(program, "uTime");
    const resolutionLoc = gl.getUniformLocation(program, "uResolution");
    const mouseLoc = gl.getUniformLocation(program, "uMouse");
    const color1Loc = gl.getUniformLocation(program, "uColor1");
    const color2Loc = gl.getUniformLocation(program, "uColor2");

    // Mouse tracking with spring lag
    let mouse = { x: 0.5, y: 0.5 };
    let targetMouse = { x: 0.5, y: 0.5 };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      targetMouse.x = (e.clientX - rect.left) / rect.width;
      targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height; // Invert Y
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // Render loop
    let startTime = Date.now();
    let animationFrameId;

    const render = () => {
      const elapsed = (Date.now() - startTime) / 1000.0;
      
      // Spring physics lag
      mouse.x += (targetMouse.x - mouse.x) * 0.06;
      mouse.y += (targetMouse.y - mouse.y) * 0.06;

      // Update uniform parameters
      gl.uniform1f(timeLoc, elapsed);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(mouseLoc, mouse.x, mouse.y);
      
      const rgb1 = getNormalizedColor(primaryColor);
      const rgb2 = getNormalizedColor(secondaryColor);
      gl.uniform3f(color1Loc, rgb1[0], rgb1[1], rgb1[2]);
      gl.uniform3f(color2Loc, rgb2[0], rgb2[1], rgb2[2]);

      // Clear and draw
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [primaryColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.95,
        backgroundColor: "white",
      }}
    />
  );
}
