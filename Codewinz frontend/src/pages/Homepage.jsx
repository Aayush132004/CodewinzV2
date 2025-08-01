import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, Code, Star, Award, Zap, Trophy, Target, Users, TrendingUp, Brain, Rocket, Shield, Crown, Sparkles, ChevronRight, Quote, CheckCircle } from 'lucide-react';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import VoidBackground from "../components/VoidBackground";
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
} from "../components/CompanyLogos";

function Homepage() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const displayUserName = user?.firstName || "Coder";

  const stats = [
    { label: "Active Users", value: "50K+", icon: Users, color: "from-blue-500 to-cyan-500" },
    { label: "Problems Solved", value: "2M+", icon: Target, color: "from-purple-500 to-pink-500" },
    { label: "Contests Run", value: "500+", icon: Trophy, color: "from-orange-500 to-red-500" },
    { label: "Success Rate", value: "98%", icon: TrendingUp, color: "from-green-500 to-emerald-500" }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Adaptive problem recommendations based on your skill level and learning patterns.",
      color: "from-violet-500 to-purple-600"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee for uninterrupted practice.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Rocket,
      title: "Performance Analytics",
      description: "Detailed insights into your coding patterns, time complexity, and improvement areas.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: Crown,
      title: "Elite Community",
      description: "Connect with top coders from leading tech companies and competitive programming.",
      color: "from-amber-500 to-orange-600"
    }
  ];

  const companies = [
    { name: "Google", logo: GoogleLogo, color: "from-blue-500 to-green-500", hoverColor: "hover:text-blue-400" },
    { name: "Microsoft", logo: MicrosoftLogo, color: "from-blue-600 to-cyan-500", hoverColor: "hover:text-blue-400" },
    { name: "Amazon", logo: AmazonLogo, color: "from-orange-500 to-yellow-500", hoverColor: "hover:text-orange-400" },
    { name: "Meta", logo: MetaLogo, color: "from-blue-500 to-purple-600", hoverColor: "hover:text-blue-400" },
    { name: "Apple", logo: AppleLogo, color: "from-gray-400 to-gray-600", hoverColor: "hover:text-gray-300" },
    { name: "Netflix", logo: NetflixLogo, color: "from-red-600 to-red-700", hoverColor: "hover:text-red-400" },
    { name: "Tesla", logo: TeslaLogo, color: "from-red-500 to-pink-500", hoverColor: "hover:text-red-400" },
    { name: "Spotify", logo: SpotifyLogo, color: "from-green-500 to-emerald-600", hoverColor: "hover:text-green-400" },
    { name: "Uber", logo: UberLogo, color: "from-black to-gray-800", hoverColor: "hover:text-gray-300" },
    { name: "Airbnb", logo: AirbnbLogo, color: "from-pink-500 to-rose-500", hoverColor: "hover:text-pink-400" },
    { name: "Twitter", logo: TwitterLogo, color: "from-blue-400 to-blue-600", hoverColor: "hover:text-blue-400" },
    { name: "LinkedIn", logo: LinkedInLogo, color: "from-blue-700 to-blue-800", hoverColor: "hover:text-blue-400" }
  ];

  const testimonials = [
    {
      text: "CodeWinz transformed my problem-solving approach. Landed my dream job at Google after 3 months of consistent practice.",
      author: "Sarah Chen",
      role: "Software Engineer at Google",
      rating: 5
    },
    {
      text: "The AI-powered recommendations are incredible. It's like having a personal coding mentor available 24/7.",
      author: "Marcus Rodriguez",
      role: "Senior Developer at Microsoft",
      rating: 5
    },
    {
      text: "Best platform for competitive programming. The community support and live contests are unmatched.",
      author: "Priya Sharma",
      role: "Tech Lead at Amazon",
      rating: 5
    }
  ];

  const achievements = [
    { icon: Trophy, text: "Award-winning platform 2024" },
    { icon: Users, text: "50K+ active developers" },
    { icon: Star, text: "4.9/5 average rating" },
    { icon: CheckCircle, text: "98% job placement rate" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] font-sans text-white relative overflow-hidden">
      <VoidBackground />
      <Navbar />

      <div className="relative z-10 flex flex-col flex-grow">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30 mb-8 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300 group">
                <Sparkles className="w-5 h-5 text-blue-400 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm font-medium text-blue-300">Welcome to the Future of Coding</span>
                <ChevronRight className="w-4 h-4 text-blue-400 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none">
                <span className="block bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
                  Hello,
                </span>
                <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-500 cursor-default">
                  {displayUserName}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto font-light leading-relaxed">
                Elevate your coding journey with AI-powered challenges, real-time competitions, 
                and a thriving community of elite programmers from <span className="text-blue-400 font-semibold">Fortune 500 companies</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <button
                  onClick={() => navigate('/contests')}
                  className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl font-bold text-lg transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/30 overflow-hidden transform hover:rotate-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center space-x-3">
                    <Zap className="w-6 h-6 group-hover:animate-pulse" />
                    <span>Start Competing</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/Homepage/problems')}
                  className="group px-10 py-5 border-2 border-gray-500 hover:border-white rounded-2xl font-bold text-lg transition-all duration-500 hover:bg-white/10 hover:scale-110 backdrop-blur-sm hover:shadow-2xl hover:shadow-white/10 transform hover:-rotate-1"
                >
                  <div className="flex items-center space-x-3">
                    <Code className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Practice Problems</span>
                    <Target className="w-5 h-5 group-hover:scale-125 transition-transform duration-300" />
                  </div>
                </button>
              </div>

              {/* Achievement Badges */}
              <div className="flex flex-wrap justify-center gap-4 opacity-80">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-default"
                  >
                    <achievement.icon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">{achievement.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`group relative p-8 rounded-3xl bg-gradient-to-br ${stat.color} opacity-90 hover:opacity-100 transition-all duration-500 hover:scale-110 transform hover:-translate-y-2 cursor-pointer`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                  <div className="relative text-center">
                    <stat.icon className="w-10 h-10 mx-auto mb-4 text-white group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                    <div className="text-4xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">{stat.value}</div>
                    <div className="text-sm font-medium text-white/90 uppercase tracking-wider">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Features Grid */}
        <section className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Choose Your Path to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Success</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Whether you're preparing for FAANG interviews, competing in global contests, or building meaningful connections
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
              {/* Contests Card */}
              <button
                onClick={() => navigate('/contests')}
                className="group relative p-10 bg-gradient-to-br from-slate-900/80 to-slate-800/40 rounded-3xl border border-blue-500/20 hover:border-blue-400/60 transition-all duration-500 hover:scale-[1.05] backdrop-blur-xl hover:shadow-2xl hover:shadow-blue-500/20 transform hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-12">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-blue-500/50">
                    <CalendarDays className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-blue-300 transition-colors">
                    Live Contests
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">
                    Compete against thousands of programmers in real-time coding battles. Climb leaderboards and earn recognition from top tech companies.
                  </p>
                  <div className="flex items-center text-blue-400 font-semibold text-lg group-hover:translate-x-4 transition-all duration-300">
                    <span>Join Competition</span>
                    <Zap className="w-5 h-5 ml-3 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </div>
              </button>

              {/* Problems Card */}
              <button
                onClick={() => navigate('/Homepage/problems')}
                className="group relative p-10 bg-gradient-to-br from-slate-900/80 to-slate-800/40 rounded-3xl border border-purple-500/20 hover:border-purple-400/60 transition-all duration-500 hover:scale-[1.05] backdrop-blur-xl hover:shadow-2xl hover:shadow-purple-500/20 transform hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-12">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-purple-500/50">
                    <Code className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-purple-300 transition-colors">
                    Skill Building
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">
                    Master data structures and algorithms with curated problems designed by industry experts from Google, Amazon, and Microsoft.
                  </p>
                  <div className="flex items-center text-purple-400 font-semibold text-lg group-hover:translate-x-4 transition-all duration-300">
                    <span>Start Practicing</span>
                    <Target className="w-5 h-5 ml-3 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </div>
              </button>

              {/* Community Card */}
              <button
                onClick={() => navigate('/communitychat')}
                className="group relative p-10 bg-gradient-to-br from-slate-900/80 to-slate-800/40 rounded-3xl border border-emerald-500/20 hover:border-emerald-400/60 transition-all duration-500 hover:scale-[1.05] backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/20 transform hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-12">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-emerald-500/50">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-emerald-300 transition-colors">
                    Elite Community
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">
                    Connect with fellow coders from FAANG companies, share insights, collaborate on solutions, and grow together in our exclusive community.
                  </p>
                  <div className="flex items-center text-emerald-400 font-semibold text-lg group-hover:translate-x-4 transition-all duration-300">
                    <span>Join Discussion</span>
                    <Users className="w-5 h-5 ml-3 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-5xl font-black mb-6">
                What <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Winners</span> Say
              </h3>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Join thousands who've transformed their careers with CodeWinz
              </p>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 rounded-3xl p-12 border border-slate-700/50 backdrop-blur-xl">
                <div className="flex items-center justify-center mb-8">
                  <Quote className="w-16 h-16 text-blue-400 opacity-50" />
                </div>
                
                <div className="text-center">
                  <p className="text-2xl text-gray-300 mb-8 leading-relaxed font-light italic">
                    "{testimonials[currentTestimonial].text}"
                  </p>
                  
                  <div className="flex items-center justify-center space-x-1 mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xl font-bold text-white mb-2">{testimonials[currentTestimonial].author}</p>
                    <p className="text-gray-400">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-8 space-x-3">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? 'bg-blue-500 scale-125' 
                        : 'bg-gray-600 hover:bg-gray-500 hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why CodeWinz Section */}
        <section className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-5xl md:text-6xl font-black mb-6">
                Why <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">CodeWinz</span>?
              </h3>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Experience the next generation of competitive programming with cutting-edge technology and unmatched community support
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group relative p-10 bg-gradient-to-br from-slate-900/60 to-slate-800/30 rounded-3xl border border-slate-700/50 hover:border-slate-600/70 transition-all duration-500 hover:scale-[1.03] backdrop-blur-xl hover:shadow-2xl transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}></div>
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-3xl font-bold text-white mb-6 group-hover:text-blue-300 transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-gray-400 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Companies Appreciation Banner */}
        <section className="relative py-20 px-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl md:text-5xl font-black mb-6">
                Trusted by Engineers at <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">Top Companies</span>
              </h3>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
                Join the elite community of developers who've successfully transitioned to leading tech giants
              </p>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
              {companies.map((company, index) => (
                <div
                  key={company.name}
                  className={`group relative p-6 bg-gradient-to-br from-slate-800/40 to-slate-700/20 rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-500 hover:scale-110 hover:-translate-y-2 cursor-pointer backdrop-blur-sm ${company.hoverColor}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${company.color} opacity-0 group-hover:opacity-20 rounded-2xl transition-all duration-500`}></div>
                  <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative text-center">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                      <company.logo className="w-12 h-12 text-white group-hover:drop-shadow-lg transition-all duration-500" />
                    </div>
                    <h4 className="text-white font-bold text-sm group-hover:font-extrabold transition-all duration-300">
                      {company.name}
                    </h4>
                  </div>
                  
                  {/* Hover Particles Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute top-2 left-2 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                    <div className="absolute top-4 right-3 w-1 h-1 bg-purple-400 rounded-full animate-ping animation-delay-200"></div>
                    <div className="absolute bottom-3 left-4 w-1 h-1 bg-green-400 rounded-full animate-ping animation-delay-400"></div>
                    <div className="absolute bottom-2 right-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping animation-delay-600"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Success Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center group cursor-default">
                <div className="text-5xl font-black text-blue-400 mb-3 group-hover:scale-110 transition-transform duration-300">85%</div>
                <p className="text-gray-300 text-lg">of our users get hired within 6 months</p>
              </div>
              <div className="text-center group cursor-default">
                <div className="text-5xl font-black text-purple-400 mb-3 group-hover:scale-110 transition-transform duration-300">$120K</div>
                <p className="text-gray-300 text-lg">average salary increase after using CodeWinz</p>
              </div>
              <div className="text-center group cursor-default">
                <div className="text-5xl font-black text-green-400 mb-3 group-hover:scale-110 transition-transform duration-300">95%</div>
                <p className="text-gray-300 text-lg">of users recommend us to their peers</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative p-12 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30 rounded-3xl border border-blue-500/20 backdrop-blur-xl hover:border-blue-400/40 transition-all duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl group-hover:from-blue-600/20 group-hover:via-purple-600/20 group-hover:to-pink-600/20 transition-all duration-500"></div>
              <div className="relative">
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <Star className="w-20 h-20 text-yellow-400 group-hover:rotate-12 group-hover:scale-125 transition-all duration-500 drop-shadow-2xl" />
                    <div className="absolute inset-0 w-20 h-20 text-yellow-400 animate-ping opacity-20">
                      <Star className="w-full h-full" />
                    </div>
                  </div>
                </div>
                
                <h3 className="text-5xl md:text-6xl font-black text-white mb-8 group-hover:scale-105 transition-transform duration-300">
                  Ready to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Dominate</span>?
                </h3>
                <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of successful programmers who've transformed their careers with CodeWinz. 
                  Your journey to <span className="text-blue-400 font-semibold">FAANG</span> starts here.
                </p>
                
                <button
                  onClick={() => navigate('/contests')}
                  className="group relative px-12 py-6 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-3xl font-bold text-xl text-black transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-yellow-500/30 overflow-hidden transform hover:rotate-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-3">
                    <Trophy className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Claim Your Victory</span>
                    <Sparkles className="w-7 h-7 group-hover:animate-spin transition-transform duration-300" />
                  </div>
                </button>
                
                <p className="text-sm text-gray-400 mt-6">
                  No credit card required • Join 50,000+ active developers • Start competing today
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default Homepage;