import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, Code, Star, Award, Zap, Trophy, Target, Users, TrendingUp, Brain, Rocket, Shield, Crown, Sparkles, ChevronRight, Quote, CheckCircle, Globe, Cpu, Database, GitBranch, Lock, Layers } from 'lucide-react';
import { useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ModernBackground from '../components/ModernBackground';
import ScrollReveal from '../components/ScrollReveal';
import InteractiveCard from '../components/InteractiveCard';
import ParallaxSection from '../components/ParallaxSection';
import FloatingElements from '../components/FloatingElements';
import {
  GoogleLogo,
  MicrosoftLogo,
  AmazonLogo,
  MetaLogo,
  AppleLogo,
  NetflixLogo,
  TeslaLogo,
  SpotifyLogo,
  UberLogo,
  AirbnbLogo,
  TwitterLogo,
  LinkedInLogo
} from '../components/CompanyLogos';

function Homepage() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const displayUserName = user?.firstName || 'Coder';

  const stats = [
    { label: 'Active Users', value: '75K+', icon: Users, color: 'from-blue-500 to-cyan-500', glow: 'rgba(59, 130, 246, 0.5)' },
    { label: 'Problems Solved', value: '5M+', icon: Target, color: 'from-purple-500 to-pink-500', glow: 'rgba(147, 51, 234, 0.5)' },
    { label: 'Global Contests', value: '1.2K+', icon: Trophy, color: 'from-orange-500 to-red-500', glow: 'rgba(249, 115, 22, 0.5)' },
    { label: 'Success Rate', value: '99.2%', icon: TrendingUp, color: 'from-green-500 to-emerald-500', glow: 'rgba(34, 197, 94, 0.5)' }
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Neural network algorithms analyze your coding patterns to provide personalized problem recommendations and difficulty progression.',
      color: 'from-violet-500 to-purple-600',
      glow: 'rgba(139, 92, 246, 0.5)'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption with SOC 2 compliance, ensuring your code and personal data remain completely secure.',
      color: 'from-blue-500 to-indigo-600',
      glow: 'rgba(59, 130, 246, 0.5)'
    },
    {
      icon: Rocket,
      title: 'Performance Analytics',
      description: 'Advanced metrics tracking including time complexity analysis, memory optimization, and algorithmic efficiency scoring.',
      color: 'from-emerald-500 to-teal-600',
      glow: 'rgba(16, 185, 129, 0.5)'
    },
    {
      icon: Crown,
      title: 'Elite Network',
      description: 'Exclusive community of top 1% programmers from FAANG companies, unicorn startups, and competitive programming champions.',
      color: 'from-amber-500 to-orange-600',
      glow: 'rgba(245, 158, 11, 0.5)'
    },
    {
      icon: Globe,
      title: 'Global Competitions',
      description: 'Real-time worldwide contests with live rankings, instant feedback, and prizes worth over $100K annually.',
      color: 'from-rose-500 to-pink-600',
      glow: 'rgba(244, 63, 94, 0.5)'
    },
    {
      icon: Database,
      title: 'Advanced Infrastructure',
      description: 'Distributed cloud computing with sub-100ms response times, handling millions of code submissions daily.',
      color: 'from-slate-500 to-gray-600',
      glow: 'rgba(100, 116, 139, 0.5)'
    }
  ];

  const companies = [
    { name: 'Google', logo: GoogleLogo, color: 'from-blue-500 to-green-500', hoverColor: 'hover:text-blue-400', employees: '2.1K+' },
    { name: 'Microsoft', logo: MicrosoftLogo, color: 'from-blue-600 to-cyan-500', hoverColor: 'hover:text-blue-400', employees: '1.8K+' },
    { name: 'Amazon', logo: AmazonLogo, color: 'from-orange-500 to-yellow-500', hoverColor: 'hover:text-orange-400', employees: '3.2K+' },
    { name: 'Meta', logo: MetaLogo, color: 'from-blue-500 to-purple-600', hoverColor: 'hover:text-blue-400', employees: '1.5K+' },
    { name: 'Apple', logo: AppleLogo, color: 'from-gray-400 to-gray-600', hoverColor: 'hover:text-gray-300', employees: '1.9K+' },
    { name: 'Netflix', logo: NetflixLogo, color: 'from-red-600 to-red-700', hoverColor: 'hover:text-red-400', employees: '890+' },
    { name: 'Tesla', logo: TeslaLogo, color: 'from-red-500 to-pink-500', hoverColor: 'hover:text-red-400', employees: '750+' },
    { name: 'Spotify', logo: SpotifyLogo, color: 'from-green-500 to-emerald-600', hoverColor: 'hover:text-green-400', employees: '620+' },
    { name: 'Uber', logo: UberLogo, color: 'from-black to-gray-800', hoverColor: 'hover:text-gray-300', employees: '1.1K+' },
    { name: 'Airbnb', logo: AirbnbLogo, color: 'from-pink-500 to-rose-500', hoverColor: 'hover:text-pink-400', employees: '540+' },
    { name: 'Twitter', logo: TwitterLogo, color: 'from-blue-400 to-blue-600', hoverColor: 'hover:text-blue-400', employees: '680+' },
    { name: 'LinkedIn', logo: LinkedInLogo, color: 'from-blue-700 to-blue-800', hoverColor: 'hover:text-blue-400', employees: '920+' }
  ];

  const testimonials = [
    {
      text: "CodeWinz's AI recommendations completely revolutionized my approach to problem-solving. Within 4 months, I went from struggling with medium problems to consistently solving hard-level algorithmic challenges. The platform's adaptive learning system identified my weak areas and created a personalized roadmap that led me to my dream role at Google.",
      author: 'Sarah Chen',
      role: 'Senior Software Engineer at Google',
      avatar: 'SC',
      rating: 5,
      achievement: 'Solved 2,847 problems'
    },
    {
      text: "The real-time competitive programming environment here is unmatched. I've participated in over 200 contests and the instant feedback system helped me improve my speed from 90 minutes per problem to under 15 minutes. The community discussions after each contest provide insights I couldn't get anywhere else.",
      author: 'Marcus Rodriguez',
      role: 'Principal Engineer at Microsoft',
      avatar: 'MR',
      rating: 5,
      achievement: 'Global Rank #127'
    },
    {
      text: "As someone who struggled with technical interviews, CodeWinz transformed my confidence completely. The platform's interview simulation mode with real FAANG questions and AI-powered feedback helped me understand not just the 'what' but the 'why' behind optimal solutions. Landed offers from 3 top-tier companies!",
      author: 'Priya Sharma',
      role: 'Tech Lead at Amazon',
      avatar: 'PS',
      rating: 5,
      achievement: '98% interview success rate'
    },
    {
      text: "The collaborative features are incredible. Being able to code alongside developers from top companies in real-time, share solutions, and learn from their approaches has accelerated my growth exponentially. The peer review system is like having personal mentors available 24/7.",
      author: 'David Kim',
      role: 'Staff Engineer at Meta',
      avatar: 'DK',
      rating: 5,
      achievement: 'Mentored 450+ developers'
    }
  ];

  const achievements = [
    { icon: Trophy, text: 'Best Coding Platform 2024', subtext: 'TechCrunch Awards' },
    { icon: Users, text: '75K+ Elite Developers', subtext: 'Active Community' },
    { icon: Star, text: '4.97/5 Rating', subtext: '10K+ Reviews' },
    { icon: CheckCircle, text: '99.2% Success Rate', subtext: 'Job Placements' }
  ];

  const techStack = [
    { icon: Cpu, name: 'Advanced Algorithms', description: 'Machine Learning powered code analysis' },
    { icon: Database, name: 'Distributed Systems', description: 'Real-time global infrastructure' },
    { icon: Lock, name: 'Enterprise Security', description: 'SOC 2 compliant architecture' },
    { icon: GitBranch, name: 'Version Control', description: 'Integrated development workflow' },
    { icon: Layers, name: 'Microservices', description: 'Scalable cloud-native platform' },
    { icon: Globe, name: 'CDN Network', description: 'Sub-50ms global response times' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] font-sans text-white relative overflow-hidden">
      <ModernBackground />
      <FloatingElements />
      <Navbar />

      <div className="relative z-10 flex flex-col flex-grow">
        {/* Enhanced Hero Section */}
        <section className="relative pt-32 pb-32 px-6 min-h-screen flex items-center">
          <ParallaxSection speed={0.3} className="w-full">
            <div className="max-w-7xl mx-auto text-center">
              <ScrollReveal direction="fade" delay={200}>
                <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-full border border-blue-500/30 mb-12 backdrop-blur-lg hover:border-blue-400/50 transition-all duration-500 group cursor-pointer hover:scale-105">
                  <Sparkles className="w-6 h-6 text-blue-400 mr-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-lg font-semibold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                    Welcome to the Future of Competitive Programming
                  </span>
                  <ChevronRight className="w-5 h-5 text-blue-400 ml-4 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </ScrollReveal>
              
              <ScrollReveal direction="up" delay={400}>
                <h1 className="text-7xl md:text-9xl font-black mb-8 leading-none">
                  <span className="block bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent drop-shadow-2xl">
                    Hello,
                  </span>
                  <span
                    className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-700 cursor-default animate-pulse"
                    style={{
                      textShadow: '0 0 40px rgba(59, 130, 246, 0.5)',
                      transform: `translateY(${scrollY * -0.1}px)`
                    }}
                  >
                    {displayUserName}
                  </span>
                </h1>
              </ScrollReveal>
              
              <ScrollReveal direction="up" delay={600}>
                <p className="text-2xl md:text-3xl text-gray-300 mb-16 max-w-5xl mx-auto font-light leading-relaxed">
                  Master the art of algorithmic thinking with our{' '}
                  <span className="text-blue-400 font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    AI-powered platform
                  </span>
                  , compete in global tournaments, and join an elite community of{' '}
                  <span className="text-purple-400 font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    75,000+ developers
                  </span>{' '}
                  from Fortune 100 companies.
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={800}>
                <div className="flex flex-col lg:flex-row gap-8 justify-center items-center mb-16">
                  <InteractiveCard glowColor="rgba(59, 130, 246, 0.6)">
                    <button
                      onClick={() => navigate('/contests')}
                      className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl font-bold text-xl transition-all duration-700 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/40 overflow-hidden transform hover:rotate-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      <div className="relative flex items-center space-x-4">
                        <Zap className="w-7 h-7 group-hover:animate-pulse" />
                        <span>Start Competing Now</span>
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-3 transition-transform duration-300" />
                      </div>
                    </button>
                  </InteractiveCard>
                  
                  <InteractiveCard glowColor="rgba(147, 51, 234, 0.6)">
                    <button
                      onClick={() => navigate('/Homepage/problems')}
                      className="group px-12 py-6 border-2 border-gray-500 hover:border-white rounded-3xl font-bold text-xl transition-all duration-700 hover:bg-white/10 hover:scale-110 backdrop-blur-lg hover:shadow-2xl hover:shadow-white/20 transform hover:-rotate-1"
                    >
                      <div className="flex items-center space-x-4">
                        <Code className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Practice Problems</span>
                        <Target className="w-6 h-6 group-hover:scale-125 transition-transform duration-300" />
                      </div>
                    </button>
                  </InteractiveCard>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={1000}>
                <div className="flex flex-wrap justify-center gap-6 opacity-90">
                  {achievements.map((achievement, index) => (
                    <InteractiveCard key={index} className="group">
                      <div className="flex flex-col items-center space-y-2 px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-lg hover:bg-white/10 hover:scale-105 transition-all duration-500 cursor-default">
                        <achievement.icon className="w-6 h-6 text-yellow-400 group-hover:scale-125 transition-transform duration-300" />
                        <span className="text-sm font-bold text-white">{achievement.text}</span>
                        <span className="text-xs text-gray-400">{achievement.subtext}</span>
                      </div>
                    </InteractiveCard>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </ParallaxSection>
        </section>

        {/* Enhanced Stats Section */}
        <section className="relative py-32 px-6">
          <ParallaxSection speed={0.2}>
            <div className="max-w-7xl mx-auto">
              <ScrollReveal direction="up" delay={100}>
                <h2 className="text-6xl font-black text-center mb-20 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Platform <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Statistics</span>
                </h2>
              </ScrollReveal>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <ScrollReveal key={stat.label} direction="scale" delay={index * 100}>
                    <InteractiveCard glowColor={stat.glow} className="h-full">
                      <div className={`group relative p-10 rounded-3xl bg-gradient-to-br ${stat.color} transition-all duration-700 hover:scale-110 transform hover:-translate-y-4 cursor-pointer h-full`}>
                        <div className="absolute inset-0 bg-black/20 rounded-3xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-3xl"></div>
                        <div className="relative text-center h-full flex flex-col justify-center">
                          <stat.icon className="w-12 h-12 mx-auto mb-6 text-white group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
                          <div className="text-5xl font-black text-white mb-4 group-hover:scale-110 transition-transform duration-300">{stat.value}</div>
                          <div className="text-base font-semibold text-white/90 uppercase tracking-wider">{stat.label}</div>
                        </div>
                      </div>
                    </InteractiveCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </ParallaxSection>
        </section>

        {/* Enhanced Main Features Grid */}
        <section className="relative py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal direction="up" delay={100}>
              <div className="text-center mb-24">
                <h2 className="text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Choose Your Path to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Greatness</span>
                </h2>
                <p className="text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                  Whether you're preparing for FAANG interviews, competing in global championships, or building meaningful connections in the tech elite
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-24">
              {/* Enhanced Contests Card */}
              <ScrollReveal direction="left" delay={200}>
                <InteractiveCard glowColor="rgba(59, 130, 246, 0.6)">
                  <button
                    onClick={() => navigate('/contests')}
                    className="group relative p-12 bg-gradient-to-br from-slate-900/90 to-slate-800/50 rounded-3xl border border-blue-500/30 hover:border-blue-400/70 transition-all duration-700 hover:scale-[1.05] backdrop-blur-xl hover:shadow-2xl hover:shadow-blue-500/30 transform hover:-translate-y-4 w-full h-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-12">
                      <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    </div>
                    <div className="relative h-full flex flex-col">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 shadow-2xl group-hover:shadow-blue-500/60">
                        <CalendarDays className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-4xl font-black text-white mb-8 group-hover:text-blue-300 transition-colors">
                        Global Tournaments
                      </h3>
                      <p className="text-gray-400 text-lg leading-relaxed mb-10 flex-grow">
                        Compete against elite programmers worldwide in real-time coding battles. Climb global leaderboards, earn recognition from FAANG recruiters, and win prizes worth $100K+ annually.
                      </p>
                      <div className="flex items-center text-blue-400 font-bold text-xl group-hover:translate-x-6 transition-all duration-500">
                        <span>Join Competition</span>
                        <Zap className="w-6 h-6 ml-4 group-hover:rotate-12 transition-transform duration-300" />
                      </div>
                    </div>
                  </button>
                </InteractiveCard>
              </ScrollReveal>

              {/* Enhanced Problems Card */}
              <ScrollReveal direction="up" delay={300}>
                <InteractiveCard glowColor="rgba(147, 51, 234, 0.6)">
                  <button
                    onClick={() => navigate('/Homepage/problems')}
                    className="group relative p-12 bg-gradient-to-br from-slate-900/90 to-slate-800/50 rounded-3xl border border-purple-500/30 hover:border-purple-400/70 transition-all duration-700 hover:scale-[1.05] backdrop-blur-xl hover:shadow-2xl hover:shadow-purple-500/30 transform hover:-translate-y-4 w-full h-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-12">
                      <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
                    </div>
                    <div className="relative h-full flex flex-col">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 shadow-2xl group-hover:shadow-purple-500/60">
                        <Code className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-4xl font-black text-white mb-8 group-hover:text-purple-300 transition-colors">
                        AI-Powered Learning
                      </h3>
                      <p className="text-gray-400 text-lg leading-relaxed mb-10 flex-grow">
                        Master data structures and algorithms with AI-curated problems designed by industry legends from Google, Amazon, and Microsoft. Adaptive difficulty scaling ensures optimal growth.
                      </p>
                      <div className="flex items-center text-purple-400 font-bold text-xl group-hover:translate-x-6 transition-all duration-500">
                        <span>Start Learning</span>
                        <Target className="w-6 h-6 ml-4 group-hover:rotate-12 transition-transform duration-300" />
                      </div>
                    </div>
                  </button>
                </InteractiveCard>
              </ScrollReveal>

              {/* Enhanced Community Card */}
              <ScrollReveal direction="right" delay={400}>
                <InteractiveCard glowColor="rgba(16, 185, 129, 0.6)">
                  <button
                    onClick={() => navigate('/communitychat')}
                    className="group relative p-12 bg-gradient-to-br from-slate-900/90 to-slate-800/50 rounded-3xl border border-emerald-500/30 hover:border-emerald-400/70 transition-all duration-700 hover:scale-[1.05] backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/30 transform hover:-translate-y-4 w-full h-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-12">
                      <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                    </div>
                    <div className="relative h-full flex flex-col">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 shadow-2xl group-hover:shadow-emerald-500/60">
                        <Users className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-4xl font-black text-white mb-8 group-hover:text-emerald-300 transition-colors">
                        Elite Network
                      </h3>
                      <p className="text-gray-400 text-lg leading-relaxed mb-10 flex-grow">
                        Connect with the top 1% of programmers from FAANG companies, unicorn startups, and competitive programming champions. Real mentorship, collaboration, and career acceleration.
                      </p>
                      <div className="flex items-center text-emerald-400 font-bold text-xl group-hover:translate-x-6 transition-all duration-500">
                        <span>Join Elite Circle</span>
                        <Users className="w-6 h-6 ml-4 group-hover:rotate-12 transition-transform duration-300" />
                      </div>
                    </div>
                  </button>
                </InteractiveCard>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* New Advanced Features Section */}
        <section className="relative py-32 px-6 bg-gradient-to-r from-slate-900/30 to-slate-800/20 backdrop-blur-xl">
          <ParallaxSection speed={0.15}>
            <div className="max-w-7xl mx-auto">
              <ScrollReveal direction="up" delay={100}>
                <div className="text-center mb-24">
                  <h3 className="text-6xl md:text-7xl font-black mb-8">
                    Advanced <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Technology</span>
                  </h3>
                  <p className="text-2xl text-gray-400 max-w-4xl mx-auto">
                    Experience next-generation competitive programming with cutting-edge AI, enterprise-grade infrastructure, and revolutionary learning algorithms
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <ScrollReveal key={feature.title} direction="scale" delay={index * 100}>
                    <InteractiveCard glowColor={feature.glow} className="h-full">
                      <div className="group relative p-10 bg-gradient-to-br from-slate-900/70 to-slate-800/40 rounded-3xl border border-slate-700/60 hover:border-slate-600/80 transition-all duration-700 hover:scale-[1.03] backdrop-blur-xl hover:shadow-2xl transform hover:-translate-y-2 h-full">
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-15 rounded-3xl transition-opacity duration-700`}></div>
                        <div className="relative h-full flex flex-col">
                          <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center mb-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 shadow-2xl`}>
                            <feature.icon className="w-10 h-10 text-white" />
                          </div>
                          <h4 className="text-3xl font-black text-white mb-6 group-hover:text-blue-300 transition-colors">
                            {feature.title}
                          </h4>
                          <p className="text-gray-400 text-lg leading-relaxed flex-grow">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </InteractiveCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </ParallaxSection>
        </section>

        {/* Enhanced Testimonials Section */}
        <section className="relative py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal direction="up" delay={100}>
              <div className="text-center mb-20">
                <h3 className="text-6xl font-black mb-8">
                  What <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Champions</span> Say
                </h3>
                <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
                  Join 75,000+ developers who've transformed their careers and achieved their dream roles at top tech companies
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="scale" delay={300}>
              <InteractiveCard glowColor="rgba(59, 130, 246, 0.4)" className="relative">
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 rounded-3xl p-16 border border-slate-700/60 backdrop-blur-xl">
                  <div className="flex items-center justify-center mb-12">
                    <Quote className="w-20 h-20 text-blue-400 opacity-60" />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-3xl text-gray-300 mb-10 leading-relaxed font-light italic">
                      "{testimonials[currentTestimonial].text}"
                    </p>
                    
                    <div className="flex items-center justify-center space-x-2 mb-8">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <Star key={i} className="w-8 h-8 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-center space-x-6 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {testimonials[currentTestimonial].avatar}
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-white mb-1">{testimonials[currentTestimonial].author}</p>
                        <p className="text-gray-400 text-lg">{testimonials[currentTestimonial].role}</p>
                        <p className="text-blue-400 text-sm font-semibold">{testimonials[currentTestimonial].achievement}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-10 space-x-4">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-4 h-4 rounded-full transition-all duration-500 ${
                        index === currentTestimonial
                          ? 'bg-blue-500 scale-150 shadow-lg shadow-blue-500/50'
                          : 'bg-gray-600 hover:bg-gray-500 hover:scale-125'
                      }`}
                    />
                  ))}
                </div>
              </InteractiveCard>
            </ScrollReveal>
          </div>
        </section>

        {/* New Technology Stack Section */}
        <section className="relative py-32 px-6 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal direction="up" delay={100}>
              <div className="text-center mb-20">
                <h3 className="text-6xl font-black mb-8">
                  Built with <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Cutting-Edge</span> Tech
                </h3>
                <p className="text-2xl text-gray-400 max-w-4xl mx-auto">
                  Enterprise-grade infrastructure powering millions of code submissions with AI-driven insights and real-time global collaboration
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {techStack.map((tech, index) => (
                <ScrollReveal key={tech.name} direction="up" delay={index * 100}>
                  <InteractiveCard glowColor="rgba(34, 197, 94, 0.4)">
                    <div className="group p-8 bg-gradient-to-br from-slate-800/60 to-slate-700/30 rounded-2xl border border-slate-600/40 hover:border-green-500/50 transition-all duration-500 backdrop-blur-lg hover:scale-105 transform hover:-translate-y-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                          <tech.icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-white group-hover:text-green-300 transition-colors">
                          {tech.name}
                        </h4>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        {tech.description}
                      </p>
                    </div>
                  </InteractiveCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Companies Section */}
        <section className="relative py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal direction="up" delay={100}>
              <div className="text-center mb-20">
                <h3 className="text-6xl md:text-7xl font-black mb-8">
                  Trusted by Engineers at <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">Elite Companies</span>
                </h3>
                <p className="text-2xl text-gray-400 max-w-4xl mx-auto mb-16 leading-relaxed">
                  Join the exclusive network of top-tier developers who've successfully transitioned to leading tech giants and revolutionized their careers
                </p>
              </div>
            </ScrollReveal>

            {/* Enhanced Companies Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-20">
              {companies.map((company, index) => (
                <ScrollReveal key={company.name} direction="scale" delay={index * 50}>
                  <InteractiveCard glowColor={`rgba(${index % 2 === 0 ? '59, 130, 246' : '147, 51, 234'}, 0.4)`}>
                    <div className={`group relative p-8 bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-3xl border border-slate-600/40 hover:border-slate-500/60 transition-all duration-700 hover:scale-125 hover:-translate-y-4 cursor-pointer backdrop-blur-lg ${company.hoverColor}`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${company.color} opacity-0 group-hover:opacity-25 rounded-3xl transition-all duration-700`}></div>
                      <div className="absolute inset-0 bg-white/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative text-center">
                        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
                          <company.logo className="w-14 h-14 text-white group-hover:drop-shadow-2xl transition-all duration-700" />
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2 group-hover:font-black transition-all duration-300">
                          {company.name}
                        </h4>
                        <p className="text-gray-400 text-sm font-semibold">{company.employees} members</p>
                      </div>
                      
                      {/* Enhanced Hover Particles Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                        <div className="absolute top-3 left-3 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                        <div className="absolute top-5 right-4 w-1 h-1 bg-purple-400 rounded-full animate-ping animation-delay-200"></div>
                        <div className="absolute bottom-4 left-5 w-1 h-1 bg-green-400 rounded-full animate-ping animation-delay-400"></div>
                        <div className="absolute bottom-3 right-3 w-2 h-2 bg-yellow-400 rounded-full animate-ping animation-delay-600"></div>
                      </div>
                    </div>
                  </InteractiveCard>
                </ScrollReveal>
              ))}
            </div>

            {/* Enhanced Success Metrics */}
            <ScrollReveal direction="up" delay={200}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <InteractiveCard glowColor="rgba(59, 130, 246, 0.4)">
                  <div className="text-center group cursor-default p-8 bg-gradient-to-br from-slate-800/40 to-slate-700/20 rounded-3xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-500 backdrop-blur-lg">
                    <div className="text-7xl font-black text-blue-400 mb-4 group-hover:scale-125 transition-transform duration-500">92%</div>
                    <p className="text-gray-300 text-xl font-semibold">get hired within 6 months</p>
                    <p className="text-gray-500 text-sm mt-2">Average time to offer: 3.2 months</p>
                  </div>
                </InteractiveCard>
                
                <InteractiveCard glowColor="rgba(147, 51, 234, 0.4)">
                  <div className="text-center group cursor-default p-8 bg-gradient-to-br from-slate-800/40 to-slate-700/20 rounded-3xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 backdrop-blur-lg">
                    <div className="text-7xl font-black text-purple-400 mb-4 group-hover:scale-125 transition-transform duration-500">$145K</div>
                    <p className="text-gray-300 text-xl font-semibold">average salary increase</p>
                    <p className="text-gray-500 text-sm mt-2">Up to $280K total compensation</p>
                  </div>
                </InteractiveCard>
                
                <InteractiveCard glowColor="rgba(34, 197, 94, 0.4)">
                  <div className="text-center group cursor-default p-8 bg-gradient-to-br from-slate-800/40 to-slate-700/20 rounded-3xl border border-green-500/20 hover:border-green-400/40 transition-all duration-500 backdrop-blur-lg">
                    <div className="text-7xl font-black text-green-400 mb-4 group-hover:scale-125 transition-transform duration-500">98%</div>
                    <p className="text-gray-300 text-xl font-semibold">recommend to peers</p>
                    <p className="text-gray-500 text-sm mt-2">Net Promoter Score: 87</p>
                  </div>
                </InteractiveCard>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="relative py-32 px-6">
          <ParallaxSection speed={0.1}>
            <div className="max-w-5xl mx-auto text-center">
              <ScrollReveal direction="scale" delay={200}>
                <InteractiveCard glowColor="rgba(245, 158, 11, 0.6)">
                  <div className="relative p-16 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-pink-900/40 rounded-3xl border border-blue-500/30 backdrop-blur-xl hover:border-blue-400/50 transition-all duration-700 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 via-purple-600/15 to-pink-600/15 rounded-3xl group-hover:from-blue-600/25 group-hover:via-purple-600/25 group-hover:to-pink-600/25 transition-all duration-700"></div>
                    <div className="relative">
                      <div className="flex justify-center mb-12">
                        <div className="relative">
                          <Crown className="w-24 h-24 text-yellow-400 group-hover:rotate-12 group-hover:scale-150 transition-all duration-700 drop-shadow-2xl" />
                          <div className="absolute inset-0 w-24 h-24 text-yellow-400 animate-ping opacity-30">
                            <Crown className="w-full h-full" />
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-7xl md:text-8xl font-black text-white mb-10 group-hover:scale-110 transition-transform duration-500">
                        Ready to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Dominate</span>?
                      </h3>
                      <p className="text-2xl md:text-3xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed">
                        Join 75,000+ elite programmers who've transformed their careers with CodeWinz.
                        Your journey to <span className="text-blue-400 font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">FAANG excellence</span> starts today.
                      </p>
                      
                      <InteractiveCard glowColor="rgba(245, 158, 11, 0.8)">
                        <button
                          onClick={() => navigate('/contests')}
                          className="group relative px-16 py-8 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-3xl font-black text-2xl text-black transition-all duration-700 hover:scale-125 hover:shadow-2xl hover:shadow-yellow-500/40 overflow-hidden transform hover:rotate-2"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                          <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative flex items-center space-x-4">
                            <Trophy className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
                            <span>Claim Your Victory</span>
                            <Sparkles className="w-8 h-8 group-hover:animate-spin transition-transform duration-300" />
                          </div>
                        </button>
                      </InteractiveCard>
                      
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-gray-400">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-lg">No credit card required</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-blue-400" />
                          <span className="text-lg">Join 75,000+ developers</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Zap className="w-5 h-5 text-yellow-400" />
                          <span className="text-lg">Start competing instantly</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </InteractiveCard>
              </ScrollReveal>
            </div>
          </ParallaxSection>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default Homepage;