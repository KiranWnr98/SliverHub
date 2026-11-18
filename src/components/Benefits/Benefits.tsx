
import { motion } from 'framer-motion';
import { Gem, Truck, ShieldCheck, Package } from 'lucide-react';

const benefits = [
  { icon: Gem, title: '100% Pure Silver', detail: 'BIS Certified Purity' },
  { icon: Truck, title: 'Free Shipping', detail: 'Across India' },
  { icon: ShieldCheck, title: 'Secure Payments', detail: 'UPI, Cards & Net Banking' },
  { icon: Package, title: 'Easy Returns', detail: 'Within 7 Days' },
];

export default function Benefits() {
  return (
    <motion.section
      className="benefits"
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {benefits.map(({ icon: Icon, title, detail }) => (
        <div className="benefit-item" key={title}>
          <Icon size={43} strokeWidth={1.5} />
          <div>
            <h3>{title}</h3>
            <p>{detail}</p>
          </div>
        </div>
      ))}
    </motion.section>
  );
}
