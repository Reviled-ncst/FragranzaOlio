import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Home } from 'lucide-react';

const VerifyEmail = () => {
  return (
    <div className="min-h-screen bg-black-950 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Home className="w-10 h-10 text-gold-500" />
        </div>
        
        <h1 className="text-2xl font-display font-bold text-white mb-3">Welcome to Fragranza Olio</h1>
        <p className="text-gray-400 mb-8">
          You can now sign in to your account or explore our collection.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go to Home
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
