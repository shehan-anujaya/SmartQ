type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant, className = '' }) => {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info'
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
