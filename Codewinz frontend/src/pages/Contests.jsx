import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, CheckCircle, XCircle, Loader2, Play, Trophy, UserPlus } from 'lucide-react';
import Navbar from '../components/Navbar';
import axiosClient from '../../utils/axiosClient';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';


// Helper to determine contest status and button text/style
const getContestDisplayInfo = (contest, userId,setContests,navigate) => {
    // console.log(userId  )
  const now = new Date();
  const start = new Date(contest.startDate);
  const end = new Date(contest.endDate);
  let status, statusColor, buttonText, buttonIcon, buttonClass, buttonAction;

  const isRegistered = contest.registeredUsers?.includes(userId);

  if (now < start) {
    status = 'Upcoming';
    statusColor = 'text-yellow-400 bg-yellow-900';
    if (isRegistered) {
        // console.log("hi");
      buttonText = 'Registered';
      buttonIcon = <CheckCircle size={18} />;
      buttonClass = 'bg-green-600 cursor-not-allowed opacity-70';
      buttonAction = () => {}; // no-op
    } else {
      buttonText = 'Register';
      buttonIcon = <UserPlus size={18} />;
      buttonClass = 'bg-green-600 hover:bg-green-700';
      buttonAction = async () => {
        await axiosClient.put(`/contest/register/${contest._id}`);
        // Optional: re-fetch contests to update state
         const fetchedContests = await axiosClient.get("/contest/getContest")
        setContests(fetchedContests.data.contests);
      };
    }
  } else if (now >= start && now <= end) {
    status = 'Active';
    statusColor = 'text-green-400 bg-green-900';
    buttonText = 'Start Contest';
    buttonIcon = <Play size={18} />;
    buttonClass = 'bg-yellow-600 hover:bg-yellow-700 animate-pulse';
    //for now letting the error of anyone can access via link any registered person as no security on link of contest for registered user but will improve in future 
    buttonAction = () => {navigate(`/contest/${contest._id}`)};
  } else {
    status = 'Completed';
    statusColor = 'text-red-400 bg-red-900';
    buttonText = 'View Results';
    buttonIcon = <Trophy size={18} />;
    buttonClass = 'bg-gray-600 hover:bg-gray-700';
    buttonAction = () => {navigate(`/contestResult/${contest._id}`)};
  }

  return { status, statusColor, buttonText, buttonIcon, buttonClass, buttonAction };
};


const Contests = () => {
    const navigate=useNavigate();
    const {user}=useSelector((state)=>state.auth)
// console.log(user)
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'active', 'completed'

  useEffect(() => {
    const loadContests = async () => {
      setLoading(true);
      try {
        const fetchedContests = await axiosClient.get("/contest/getContest")
        // console.log(fetchedContests);
        setContests(fetchedContests.data.contests);
      } catch (error) {
        console.error('Failed to fetch contests:', error);
        // Handle error display
      } finally {
        setLoading(false);
      }
    };
    loadContests();
  }, []);

  // Filter and sort contests based on current status and filter selection
  const getFilteredAndSortedContests = () => {
    const now = new Date();

    const categorized = contests.map(contest => {
      const { status, statusColor, buttonText, buttonIcon, buttonClass, buttonAction } = getContestDisplayInfo(contest,user._id,setContests,navigate);
      
      return { ...contest, displayStatus: status, statusColor, buttonText, buttonIcon, buttonClass, buttonAction };
    });

    let filtered = categorized;
    if (filter !== 'all') {
      filtered = categorized.filter(contest => contest.displayStatus.toLowerCase() === filter);
    }

    // Sort: Active first, then Upcoming, then Completed
    return filtered.sort((a, b) => {
      const order = { 'Active': 1, 'Upcoming': 2, 'Completed': 3 };
      return order[a.displayStatus] - order[b.displayStatus];
    });
  };

  const displayContests = getFilteredAndSortedContests();

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'shortOffset' // e.g., "IST", "+05:30"
    });
  };

  return (
    <div className="  min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b] font-sans text-white relative flex flex-col">
      {/* Header */}
      <Navbar/>
    <div className="">
      {/* Company Values Section */}
      <section className="py-16 mt-10 px-4 md:px-8 lg:px-16 bg-slate-900 bg-opacity-60 border-y border-slate-700 shadow-xl"> {/* Enhanced shadow and opacity */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center"> {/* Increased gap and max-width */}
          <div className="p-8 rounded-xl bg-slate-800 bg-opacity-80 shadow-2xl border border-slate-700 hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-2"> {/* Enhanced card style */}
            <h3 className="text-4xl font-extrabold text-purple-400 mb-4">Innovation</h3>
            <p className="text-gray-300 text-lg">Pushing the boundaries of what's possible in competitive programming with cutting-edge problems and features.</p>
          </div>
          <div className="p-8 rounded-xl bg-slate-800 bg-opacity-80 shadow-2xl border border-slate-700 hover:border-emerald-500 transition-all duration-300 transform hover:-translate-y-2">
            <h3 className="text-4xl font-extrabold text-emerald-400 mb-4">Community</h3>
            <p className="text-gray-300 text-lg">Fostering a supportive and engaging environment where coders connect, learn, and grow together.</p>
          </div>
          <div className="p-8 rounded-xl bg-slate-800 bg-opacity-80 shadow-2xl border border-slate-700 hover:border-orange-500 transition-all duration-300 transform hover:-translate-y-2">
            <h3 className="text-4xl font-extrabold text-orange-400 mb-4">Excellence</h3>
            <p className="text-gray-300 text-lg">Striving for the highest standards in problem quality, platform performance, and user experience.</p>
          </div>
        </div>
      </section>

      {/* Filter Buttons */}
      <section className="py-12 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto w-full"> {/* Increased padding and max-width */}
        <div className="flex flex-wrap justify-center gap-6 mb-10"> {/* Increased gap and margin-bottom */}
          {['all', 'active', 'upcoming', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-8 py-4 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105
                ${filter === status
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl border border-cyan-400' // More prominent active state
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white border border-slate-600'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} Contests
            </button>
          ))}
        </div>

        {/* Contests Grid -> Changed to Vertical Flex */}
        <div className="flex flex-col -z-1 items-center space-y-10 max-w-4xl mx-auto"> {/* Changed to flex-col, added space-y and max-width */}
          {loading ? (
            <div className="col-span-full text-center py-20">
              <Loader2 className="animate-spin text-cyan-400 mx-auto mb-4" size={80} /> {/* Larger loader */}
              <p className="text-2xl text-gray-400 font-semibold">Loading contests...</p>
            </div>
          ) : displayContests.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-2xl text-gray-400 font-semibold">No contests found for this filter.</p>
            </div>
          ) : (
            displayContests.map(contest => (
              <div
                key={contest._id}
                className="w-full  bg-slate-800 p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 border border-slate-700 hover:border-cyan-500 cursor-pointer flex flex-col justify-between" // Added w-full, adjusted scale
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-3xl font-bold text-cyan-400 leading-tight">{contest.title}</h3>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${contest.statusColor} `}>
                      {contest.displayStatus}
                    </span>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6 flex-grow">
                    {contest.description}
                  </p>
                </div>
                <div className="text-gray-400 text-base space-y-2 mb-6">
                  <p className="flex items-center gap-3"><CalendarDays size={18} className="text-blue-400" /> Starts: {formatDate(contest.startDate)}</p>
                  <p className="flex items-center gap-3"><Clock size={18} className="text-orange-400" /> Ends: {formatDate(contest.endDate)}</p>
                </div>
                <button
                  onClick={contest.buttonAction}
                  className={`px-8 py-4 rounded-full font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105
                    ${contest.buttonClass} text-white shadow-lg hover:shadow-xl`}
                >
                  {contest.buttonIcon} {contest.buttonText}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 px-4 md:px-8 lg:px-16 bg-slate-900 bg-opacity-80 border-t border-slate-700 text-center text-gray-400 shadow-inner">
        <div className="max-w-7xl mx-auto">
          <p className="text-lg font-semibold">&copy; {new Date().getFullYear()} CodeWinz. All rights reserved.</p>
          <p className="mt-3 text-base">Empowering the next generation of coders through challenge and collaboration.</p>
          <div className="flex justify-center space-x-6 mt-6 text-cyan-500 text-lg">
            <a href="#" className="hover:text-cyan-400 transition-colors duration-200">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors duration-200">Terms of Service</a>
            <a href="#" className="hover:text-cyan-400 transition-colors duration-200">Contact Us</a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Contests;
