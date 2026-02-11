import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from 'lucide-react';

import { Input, Textarea, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';

const contactInfo = [
  {
    icon: MapPin,
    title: 'Visit Us',
    details: ['123 Fragrance Avenue', 'Beauty District, Metro Manila', 'Philippines 1234'],
  },
  {
    icon: Phone,
    title: 'Call Us',
    details: ['+63 912 345 6789', '+63 2 8123 4567'],
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: ['info@fragranza.com', 'sales@fragranza.com'],
  },
  {
    icon: Clock,
    title: 'Business Hours',
    details: ['Monday - Friday: 9AM - 6PM', 'Saturday: 9AM - 1PM', 'Sunday: Closed'],
  },
];

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

const inquiryTypes = [
  { value: '', label: 'Select inquiry type' },
  { value: 'product', label: 'Product Inquiry' },
  { value: 'wholesale', label: 'Wholesale Inquiry' },
  { value: 'manufacturing', label: 'Manufacturing Partnership' },
  { value: 'private-label', label: 'Private Label Services' },
  { value: 'general', label: 'General Inquiry' },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    inquiryType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.inquiryType) {
      newErrors.inquiryType = 'Please select an inquiry type';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      inquiryType: '',
      message: '',
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero Section */}
      <section className="bg-black-950 py-8 sm:py-12 lg:py-16">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="text-gold-400 font-accent text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 block">
              Get In Touch
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Contact Us
            </h1>
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg">
              Have questions or want to start a project? We'd love to hear from you. 
              Reach out and let's create something beautiful together.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">
                  Send Us a Message
                </h2>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black-800 border border-gold-500/30 rounded-sm p-6 sm:p-8 text-center"
                  >
                    <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gold-500 mx-auto mb-3 sm:mb-4" />
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-white mb-2">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                      Thank you for reaching out. We'll get back to you within 24-48 hours.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                      <Input
                        label="Full Name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        required
                      />
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                      <Input
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        placeholder="+63 912 345 6789"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                      <Input
                        label="Company Name"
                        name="company"
                        type="text"
                        placeholder="Your Company"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>

                    <Select
                      label="Inquiry Type"
                      name="inquiryType"
                      options={inquiryTypes}
                      value={formData.inquiryType}
                      onChange={handleChange}
                      error={errors.inquiryType}
                      required
                    />

                    <Textarea
                      label="Your Message"
                      name="message"
                      placeholder="Tell us about your project or inquiry..."
                      value={formData.message}
                      onChange={handleChange}
                      error={errors.message}
                      required
                    />

                    <Button
                      type="submit"
                      size="lg"
                      isLoading={isSubmitting}
                      rightIcon={<Send size={18} />}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                )}
              </motion.div>
            </div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">
                Contact Information
              </h2>

              <div className="space-y-4 sm:space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black-800 border border-gold-500/30 rounded-sm flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gold-500" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-medium text-white mb-0.5 sm:mb-1">{item.title}</h3>
                      {item.details.map((detail, index) => (
                        <p key={index} className="text-gray-400 text-xs sm:text-sm">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gold-500/20">
                <h3 className="text-sm sm:text-base font-medium text-white mb-3 sm:mb-4">Follow Us</h3>
                <div className="flex gap-2 sm:gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-black-800 border border-gold-500/30 rounded-full flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-black-950">
        <div className="container-custom px-4 sm:px-6 py-8 sm:py-12">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6 text-center">
            Our Location
          </h2>
          <div className="aspect-[16/10] sm:aspect-[21/9] rounded-sm overflow-hidden border border-gold-500/20">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3865.5837899999997!2d120.9504018!3d14.3408171!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d5af018f8d71%3A0xd99d5f75a15f54e3!2sFragranza%20Olio!5e0!3m2!1sen!2sph!4v1706500000000!5m2!1sen!2sph"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Fragranza Olio Location"
            />
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="section-sm bg-black-900 border-t border-gold-500/20">
        <div className="container-custom px-4 sm:px-6 text-center">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">
            Have Questions?
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
            Check out our frequently asked questions or reach out directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button href="/products" variant="secondary">
              Browse Products
            </Button>
            <Button href="/services" variant="outline" className="border-gold-500 text-gold-400 hover:bg-gold-500 hover:text-black">
              Our Services
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
