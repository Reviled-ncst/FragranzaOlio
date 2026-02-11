import { motion } from 'framer-motion';
import { Award, Users, Globe, Leaf, Target, Heart } from 'lucide-react';

import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';

const stats = [
  { value: '10+', label: 'Years Experience' },
  { value: '500+', label: 'Products Created' },
  { value: '50+', label: 'Partner Brands' },
  { value: '25K+', label: 'Happy Customers' },
];

const values = [
  {
    icon: Heart,
    title: 'Good Heart',
    description: 'We care deeply for our customers, our team, and our community, creating products with genuine love.',
  },
  {
    icon: Award,
    title: 'Integrity',
    description: 'Honesty and transparency guide everything we do, from sourcing to customer relationships.',
  },
  {
    icon: Target,
    title: 'Commitment',
    description: 'Dedicated to delivering excellence and standing behind every product we create.',
  },
];

const timeline = [
  {
    year: '2015',
    title: 'The Beginning',
    description: 'Fragranza Olio was founded with a vision to create premium fragrances accessible to everyone.',
  },
  {
    year: '2017',
    title: 'First Collection',
    description: 'Launched our signature collection of 12 unique perfumes that defined our brand identity.',
  },
  {
    year: '2019',
    title: 'Expansion',
    description: 'Extended our product line to include cosmetics and skincare products.',
  },
  {
    year: '2021',
    title: 'Manufacturing Hub',
    description: 'Opened our state-of-the-art manufacturing facility with advanced quality control.',
  },
  {
    year: '2023',
    title: 'Global Reach',
    description: 'Expanded operations to serve clients across Southeast Asia and beyond.',
  },
  {
    year: '2025',
    title: 'Today',
    description: 'Continuing to innovate and create exceptional fragrances for our growing community.',
  },
];

const team = [
  {
    name: 'Maria Santos',
    role: 'Founder & CEO',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  },
  {
    name: 'James Rodriguez',
    role: 'Master Perfumer',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
  },
  {
    name: 'Anna Reyes',
    role: 'Head of Production',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
  },
  {
    name: 'Michael Chen',
    role: 'Quality Director',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  },
];

const About = () => {
  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero Section */}
      <section className="relative bg-black-950 text-white py-12 sm:py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1920"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Gold gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black-950 via-black-900/90 to-gold-900/10" />
        <div className="container-custom relative z-10 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="text-gold-400 font-accent text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 block">
              Our Story
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Crafting Memories Through Scent
            </h1>
            <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed">
              At Fragranza Olio, we believe that every fragrance tells a story. 
              Our journey began with a simple passion: to create scents that 
              capture life's most precious moments.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-10 lg:py-12 bg-gold-500">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 text-black">
                  {stat.value}
                </div>
                <div className="font-accent text-xs sm:text-sm text-black/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="section bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-gold-400 font-accent text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 block">
                Who We Are
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4 sm:mb-6">
                A Legacy of Luxury & Craftsmanship
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4 sm:mb-6">
                Founded with a passion for creating exceptional fragrances, Fragranza Olio 
                has grown from a small workshop to a leading perfume and cosmetics 
                manufacturer in the Philippines. Our commitment to quality and innovation 
                has earned us the trust of countless customers and partner brands.
              </p>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6 sm:mb-8">
                Every product we create undergoes rigorous quality control, ensuring that 
                only the finest fragrances and cosmetics reach our customers. We source our 
                ingredients from trusted suppliers around the world, combining traditional 
                perfumery techniques with modern innovation.
              </p>
              <Button href="/contact">Work With Us</Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mt-8 lg:mt-0"
            >
              <img
                src="https://images.unsplash.com/photo-1585652757141-8837d676054c?w=600"
                alt="Our Workshop"
                className="rounded-sm shadow-gold w-full"
              />
              <div className="absolute -bottom-4 sm:-bottom-8 -left-2 sm:-left-8 bg-black-800 border border-gold-500/30 p-4 sm:p-6 rounded-sm max-w-[260px] sm:max-w-xs">
                <blockquote className="text-gray-300 italic text-sm sm:text-base">
                  "We don't just make perfumes, we craft memories that last a lifetime."
                </blockquote>
                <p className="font-accent text-xs sm:text-sm font-medium text-gold-500 mt-2 sm:mt-3">
                  — Maria Santos, Founder
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section bg-black-950">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Our Core Values"
            subtitle="The principles that guide everything we do at Fragranza Olio"
            dark
          />

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-black-800 border border-gold-500/20 p-6 sm:p-8 rounded-sm text-center hover:border-gold-500/40 transition-all h-full flex flex-col"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <value.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gold-500" />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed flex-grow">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Our Journey"
            subtitle="Key milestones in the Fragranza Olio story"
            dark
          />

          <div className="max-w-4xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`flex items-start gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 lg:mb-12 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <span className="inline-block bg-gold-500 text-black font-accent font-bold px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-sm mb-2 sm:mb-3">
                    {item.year}
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-white mb-1.5 sm:mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400">{item.description}</p>
                </div>
                <div className="hidden md:flex flex-col items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gold-500 rounded-full" />
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-20 sm:h-24 bg-gold-500/30" />
                  )}
                </div>
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section bg-black-950">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Meet Our Team"
            subtitle="The talented people behind Fragranza Olio's success"
            dark
          />

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="relative mb-3 sm:mb-4 lg:mb-6 overflow-hidden rounded-sm border border-gold-500/20">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="font-display text-sm sm:text-base lg:text-xl font-semibold text-white mb-0.5 sm:mb-1">
                  {member.name}
                </h3>
                <p className="text-gold-500 font-accent text-xs sm:text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-sm bg-black-900 border-t border-gold-500/20">
        <div className="container-custom px-4 sm:px-6 text-center">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
            Ready to Create Something Beautiful?
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Whether you're looking for our products or want to partner with us for 
            custom manufacturing, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button href="/products" size="lg">
              Explore Products
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
