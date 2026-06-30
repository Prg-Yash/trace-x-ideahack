import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { formatINR } from "@/data/replayData";

type AnimatedValueProps = {
  value: number;
  className?: string;
  style?: React.CSSProperties;
  format?: (v: number) => string;
};

export function AnimatedValue({
  value,
  className,
  style,
  format = formatINR,
}: AnimatedValueProps) {
  const spring = useSpring(value, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, v => format(Math.round(v)));
  const [text, setText] = useState(format(value));

  useEffect(() => {
    spring.set(value);
    const unsub = display.on("change", v => setText(v));
    return unsub;
  }, [value, spring, display, format]);

  return (
    <motion.span className={className} style={style}>
      {text}
    </motion.span>
  );
}

export function AnimatedScore({
  value,
  className,
  style,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <AnimatedValue
      value={value}
      className={className}
      style={style}
      format={v => String(v)}
    />
  );
}
