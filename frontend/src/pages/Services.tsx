import { motion } from 'framer-motion';
import { 
  Factory, 
  Beaker, 
  Package, 
  Palette, 
  Truck, 
  Award,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';

const services = [
  {
    icon: Factory,
    title: 'Contract Manufacturing',
    description: 'Full-scale production of perfumes, cosmetics, and personal care products under your brand name.',
    features: [
      'State-of-the-art manufacturing facility',
      'Scalable production capacity',
      'Strict quality control measures',
      'Regulatory compliance support',
    ],
  },
  {
    icon: Beaker,
    title: 'Custom Formulation',
    description: 'Work with our expert perfumers to develop unique fragrances tailored to your brand identity.',
    features: [
      'Bespoke fragrance creation',
      'Formula optimization',
      'Stability testing',
      'Ingredient sourcing assistance',
    ],
  },
  {
    icon: Package,
    title: 'Private Label Solutions',
    description: 'Ready-to-market products that you can brand and sell as your own.',
    features: [
      'Wide range of base formulas',
      'Custom packaging options',
      'Low minimum order quantities',
      'Quick turnaround times',
    ],
  },
  {
    icon: Palette,
    title: 'Packaging Design',
    description: 'Complete packaging solutions from concept to production, ensuring your products stand out.',
    features: [
      'Custom bottle and packaging design',
      'Label and branding support',
      'Sustainable packaging options',
      'Luxury finishing options',
    ],
  },
];

const tradingServices = [
  {
    icon: Truck,
    title: 'Wholesale Distribution',
    description: 'Bulk quantities of our premium products at competitive wholesale prices.',
  },
  {
    icon: Award,
    title: 'Brand Partnership',
    description: 'Strategic partnerships for exclusive distribution and co-branding opportunities.',
  },
];

const process = [
  {
    step: 1,
    title: 'Consultation',
    description: 'We discuss your vision, requirements, and target market.',
  },
  {
    step: 2,
    title: 'Development',
    description: 'Our team creates samples and refines the formulation.',
  },
  {
    step: 3,
    title: 'Testing',
    description: 'Rigorous quality and stability testing ensures product excellence.',
  },
  {
    step: 4,
    title: 'Production',
    description: 'Full-scale manufacturing with strict quality control.',
  },
  {
    step: 5,
    title: 'Delivery',
    description: 'Timely delivery of finished products ready for market.',
  },
];

const Services = () => {
  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero Section */}
      <section className="relative bg-black-950 py-12 sm:py-16 lg:py-24">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="text-gold-400 font-accent text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 block">
              What We Offer
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Our Services
            </h1>
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed">
              From custom fragrance development to full-scale manufacturing, 
              we provide comprehensive solutions for all your perfume and cosmetics needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Manufacturing Services */}
      <section className="section bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Manufacturing Services"
            subtitle="End-to-end production solutions for your brand"
            dark
          />

          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-black-800 border border-gold-500/20 p-5 sm:p-6 lg:p-8 rounded-sm hover:border-gold-500/40 transition-all"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gold-500 rounded-sm flex items-center justify-center mb-4 sm:mb-5 lg:mb-6">
                  <service.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-black" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">
                  {service.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">{service.description}</p>
                <ul className="space-y-2 sm:space-y-3">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-xs sm:text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Services */}
      <section className="section bg-black-950 text-white">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-gold-500 font-accent text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 block">
                Distribution & Trading
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                Trading & Distribution Services
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6 sm:mb-8">
                Beyond manufacturing, we offer comprehensive trading and distribution 
                services. Whether you're a retailer looking for premium products or a 
                brand seeking distribution partnerships, we have solutions for you.
              </p>

              <div className="space-y-4 sm:space-y-6">
                {tradingServices.map((service, index) => (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-3 sm:gap-3 sm:gap-4"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-500/20 rounded-sm flex items-center justify-center flex-shrink-0">
                      <service.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold-500" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
                        {service.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-400">{service.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button href="/contact" className="mt-6 sm:mt-8" rightIcon={<ArrowRight size={18} />}>
                Become a Partner
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mt-8 lg:mt-0"
            >
              <img
                src="https://images.unsplash.com/photo-1566958769312-82cef41d19ef?w=600"
                alt="Distribution Services"
                className="rounded-sm shadow-2xl w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="section bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Our Process"
            subtitle="From concept to completion, we're with you every step of the way"
            dark
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
            {process.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative text-center"
              >
                {/* Connector Line */}
                {index < process.length - 1 && (
                  <div className="hidden md:block absolute top-6 sm:top-8 left-1/2 w-full h-0.5 bg-gold-500/30" />
                )}
                
                {/* Step Number */}
                <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                  <span className="font-display text-xl sm:text-2xl font-bold text-black">
                    {item.step}
                  </span>
                </div>
                
                <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-white mb-1 sm:mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section bg-black-950">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <img
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600"
                alt="Why Choose Us"
                className="rounded-sm shadow-gold w-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <span className="text-gold-400 font-accent text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 block">
                Why Fragranza Olio
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4 sm:mb-6">
                Why Partner With Us?
              </h2>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-white mb-0.5 sm:mb-1">Industry Expertise</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Over a decade of experience in fragrance and cosmetics manufacturing.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-white mb-0.5 sm:mb-1">Quality Assurance</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Rigorous quality control at every stage of production.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-white mb-0.5 sm:mb-1">Flexible Solutions</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Customizable services to meet your specific requirements.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-white mb-0.5 sm:mb-1">Competitive Pricing</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Premium quality products at market-competitive prices.</p>
                  </div>
                </div>
              </div>

              <Button href="/contact" className="mt-6 sm:mt-8">
                Get Started Today
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-sm bg-black-950 border-t border-gold-500/20">
        <div className="container-custom px-4 sm:px-6 text-center">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
            Ready to Bring Your Vision to Life?
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Contact us today to discuss your project requirements. Our team is ready 
            to help you create exceptional products.
          </p>
          <Button href="/contact" size="lg">
            Request a Quote
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Services;
