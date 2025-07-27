// src/components/Footer.jsx
import React from 'react';
import { Facebook, Twitter, Linkedin, Github } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f172a] text-gray-400 py-8 mt-auto border-t border-gray-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Company Info */}
        <div className="col-span-1">
          <h3 className="text-xl font-bold text-white mb-4">CodeWinz</h3> {/* Changed to CodeWinz */}
          <p className="text-sm">Mastering Code, Forging Futures. Your arena for competitive programming excellence.</p>
          <div className="flex space-x-4 mt-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github size={20} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Contests</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Problems</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Leaderboard</a></li>
            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
          </ul>
        </div>

        {/* Contact Info / Newsletter */}
        <div className="col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
          <p className="text-sm">Email: info@codewinz.com</p> {/* Changed email domain */}
          <p className="text-sm">Phone: +91 123 456 7890</p>
          {/* Optional: Newsletter Signup */}
          <div className="mt-4">
            <h4 className="text-md font-semibold text-white mb-2">Stay Updated</h4>
            <input type="email" placeholder="Your email" className="input input-bordered input-sm w-full bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
            <button className="btn btn-primary btn-sm w-full mt-2 bg-blue-600 hover:bg-blue-700 border-0">Subscribe</button>
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-gray-500 mt-8 border-t border-gray-800 pt-6">
        &copy; {currentYear} CodeWinz. All rights reserved. {/* Changed to CodeWinz */}
      </div>
    </footer>
  );
}

export default Footer;