import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useLoadingStore } from '@/lib/stores/loading-store'
import { AnimatePresence, motion } from 'framer-motion'

export function GlobalLoader() {
  const { isLoading } = useLoadingStore()
  
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
            key="global-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-md"
        >
            <LoadingSpinner size="lg" text="Loading" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
