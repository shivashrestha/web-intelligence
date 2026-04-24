import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    id: 1,
    title: "Upload Your File",
    description: "Drag and drop your files securely into the platform.",
  },
  {
    id: 2,
    title: "Analyze Data",
    description: "We process and extract insights automatically.",
  },
  {
    id: 3,
    title: "Get Results",
    description: "Visual dashboards and reports ready instantly.",
  },
];

export default function FeatureGuide() {
  const [active, setActive] = useState(steps[0]);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActive((prev) => {
        const currentIndex = steps.findIndex((s) => s.id === prev.id);
        return steps[(currentIndex + 1) % steps.length];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [autoPlay]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-10">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-10 items-center">

        {/* Left - Steps */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold">How it works</h1>
          <p className="text-gray-500">
            Interactive walkthrough of our platform features.
          </p>

          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.id}
                onMouseEnter={() => {
                  setActive(step);
                  setAutoPlay(false);
                }}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  active.id === step.id
                    ? "bg-white shadow-lg border-blue-500"
                    : "bg-transparent border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Animated Preview */}
        <div className="relative h-[400px] bg-white rounded-3xl shadow-xl p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full flex flex-col justify-center items-center text-center"
            >
              {/* Fake UI Animation */}
              {active.id === 1 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-64 h-40 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center"
                >
                  <span className="text-gray-400">Drop files here</span>
                </motion.div>
              )}

              {active.id === 2 && (
                <motion.div className="space-y-3 w-full">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: i * 0.3 }}
                      className="h-3 bg-blue-400 rounded"
                    />
                  ))}
                </motion.div>
              )}

              {active.id === 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-100 rounded-lg shadow-inner"
                    />
                  ))}
                </motion.div>
              )}

              <h2 className="text-xl font-semibold mt-6">
                {active.title}
              </h2>
              <p className="text-gray-500 mt-2 max-w-sm">
                {active.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
