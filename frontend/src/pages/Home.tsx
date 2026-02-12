import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade, Navigation } from 'swiper/modules';
import { ArrowRight, Sparkles, Shield, Leaf, Award } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

import ProductCard from '../components/ui/ProductCard';
import CategoryCard from '../components/ui/CategoryCard';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { productService, Product as APIProduct, Category } from '../services/productServicePHP';
import { useAuth } from '../context/AuthContext';
import { getDashboardForRole } from '../components/utils/RoleBasedRoute';
import { getImageUrl } from '../services/api';

// Transform API product to ProductCard format
interface ProductCardData {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
  inspiredBy?: string;
}

const transformProduct = (product: APIProduct): ProductCardData => ({
  id: product.id,
  name: product.name,
  price: product.price,
  image: getImageUrl(product.image_main),
  category: product.category?.name || 'Uncategorized',
  isNew: product.is_new,
  isFeatured: product.is_featured,
});

// Hero carousel images
const heroImages = [
  {
    image: "/assets/images/Women's Perfume/G46 Valentina.png",
    title: "Valentina",
    subtitle: "Elegant & Timeless"
  },
  {
    image: "/assets/images/Women's Perfume/G59 Killer Queen.png",
    title: "Killer Queen",
    subtitle: "Bold & Captivating"
  },
  {
    image: "/assets/images/Men's Perfume/B1 Acqua Fresh.png",
    title: "Acqua Fresh",
    subtitle: "Fresh & Invigorating"
  },
  {
    image: "/assets/images/Women's Perfume/G1 Blossom.png",
    title: "Blossom",
    subtitle: "Delicate & Feminine"
  },
  {
    image: "/assets/images/Men's Perfume/B8 Crimson Moon.png",
    title: "Crimson Moon",
    subtitle: "Mysterious & Intense"
  },
  {
    image: "/assets/images/Women's Perfume/G30 Majesty.png",
    title: "Majesty",
    subtitle: "Royal & Luxurious"
  },
];

// Fallback featured products (used only if API fails)
const fallbackFeaturedProducts: ProductCardData[] = [
  {
    id: 1,
    name: 'Blossom',
    price: 380,
    image: "/assets/images/Women's Perfume/G1 Blossom.png",
    category: "Women's Perfume",
    isNew: true,
    isFeatured: true,
  },
  {
    id: 120,
    name: 'Valentina',
    price: 450,
    image: "/assets/images/Women's Perfume/G46 Valentina.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 132,
    name: 'Killer Queen',
    price: 465,
    image: "/assets/images/Women's Perfume/G59 Killer Queen.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 8,
    name: 'Acqua Fresh',
    price: 280,
    image: "/assets/images/Men's Perfume/B1 Acqua Fresh.png",
    category: "Men's Perfume",
    isFeatured: true,
  },
];

const categories = [
  {
    name: "Women's Perfume",
    slug: "women's perfume",
    image: "/assets/images/Women's Perfume/G46 Valentina.png",
    productCount: 60,
  },
  {
    name: "Men's Perfume",
    slug: "men's perfume",
    image: "/assets/images/Men's Perfume/B2 Amour Desire.png",
    productCount: 43,
  },
  {
    name: 'Car Diffuser',
    slug: 'car diffuser',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600',
    productCount: 2,
  },
  {
    name: 'Soap',
    slug: 'soap',
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=600',
    productCount: 2,
  },
];

const features = [
  {
    icon: Sparkles,
    title: 'Premium Quality',
    description: 'Crafted with the finest ingredients sourced globally',
  },
  {
    icon: Shield,
    title: 'Certified Safe',
    description: 'All products tested and certified to international standards',
  },
  {
    icon: Leaf,
    title: 'Eco-Friendly',
    description: 'Sustainable practices and environmentally conscious packaging',
  },
  {
    icon: Award,
    title: 'Award Winning',
    description: 'Recognized excellence in fragrance and cosmetics industry',
  },
];

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<ProductCardData[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState(categories);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect non-customer roles to their dashboard
  const staffRoles = ['admin', 'ojt_supervisor', 'ojt', 'sales'];
  const shouldRedirect = isAuthenticated && user?.role && staffRoles.includes(user.role);
  const targetDashboard = shouldRedirect ? getDashboardForRole(user!.role) : '/';

  useEffect(() => {
    // Don't fetch if we're going to redirect
    if (shouldRedirect) return;
    
    const fetchData = async () => {
      try {
        // Fetch featured products from database
        const response = await productService.getProducts({ featured: true, limit: 8 });
        
        if (response.success && response.data.length > 0) {
          const transformed = response.data.map(transformProduct);
          setFeaturedProducts(transformed.slice(0, 8)); // Limit to 8 featured products
          
          // Update categories with real product counts if available
          if (response.categories && response.categories.length > 0) {
            const updatedCategories = categories.map(cat => {
              const apiCat = response.categories?.find(
                (c: Category) => c.name.toLowerCase() === cat.name.toLowerCase()
              );
              // Cast to any to access potential product_count from API response
              const productCount = apiCat ? (apiCat as any).product_count : null;
              return productCount ? { ...cat, productCount } : cat;
            });
            setDynamicCategories(updatedCategories);
          }
        } else {
          // Fall back to static data if API fails or returns empty
          setFeaturedProducts(fallbackFeaturedProducts);
        }
      } catch (error) {
        console.error('Home: Failed to fetch products:', error);
        setFeaturedProducts(fallbackFeaturedProducts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [shouldRedirect]);

  // Redirect non-customer roles to their dashboard (after all hooks)
  if (shouldRedirect) {
    return <Navigate to={targetDashboard} replace />;
  }

  return (
    <div className="overflow-hidden">
      {/* Hero Section - Black & Gold Theme */}
      <section className="relative min-h-screen flex items-center justify-center bg-black-950">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        {/* Gold gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black-950 via-black-900/95 to-gold-900/20" />

        <div className="container-custom relative z-10 pt-16 sm:pt-20 pb-8 sm:pb-0 px-6 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <span className="inline-block text-gold-400 font-accent text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-3 sm:mb-4">
                Premium Fragrances & Cosmetics
              </span>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                Discover the Art of
                <span className="text-gradient-gold block">Luxury Scents</span>
              </h1>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 lg:max-w-lg mx-auto lg:mx-0">
                Experience exquisite fragrances and premium cosmetics crafted with passion, 
                precision, and the finest ingredients from around the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button href="/products" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Explore Collection
                </Button>
                <Button href="/about" variant="outline" size="lg" className="border-gold-500 text-gold-400 hover:bg-gold-500 hover:text-black">
                  Our Story
                </Button>
              </div>
            </motion.div>

            {/* Hero Image Carousel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative z-10 w-full max-w-sm md:max-w-md lg:max-w-lg">
                <Swiper
                  modules={[Autoplay, Pagination, EffectFade, Navigation]}
                  effect="fade"
                  fadeEffect={{
                    crossFade: true
                  }}
                  autoplay={{
                    delay: 4000,
                    disableOnInteraction: false,
                  }}
                  pagination={{
                    clickable: true,
                  }}
                  loop={true}
                  speed={1500}
                  className="w-full rounded-xl overflow-hidden hero-carousel shadow-2xl"
                >
                  {heroImages.map((item, index) => (
                    <SwiperSlide key={index}>
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-auto object-contain"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gold-500/30 rounded-full blur-3xl" />
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-gold-400/30 rounded-full blur-3xl" />
              {/* Gold border accent */}
              <div className="absolute inset-4 border-2 border-gold-500/20 rounded-xl translate-x-4 translate-y-4 -z-10" />
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-gold-400 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-gold-400 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section - Black Background with Gold Accents */}
      <section className="py-12 sm:py-16 lg:py-20 bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-3 sm:p-4"
              >
                <div className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <feature.icon className="w-5 h-5 sm:w-6 md:w-7 sm:h-6 md:h-7 text-gold-400" />
                </div>
                <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-white mb-1 sm:mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 sm:line-clamp-none">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Shop by Category"
            subtitle="Explore our carefully curated collections of premium fragrances and beauty products"
            dark
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {dynamicCategories.map((category, index) => (
              <div key={category.slug} data-aos="fade-up" data-aos-delay={index * 100}>
                <CategoryCard {...category} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section bg-black-950">
        <div className="container-custom px-4 sm:px-6">
          <SectionHeader
            title="Featured Products"
            subtitle="Discover our most popular and highly-rated luxury items"
            dark
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              // Show skeleton loaders while loading
              Array.from({ length: 4 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))
            ) : (
              // Fallback if no products
              fallbackFeaturedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))
            )}
          </div>

          <div className="text-center mt-12" data-aos="fade-up">
            <Button href="/products" variant="secondary" rightIcon={<ArrowRight size={18} />}>
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-black-950 text-white overflow-hidden">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-gold-400 font-accent text-sm tracking-[0.3em] uppercase mb-4 block">
                About Fragranza Olio
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Crafting Excellence Since Day One
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                At Fragranza Olio, we believe that every fragrance tells a story. Our master 
                perfumers combine traditional techniques with innovative approaches to create 
                scents that captivate the senses and leave lasting impressions.
              </p>
              <p className="text-gray-300 mb-8 leading-relaxed">
                From sourcing the finest raw materials to the final bottling process, every 
                step is carried out with meticulous attention to detail and unwavering 
                commitment to quality.
              </p>
              <Button href="/about" variant="secondary">
                Learn More About Us
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600"
                alt="Fragranza Manufacturing"
                className="rounded-sm shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-gold-500 text-white p-6 rounded-sm">
                <div className="text-4xl font-display font-bold">10+</div>
                <div className="text-sm">Years of Excellence</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-sm bg-black-900 border-t border-gold-500/20">
        <div className="container-custom px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-400 mb-6">
              Subscribe to our newsletter for exclusive offers, new arrivals, and fragrance tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-black-800 border border-gold-500/30 rounded-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 outline-none transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gold-500 text-black font-accent font-medium rounded-sm hover:bg-gold-400 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
