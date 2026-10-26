import { Apple, Dumbbell, Shirt, Smartphone, Sofa, Sparkles, Watch, Package } from "lucide-react";

const icons = { Apple, Dumbbell, Shirt, Smartphone, Sofa, Sparkles, Watch };

export default function CategoryIcon({ name, ...props }) {
  const Icon = icons[name] || Package;
  return <Icon {...props} />;
}
