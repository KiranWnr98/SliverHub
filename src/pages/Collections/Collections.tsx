
import { categories } from '../../data/categories';
import CategoryCard from '../../components/CategoryCard/CategoryCard';

export default function Collections() {
  return (
    <section className="categories-section">
      <div className="section-heading">
        <h2>Our Collections</h2>
        <p>Find jewellery for every occasion.</p>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
