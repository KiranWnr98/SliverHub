
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Category } from '../types';

interface Props {
  category: Category;
}

export default function CategoryCard({ category }: Props) {
  return (
    <motion.a
      href={`/shop?category=${encodeURIComponent(category.name)}`}
      className="category-card"
      whileHover={{ y: -10 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="category-image">
        <img
          src={category.image}
          alt={`Silver ${category.name}`}
          loading="lazy"
        />
        <div className="category-overlay">
          <ArrowRight size={25} />
        </div>
      </div>

      <h3>{category.name}</h3>
      <p>{category.subtitle}</p>
    </motion.a>
  );
}
