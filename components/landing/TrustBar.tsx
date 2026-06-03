"use client";

import { useEffect, useRef, useState } from "react";

function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1200;
    let start: number | null = null;
    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * to));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [started, to]);

  return <span ref={ref}>{value}{suffix}</span>;
}

export function TrustBar() {
  return (
    <section className="px-6 py-8 bg-green-600">
      <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center text-white">
        <div>
          <p className="text-2xl md:text-4xl font-black"><AnimatedCounter to={30} />s</p>
          <p className="text-green-200 text-xs md:text-sm mt-1">pra começar</p>
        </div>
        <div>
          <p className="text-2xl md:text-4xl font-black"><AnimatedCounter to={1} /> toque</p>
          <p className="text-green-200 text-xs md:text-sm mt-1">pra marcar</p>
        </div>
        <div>
          <p className="text-lg sm:text-xl md:text-3xl font-black leading-tight">R$&nbsp;<AnimatedCounter to={4} />,99<span className="text-sm sm:text-base font-bold">/mês</span></p>
          <p className="text-green-200 text-xs md:text-sm mt-1">no plano anual</p>
        </div>
      </div>
    </section>
  );
}
