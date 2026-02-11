import { motion } from 'framer-motion';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ChevronRight,
  Heart,
  TrendingUp,
  Users,
  Gift,
  Coffee,
  GraduationCap
} from 'lucide-react';

import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';

const jobOpenings = [
  {
    id: 1,
    title: 'Marketing Intern',
    department: 'Marketing',
    location: 'Metro Manila, Philippines',
    type: 'Internship',
    description: 'Assist in developing marketing campaigns, social media management, and brand promotions.',
  },
  {
    id: 2,
    title: 'Product Development Intern',
    department: 'Product Development',
    location: 'Metro Manila, Philippines',
    type: 'Internship',
    description: 'Learn fragrance formulation and assist in creating new product compositions.',
  },
  {
    id: 3,
    title: 'Graphic Design Intern',
    department: 'Creative',
    location: 'Metro Manila, Philippines',
    type: 'Internship',
    description: 'Create visual content for packaging, marketing materials, and digital platforms.',
  },
  {
    id: 4,
    title: 'Sales & Business Development Intern',
    department: 'Sales',
    location: 'Metro Manila, Philippines',
    type: 'Internship',
    description: 'Support sales operations, client relations, and business growth initiatives.',
  },
  {
    id: 5,
    title: 'Operations & Quality Control Intern',
    department: 'Operations',
    location: 'Metro Manila, Philippines',
    type: 'Internship',
    description: 'Assist in quality assurance processes and production operations management.',
  },
  {
    id: 6,
    title: 'Human Resources Intern',
    department: 'HR',
    location: 'Metro Manila, Philippines',
    type: 'Internship',
    description: 'Support HR functions including recruitment, onboarding, and employee engagement.',
  },
];

const benefits = [
  {
    icon: GraduationCap,
    title: 'Hands-on Learning',
    description: 'Gain practical experience working on real projects in the fragrance industry.',
  },
  {
    icon: Users,
    title: 'Mentorship',
    description: 'Learn directly from experienced professionals who will guide your growth.',
  },
  {
    icon: TrendingUp,
    title: 'Career Development',
    description: 'Build skills and connections that will help launch your professional career.',
  },
  {
    icon: Gift,
    title: 'Internship Allowance',
    description: 'Receive competitive compensation to support you during your internship.',
  },
  {
    icon: Coffee,
    title: 'Flexible Schedule',
    description: 'We work with your academic schedule to accommodate your studies.',
  },
  {
    icon: Heart,
    title: 'Inclusive Culture',
    description: 'Join a welcoming environment that values good heart, integrity, and commitment.',
  },
];

const Careers = () => {
  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero Section */}
      <section className="bg-black-950 py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent" />
        <div className="container-custom px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-gold-500/10 border border-gold-500/30 rounded-full text-gold-500 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              Internship Opportunities
            </span>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
              Start Your Journey at{' '}
              <span className="text-gold-500">Fragranza Olio</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 sm:mb-8">
              We believe in nurturing the next generation of talent. Our internship program 
              offers hands-on experience in the fragrance and cosmetics industry. Join us to 
              learn, grow, and build a foundation for your career with good heart, integrity, and commitment.
            </p>
            <Button href="#openings" variant="primary" size="lg">
              View Internship Positions
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="section bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Why Intern With Us?"
            subtitle="Gain valuable experience and grow your career at Fragranza Olio"
            dark
          />

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-black-800 border border-gold-500/20 p-4 sm:p-5 lg:p-6 rounded-sm hover:border-gold-500/40 transition-all group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-gold-500/20 transition-colors">
                  <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold-500" />
                </div>
                <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-white mb-1.5 sm:mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings Section */}
      <section id="openings" className="section bg-black-950">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Internship Opportunities"
            subtitle="Explore our available internship positions and kickstart your career"
            dark
          />

          <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
            {jobOpenings.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-black-800 border border-gold-500/20 p-4 sm:p-5 lg:p-6 rounded-sm hover:border-gold-500/40 transition-all group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                      <h3 className="font-display text-base sm:text-lg lg:text-xl font-semibold text-white group-hover:text-gold-500 transition-colors">
                        {job.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-gold-500/10 border border-gold-500/30 rounded text-gold-500 text-xs">
                        {job.department}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-gold-500/70 sm:w-3.5 sm:h-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-gold-500/70 sm:w-3.5 sm:h-3.5" />
                        {job.type}
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <Briefcase size={12} className="text-gold-500/70 sm:w-3.5 sm:h-3.5" />
                        {job.department}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gold-500 flex items-center gap-1 text-xs sm:text-sm font-medium group-hover:gap-2 transition-all">
                      Apply Now
                      <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* No openings fallback - hidden for now */}
          {jobOpenings.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-gold-500/30 mx-auto mb-3 sm:mb-4" />
              <h3 className="font-display text-lg sm:text-xl font-semibold text-white mb-1.5 sm:mb-2">
                No Open Positions
              </h3>
              <p className="text-sm sm:text-base text-gray-400">
                We don't have any openings right now, but check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-gold-500/10 to-gold-600/10 border border-gold-500/30 rounded-sm p-6 sm:p-8 md:p-10 lg:p-12 text-center"
          >
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
              Don't See the Right Role?
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8">
              We're always looking for talented individuals. Send us your resume and 
              we'll keep you in mind for future opportunities that match your skills.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button href="/contact" variant="primary">
                Send Your Resume
              </Button>
              <Button href="/about" variant="outline">
                Learn About Us
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Careers;
