/**
 * Lightweight, zero-dependency celebratory canvas confetti cannon.
 * Renders multi-colored particles, stars, and ribbons that burst across the viewport.
 */

export function fireCelebratoryConfetti(durationMs = 3500) {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };
  resize();

  const colors = [
    "#FF1A75", // Prismatic Pink
    "#D946EF", // Vibrant Fuchsia
    "#8B5CF6", // Royal Purple
    "#3B82F6", // Bright Blue
    "#06B6D4", // Cyan
    "#10B981", // Emerald
    "#F59E0B", // Gold / Amber
    "#F43F5E", // Rose
  ];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    shape: "circle" | "rect" | "star";
    opacity: number;
    wobble: number;
  }

  const particles: Particle[] = [];
  const particleCount = Math.min(100, Math.floor(window.innerWidth / 4));

  // Spawn bursts from left and right bottom / center
  for (let i = 0; i < particleCount; i++) {
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? window.innerWidth * 0.2 : window.innerWidth * 0.8;
    const startY = window.innerHeight * 0.6;
    const angle = fromLeft
      ? -Math.PI / 3 + (Math.random() - 0.5) * 0.6
      : -2 * Math.PI / 3 + (Math.random() - 0.5) * 0.6;
    const speed = 12 + Math.random() * 16;

    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.3 ? "rect" : Math.random() > 0.5 ? "circle" : "star",
      opacity: 1,
      wobble: Math.random() * 10,
    });
  }

  const startTime = Date.now();
  let animId: number;

  const render = () => {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / durationMs;

    if (progress >= 1) {
      cancelAnimationFrame(animId);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38; // gravity
      p.vx *= 0.985; // drag
      p.rotation += p.rotationSpeed;
      p.wobble += 0.1;

      // Fade out towards the end
      if (progress > 0.6) {
        p.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            Math.cos(((18 + i * 72) * Math.PI) / 180) * (p.size / 2),
            -Math.sin(((18 + i * 72) * Math.PI) / 180) * (p.size / 2)
          );
          ctx.lineTo(
            Math.cos(((54 + i * 72) * Math.PI) / 180) * (p.size / 4),
            -Math.sin(((54 + i * 72) * Math.PI) / 180) * (p.size / 4)
          );
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);
}
