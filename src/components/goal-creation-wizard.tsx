"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Clock, Camera, Sparkles } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGoal, suggestTasks } from "@/lib/api/goals";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { GoalSuggestionResponse } from "@/schemas/goal";

import { useFieldArray } from "react-hook-form";

interface WizardStep {
  id: string
  title: string
  description: string
}

const taskSchema = z.object({
  name: z.string().min(1, "Task name cannot be empty."),
  description: z.string().optional(),
  repeat_frequency: z.string().optional(),
});

const formSchema = z.object({
  goalName: z.string().min(1, "Goal name is required."),
  motivation: z.string().min(1, "Motivation is required."),
  availability: z.array(z.string()).min(1, "Please select at least one availability option."),
  timeCommitment: z.string().min(1, "Please select a time commitment."),
  customTime: z.string().optional(),
  accountabilityType: z.enum(["visual_proof", "time_bound_action"]),
  timeWindow: z.string().optional(),
  tasks: z.array(taskSchema).optional(),
});


export default function GoalCreationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goalName: "",
      motivation: "",
      availability: [],
      timeCommitment: "",
      customTime: "",
      accountabilityType: "visual_proof",
      timeWindow: "",
      tasks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({
        title: "Goal Created!",
        description: "Your new goal has been saved successfully.",
      });
      router.push("/goals");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not create the goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [suggestions, setSuggestions] = useState<GoalSuggestionResponse | null>(null);

  const suggestTasksMutation = useMutation({
    mutationFn: suggestTasks,
    onSuccess: (data) => {
      setSuggestions(data);

    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not generate suggestions: ${error.message}`,
        variant: "destructive",
      });
    },
  });



  const steps: WizardStep[] = [
    { id: "goal", title: "Your Goal", description: "What do you want to achieve?" },
    { id: "motivation", title: "Your Why", description: "What drives you?" },
    { id: "availability", title: "Your Schedule", description: "When can you work on this?" },
    { id: "time", title: "Time Investment", description: "How much time can you dedicate?" },
    { id: "accountability", title: "Accountability", description: "How will you track completion?" },
    { id: "review", title: "Review", description: "Your personalized plan" },
  ]

  const availabilityOptions = [
    "Mornings (6-9 AM)",
    "Lunchtime (12-2 PM)",
    "Evenings (6-9 PM)",
    "Weekends only",
    "I'm flexible",
  ]

  const timeCommitmentOptions = ["15-30 mins daily", "1 hour weekly", "Suggest optimal based on my input"]

  const stepFields: (keyof z.infer<typeof formSchema>)[][] = [
    ["goalName"],
    ["motivation"],
    ["availability"],
    ["timeCommitment", "customTime"],
    ["accountabilityType", "timeWindow"],
  ];

  const generateSuggestion = () => {
    const values = form.getValues();
    suggestTasksMutation.mutate({
      goal_type: "personal", // This can be dynamic in the future
      goal_name: values.goalName,
      motivation: values.motivation,
      availability: values.availability,
      time_commitment: values.timeCommitment,
      custom_time: values.customTime,
      accountability_type: values.accountabilityType,
      time_window: values.timeWindow,
    });
  };

  const handleAcceptAndEdit = () => {
    if (!suggestions) return;

    // Use form.reset to populate the entire form with new values
    form.reset({
      ...form.getValues(), // Keep the initial user input like motivation, etc.
      goalName: form.getValues("goalName"),
      tasks: suggestions.tasks.map(task => ({
        name: task.task_name,
        description: task.description,
        repeat_frequency: task.repeat_frequency,
      })),
    });

    setIsEditingPlan(true); // Switch to editing mode
  };

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep];
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      if (currentStep === 4) { // Step before review
        generateSuggestion();
      }
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (isEditingPlan) {
      setIsEditingPlan(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

    function onSubmit(values: z.infer<typeof formSchema>) {
      // Guard clause to prevent premature submission
      if (!isEditingPlan) {
        return; // Do nothing if not in the final editing phase
      }
  
      createGoalMutation.mutate({
        name: values.goalName,
        category: suggestions?.goal_type || 'General', 
        is_habit: suggestions?.goal_type === 'Habit',
        tasks: values.tasks || [], // Use the (potentially edited) tasks from the form
      });
    }




  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  return (
    <div className="min-h-screen bg-pearl-gray dark:bg-gray-900 pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-charcoal dark:text-gray-100" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">Create New Goal</h1>
            <p className="text-sm text-stone-gray dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </motion.div>

        {/* Progress Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="h-2 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary-blue rounded-full"
            />
          </div>
        </motion.div>

        {/* Step Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 mb-6"
              >
            <h2 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">{steps[currentStep].title}</h2>
            <p className="text-stone-gray dark:text-gray-300 mb-6">{steps[currentStep].description}</p>

            {/* Step Content */}
            {currentStep === 0 && (
              <FormField
                control={form.control}
                name="goalName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="e.g., Run a 5K, Meditate daily for 15 mins, Learn to code in Python"
                        {...field}
                        className="w-full p-4 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentStep === 1 && (
              <FormField
                control={form.control}
                name="motivation"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Improve my health, Boost my confidence, Learn a valuable new skill"
                        rows={4}
                        {...field}
                        className="w-full p-4 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentStep === 2 && (
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    {availabilityOptions.map((option) => (
                      <motion.label
                        key={option}
                        whileHover={{ scale: 1.01 }}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${field.value?.includes(option)
                            ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                            : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                          }`}
                      >
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value?.includes(option)}
                            onChange={(e) => {
                              const newValue = e.target.checked
                                ? [...(field.value || []), option]
                                : (field.value || []).filter((value) => value !== option);
                              field.onChange(newValue);
                            }}
                            className="sr-only"
                          />
                        </FormControl>
                        <div
                          className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${field.value?.includes(option)
                              ? "border-primary-blue bg-primary-blue"
                              : "border-cool-gray dark:border-gray-600"
                            }`}
                        >
                          {field.value?.includes(option) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-white rounded-sm"
                            />
                          )}
                        </div>
                        <span className="text-charcoal dark:text-gray-100">{option}</span>
                      </motion.label>
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="timeCommitment"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      {timeCommitmentOptions.map((option) => (
                        <motion.label
                          key={option}
                          whileHover={{ scale: 1.01 }}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${field.value === option
                              ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                              : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                            }`}
                        >
                          <FormControl>
                            <input
                              type="radio"
                              name="timeCommitment"
                              checked={field.value === option}
                              onChange={() => field.onChange(option)}
                              className="sr-only"
                            />
                          </FormControl>
                          <div
                            className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${field.value === option
                                ? "border-primary-blue"
                                : "border-cool-gray dark:border-gray-600"
                              }`}
                          >
                            {field.value === option && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-primary-blue rounded-full"
                              />
                            )}
                          </div>
                          <span className="text-charcoal dark:text-gray-100">{option}</span>
                        </motion.label>
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Custom: e.g., 45 mins 3x per week"
                          {...field}
                          className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountabilityType"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <motion.label
                        whileHover={{ scale: 1.01 }}
                        className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${field.value === "visual_proof"
                            ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                            : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                          }`}
                      >
                        <FormControl>
                          <input
                            type="radio"
                            name="accountability"
                            checked={field.value === "visual_proof"}
                            onChange={() => field.onChange("visual_proof")}
                            className="sr-only"
                          />
                        </FormControl>
                        <div
                          className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${field.value === "visual"
                              ? "border-primary-blue"
                              : "border-cool-gray dark:border-gray-600"
                            }`}
                        >
                          {field.value === "visual" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-primary-blue rounded-full"
                            />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Camera className="w-5 h-5 text-primary-blue" />
                            <span className="font-semibold text-charcoal dark:text-gray-100">Visual Proof (Recommended)</span>
                          </div>
                          <p className="text-sm text-stone-gray dark:text-gray-400">
                            Upload a picture to confirm task completion
                          </p>
                        </div>
                      </motion.label>

                      <motion.label
                        whileHover={{ scale: 1.01 }}
                        className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${field.value === "time_bound_action"
                            ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                            : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                          }`}
                      >
                        <FormControl>
                          <input
                            type="radio"
                            name="accountability"
                            checked={field.value === "time_bound_action"}
                            onChange={() => field.onChange("time_bound_action")}
                            className="sr-only"
                          />
                        </FormControl>
                        <div
                          className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${field.value === "time-bound"
                              ? "border-primary-blue"
                              : "border-cool-gray dark:border-gray-600"
                            }`}
                        >
                          {field.value === "time-bound" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-primary-blue rounded-full"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-5 h-5 text-primary-blue" />
                            <span className="font-semibold text-charcoal dark:text-gray-100">Time-Bound Action</span>
                          </div>
                          <p className="text-sm text-stone-gray dark:text-gray-400 mb-3">
                            Mark completed within a specific time window
                          </p>
                          {field.value === "time-bound" && (
                            <FormField
                              control={form.control}
                              name="timeWindow"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="e.g., 7:00 AM ± 10 mins"
                                      {...field}
                                      className="w-full p-2 border border-cool-gray dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </motion.label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 5 && (
              <AnimatePresence mode="wait">
                {isEditingPlan ? (
                  // EDITING VIEW
                  <motion.div key="editing-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Review and Finalize Your Plan</h3>
                    <FormField
                      control={form.control}
                      name="goalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <h4 className="font-semibold text-charcoal dark:text-gray-100">Tasks</h4>
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-2 bg-pearl-gray dark:bg-gray-700/50">
                          <FormField
                            control={form.control}
                            name={`tasks.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task {index + 1}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`tasks.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea {...field} rows={2} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name={`tasks.${index}.repeat_frequency`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  // REVIEW VIEW
                  <motion.div key="review-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    {!suggestions ? (
                      <div className="text-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} className="w-16 h-16 mx-auto mb-4">
                          <Sparkles className="w-16 h-16 text-primary-blue" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-2">Generating your personalized plan...</h3>
                        <p className="text-stone-gray dark:text-gray-400">Our AI is analyzing your preferences to create the perfect routine</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Here's your suggested plan for "{form.getValues("goalName")}":</h3>
                        <div className="bg-accent-light-blue dark:bg-primary-blue/10 rounded-lg p-4">
                          <h4 className="font-semibold text-charcoal dark:text-gray-100 mb-2">Suggested Tasks:</h4>
                          <ul className="space-y-2">
                            {suggestions.tasks.map((task, index) => (
                              <li key={index} className="text-sm text-stone-gray dark:text-gray-300">
                                <p className="font-bold">{task.task_name} <span className="font-normal text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">{task.repeat_frequency}</span></p>
                                <p>{task.description}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-pearl-gray dark:bg-gray-700 rounded-lg p-3">
                            <h5 className="font-semibold text-charcoal dark:text-gray-100 text-sm mb-1">Goal Type</h5>
                            <p className="text-sm text-stone-gray dark:text-gray-300 font-semibold">{suggestions.goal_type}</p>
                          </div>
                          <div className="bg-pearl-gray dark:bg-gray-700 rounded-lg p-3">
                            <h5 className="font-semibold text-charcoal dark:text-gray-100 text-sm mb-1">Success Tips</h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-stone-gray dark:text-gray-300">
                              {suggestions.success_tips.map((tip, index) => (
                                <li key={index}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
                        </motion.div>
                      </AnimatePresence>
          
                      {/* Action Buttons */}
                      <div className="flex justify-between">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleBack}
                          className="px-6 py-3 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          Back
                        </motion.button>
          
                        <div className="flex-1" />
          
                        {currentStep < steps.length - 1 ? (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext}
                            disabled={suggestTasksMutation.isPending}
                            className="px-6 py-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                          >
                            <span>{suggestTasksMutation.isPending ? "Generating..." : "Next"}</span>
                            <ArrowRight className="w-4 h-4" />
                          </motion.button>
                        ) : isEditingPlan ? (
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={createGoalMutation.isPending}
                            className="px-6 py-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {createGoalMutation.isPending ? "Saving..." : "Save Goal"}
                          </motion.button>
                        ) : (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAcceptAndEdit}
                            disabled={!suggestions}
                            className="px-6 py-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            Accept & Edit Plan
                          </motion.button>
                        )}
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            )
          }
