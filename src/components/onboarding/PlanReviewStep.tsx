"use client"

import { motion } from "framer-motion"

interface PlanReviewStepProps {
  plan: any;
}

export default function PlanReviewStep({ plan }: PlanReviewStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
        >
            <h2 className="text-2xl font-bold text-center">Your Personalized Plan</h2>
            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold">{plan.goal.title}</h3>
                <p className="text-sm text-gray-600">{plan.goal.description}</p>
            </div>
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">Contextual Answers:</h4>
                <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
                    {JSON.stringify(plan.context, null, 2)}
                </pre>
            </div>
            <p className="text-center text-sm text-gray-600">
                (This is where the AI-generated tasks and tips will be displayed for review)
            </p>
        </motion.div>
    </div>
  );
}
