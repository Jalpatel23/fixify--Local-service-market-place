import React from 'react';

const EmptyState = ({
  title = 'No data found',
  description = 'There are no items to display.',
  className = '',
  ...props
}) => {
  return (
    <div className={`text-center py-12 ${className}`} {...props}>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-secondary-600">{description}</p>
    </div>
  );
};

export default EmptyState;
export { EmptyState }; 