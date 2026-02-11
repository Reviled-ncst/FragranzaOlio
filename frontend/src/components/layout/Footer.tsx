import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin 
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Products' },
    { path: '/about', label: 'About Us' },
    { path: '/services', label: 'Services' },
    { path: '/careers', label: 'Careers' },
    { path: '/contact', label: 'Contact' },
  ];

  const productCategories = [
    { path: "/products?category=women's perfume", label: "Women's Perfume" },
    { path: "/products?category=men's perfume", label: "Men's Perfume" },
    { path: '/products?category=car diffuser', label: 'Car Diffuser' },
    { path: '/products?category=dish washing', label: 'Dish Washing' },
    { path: '/products?category=soap', label: 'Soap' },
    { path: '/products?category=alcohol', label: 'Alcohol' },
    { path: '/products?category=helmet spray', label: 'Helmet Spray' },
    { path: '/products?category=disinfectants', label: 'Disinfectants' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-black-950 text-white">
      {/* Main Footer */}
      <div className="container-custom px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <img
                src="/assets/images/Fragranza LOGO.png"
                alt="Fragranza Logo"
                className="h-10 sm:h-12 lg:h-14 w-auto"
              />
              <div>
                <span className="font-display text-lg sm:text-xl font-semibold text-white">
                  Fragranza
                </span>
                <span className="block text-xs text-gold-500 font-accent tracking-wider">
                  OLIO
                </span>
              </div>
            </Link>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
              Premium perfumes and cosmetics manufacturer, crafting luxury 
              fragrances and beauty products with passion and precision since our founding.
            </p>
            <div className="flex gap-3 sm:gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black-800 border border-gold-500/30 flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4 lg:mb-6 text-white">
              Quick Links
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-gold-500 transition-colors text-xs sm:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4 lg:mb-6 text-white">
              Products
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {productCategories.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-gold-500 transition-colors text-xs sm:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4 lg:mb-6 text-white">
              Contact Us
            </h4>
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-2 sm:gap-3">
                <MapPin size={16} className="text-gold-500 mt-0.5 sm:mt-1 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                <span className="text-gray-400 text-xs sm:text-sm">
                  123 Fragrance Avenue, Beauty District<br />
                  Metro Manila, Philippines
                </span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3">
                <Phone size={16} className="text-gold-500 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                <a href="tel:+639123456789" className="text-gray-400 hover:text-gold-500 text-xs sm:text-sm transition-colors">
                  +63 912 345 6789
                </a>
              </li>
              <li className="flex items-center gap-2 sm:gap-3">
                <Mail size={16} className="text-gold-500 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                <a href="mailto:info@fragranza.com" className="text-gray-400 hover:text-gold-500 text-xs sm:text-sm transition-colors break-all">
                  info@fragranza.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gold-500/20">
        <div className="container-custom px-4 sm:px-6 py-4 sm:py-6 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-gray-500 text-xs sm:text-sm text-center md:text-left">
            © {currentYear} Fragranza Olio. All rights reserved.
          </p>
          <div className="flex gap-4 sm:gap-6">
            <Link to="/privacy" className="text-gray-500 hover:text-gold-400 text-xs sm:text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-gold-400 text-xs sm:text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
