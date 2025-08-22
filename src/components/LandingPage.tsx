import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Brain, 
  Search, 
  Trophy, 
  Heart, 
  Users, 
  Zap, 
  Target, 
  Star,
  ChevronRight,
  Play,
  CheckCircle,
  Globe,
  MessageCircle,
  BarChart3,
  Sparkles,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface LandingPageProps {
  onAuthClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuthClick }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [weeklyVerse, setWeeklyVerse] = useState({
    text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
    reference: "Proverbs 3:5-6",
    theme: "Trust & Guidance"
  });

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Youth Pastor",
      text: "The AI-powered verse suggestions have transformed how I prepare for evangelism. I've memorized 47 verses in just 3 months!",
      rating: 5
    },
    {
      name: "David L.",
      role: "Seminary Student",
      text: "The syntax analysis tool is incredible. It shows exactly where I'm struggling and helps me improve my accuracy to 95%+",
      rating: 5
    },
    {
      name: "Maria R.",
      role: "Missionary",
      text: "Having verses ready to help people in crisis has been life-changing. This app prepared me for real ministry moments.",
      rating: 5
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Verse Generation",
      description: "Get personalized Bible verses tailored to your ministry needs and spiritual growth goals.",
      color: "from-purple-500 to-blue-500"
    },
    {
      icon: Target,
      title: "Advanced Syntax Analysis",
      description: "Our unique syntax learning tool compares your memorization word-by-word against the original verse, providing detailed feedback on accuracy and areas for improvement.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Search,
      title: "Comprehensive Verse Search",
      description: "Search through multiple Bible versions with intelligent filtering by topic, book, or keyword to find exactly what you need.",
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Trophy,
      title: "Achievement & Progress Tracking",
      description: "Monitor your memorization journey with detailed analytics, streaks, accuracy scores, and unlockable achievements.",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const categories = [
    {
      title: "Commission Verses",
      description: "Powerful verses for evangelism and sharing your faith",
      icon: Users,
      benefits: [
        "Build confidence in witnessing",
        "Have Scripture ready for any conversation",
        "Transform hearts through God's Word",
        "Equip yourself for the Great Commission"
      ],
      example: "For God so loved the world, that he gave his only begotten Son... - John 3:16"
    },
    {
      title: "Help People Verses",
      description: "Comforting verses to minister to those in need",
      icon: Heart,
      benefits: [
        "Provide comfort in times of crisis",
        "Offer hope to the hurting",
        "Minister with Scripture-backed wisdom",
        "Be prepared for pastoral moments"
      ],
      example: "Come unto me, all ye that labour and are heavy laden... - Matthew 11:28"
    },
    {
      title: "Coming Soon: More Categories",
      description: "We're expanding to include specialized verse collections",
      icon: Sparkles,
      benefits: [
        "Worship & Praise verses",
        "Leadership & Wisdom verses",
        "Prayer & Intercession verses",
        "Faith & Courage verses"
      ],
      example: "New categories launching based on user feedback!"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-purple-200">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Powered by Advanced AI Technology</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Memorize Scripture with
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
                AI Precision
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Transform your Bible memorization journey with AI-powered verse generation, 
              advanced syntax analysis, and comprehensive progress tracking. Join thousands 
              of believers strengthening their faith through God's Word.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <button
                onClick={onAuthClick}
                className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-200 shadow-xl flex items-center space-x-2"
              >
                <span>Start Memorizing Free</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors">
                <Play className="w-5 h-5" />
                <span className="font-medium">Watch Demo</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {[
                { number: "10,000+", label: "Verses Memorized" },
                { number: "2,500+", label: "Active Users" },
                { number: "95%", label: "Average Accuracy" },
                { number: "15+", label: "Bible Versions" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Verse Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full px-4 py-2 mb-6">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">This Week's Featured Verse</span>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 mb-6">
            <blockquote className="text-2xl md:text-3xl font-serif text-gray-800 italic mb-4 leading-relaxed">
              "{weeklyVerse.text}"
            </blockquote>
            <cite className="text-lg font-semibold text-purple-600">
              {weeklyVerse.reference}
            </cite>
            <div className="mt-4 inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
              Theme: {weeklyVerse.theme}
            </div>
          </div>
          
          <button
            onClick={onAuthClick}
            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Get Your Weekly Verse</span>
          </button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Verse Categories for Every Ministry Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're expanding beyond our core Commission and Help People verses to include 
              specialized collections that equip you for every aspect of Christian ministry.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6 leading-relaxed">{category.description}</p>
                
                <div className="space-y-3 mb-6">
                  {category.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <p className="text-sm text-gray-600 italic">{category.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Commission Verses Matter */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Why Commission Verses Transform Lives
              </h2>
              <p className="text-xl mb-8 text-purple-100 leading-relaxed">
                Memorizing commission verses isn't just about personal growth—it's about being equipped 
                to share the Gospel effectively and confidently in any situation.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    title: "Instant Gospel Readiness",
                    description: "Have powerful salvation verses ready for any witnessing opportunity"
                  },
                  {
                    title: "Overcome Fear & Doubt",
                    description: "Build confidence through Scripture-backed evangelism preparation"
                  },
                  {
                    title: "Plant Seeds Everywhere",
                    description: "Turn everyday conversations into Gospel opportunities"
                  },
                  {
                    title: "Fulfill the Great Commission",
                    description: "Actively participate in making disciples of all nations"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-purple-100">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Commission Verse Impact</h3>
              <div className="space-y-4">
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-center mb-2">73%</div>
                  <div className="text-center text-purple-100">of users report increased confidence in sharing their faith</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-center mb-2">2.3x</div>
                  <div className="text-center text-purple-100">more Gospel conversations per month</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-center mb-2">89%</div>
                  <div className="text-center text-purple-100">feel better prepared for witnessing opportunities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help People Verses Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8 border border-green-200">
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Ministry Moments Ready</h3>
              <div className="space-y-4">
                {[
                  { situation: "Someone facing loss", verse: "Psalm 23:4", impact: "Comfort in grief" },
                  { situation: "Anxiety & worry", verse: "Philippians 4:6-7", impact: "Peace that passes understanding" },
                  { situation: "Financial struggles", verse: "Matthew 6:26", impact: "Trust in God's provision" },
                  { situation: "Relationship conflicts", verse: "Matthew 18:15", impact: "Biblical reconciliation" }
                ].map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="font-semibold text-gray-800 mb-1">{item.situation}</div>
                    <div className="text-sm text-green-600 mb-1">{item.verse}</div>
                    <div className="text-sm text-gray-600">{item.impact}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Be Ready to Help in Crisis
              </h2>
              <p className="text-xl mb-8 text-gray-600 leading-relaxed">
                Help People verses prepare you to minister effectively to those facing life's 
                greatest challenges. When someone needs hope, you'll have God's Word ready.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    title: "Crisis-Ready Ministry",
                    description: "Have comforting verses memorized for unexpected pastoral moments"
                  },
                  {
                    title: "Authentic Compassion",
                    description: "Minister with Scripture-backed wisdom rather than empty words"
                  },
                  {
                    title: "Immediate Hope",
                    description: "Provide instant encouragement when people need it most"
                  },
                  {
                    title: "Lasting Impact",
                    description: "Plant seeds of faith that continue growing long after you're gone"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Advanced AI-Powered Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our cutting-edge technology provides unprecedented insights into your 
              memorization progress with features you won't find anywhere else.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Syntax Analysis Deep Dive */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">
              Revolutionary Syntax Learning Technology
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Our proprietary syntax analysis engine provides word-by-word comparison 
              with the original verse, giving you unprecedented insight into your memorization accuracy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">How It Works</h3>
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Real-Time Analysis",
                    description: "As you type, our AI compares each word against the original verse"
                  },
                  {
                    step: "2", 
                    title: "Syntax Mapping",
                    description: "Advanced algorithms identify missing words, incorrect order, and substitutions"
                  },
                  {
                    step: "3",
                    title: "Intelligent Feedback",
                    description: "Get specific suggestions for improvement based on your unique patterns"
                  },
                  {
                    step: "4",
                    title: "Progress Tracking",
                    description: "Monitor improvement over time with detailed accuracy metrics"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-lg">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                      <p className="text-blue-100">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 text-center">Syntax Analysis Results</h3>
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-200">Correct Words</span>
                    <span className="font-bold">23/25</span>
                  </div>
                  <div className="w-full bg-green-900/30 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{width: '92%'}}></div>
                  </div>
                </div>
                
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-200">Word Order</span>
                    <span className="font-bold">Perfect</span>
                  </div>
                  <div className="w-full bg-yellow-900/30 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-200">Overall Accuracy</span>
                    <span className="font-bold">94%</span>
                  </div>
                  <div className="w-full bg-blue-900/30 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white/10 rounded-lg">
                <h4 className="font-semibold mb-2">AI Suggestion:</h4>
                <p className="text-sm text-blue-100">
                  Focus on the phrase "with all thine heart" - you consistently miss "thine". 
                  Try emphasizing this word during practice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything You Need for Bible Memorization
            </h2>
            <p className="text-xl text-gray-600">
              A comprehensive suite of tools designed to accelerate your Scripture memorization journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Advanced Search",
                description: "Search through multiple Bible versions with intelligent filtering by topic, book, chapter, or keyword. Find exactly what you need instantly."
              },
              {
                icon: Trophy,
                title: "Achievement System",
                description: "Unlock badges, track streaks, monitor accuracy scores, and celebrate milestones in your memorization journey."
              },
              {
                icon: BarChart3,
                title: "Progress Analytics",
                description: "Detailed insights into your memorization patterns, improvement trends, and areas that need focus."
              },
              {
                icon: Globe,
                title: "Multiple Bible Versions",
                description: "Study from KJV, ASV, and more translations. Compare verses across versions for deeper understanding."
              },
              {
                icon: MessageCircle,
                title: "AI Feedback",
                description: "Get personalized suggestions and encouragement based on your unique memorization patterns and progress."
              },
              {
                icon: Star,
                title: "Favorites & Notes",
                description: "Save your favorite verses, add personal notes, and organize them by categories for easy reference."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                <feature.icon className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Transforming Lives Through Scripture
            </h2>
            <p className="text-xl text-gray-600">
              See how Bible Memory AI is helping believers worldwide grow in their faith
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-200">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-xl md:text-2xl text-gray-800 italic mb-6 leading-relaxed">
                "{testimonials[currentTestimonial].text}"
              </blockquote>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {testimonials[currentTestimonial].name.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                  <div className="text-gray-600 text-sm">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentTestimonial ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Your Bible Memorization Journey Today
          </h2>
          <p className="text-xl mb-8 text-purple-100 leading-relaxed">
            Join thousands of believers who are strengthening their faith, preparing for ministry, 
            and hiding God's Word in their hearts with the power of AI assistance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <button
              onClick={onAuthClick}
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-xl"
            >
              Get Started Free - No Credit Card Required
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { icon: CheckCircle, text: "Free forever plan" },
              { icon: Zap, text: "Instant setup" },
              { icon: Heart, text: "Join 2,500+ believers" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-center space-x-2">
                <item.icon className="w-5 h-5 text-green-300" />
                <span className="text-purple-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;