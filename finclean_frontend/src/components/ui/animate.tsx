'use client';

import { motion } from 'framer-motion';

interface Props {
  text: string;
  className?: string;
}

export default function AnimatedText({ text, className }: Props) {
  const letters = text.split('');

  return (
    <h1 className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.03,
            duration: 0.4,
          }}
        >
          {letter}
        </motion.span>
      ))}
    </h1>
  );
}