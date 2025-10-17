import { motion, AnimatePresence } from 'framer-motion';

type MonkeyDisplayProps = {
  imagePath: string;
  label?: string;
};

export default function MonkeyDisplay({ imagePath, label }: MonkeyDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="text-lg font-semibold mb-3">{label ?? 'Detecting…'}</div>
      <div className="relative w-full max-w-md aspect-square">
        <AnimatePresence mode="wait">
          <motion.img
            key={imagePath}
            src={imagePath}
            className="absolute inset-0 w-full h-full object-contain rounded-lg shadow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            alt={label ?? 'monkey'}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}


