import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

const CategoryCard = ({ name, slug, image, productCount }: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Link
        to={`/products?category=${slug}`}
        className="group relative block overflow-hidden rounded-sm aspect-[4/5]"
      >
        {/* Background Image */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="font-display text-2xl font-semibold mb-1">
            {name}
          </h3>
          {productCount !== undefined && (
            <p className="text-white/70 text-sm mb-3">
              {productCount} Products
            </p>
          )}
          <div className="flex items-center gap-2 text-gold-400 font-accent text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Explore Collection</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
