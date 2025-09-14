"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import {
  ArrowRight,
  Users,
  Globe,
  Heart,
  CheckCircle,
  Star,
  Mail,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Sparkles,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [partnerEmail, setPartnerEmail] = useState("")
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleGetStarted = () => {
    setShowInviteForm(true)
  }

  const handleSendInvite = () => {
    console.log("Sending invite to:", partnerEmail, "from:", email)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-x-hidden">
      {/* Custom Mouse Cursor Effect */}
      <div
        className="fixed w-6 h-6 bg-blue-500/20 rounded-full pointer-events-none z-50 transition-all duration-100 ease-out"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          transform: "scale(1)",
        }}
      />

      {/* Custom Navigation - No Dashboard Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-200/50 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DuoTrak
              </span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              <motion.a
                href="#benefits"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Benefits
              </motion.a>
              <motion.a
                href="#how-it-works"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                How It Works
              </motion.a>
              <motion.a
                href="#success-stories"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Success Stories
              </motion.a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  Start Your Journey
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Focus on Life Transformation */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-6 py-3 text-sm font-medium border-0 shadow-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Transform Your Life Through Accountability
                </Badge>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Finally Achieve Your{" "}
                <motion.span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  Dreams
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Imagine waking up excited about your goals, staying consistent without willpower battles, and
                celebrating real progress every single day. DuoTrak makes this your reality.
              </motion.p>
            </motion.div>

            {/* Interactive CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              {!showInviteForm ? (
                <motion.div className="flex flex-col sm:flex-row gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleGetStarted}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <Target className="mr-2 w-5 h-5" />
                      Start Achieving Today
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 border-gray-300 hover:border-blue-500 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 bg-transparent"
                    >
                      <Play className="mr-2 w-5 h-5" />
                      Watch Demo
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="w-full max-w-md p-6 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold mb-2">Ready to Transform Your Life?</h3>
                        <p className="text-gray-600 text-sm">Start your journey with someone who believes in you</p>
                      </div>
                      <div className="space-y-3">
                        <Input
                          type="email"
                          placeholder="Your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border-2 focus:border-blue-500 rounded-lg"
                        />
                        <Input
                          type="email"
                          placeholder="Invite someone special (friend, family, colleague)"
                          value={partnerEmail}
                          onChange={(e) => setPartnerEmail(e.target.value)}
                          className="w-full border-2 focus:border-purple-500 rounded-lg"
                        />
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={handleSendInvite}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3"
                            disabled={!email || !partnerEmail}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Begin Your Transformation Together
                          </Button>
                        </motion.div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        💡 DuoTrak works best when you have someone to share the journey with
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>

            {/* Life Transformation Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="relative max-w-5xl mx-auto"
            >
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -10, scale: 1.02 }} transition={{ duration: 0.3 }}>
                  <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">😔</span>
                      </div>
                      <h3 className="font-semibold text-red-800 mb-2">Your Life Before</h3>
                      <p className="text-red-600 text-sm">
                        Endless cycles of starting and stopping, guilt about unfinished goals, feeling stuck and
                        unmotivated
                      </p>
                    </div>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -10, scale: 1.02 }} transition={{ duration: 0.3 }} className="relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-3 py-1 text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      The Magic Happens
                    </Badge>
                  </div>
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-lg">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Users className="text-white w-8 h-8" />
                      </div>
                      <h3 className="font-semibold text-blue-800 mb-2">With DuoTrak</h3>
                      <p className="text-blue-600 text-sm">
                        Shared accountability, mutual encouragement, and the power of two minds working toward success
                      </p>
                    </div>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -10, scale: 1.02 }} transition={{ duration: 0.3 }}>
                  <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Award className="text-white w-8 h-8" />
                      </div>
                      <h3 className="font-semibold text-green-800 mb-2">Your New Reality</h3>
                      <p className="text-green-600 text-sm">
                        Consistent progress, celebrated victories, stronger relationships, and dreams becoming reality
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Life Benefits Section */}
      <section id="benefits" className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Imagine Your Life With{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                DuoTrak
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Picture waking up every day knowing someone believes in your success as much as you do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Consistent Daily Progress",
                description:
                  "No more all-or-nothing cycles. Make steady progress every single day with someone cheering you on.",
                benefit: "Feel accomplished and motivated daily",
                color: "blue",
              },
              {
                icon: Heart,
                title: "Deeper Relationships",
                description: "Strengthen bonds with friends, family, or colleagues as you support each other's growth.",
                benefit: "Build meaningful connections while achieving goals",
                color: "pink",
              },
              {
                icon: Zap,
                title: "Effortless Motivation",
                description:
                  "Stop relying on willpower alone. Your partner's progress naturally inspires your own action.",
                benefit: "Stay motivated without forcing it",
                color: "yellow",
              },
              {
                icon: Calendar,
                title: "Guilt-Free Flexibility",
                description: "Life happens, and that's okay. Adjust goals together without shame or self-criticism.",
                benefit: "Adapt to life while staying on track",
                color: "green",
              },
              {
                icon: Award,
                title: "Shared Celebrations",
                description:
                  "Every victory is twice as sweet when someone who understands the journey celebrates with you.",
                benefit: "Experience joy and recognition for your efforts",
                color: "purple",
              },
              {
                icon: Globe,
                title: "Global Connection",
                description: "Stay connected with your accountability partner anywhere in the world, any time zone.",
                benefit: "Never feel alone in your journey",
                color: "indigo",
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                  <CardContent>
                    <div
                      className={`w-16 h-16 bg-${benefit.color}-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <benefit.icon className={`w-8 h-8 text-${benefit.color}-600`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">{benefit.title}</h3>
                    <p className="text-gray-600 mb-4 text-center">{benefit.description}</p>
                    <div className={`text-center p-3 bg-${benefit.color}-50 rounded-lg`}>
                      <p className={`text-sm font-medium text-${benefit.color}-700`}>✨ {benefit.benefit}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How Partnership Works (Subtle Introduction) */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">The Power of Two Minds</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              DuoTrak is built on a simple truth: we achieve more together than alone. Here's how it transforms your
              journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Journey Companion</h3>
                    <p className="text-gray-600">
                      Invite someone you trust - a friend, family member, or colleague who shares your desire for
                      growth. This person becomes your accountability partner.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-purple-600">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Set Goals Together</h3>
                    <p className="text-gray-600">
                      Create meaningful goals that matter to both of you. Whether they're the same goals or different
                      ones, you'll support each other every step of the way.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-green-600">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Stay Connected Daily</h3>
                    <p className="text-gray-600">
                      Share progress, celebrate wins, and encourage each other through challenges. Your partner's
                      success motivates you, and your progress inspires them.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-orange-600">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Achieve More Together</h3>
                    <p className="text-gray-600">
                      Watch as goals that seemed impossible alone become achievable with your partner's support.
                      Celebrate victories that are twice as meaningful.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Why Partnership Works</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">65% higher success rate with accountability</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Stronger relationships through shared goals</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Natural motivation without forcing it</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700">Shared celebrations make victories sweeter</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 text-center">
                    <strong>💡 DuoTrak Insight:</strong> Research shows that having just one accountability partner
                    increases your chance of achieving goals by 65%. That's why DuoTrak is designed around partnership
                    from day one.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success-stories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Real People, Real Transformations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how DuoTrak partnerships have changed lives across the globe
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                quote:
                  "Sarah and I went from struggling with fitness goals alone to running our first marathon together. Having her in my corner made all the difference. We didn't just achieve our goals - we strengthened our friendship.",
                author: "Emma & Sarah",
                relationship: "Best Friends",
                achievement: "Completed first marathon together",
                rating: 5,
                image: "👭",
              },
              {
                quote:
                  "My son and I used DuoTrak to learn Spanish together. What started as a goal became our special bonding time. Now we're planning a trip to Spain to practice what we've learned!",
                author: "Michael & David",
                relationship: "Father & Son",
                achievement: "Became conversational in Spanish",
                rating: 5,
                image: "👨‍👦",
              },
              {
                quote:
                  "Working from home made me feel isolated. My colleague and I started using DuoTrak for our professional development goals. We both got promoted this year and our working relationship is stronger than ever.",
                author: "Lisa & Amanda",
                relationship: "Colleagues",
                achievement: "Both received promotions",
                rating: 5,
                image: "👩‍💼",
              },
            ].map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="p-6 h-full shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">{story.image}</div>
                      <div className="flex justify-center mb-2">
                        {[...Array(story.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <blockquote className="text-gray-700 mb-4 italic text-center">"{story.quote}"</blockquote>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{story.author}</div>
                      <div className="text-sm text-gray-500 mb-2">{story.relationship}</div>
                      <Badge className="bg-green-100 text-green-800 text-xs">🏆 {story.achievement}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-600 mb-8">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-medium">4.9/5 Average Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-medium">25,000+ Active Partnerships</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-green-500" />
                <span className="font-medium">Partners in 47+ Countries</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 left-0 w-full h-full opacity-10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6"
              animate={{
                textShadow: [
                  "0 0 20px rgba(255,255,255,0.5)",
                  "0 0 40px rgba(255,255,255,0.8)",
                  "0 0 20px rgba(255,255,255,0.5)",
                ],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              Your Dreams Are Waiting. Your Partner Is Too.
            </motion.h2>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              Stop letting another day slip by wondering "what if." The person who could change everything for you is
              just one invitation away. Join thousands who've discovered that the secret to lasting change isn't
              willpower—it's having someone who believes in you as much as you believe in them.
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Heart className="mr-2 w-5 h-5" />
                Start Your Transformation Together
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm opacity-80">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Free 14-day trial for both partners</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Simple email invitation process</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Works anywhere in the world</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">DuoTrak</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Transform your life through the power of partnership. Because every great achievement starts with
                someone who believes in you.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-xs">📧</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-xs">📱</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-xs">🌐</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#benefits" className="hover:text-white transition-colors">
                    Benefits
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#success-stories" className="hover:text-white transition-colors">
                    Success Stories
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DuoTrak. All rights reserved. Transform your life through partnership.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
