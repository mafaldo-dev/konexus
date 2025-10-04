import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function Branding() {
  const [showLoading, setShowLoading] = useState(true)
  const [showRest, setShowRest] = useState(false)
  const [showSlogan, setShowSlogan] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowLoading(false)
      setShowRest(true)
    }, 3000) // 3 segundos de loading
    
    const timer2 = setTimeout(() => setShowSlogan(true), 5000) // slogan depois

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="w-1/2 bg-slate-900 text-white flex flex-col items-center justify-center p-8 overflow-hidden">
      
      <div className="flex items-center">
        {/* K fixo */}
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-8xl font-bold"
        >
          K
        </motion.span>

        {/* Loading dots */}
        <AnimatePresence>
          {showLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex space-x-1 ml-2 mt-14"
            >
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0.3, y: 0 }}
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    y: [0, -5, 0]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-3 h-3 bg-blue-500 rounded-full"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resto do nome que aparece depois do loading - ORDEM CORRETA: Konexus */}
        <AnimatePresence>
          {showRest && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.4,
                ease: "easeIn"
              }}
              className="flex items-center"
            >
              {/* "one" aparece primeiro */}
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.5
                }}
                className="text-8xl font-bold"
              >
                oné
              </motion.span>
              
              {/* "x" aparece depois */}
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.6,
                  delay: 0.6
                }}
                className="text-8xl font-bold text-blue-500"
              >
                x
              </motion.span>
              
              {/* "us" aparece por último */}
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.4,
                  delay: 0.6
                }}
                className="text-8xl font-bold"
              >
                u
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.8,
                    ease: "backOut"
                  }}
                  className="text-blue-500"
                >
                  s
                </motion.span>
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SLOGAN depois */}
      <AnimatePresence>
        {showSlogan && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="text-xl font-semibold tracking-wider mt-4"
          >
            Conectando seu negócio de ponta a ponta.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}